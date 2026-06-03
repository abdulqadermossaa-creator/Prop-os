-- ═══════════════════════════════════════════════════════
-- Migration 001: Full Schema — QLVN OS
-- المرجع: CLAUDE_FINAL.md §8
-- الترتيب: حسب تبعيات الـ FK
-- ═══════════════════════════════════════════════════════

-- امتداد للـ token generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- دالة مشتركة لتحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ============================================
-- 1. USERS (Founders + Hosts)
-- ============================================
CREATE TABLE users (
    id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_id     uuid        UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    name        text        NOT NULL,
    role        text        NOT NULL CHECK (role IN ('founder', 'host')),
    phone       text,
    email       text,
    created_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE users IS 'المؤسسون والمضيفون فقط. الضيف → guest_sessions بالـ token.';


-- ============================================
-- 2. HOSTS
-- ============================================
CREATE TABLE hosts (
    id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             uuid        REFERENCES users(id) ON DELETE CASCADE,
    name                text        NOT NULL,
    phone               text,
    email               text,
    subscription_status text        NOT NULL DEFAULT 'active'
                                    CHECK (subscription_status IN ('active', 'suspended')),
    units_count         int         NOT NULL DEFAULT 0,
    monthly_fee         numeric     NOT NULL DEFAULT 300,
    created_at          timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE hosts IS 'تفاصيل المضيف وبيانات الاشتراك.';


-- ============================================
-- 3. HOST_SETTINGS (Feature Flags — Plug & Play)
-- المرجع: CLAUDE_FINAL.md §6
-- ============================================
CREATE TABLE host_settings (
    host_id                     uuid    PRIMARY KEY REFERENCES hosts(id) ON DELETE CASCADE,

    -- الواجهات
    card_style                  text    NOT NULL DEFAULT 'cinema'   CHECK (card_style IN ('cinema', 'luxury')),
    tablet_layout               text    NOT NULL DEFAULT 'classic'  CHECK (tablet_layout IN ('classic', 'immersive')),

    -- الميزات
    show_sports_widget          boolean NOT NULL DEFAULT true,
    sports_league               text    NOT NULL DEFAULT 'saudi_pro_league',
    show_local_ads              boolean NOT NULL DEFAULT true,
    show_extras_menu            boolean NOT NULL DEFAULT true,
    ad_engine_enabled           boolean NOT NULL DEFAULT true,
    nawaf_enabled               boolean NOT NULL DEFAULT true,
    netflix_confusion_detection boolean NOT NULL DEFAULT true,
    extend_button               boolean NOT NULL DEFAULT true,
    exit_button                 boolean NOT NULL DEFAULT true,
    order_coffee                boolean NOT NULL DEFAULT false,
    order_popcorn               boolean NOT NULL DEFAULT false,
    rgb_slider                  boolean NOT NULL DEFAULT false,

    -- الاتصال
    whatsapp_notifications      boolean NOT NULL DEFAULT true,
    ical_sync_enabled           boolean NOT NULL DEFAULT true,

    -- الحدود
    max_automations             int     NOT NULL DEFAULT 20,
    max_devices                 int     NOT NULL DEFAULT 15,
    max_gemini_calls_per_day    int     NOT NULL DEFAULT 500,

    language                    text    NOT NULL DEFAULT 'ar'
);

COMMENT ON TABLE host_settings IS 'Feature flags لكل مضيف. Plug & Play — بدون تعديل كود.';


-- ============================================
-- 4. UNITS
-- ============================================
CREATE TABLE units (
    id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    host_id              uuid        NOT NULL REFERENCES hosts(id) ON DELETE RESTRICT,

    name                 text        NOT NULL,
    qlvn_code            text        UNIQUE,                    -- e.g. "QLVN-1042"
    neighborhood         text,                                  -- للـ Ad Engine
    address              text,

    -- Pi
    pi_device_id         text,
    pi_api_key           text,                                  -- مشفّر
    pi_status            text        NOT NULL DEFAULT 'offline',
    pi_last_seen         timestamptz,

    -- الحالات
    approval_status      text        NOT NULL DEFAULT 'pending_approval'
                                     CHECK (approval_status IN (
                                         'pending_approval', 'approved',
                                         'rejected', 'suspended'
                                     )),
    operational_status   text        NOT NULL DEFAULT 'available'
                                     CHECK (operational_status IN (
                                         'available', 'occupied',
                                         'cleaning', 'maintenance'
                                     )),

    -- WiFi
    wifi_name            text,
    wifi_password        text,

    -- المناخ
    current_temp         numeric,
    target_temp          numeric     NOT NULL DEFAULT 22,

    -- التسعير
    base_price_per_night        numeric,
    extension_price_per_hour    numeric NOT NULL DEFAULT 50,

    -- التهيئة (من feature-registry)
    features             jsonb       NOT NULL DEFAULT '{}',
    tablet_layout        text        NOT NULL DEFAULT 'classic',

    created_at           timestamptz NOT NULL DEFAULT now(),
    updated_at           timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_units_updated_at
    BEFORE UPDATE ON units
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

COMMENT ON TABLE units IS 'الشقق المدارة. approval_status → لا يشتغل iCal ولا tokens قبل approved.';
COMMENT ON COLUMN units.features IS 'تهيئة التابلت والأجهزة. §1 Rule: ALWAYS use unit.features JSONB.';


-- ============================================
-- 5. DEVICES
-- ============================================
CREATE TABLE devices (
    id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id     uuid        NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    name        text        NOT NULL,
    type        text        CHECK (type IN (
                                'ac', 'light', 'led_strip', 'door',
                                'presence', 'plug', 'switch', 'lock',
                                'temp', 'tv'
                            )),
    protocol    text        CHECK (protocol IN (
                                'zigbee', 'mqtt', 'wifi', 'ir', 'gpio'
                            )),
    mqtt_topic  text,
    state       jsonb       NOT NULL DEFAULT '{}',
    status      text        NOT NULL DEFAULT 'offline',
    last_seen   timestamptz,
    created_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE devices IS 'أجهزة IoT لكل شقة. state JSONB يتحدث من Pi.';


-- ============================================
-- 6. ICAL_FEEDS
-- ============================================
CREATE TABLE ical_feeds (
    id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id         uuid        NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    source          text        CHECK (source IN ('airbnb', 'gathern', 'booking', 'other')),
    url             text        NOT NULL,
    last_synced_at  timestamptz,
    sync_status     text        NOT NULL DEFAULT 'pending',
    created_at      timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE ical_feeds IS 'روابط iCal لكل شقة. ical-sync Edge Function يسحب منها كل 15 دقيقة.';


-- ============================================
-- 7. BOOKINGS (من iCal أو يدوي)
-- ============================================
CREATE TABLE bookings (
    id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id             uuid        NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    external_booking_id text,
    source              text        CHECK (source IN (
                                        'airbnb', 'gathern', 'booking',
                                        'direct', 'manual'
                                    )),
    guest_name          text        NOT NULL,
    guest_phone         text,
    checkin_at          timestamptz NOT NULL,
    checkout_at         timestamptz NOT NULL,
    nights              int,
    total_price         numeric,
    status              text        NOT NULL DEFAULT 'confirmed',
    created_at          timestamptz NOT NULL DEFAULT now(),

    UNIQUE (external_booking_id, source),
    CONSTRAINT chk_checkout_after_checkin CHECK (checkout_at > checkin_at)
);

COMMENT ON TABLE bookings IS 'حجز واحد = صف واحد. external_booking_id + source = مفتاح فريد لمنع التكرار.';


-- ============================================
-- 8. GUEST_SESSIONS (الإقامات النشطة + Tokens)
-- ============================================
CREATE TABLE guest_sessions (
    id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id      uuid        REFERENCES bookings(id) ON DELETE SET NULL,
    unit_id         uuid        NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    guest_name      text        NOT NULL,
    guest_phone     text,

    -- كود الدخول الفيزيائي
    access_code     text,

    -- Token للبوابة الرقمية — فريد، لا يُعاد استخدامه
    guest_token     text        UNIQUE NOT NULL
                                DEFAULT encode(gen_random_bytes(32), 'hex'),
    token_expires_at timestamptz NOT NULL,

    status          text        NOT NULL DEFAULT 'pending'
                                CHECK (status IN ('pending', 'active', 'completed', 'cancelled')),

    checked_in_at   timestamptz,
    checked_out_at  timestamptz,
    last_seen       timestamptz,               -- Heartbeat كل 30s
    preferences     jsonb       NOT NULL DEFAULT '{}',
    created_at      timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE guest_sessions IS 'إقامة نشطة. guest_token = الوثيقة الوحيدة للضيف. لا يُكرر أبداً.';
COMMENT ON COLUMN guest_sessions.last_seen IS 'يتحدث من heartbeat Edge Function كل 30 ثانية.';


-- ============================================
-- 9. ACCESS_CODES
-- ============================================
CREATE TABLE access_codes (
    id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id           uuid        NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    guest_session_id  uuid        REFERENCES guest_sessions(id) ON DELETE SET NULL,
    code              text        NOT NULL,
    valid_from        timestamptz,
    valid_until       timestamptz,
    delivered_via     text[],                  -- ['whatsapp', 'sms']
    created_at        timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE access_codes IS 'أكواد الدخول للقفل الذكي. generate-code Edge Function يكتب هنا.';


-- ============================================
-- 10. ACTIVITY_LOGS (كل شي يسجل هنا)
-- المرجع: §5 Unified Activity Logs — لا exceptions
-- ============================================
CREATE TABLE activity_logs (
    id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id           uuid        REFERENCES units(id) ON DELETE SET NULL,
    guest_session_id  uuid        REFERENCES guest_sessions(id) ON DELETE SET NULL,
    event_type        text        NOT NULL,
    -- المصادر المسموحة
    source            text        CHECK (source IN (
                                      'pi', 'host', 'guest',
                                      'system', 'nawaf', 'automation', 'ical'
                                  )),
    severity          text        NOT NULL DEFAULT 'info'
                                  CHECK (severity IN ('info', 'warning', 'critical')),
    payload           jsonb       NOT NULL DEFAULT '{}',
    created_at        timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE activity_logs IS 'سجل موحد لكل الأحداث. لا UPDATE، لا DELETE. Append-only.';


-- ============================================
-- 11. AUTOMATION_RULES
-- المرجع: CLAUDE_FINAL.md §7
-- ============================================
CREATE TABLE automation_rules (
    id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id           uuid        REFERENCES units(id) ON DELETE CASCADE,

    scope             text        CHECK (scope IN ('platform', 'host', 'unit')),
    name              text        NOT NULL,
    icon              text        NOT NULL DEFAULT '⚡',

    runs_on           text        CHECK (runs_on IN (
                                      'tablet', 'mobile_card', 'pi_local',
                                      'cloud', 'multi'
                                  )),

    trigger_type      text        NOT NULL,
    trigger_config    jsonb,
    conditions        jsonb       NOT NULL DEFAULT '[]',
    actions           jsonb       NOT NULL,

    enabled           boolean     NOT NULL DEFAULT true,
    locked_by_founder boolean     NOT NULL DEFAULT false,

    created_by        uuid        REFERENCES users(id) ON DELETE SET NULL,
    last_edited_by    uuid        REFERENCES users(id) ON DELETE SET NULL,
    last_edited_at    timestamptz,

    created_at        timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE automation_rules IS 'قواعد الأتمتة. locked_by_founder=true → المضيف لا يقدر يعدّل.';


-- ============================================
-- 12. MESSAGES (محادثات نواف)
-- ============================================
CREATE TABLE messages (
    id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    guest_session_id  uuid        NOT NULL REFERENCES guest_sessions(id) ON DELETE CASCADE,
    role              text        CHECK (role IN ('guest', 'nawaf', 'system')),
    content           text        NOT NULL,
    intent            text,
    used_gemini       boolean     NOT NULL DEFAULT false,
    created_at        timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE messages IS '80% scripted (nawaf)، 20% Gemini. used_gemini يساعد في تتبع التكلفة.';


-- ============================================
-- 13. ADS (Ad Engine)
-- ============================================
CREATE TABLE ads (
    id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    title                 text,
    description           text,
    image_url             text,
    target_neighborhoods  text[],
    active                boolean     NOT NULL DEFAULT true,
    clicks                int         NOT NULL DEFAULT 0,
    impressions           int         NOT NULL DEFAULT 0,
    starts_at             timestamptz,
    ends_at               timestamptz
);

COMMENT ON TABLE ads IS 'إعلانات محلية. target_neighborhoods يطابق units.neighborhood.';


-- ============================================
-- 14. EXTENSIONS (تمديد الإقامة)
-- ============================================
CREATE TABLE extensions (
    id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    guest_session_id  uuid        NOT NULL REFERENCES guest_sessions(id) ON DELETE CASCADE,
    duration_hours    int         NOT NULL,
    price             numeric     NOT NULL,
    status            text        NOT NULL DEFAULT 'requested'
                                  CHECK (status IN (
                                      'requested', 'approved',
                                      'rejected', 'paid'
                                  )),
    requested_at      timestamptz NOT NULL DEFAULT now(),
    new_checkout_at   timestamptz
);

COMMENT ON TABLE extensions IS 'طلبات تمديد الإقامة. extension-request Edge Function يديرها.';


-- ============================================
-- 15. NOTIFICATIONS
-- ============================================
CREATE TABLE notifications (
    id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id  uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type          text        NOT NULL,
    title         text        NOT NULL,
    body          text,
    payload       jsonb       NOT NULL DEFAULT '{}',
    read_at       timestamptz,
    created_at    timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE notifications IS 'تنبيهات للمضيف والمؤسس. يظهر فوراً عبر Realtime.';


-- ═══════════════════════════════════════════════════════
-- INDEXES — hot paths
-- ═══════════════════════════════════════════════════════

-- users
CREATE INDEX idx_users_auth_id   ON users(auth_id);
CREATE INDEX idx_users_role      ON users(role);

-- hosts
CREATE INDEX idx_hosts_user_id   ON hosts(user_id);

-- units
CREATE INDEX idx_units_host_id         ON units(host_id);
CREATE INDEX idx_units_approval        ON units(approval_status);
CREATE INDEX idx_units_operational     ON units(operational_status);

-- bookings
CREATE INDEX idx_bookings_unit         ON bookings(unit_id);
CREATE INDEX idx_bookings_dates        ON bookings(checkin_at, checkout_at);
CREATE INDEX idx_bookings_source       ON bookings(source, external_booking_id);

-- guest_sessions — token lookup هو الأكثر تكراراً
CREATE INDEX idx_sessions_unit         ON guest_sessions(unit_id);
CREATE INDEX idx_sessions_token        ON guest_sessions(guest_token);
CREATE INDEX idx_sessions_expires      ON guest_sessions(token_expires_at);
CREATE INDEX idx_sessions_status       ON guest_sessions(status);

-- devices
CREATE INDEX idx_devices_unit          ON devices(unit_id);
CREATE INDEX idx_devices_type          ON devices(unit_id, type);

-- activity_logs — Realtime + host dashboard
CREATE INDEX idx_logs_unit             ON activity_logs(unit_id, created_at DESC);
CREATE INDEX idx_logs_session          ON activity_logs(guest_session_id);
CREATE INDEX idx_logs_type             ON activity_logs(event_type, created_at DESC);
CREATE INDEX idx_logs_severity         ON activity_logs(severity) WHERE severity != 'info';

-- automation_rules
CREATE INDEX idx_auto_unit             ON automation_rules(unit_id);
CREATE INDEX idx_auto_enabled          ON automation_rules(enabled) WHERE enabled = true;
CREATE INDEX idx_auto_locked           ON automation_rules(locked_by_founder)
    WHERE locked_by_founder = true;

-- notifications
CREATE INDEX idx_notifs_recipient      ON notifications(recipient_id, created_at DESC);
CREATE INDEX idx_notifs_unread         ON notifications(recipient_id)
    WHERE read_at IS NULL;

-- ical_feeds
CREATE INDEX idx_ical_unit             ON ical_feeds(unit_id);
