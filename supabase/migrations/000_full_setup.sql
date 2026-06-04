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
-- ═══════════════════════════════════════════════════════
-- Migration 002: Row Level Security
-- المرجع: CLAUDE_FINAL.md §8 (RLS section)
-- ═══════════════════════════════════════════════════════

-- ─────────────────────────────────────────────
-- دوال مساعدة (SECURITY DEFINER — تقرأ قبل تطبيق RLS)
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_my_user_id()
RETURNS uuid AS $$
  SELECT id FROM users WHERE auth_id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_my_role()
RETURNS text AS $$
  SELECT role FROM users WHERE auth_id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_founder()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE auth_id = auth.uid() AND role = 'founder'
  )
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_my_host_id()
RETURNS uuid AS $$
  SELECT h.id FROM hosts h
  JOIN users u ON u.id = h.user_id
  WHERE u.auth_id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER;


-- ═══════════════════════════════════════════════════════
-- تفعيل RLS على جميع الجداول
-- ═══════════════════════════════════════════════════════
ALTER TABLE users             ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosts             ENABLE ROW LEVEL SECURITY;
ALTER TABLE host_settings     ENABLE ROW LEVEL SECURITY;
ALTER TABLE units             ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings          ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_sessions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices           ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_codes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_rules  ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages          ENABLE ROW LEVEL SECURITY;
ALTER TABLE ical_feeds        ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads               ENABLE ROW LEVEL SECURITY;
ALTER TABLE extensions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications     ENABLE ROW LEVEL SECURITY;


-- ═══════════════════════════════════════════════════════
-- POLICIES
-- المبدأ من CLAUDE_FINAL.md:
--   Founders يشوفون كل شي
--   Hosts يشوفون شققهم فقط
--   Guest: NO direct DB access — فقط عبر Edge Functions
-- ═══════════════════════════════════════════════════════

-- ─────────────────────────────────────────────
-- users
-- ─────────────────────────────────────────────
CREATE POLICY "users_own_row" ON users FOR ALL
  USING (auth_id = auth.uid());

CREATE POLICY "founders_see_all_users" ON users FOR SELECT
  USING (is_founder());


-- ─────────────────────────────────────────────
-- hosts
-- ─────────────────────────────────────────────
CREATE POLICY "host_own_record" ON hosts FOR ALL
  USING (user_id = get_my_user_id());

CREATE POLICY "founders_all_hosts" ON hosts FOR ALL
  USING (is_founder());


-- ─────────────────────────────────────────────
-- host_settings
-- ─────────────────────────────────────────────
CREATE POLICY "host_own_settings" ON host_settings FOR ALL
  USING (host_id = get_my_host_id());

CREATE POLICY "founders_all_settings" ON host_settings FOR ALL
  USING (is_founder());


-- ─────────────────────────────────────────────
-- units — المرجع: CLAUDE_FINAL.md §8
-- ─────────────────────────────────────────────
CREATE POLICY "hosts_own_units" ON units FOR ALL
  USING (host_id IN (
    SELECT id FROM hosts WHERE user_id = auth.uid()
  ));

CREATE POLICY "founders_all" ON units FOR ALL
  USING (is_founder());


-- ─────────────────────────────────────────────
-- bookings
-- ─────────────────────────────────────────────
CREATE POLICY "host_own_bookings" ON bookings FOR ALL
  USING (unit_id IN (
    SELECT id FROM units WHERE host_id = get_my_host_id()
  ));

CREATE POLICY "founders_all_bookings" ON bookings FOR ALL
  USING (is_founder());


-- ─────────────────────────────────────────────
-- guest_sessions — المرجع: CLAUDE_FINAL.md §8
-- الضيف: لا وصول مباشر للـ DB — فقط عبر Edge Functions
-- ─────────────────────────────────────────────
CREATE POLICY "host_own_sessions" ON guest_sessions FOR ALL
  USING (unit_id IN (
    SELECT id FROM units WHERE host_id = get_my_host_id()
  ));

