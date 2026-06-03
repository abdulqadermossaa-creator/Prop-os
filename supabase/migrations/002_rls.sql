-- ═══════════════════════════════════════════════════════
-- Migration 002: Row Level Security
-- المرجع: CLAUDE_FINAL.md §8 (RLS section)
-- ═══════════════════════════════════════════════════════

-- ─────────────────────────────────────────────
-- دوال مساعدة للـ policies (SECURITY DEFINER
-- لأنها تقرأ جدول users قبل ما يُطبّق RLS)
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
ALTER TABLE devices           ENABLE ROW LEVEL SECURITY;
ALTER TABLE ical_feeds        ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings          ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_sessions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_codes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_rules  ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages          ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads               ENABLE ROW LEVEL SECURITY;
ALTER TABLE extensions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications     ENABLE ROW LEVEL SECURITY;


-- ═══════════════════════════════════════════════════════
-- POLICIES
-- المبدأ: Founders يشوفون كل شي — Hosts يشوفون شقق هم فقط
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
-- Hosts يشوفون شققهم فقط
CREATE POLICY "hosts_own_units" ON units FOR ALL
    USING (host_id IN (
        SELECT id FROM hosts WHERE user_id = auth.uid()
    ));

-- Founders يشوفون الكل
CREATE POLICY "founders_all" ON units FOR ALL
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
-- ical_feeds
-- ─────────────────────────────────────────────
CREATE POLICY "host_own_ical" ON ical_feeds FOR ALL
    USING (unit_id IN (
        SELECT id FROM units WHERE host_id = get_my_host_id()
    ));

CREATE POLICY "founders_all_ical" ON ical_feeds FOR ALL
    USING (is_founder());


-- ─────────────────────────────────────────────
-- bookings — المرجع: CLAUDE_FINAL.md §8
-- ─────────────────────────────────────────────
CREATE POLICY "host_own_bookings" ON bookings FOR ALL
    USING (unit_id IN (
        SELECT id FROM units WHERE host_id = get_my_host_id()
    ));

CREATE POLICY "founders_all_bookings" ON bookings FOR ALL
    USING (is_founder());


-- ─────────────────────────────────────────────
-- guest_sessions — المرجع: CLAUDE_FINAL.md §8
-- ─────────────────────────────────────────────
CREATE POLICY "host_own_sessions" ON guest_sessions FOR ALL
    USING (unit_id IN (
        SELECT id FROM units WHERE host_id = get_my_host_id()
    ));

CREATE POLICY "founders_all_sessions" ON guest_sessions FOR ALL
    USING (is_founder());

-- الضيف: لا وصول مباشر للـ DB
-- يدخل فقط عبر Edge Functions + token validation


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

-- النظام والـ service_role يكتب الـ logs (Edge Functions)


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
-- notifications — كل مستخدم يشوف إشعاراته فقط
-- ─────────────────────────────────────────────
CREATE POLICY "own_notifications" ON notifications FOR ALL
    USING (recipient_id = get_my_user_id());

CREATE POLICY "founders_all_notifications" ON notifications FOR ALL
    USING (is_founder());
