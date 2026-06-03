-- ═══════════════════════════════════════════════════════
-- Migration 001: Schema — QLVN OS
-- المرجع: CLAUDE_FINAL.md §6 + §7 + §8
-- 15 جدول بالترتيب الصحيح (حسب الـ FK dependencies)
-- ═══════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- دالة مساعدة: تحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;


-- ============================================
-- 1. USERS (Founders + Hosts فقط — الضيف بدون auth)
-- ============================================
CREATE TABLE users (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id    uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name       text NOT NULL,
  role       text NOT NULL CHECK (role IN ('founder', 'host')),
  phone      text,
  email      text,
  created_at timestamptz DEFAULT now()
);


-- ============================================
-- 2. HOSTS
-- ============================================
CREATE TABLE hosts (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid REFERENCES users(id),
  name                text NOT NULL,
  phone               text,
  email               text,
  subscription_status text DEFAULT 'active',   -- active | suspended
  units_count         int  DEFAULT 0,
  monthly_fee         numeric DEFAULT 300,
  created_at          timestamptz DEFAULT now()
);


-- ============================================
-- 3. HOST_SETTINGS (Plug & Play — §6)
-- ============================================
CREATE TABLE host_settings (
  host_id uuid PRIMARY KEY REFERENCES hosts(id) ON DELETE CASCADE,

  -- الواجهات
  card_style     text DEFAULT 'cinema',   -- cinema | luxury
  tablet_layout  text DEFAULT 'classic',  -- classic | immersive

  -- الميزات
  show_sports_widget          boolean DEFAULT true,
  sports_league               text    DEFAULT 'saudi_pro_league',
  show_local_ads              boolean DEFAULT true,
  show_extras_menu            boolean DEFAULT true,
  ad_engine_enabled           boolean DEFAULT true,
  nawaf_enabled               boolean DEFAULT true,
  netflix_confusion_detection boolean DEFAULT true,
  extend_button               boolean DEFAULT true,
  exit_button                 boolean DEFAULT true,
  order_coffee                boolean DEFAULT false,
  order_popcorn               boolean DEFAULT false,
  rgb_slider                  boolean DEFAULT false,

  -- الاتصال
  whatsapp_notifications boolean DEFAULT true,
  ical_sync_enabled      boolean DEFAULT true,

  -- الحدود
  max_automations          int DEFAULT 20,
  max_devices              int DEFAULT 15,
  max_gemini_calls_per_day int DEFAULT 500,

  language text DEFAULT 'ar'
);


