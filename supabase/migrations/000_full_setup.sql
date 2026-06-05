-- QLVN OS — Full Database Setup
-- شغّل هذا الملف مرة واحدة في SQL Editor
-- ═══════════════════════════════════════════════════════
-- يشمل: 001 → 009 بالترتيب الصحيح
-- الجداول: users, units, guest_sessions, events,
--          notifications, devices, automation_rules,
--          automation_executions, audit_log,
--          resource_limits, resource_usage, permissions
-- ═══════════════════════════════════════════════════════


-- ═══════════════════════════════════════════════════════
-- Migration 001: Core users table
-- ═══════════════════════════════════════════════════════

CREATE TABLE public.users (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_id     UUID        UNIQUE NOT NULL
                            REFERENCES auth.users(id) ON DELETE CASCADE,
    name        TEXT        NOT NULL,
    email       TEXT        UNIQUE NOT NULL,
    phone       TEXT,
    role        TEXT        NOT NULL
                            CHECK (role IN ('founder', 'host')),
    status      TEXT        NOT NULL DEFAULT 'active'
                            CHECK (status IN ('active', 'suspended', 'invited')),
    avatar_url  TEXT,
    metadata    JSONB       NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

COMMENT ON TABLE  public.users           IS 'Platform users: Founder and Host only. Guests → guest_sessions.';
COMMENT ON COLUMN public.users.auth_id   IS 'Supabase Auth user. Cascades on deletion.';
COMMENT ON COLUMN public.users.role      IS 'founder = full control. host = scoped to own units.';
COMMENT ON COLUMN public.users.metadata  IS 'Arbitrary host/founder config (e.g. notification prefs).';


-- ═══════════════════════════════════════════════════════
-- Migration 002: Units (furnished apartments)
-- ═══════════════════════════════════════════════════════

CREATE TABLE public.units (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    host_id             UUID        NOT NULL
                                    REFERENCES public.users(id) ON DELETE RESTRICT,
    name                TEXT        NOT NULL,
    location            TEXT,
    floor               TEXT,
    building            TEXT,
    features            JSONB       NOT NULL DEFAULT '{}',
    wifi_ssid           TEXT,
    wifi_password       TEXT,
    ical_airbnb         TEXT,
    ical_booking        TEXT,
    ical_other          TEXT,
    price_per_night     DECIMAL(10, 2),
    currency            TEXT        NOT NULL DEFAULT 'SAR',
    status              TEXT        NOT NULL DEFAULT 'pending_approval'
                                    CHECK (status IN (
                                        'pending_approval',
                                        'approved',
                                        'suspended',
                                        'inactive'
                                    )),
    approved_by         UUID        REFERENCES public.users(id) ON DELETE SET NULL,
    approved_at         TIMESTAMPTZ,
    pi_pairing_code     TEXT        UNIQUE,
    pi_connected        BOOLEAN     NOT NULL DEFAULT false,
    pi_last_heartbeat   TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_units_updated_at
    BEFORE UPDATE ON public.units
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

COMMENT ON TABLE  public.units                  IS 'Furnished apartments managed by Qlvin OS.';
COMMENT ON COLUMN public.units.features         IS 'Unit config: enabled features, tablet layout, device map. Never hardcoded.';
COMMENT ON COLUMN public.units.pi_pairing_code  IS 'Generated at unit creation. Pi scans this to pair. e.g. QLVN-PAIR-7842.';
COMMENT ON COLUMN public.units.status           IS 'pending_approval → approved (by founder) → live.';


-- ═══════════════════════════════════════════════════════
-- Migration 003: Guest sessions & tokens
-- ═══════════════════════════════════════════════════════

CREATE TABLE public.guest_sessions (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id             UUID        NOT NULL
                                    REFERENCES public.units(id) ON DELETE CASCADE,
    guest_name          TEXT,
    guest_phone         TEXT,
    party_size          INT         NOT NULL DEFAULT 1
                                    CHECK (party_size > 0),
    check_in            TIMESTAMPTZ NOT NULL,
    check_out           TIMESTAMPTZ NOT NULL,
    token               TEXT        UNIQUE NOT NULL,
    token_expires_at    TIMESTAMPTZ NOT NULL,
    current_mode        TEXT        NOT NULL DEFAULT 'normal',
    source              TEXT        NOT NULL DEFAULT 'manual'
                                    CHECK (source IN (
                                        'manual', 'airbnb', 'booking', 'direct'
                                    )),
    ical_uid            TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_checkout_after_checkin CHECK (check_out > check_in)
);

CREATE TRIGGER trg_sessions_updated_at
    BEFORE UPDATE ON public.guest_sessions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

COMMENT ON TABLE  public.guest_sessions             IS 'One row per booking. Token is the only credential. Expires at checkout.';
COMMENT ON COLUMN public.guest_sessions.token       IS 'Unique, non-reusable. Created by guest-token-create Edge Function.';
COMMENT ON COLUMN public.guest_sessions.current_mode IS 'Broadcast via Realtime to tablet + Pi on change (§7 Scenario 3).';
COMMENT ON COLUMN public.guest_sessions.ical_uid    IS 'iCal UID — prevents duplicate imports from multiple syncs.';


-- ═══════════════════════════════════════════════════════
-- Migration 004: Events, Notifications, Devices
-- ═══════════════════════════════════════════════════════

CREATE TABLE public.events (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id     UUID        REFERENCES public.units(id)           ON DELETE SET NULL,
    session_id  UUID        REFERENCES public.guest_sessions(id)  ON DELETE SET NULL,
    actor_id    UUID        REFERENCES public.users(id)           ON DELETE SET NULL,
    event_type  TEXT        NOT NULL,
    source      TEXT        CHECK (source IN (
                                'guest_card', 'tablet', 'founder',
                                'host', 'pi', 'automation', 'ical', 'system'
                            )),
    payload     JSONB       NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.events            IS 'Immutable event log. Every system action appends here. Never updated or deleted.';
COMMENT ON COLUMN public.events.event_type IS 'e.g. mode.changed, device.toggled, guest.checkin, automation.executed';

CREATE TABLE public.notifications (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id    UUID        NOT NULL
                                REFERENCES public.users(id) ON DELETE CASCADE,
    type            TEXT        NOT NULL,
    title           TEXT,
    body            TEXT,
    payload         JSONB       NOT NULL DEFAULT '{}',
    read_at         TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.notifications          IS 'Push notifications for Founder/Host.';
COMMENT ON COLUMN public.notifications.read_at  IS 'NULL = unread.';

CREATE TABLE public.devices (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id         UUID        NOT NULL
                                REFERENCES public.units(id) ON DELETE CASCADE,
    device_type     TEXT        NOT NULL
                                CHECK (device_type IN (
                                    'ac', 'light', 'led_strip', 'door', 'presence',
                                    'plug', 'switch', 'leak', 'temp', 'tv', 'lock'
                                )),
    name            TEXT        NOT NULL,
    room            TEXT,
    zigbee_id       TEXT,
    mqtt_topic      TEXT,
    state           JSONB       NOT NULL DEFAULT '{}',
    online          BOOLEAN     NOT NULL DEFAULT false,
    last_seen       TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_devices_updated_at
    BEFORE UPDATE ON public.devices
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

COMMENT ON TABLE  public.devices       IS 'IoT devices per unit. state JSONB updated in real-time by Pi.';
COMMENT ON COLUMN public.devices.state IS 'e.g. {"power":"on","temp":22,"mode":"cool"} for AC.';


-- ═══════════════════════════════════════════════════════
-- Migration 005: Automation rules & executions
-- ═══════════════════════════════════════════════════════

CREATE TABLE public.automation_rules (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    scope               TEXT        NOT NULL
                                    CHECK (scope IN ('platform', 'host', 'unit')),
    scope_id            UUID,
    name                TEXT        NOT NULL,
    icon                TEXT        NOT NULL DEFAULT '⚡',
    category            TEXT,
    runs_on             TEXT        NOT NULL
                                    CHECK (runs_on IN (
                                        'mobile_card', 'tablet', 'host_dashboard',
                                        'founder_dashboard', 'pi_local', 'cloud', 'multi'
                                    )),
    runs_on_multi       TEXT[],
    trigger_type        TEXT        NOT NULL,
    trigger_config      JSONB       NOT NULL,
    conditions          JSONB       NOT NULL DEFAULT '[]',
    actions             JSONB       NOT NULL,
    enabled             BOOLEAN     NOT NULL DEFAULT true,
    is_template         BOOLEAN     NOT NULL DEFAULT false,
    created_by          UUID        REFERENCES public.users(id) ON DELETE SET NULL,
    locked_by_founder   BOOLEAN     NOT NULL DEFAULT false,
    visible_to_host     BOOLEAN     NOT NULL DEFAULT true,
    last_edited_by      UUID        REFERENCES public.users(id) ON DELETE SET NULL,
    last_edited_at      TIMESTAMPTZ,
    cost_weight         INT         NOT NULL DEFAULT 1,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_automation_rules_updated_at
    BEFORE UPDATE ON public.automation_rules
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TABLE public.automation_executions (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    automation_id       UUID        REFERENCES public.automation_rules(id) ON DELETE CASCADE,
    unit_id             UUID        REFERENCES public.units(id)             ON DELETE SET NULL,
    triggered_by        TEXT,
    executed_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    duration_ms         INT,
    success             BOOLEAN,
    error_message       TEXT,
    actions_results     JSONB       NOT NULL DEFAULT '[]'
);

COMMENT ON TABLE  public.automation_rules                    IS 'Automation engine core. Scope: platform (Founder), host, or unit.';
COMMENT ON COLUMN public.automation_rules.locked_by_founder IS 'true → Host sees 🔒 and cannot edit/delete.';
COMMENT ON TABLE  public.automation_executions              IS 'Every run logged here for Founder audit viewer.';


-- ═══════════════════════════════════════════════════════
-- Migration 006: Audit log + auto-trigger
-- ═══════════════════════════════════════════════════════

CREATE TABLE public.audit_log (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id            UUID        REFERENCES public.users(id) ON DELETE SET NULL,
    actor_name          TEXT,
    actor_role          TEXT,
    action              TEXT        NOT NULL,
    entity_type         TEXT,
    entity_id           UUID,
    target_scope        TEXT,
    target_scope_id     UUID,
    before_state        JSONB,
    after_state         JSONB,
    metadata            JSONB       NOT NULL DEFAULT '{}',
    severity            TEXT        NOT NULL DEFAULT 'info'
                                    CHECK (severity IN ('info', 'warning', 'critical')),
    is_critical_change  BOOLEAN     NOT NULL DEFAULT false,
    ip_address          INET,
    user_agent          TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.audit_log                    IS 'Immutable audit trail. Every automation change is recorded here.';
COMMENT ON COLUMN public.audit_log.is_critical_change IS 'true → Founder gets real-time notification.';

CREATE OR REPLACE FUNCTION public.log_automation_change()
RETURNS TRIGGER AS $$
DECLARE
    actor_user_id   UUID;
    actor_user_name TEXT;
    actor_user_role TEXT;
    is_critical     BOOLEAN := false;
    current_row     public.automation_rules;
BEGIN
    current_row := CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;

    SELECT id, name, role
    INTO   actor_user_id, actor_user_name, actor_user_role
    FROM   public.users
    WHERE  auth_id = auth.uid();

    IF actor_user_role = 'host' AND (
        current_row.scope = 'platform' OR
        current_row.locked_by_founder = true
    ) THEN
        is_critical := true;
    END IF;

    INSERT INTO public.audit_log (
        actor_id, actor_name, actor_role,
        action, entity_type, entity_id,
        target_scope, target_scope_id,
        before_state, after_state,
        severity, is_critical_change
    ) VALUES (
        actor_user_id,
        COALESCE(actor_user_name, 'system'),
        COALESCE(actor_user_role, 'system'),
        TG_OP,
        'automation_rule',
        current_row.id,
        current_row.scope,
        current_row.scope_id,
        CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END,
        CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END,
        CASE WHEN is_critical THEN 'critical' ELSE 'info' END,
        is_critical
    );

    IF is_critical THEN
        INSERT INTO public.notifications (
            recipient_id, type, title, body, payload
        )
        SELECT
            u.id,
            'critical_automation_change',
            '⚠️ تعديل حرج',
            COALESCE(actor_user_name, 'مستخدم') || ' عدّل "' || current_row.name || '"',
            jsonb_build_object(
                'automation_id', current_row.id,
                'action',        TG_OP,
                'actor_role',    actor_user_role
            )
        FROM public.users u
        WHERE u.role = 'founder';
    END IF;

    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_audit_automation
    AFTER INSERT OR UPDATE OR DELETE ON public.automation_rules
    FOR EACH ROW EXECUTE FUNCTION public.log_automation_change();


-- ═══════════════════════════════════════════════════════
-- Migration 007: Resource limits & usage tracking
-- ═══════════════════════════════════════════════════════

CREATE TABLE public.resource_limits (
    id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    scope       TEXT    NOT NULL
                        CHECK (scope IN ('platform_default', 'host_override', 'unit_override')),
    scope_id    UUID,
    limit_key   TEXT    NOT NULL,
    limit_value JSONB   NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (scope, scope_id, limit_key)
);

COMMENT ON TABLE public.resource_limits IS 'Platform-wide and per-host/unit limits. Checked by Permission Engine.';

INSERT INTO public.resource_limits (scope, scope_id, limit_key, limit_value) VALUES
    ('platform_default', NULL, 'max_automations_per_unit',     '20'::jsonb),
    ('platform_default', NULL, 'max_devices_per_unit',         '15'::jsonb),
    ('platform_default', NULL, 'max_features_per_unit',        '25'::jsonb),
    ('platform_default', NULL, 'max_units_per_host',           '10'::jsonb),
    ('platform_default', NULL, 'max_gemini_calls_per_day',     '500'::jsonb),
    ('platform_default', NULL, 'max_whatsapp_messages_per_day','100'::jsonb),
    ('platform_default', NULL, 'allowed_device_types',
        '["ac","light","led_strip","door","presence","plug","switch","leak","temp","tv","lock"]'::jsonb),
    ('platform_default', NULL, 'allowed_automation_runs_on',
        '["mobile_card","tablet","host_dashboard","pi_local","cloud","multi"]'::jsonb);

CREATE TABLE public.resource_usage (
    id              UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id         UUID    REFERENCES public.units(id)  ON DELETE CASCADE,
    host_id         UUID    REFERENCES public.users(id)  ON DELETE CASCADE,
    metric_key      TEXT    NOT NULL,
    metric_value    INT     NOT NULL DEFAULT 0,
    period_start    TIMESTAMPTZ,
    period_end      TIMESTAMPTZ,
    UNIQUE (unit_id, host_id, metric_key, period_start)
);

COMMENT ON TABLE public.resource_usage IS 'Tracks current usage per metric per period.';

CREATE OR REPLACE FUNCTION public.get_resource_limit(
    p_limit_key TEXT,
    p_unit_id   UUID DEFAULT NULL,
    p_host_id   UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_value JSONB;
BEGIN
    IF p_unit_id IS NOT NULL THEN
        SELECT limit_value INTO v_value
        FROM public.resource_limits
        WHERE scope = 'unit_override' AND scope_id = p_unit_id AND limit_key = p_limit_key;
        IF FOUND THEN RETURN v_value; END IF;
    END IF;

    IF p_host_id IS NOT NULL THEN
        SELECT limit_value INTO v_value
        FROM public.resource_limits
        WHERE scope = 'host_override' AND scope_id = p_host_id AND limit_key = p_limit_key;
        IF FOUND THEN RETURN v_value; END IF;
    END IF;

    SELECT limit_value INTO v_value
    FROM public.resource_limits
    WHERE scope = 'platform_default' AND scope_id IS NULL AND limit_key = p_limit_key;

    RETURN v_value;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.get_resource_limit IS
    'Resolves effective limit: unit_override → host_override → platform_default.';


-- ═══════════════════════════════════════════════════════
-- Migration 008: Permission matrix + check function
-- ═══════════════════════════════════════════════════════

CREATE TABLE public.permissions (
    id                      UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    role                    TEXT    NOT NULL,
    action                  TEXT    NOT NULL,
    resource                TEXT    NOT NULL,
    allowed                 BOOLEAN NOT NULL DEFAULT true,
    requires_approval       BOOLEAN NOT NULL DEFAULT false,
    triggers_notification   BOOLEAN NOT NULL DEFAULT false,
    severity                TEXT    NOT NULL DEFAULT 'info'
                                    CHECK (severity IN ('info', 'warning', 'critical')),
    UNIQUE (role, action, resource)
);

COMMENT ON TABLE public.permissions IS 'RBAC matrix. Queried by check_permission() and the JS Permission Engine.';

-- 👑 FOUNDER
INSERT INTO public.permissions (role, action, resource, allowed, severity) VALUES
    ('founder', 'automation.create', 'platform',  true, 'info'),
    ('founder', 'automation.create', 'host',       true, 'info'),
    ('founder', 'automation.create', 'unit',       true, 'info'),
    ('founder', 'automation.edit',   'any',        true, 'info'),
    ('founder', 'automation.delete', 'any',        true, 'info'),
    ('founder', 'automation.lock',   'any',        true, 'info'),
    ('founder', 'host.create',       'platform',   true, 'info'),
    ('founder', 'host.suspend',      'any',        true, 'critical'),
    ('founder', 'unit.create',       'any',        true, 'info'),
    ('founder', 'unit.approve',      'any',        true, 'info'),
    ('founder', 'limits.set',        'any',        true, 'critical'),
    ('founder', 'audit.view',        'any',        true, 'info'),
    ('founder', 'studio.access',     'any',        true, 'info');

-- 🏠 HOST
INSERT INTO public.permissions (role, action, resource, allowed, triggers_notification, severity) VALUES
    ('host', 'automation.create', 'own_unit',          true,  true,  'info'),
    ('host', 'automation.create', 'platform',          false, false, 'info'),
    ('host', 'automation.edit',   'own_unit_unlocked',  true,  true,  'info'),
    ('host', 'automation.edit',   'locked',             false, false, 'critical'),
    ('host', 'automation.delete', 'own_unit_unlocked',  true,  true,  'warning'),
    ('host', 'automation.delete', 'locked',             false, false, 'critical'),
    ('host', 'unit.create',       'own',                true,  false, 'info'),
    ('host', 'unit.edit',         'own_approved',       true,  true,  'warning'),
    ('host', 'limits.set',        'any',                false, false, 'critical'),
    ('host', 'studio.access',     'own_units',          true,  false, 'info');

-- 🎫 GUEST
INSERT INTO public.permissions (role, action, resource, allowed, triggers_notification, severity) VALUES
    ('guest', 'mode.set',          'current_session', true,  false, 'info'),
    ('guest', 'slider.adjust',     'current_session', true,  false, 'info'),
    ('guest', 'order.create',      'current_session', true,  false, 'info'),
    ('guest', 'extension.request', 'current_session', true,  false, 'info'),
    ('guest', 'automation.create', 'any',             false, false, 'critical');

CREATE OR REPLACE FUNCTION public.check_permission(
    p_user_role TEXT,
    p_action    TEXT,
    p_resource  TEXT
)
RETURNS TABLE (
    allowed               BOOLEAN,
    requires_approval     BOOLEAN,
    triggers_notification BOOLEAN,
    severity              TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(p.allowed,               false)      AS allowed,
        COALESCE(p.requires_approval,     false)      AS requires_approval,
        COALESCE(p.triggers_notification, false)      AS triggers_notification,
        COALESCE(p.severity,              'critical') AS severity
    FROM       (SELECT true) base
    LEFT JOIN  public.permissions p
           ON  p.role     = p_user_role
           AND p.action   = p_action
           AND p.resource = p_resource;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.check_permission IS
    'RBAC lookup. Returns allowed/requires_approval/triggers_notification/severity. Defaults to denied+critical if no rule found.';


-- ═══════════════════════════════════════════════════════
-- Migration 009: Indexes + RLS preparation
-- ═══════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.get_my_user_id()
RETURNS UUID AS $$
    SELECT id FROM public.users WHERE auth_id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
    SELECT role FROM public.users WHERE auth_id = auth.uid()
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_founder()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.users
        WHERE auth_id = auth.uid() AND role = 'founder'
    )
$$ LANGUAGE sql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.get_my_user_id IS 'Returns users.id for current Supabase Auth session. Used in RLS policies.';
COMMENT ON FUNCTION public.get_my_role    IS 'Returns role (founder/host) for current session. Used in RLS policies.';
COMMENT ON FUNCTION public.is_founder     IS 'Returns true if current user is founder. Used in RLS policies.';

-- تفعيل RLS
ALTER TABLE public.users                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guest_sessions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_rules      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_limits       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_usage        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions           ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_users_auth_id      ON public.users(auth_id);
CREATE INDEX idx_users_role         ON public.users(role);
CREATE INDEX idx_units_host_id      ON public.units(host_id);
CREATE INDEX idx_units_status       ON public.units(status);
CREATE INDEX idx_units_pi           ON public.units(pi_pairing_code) WHERE pi_pairing_code IS NOT NULL;
CREATE INDEX idx_sessions_unit_id   ON public.guest_sessions(unit_id);
CREATE INDEX idx_sessions_expires   ON public.guest_sessions(token_expires_at);
CREATE INDEX idx_sessions_dates     ON public.guest_sessions(check_in, check_out);
CREATE INDEX idx_events_unit        ON public.events(unit_id, created_at DESC);
CREATE INDEX idx_events_session     ON public.events(session_id);
CREATE INDEX idx_events_type        ON public.events(event_type, created_at DESC);
CREATE INDEX idx_notifs_recipient   ON public.notifications(recipient_id, created_at DESC);
CREATE INDEX idx_notifs_unread      ON public.notifications(recipient_id) WHERE read_at IS NULL;
CREATE INDEX idx_devices_unit       ON public.devices(unit_id);
CREATE INDEX idx_devices_type       ON public.devices(unit_id, device_type);
CREATE INDEX idx_devices_online     ON public.devices(unit_id, online);
CREATE INDEX idx_auto_scope         ON public.automation_rules(scope, scope_id);
CREATE INDEX idx_auto_enabled       ON public.automation_rules(enabled, scope) WHERE enabled = true;
CREATE INDEX idx_auto_runs_on       ON public.automation_rules(runs_on);
CREATE INDEX idx_auto_locked        ON public.automation_rules(locked_by_founder) WHERE locked_by_founder = true;
CREATE INDEX idx_exec_automation    ON public.automation_executions(automation_id, executed_at DESC);
CREATE INDEX idx_exec_unit          ON public.automation_executions(unit_id, executed_at DESC);
CREATE INDEX idx_audit_entity       ON public.audit_log(entity_type, entity_id, created_at DESC);
CREATE INDEX idx_audit_actor        ON public.audit_log(actor_id, created_at DESC);
CREATE INDEX idx_audit_critical     ON public.audit_log(created_at DESC) WHERE is_critical_change = true;
CREATE INDEX idx_limits_lookup      ON public.resource_limits(scope, limit_key);
CREATE INDEX idx_usage_lookup       ON public.resource_usage(unit_id, metric_key, period_start);
