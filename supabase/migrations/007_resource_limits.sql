-- ═══════════════════════════════════════════════════════
-- Migration 007: Resource limits & usage tracking
--
-- Schema from §4 — verbatim.
-- §1 Rule #15: ALWAYS check resource limits before
--              allowing host actions.
-- ═══════════════════════════════════════════════════════


-- ─────────────────────────────────────────────
-- RESOURCE LIMITS — platform defaults + overrides
-- ─────────────────────────────────────────────
CREATE TABLE public.resource_limits (
    id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),

    -- 'platform_default' = applies to all unless overridden
    -- 'host_override'    = scope_id = users.id
    -- 'unit_override'    = scope_id = units.id
    scope       TEXT    NOT NULL
                        CHECK (scope IN ('platform_default', 'host_override', 'unit_override')),
    scope_id    UUID,

    limit_key   TEXT    NOT NULL,
    limit_value JSONB   NOT NULL,

    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (scope, scope_id, limit_key)
);

COMMENT ON TABLE  public.resource_limits           IS 'Platform-wide and per-host/unit limits. Checked by Permission Engine.';
COMMENT ON COLUMN public.resource_limits.scope_id  IS 'NULL for platform_default, users.id for host_override, units.id for unit_override.';


-- ─────────────────────────────────────────────
-- Seed: platform defaults (from §4)
-- ─────────────────────────────────────────────
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


-- ─────────────────────────────────────────────
-- RESOURCE USAGE — tracks consumption per period
-- ─────────────────────────────────────────────
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

COMMENT ON TABLE  public.resource_usage IS 'Tracks current usage per metric per period. Compared against resource_limits to gate actions.';


-- ─────────────────────────────────────────────
-- Helper: resolve effective limit for a scope
-- Checks unit_override → host_override → platform_default
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_resource_limit(
    p_limit_key TEXT,
    p_unit_id   UUID DEFAULT NULL,
    p_host_id   UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_value JSONB;
BEGIN
    -- 1. Unit override (most specific)
    IF p_unit_id IS NOT NULL THEN
        SELECT limit_value INTO v_value
        FROM public.resource_limits
        WHERE scope = 'unit_override' AND scope_id = p_unit_id AND limit_key = p_limit_key;
        IF FOUND THEN RETURN v_value; END IF;
    END IF;

    -- 2. Host override
    IF p_host_id IS NOT NULL THEN
        SELECT limit_value INTO v_value
        FROM public.resource_limits
        WHERE scope = 'host_override' AND scope_id = p_host_id AND limit_key = p_limit_key;
        IF FOUND THEN RETURN v_value; END IF;
    END IF;

    -- 3. Platform default
    SELECT limit_value INTO v_value
    FROM public.resource_limits
    WHERE scope = 'platform_default' AND scope_id IS NULL AND limit_key = p_limit_key;

    RETURN v_value;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.get_resource_limit IS
    'Resolves effective limit: unit_override → host_override → platform_default.';