CREATE POLICY "founders_all_sessions" ON guest_sessions FOR ALL
  USING (is_founder());


-- ─────────────────────────────────────────────
-- devices
-- ─────────────────────────────────────────────
CREATE POLICY "host_own_devices" ON devices FOR ALL
  USING (unit_id IN (
    SELECT id FROM units WHERE host_id = get_my_host_id()
  ));

CREATE POLICY "founders_all_devices" ON devices FOR ALL
  USING (is_founder());


-- ─────────────────────────────────────────────
-- access_codes
-- ─────────────────────────────────────────────
CREATE POLICY "host_own_codes" ON access_codes FOR ALL
  USING (unit_id IN (
    SELECT id FROM units WHERE host_id = get_my_host_id()
  ));

CREATE POLICY "founders_all_codes" ON access_codes FOR ALL
  USING (is_founder());


-- ─────────────────────────────────────────────
-- activity_logs — Append-only للنظام
-- ─────────────────────────────────────────────
CREATE POLICY "host_own_logs" ON activity_logs FOR SELECT
  USING (unit_id IN (
    SELECT id FROM units WHERE host_id = get_my_host_id()
  ));

CREATE POLICY "founders_all_logs" ON activity_logs FOR ALL
  USING (is_founder());


-- ─────────────────────────────────────────────
-- automation_rules
-- ─────────────────────────────────────────────
CREATE POLICY "host_own_automations" ON automation_rules FOR ALL
  USING (unit_id IN (
    SELECT id FROM units WHERE host_id = get_my_host_id()
  ));

CREATE POLICY "founders_all_automations" ON automation_rules FOR ALL
  USING (is_founder());


-- ─────────────────────────────────────────────
-- messages (Nawaf)
-- ─────────────────────────────────────────────
CREATE POLICY "host_own_messages" ON messages FOR SELECT
  USING (guest_session_id IN (
    SELECT id FROM guest_sessions WHERE unit_id IN (
      SELECT id FROM units WHERE host_id = get_my_host_id()
    )
  ));

CREATE POLICY "founders_all_messages" ON messages FOR ALL
  USING (is_founder());


-- ─────────────────────────────────────────────
-- ical_feeds
-- ─────────────────────────────────────────────
CREATE POLICY "host_own_ical" ON ical_feeds FOR ALL
  USING (unit_id IN (
    SELECT id FROM units WHERE host_id = get_my_host_id()
  ));

CREATE POLICY "founders_all_ical" ON ical_feeds FOR ALL
  USING (is_founder());


-- ─────────────────────────────────────────────
-- ads — المؤسس فقط يدير الإعلانات
-- ─────────────────────────────────────────────
CREATE POLICY "founders_manage_ads" ON ads FOR ALL
  USING (is_founder());

CREATE POLICY "hosts_view_active_ads" ON ads FOR SELECT
  USING (active = true);


-- ─────────────────────────────────────────────
-- extensions
-- ─────────────────────────────────────────────
CREATE POLICY "host_own_extensions" ON extensions FOR ALL
  USING (guest_session_id IN (
    SELECT id FROM guest_sessions WHERE unit_id IN (
      SELECT id FROM units WHERE host_id = get_my_host_id()
    )
  ));

CREATE POLICY "founders_all_extensions" ON extensions FOR ALL
  USING (is_founder());


-- ─────────────────────────────────────────────
-- notifications
-- ─────────────────────────────────────────────
CREATE POLICY "own_notifications" ON notifications FOR ALL
  USING (recipient_id = get_my_user_id());

CREATE POLICY "founders_all_notifications" ON notifications FOR ALL
  USING (is_founder());
-- ═══════════════════════════════════════════════════════
-- Migration 003: Realtime Publications
-- المرجع: CLAUDE_FINAL.md §8 (REALTIME section)
--
-- هذه الجداول تُبثّ تلقائياً لكل المشتركين
-- عبر Supabase Realtime WebSocket.
-- ═══════════════════════════════════════════════════════