-- ============================================
-- 4. UNITS
-- ============================================
CREATE TABLE units (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id    uuid REFERENCES hosts(id),
  name       text NOT NULL,
  qlvn_code  text UNIQUE,        -- e.g. "QLVN-1042"
  neighborhood text,              -- للـ Ad Engine
  address    text,
  pi_device_id text,
  pi_api_key text,                -- مشفّر
  pi_status  text DEFAULT 'offline',
  pi_last_seen timestamptz,

  -- Status
  approval_status text DEFAULT 'pending_approval'
    CHECK (approval_status IN ('pending_approval','approved','rejected','suspended')),
  operational_status text DEFAULT 'available'
    CHECK (operational_status IN ('available','occupied','cleaning','maintenance')),

  -- WiFi
  wifi_name     text,
  wifi_password text,

  -- Climate
  current_temp numeric,
  target_temp  numeric DEFAULT 22,

  -- Pricing
  base_price_per_night     numeric,
  extension_price_per_hour numeric DEFAULT 50,

  -- إعدادات إضافية
  features       jsonb DEFAULT '{}',
  tablet_layout  text  DEFAULT 'classic',

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TRIGGER units_updated_at
  BEFORE UPDATE ON units
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ============================================
-- 5. BOOKINGS (من iCal أو يدوي)
-- ============================================
CREATE TABLE bookings (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id             uuid REFERENCES units(id),
  external_booking_id text,
  source              text CHECK (source IN ('airbnb','gathern','booking','direct','manual')),
  guest_name          text NOT NULL,
  guest_phone         text,
  checkin_at          timestamptz NOT NULL,
  checkout_at         timestamptz NOT NULL,
  nights              int,
  total_price         numeric,
  status              text DEFAULT 'confirmed',
  created_at          timestamptz DEFAULT now(),
  UNIQUE(external_booking_id, source)
);


-- ============================================
-- 6. GUEST_SESSIONS (الإقامات النشطة + Tokens)
-- ============================================
CREATE TABLE guest_sessions (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id       uuid REFERENCES bookings(id),
  unit_id          uuid REFERENCES units(id),
  guest_name       text NOT NULL,
  guest_phone      text,
  access_code      text,
  guest_token      text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  token_expires_at timestamptz NOT NULL,
  status           text DEFAULT 'pending'
    CHECK (status IN ('pending','active','completed','cancelled','expired')),
  checked_in_at    timestamptz,
  checked_out_at   timestamptz,
  last_seen        timestamptz,    -- للـ Heartbeat
  preferences      jsonb DEFAULT '{}',
  created_at       timestamptz DEFAULT now()
);


-- ============================================
-- 7. DEVICES
-- ============================================
CREATE TABLE devices (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id     uuid REFERENCES units(id),
  name        text NOT NULL,
  type        text CHECK (type IN ('ac','light','led_strip','door','presence','plug','switch','lock','temp','tv')),
  protocol    text CHECK (protocol IN ('zigbee','mqtt','wifi','ir','gpio')),
  mqtt_topic  text,
  state       jsonb DEFAULT '{}',
  status      text DEFAULT 'offline',
  last_seen   timestamptz,
  created_at  timestamptz DEFAULT now()
);


-- ============================================
-- 8. ACCESS_CODES
-- ============================================
CREATE TABLE access_codes (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id          uuid REFERENCES units(id),
  guest_session_id uuid REFERENCES guest_sessions(id),
  code             text NOT NULL,
  valid_from       timestamptz,
  valid_until      timestamptz,
  delivered_via    text[],        -- ['whatsapp', 'sms']
  created_at       timestamptz DEFAULT now()
);


-- ============================================
-- 9. ACTIVITY_LOGS (كل شي يسجل هنا — Append-only)
-- ============================================
CREATE TABLE activity_logs (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id          uuid REFERENCES units(id),
  guest_session_id uuid REFERENCES guest_sessions(id),
  event_type       text NOT NULL,  -- unlock | sensor | mode_change | code_change | automation | ai_intent
  source           text,           -- pi | host | guest | system | nawaf
  severity         text DEFAULT 'info' CHECK (severity IN ('info','warning','critical')),
  payload          jsonb DEFAULT '{}',
  created_at       timestamptz DEFAULT now()
);


-- ============================================
-- 10. AUTOMATION_RULES (§7)
-- ============================================
CREATE TABLE automation_rules (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id           uuid REFERENCES units(id),
  scope             text,           -- platform | host | unit
  name              text NOT NULL,
  icon              text DEFAULT '⚡',
  runs_on           text,           -- tablet | mobile_card | pi_local | cloud | multi
  trigger_type      text NOT NULL,
  trigger_config    jsonb DEFAULT '{}',
  conditions        jsonb DEFAULT '[]',
  actions           jsonb NOT NULL,
  enabled           boolean DEFAULT true,
  locked_by_founder boolean DEFAULT false,
  created_by        uuid REFERENCES users(id),
  last_edited_by    uuid REFERENCES users(id),
  last_edited_at    timestamptz,
  created_at        timestamptz DEFAULT now()
);


-- ============================================
-- 11. MESSAGES (Nawaf conversations)
-- ============================================
CREATE TABLE messages (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_session_id uuid REFERENCES guest_sessions(id),
  role             text CHECK (role IN ('guest','nawaf','system')),
  content          text NOT NULL,
  intent           text,
  used_gemini      boolean DEFAULT false,
  created_at       timestamptz DEFAULT now()
);


-- ============================================
-- 12. ICAL_FEEDS
-- ============================================
CREATE TABLE ical_feeds (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id        uuid REFERENCES units(id),
  source         text CHECK (source IN ('airbnb','gathern','booking','other')),
  url            text NOT NULL,
  last_synced_at timestamptz,
  sync_status    text DEFAULT 'pending',
  created_at     timestamptz DEFAULT now()
);


-- ============================================
-- 13. ADS (Ad Engine)
-- ============================================
CREATE TABLE ads (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title                text,
  description          text,
  image_url            text,
  target_neighborhoods text[],
  active               boolean DEFAULT true,
  clicks               int DEFAULT 0,
  impressions          int DEFAULT 0,
  starts_at            timestamptz,
  ends_at              timestamptz
);


-- ============================================
-- 14. EXTENSIONS (تمديد الإقامة)
-- ============================================
CREATE TABLE extensions (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_session_id uuid REFERENCES guest_sessions(id),
  duration_hours   int NOT NULL,
  price            numeric NOT NULL,
  status           text DEFAULT 'requested'
    CHECK (status IN ('requested','approved','rejected','paid')),
  requested_at     timestamptz DEFAULT now(),
  new_checkout_at  timestamptz
);


-- ============================================
-- 15. NOTIFICATIONS
-- ============================================
CREATE TABLE notifications (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id uuid REFERENCES users(id),
  type         text NOT NULL,
  title        text NOT NULL,
  body         text,
  payload      jsonb DEFAULT '{}',
  read_at      timestamptz,
  created_at   timestamptz DEFAULT now()
);


-- ─────────────────────────────────────────────
-- Indexes على أكثر المسارات استخداماً
-- ─────────────────────────────────────────────
CREATE INDEX units_host_id        ON units(host_id);
CREATE INDEX units_status         ON units(operational_status);
CREATE INDEX bookings_unit_id     ON bookings(unit_id);
CREATE INDEX bookings_checkin     ON bookings(checkin_at);
CREATE INDEX sessions_unit_id     ON guest_sessions(unit_id);
CREATE INDEX sessions_token       ON guest_sessions(guest_token);
CREATE INDEX sessions_status      ON guest_sessions(status);
CREATE INDEX access_codes_session ON access_codes(guest_session_id);
CREATE INDEX access_codes_unit    ON access_codes(unit_id);
CREATE INDEX messages_session     ON messages(guest_session_id);
CREATE INDEX notifications_recip  ON notifications(recipient_id, read_at);
CREATE INDEX automations_unit     ON automation_rules(unit_id, enabled);
CREATE INDEX activity_unit_time   ON activity_logs(unit_id, created_at DESC);
CREATE INDEX activity_session     ON activity_logs(guest_session_id);