-- الجداول التي تحتاج Realtime (من CLAUDE_FINAL.md §8 بالضبط)
ALTER PUBLICATION supabase_realtime ADD TABLE units;
ALTER PUBLICATION supabase_realtime ADD TABLE guest_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE activity_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE devices;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE automation_rules;

-- ─────────────────────────────────────────────
-- ملاحظات القنوات (تُستخدم في الواجهات):
--
-- channel: units:{unit_id}
--   → host_v6.html يشترك — يشوف تحديث الحالة فوراً
--
-- channel: guest_sessions:{unit_id}
--   → tablet + mobile_card يشتركان — mode change يُطبّق < 200ms
--
-- channel: activity_logs:{unit_id}
--   → host_v6.html Live Feed
--
-- channel: devices:{unit_id}
--   → كل الواجهات تشترك — state sync فوري
--
-- channel: notifications:{user_id}
--   → founder + host يستقبلان تنبيهات فورية
--
-- channel: automation_rules:{unit_id}
--   → Pi يعيد تحميل الـ rules عند التغيير
-- ─────────────────────────────────────────────
-- ═══════════════════════════════════════════════════════
-- Migration 004: Seed Data
-- بيانات أولية للنظام
-- ═══════════════════════════════════════════════════════

-- ─────────────────────────────────────────────
-- إعلان demo (للاختبار — يُحذف في Production)
-- ─────────────────────────────────────────────
INSERT INTO ads (title, description, target_neighborhoods, active, starts_at, ends_at)
VALUES (
  'مطعم الأصيل',
  'خصم 15% للضيوف القادمين من Qlvin — أرقى مطاعم المنطقة',
  ARRAY['حي النرجس', 'حي الياسمين', 'حي الملقا'],
  true,
  NOW(),
  NOW() + INTERVAL '90 days'
);


-- ─────────────────────────────────────────────
-- Automation templates عامة (scope = 'platform')
-- تُطبّق على كل الوحدات تلقائياً
-- ─────────────────────────────────────────────
INSERT INTO automation_rules
  (scope, name, icon, runs_on, trigger_type, trigger_config, actions, locked_by_founder)
VALUES
  (
    'platform',
    'الترحيب عند الوصول',
    '🎉',
    'tablet',
    'guest_checked_in',
    '{}',
    '[
      {"type": "set_lights",      "params": {"brightness": 80}},
      {"type": "set_ac",          "params": {"power": "on", "temperature": 22, "mode": "cool"}},
      {"type": "show_nawaf_card", "params": {"message": "أهلاً وسهلاً! نواف في خدمتك 24/7"}}
    ]'::jsonb,
    true
  ),
  (
    'platform',
    'وضع الليل عند منتصف الليل',
    '🌙',
    'pi_local',
    'time_of_day',
    '{"time": "00:00", "days": ["sun","mon","tue","wed","thu","fri","sat"]}'::jsonb,
    '[
      {"type": "set_lights", "params": {"brightness": 0}},
      {"type": "set_ac",     "params": {"temperature": 23}}
    ]'::jsonb,
    false
  ),
  (
    'platform',
    'تنبيه الخروج الصامت',
    '👻',
    'cloud',
    'presence_lost',
    '{"timeout_minutes": 180}'::jsonb,
    '[
      {"type": "change_unit_status", "params": {"operational_status": "cleaning"}},
      {"type": "notify_host",        "params": {"title": "🧹 الشقة جاهزة للتنظيف", "body": "لم يُكتشف وجود منذ 3 ساعات"}}
    ]'::jsonb,
    true
  );


-- ─────────────────────────────────────────────
-- ملاحظة: المؤسس الأول يُنشأ يدوياً من Supabase Auth Dashboard
-- ثم يُضاف صف في جدول users بالـ auth_id المقابل:
--
-- INSERT INTO users (auth_id, name, role, email, phone)
-- VALUES ('<auth_id_from_dashboard>', 'عبدالقادر', 'founder', 'abdulqader.mossaa@gmail.com', '...');
-- ─────────────────────────────────────────────
