-- ═══════════════════════════════════════════════════════
-- Migration 009: Indexes + RLS preparation
--
-- RLS is ENABLED here on all tables.
-- Actual policies are written in Day 3 (separate migration).
-- Helper functions provided here for use by Day 3 policies.
-- ═══════════════════════════════════════════════════════


-- ─────────────────────────────────────────────
-- HELPER FUNCTIONS (used by RLS policies Day 3)
-- SECURITY DEFINER = bypasses RLS when reading users
-- ─────────────────────────────────────────────

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


-- ─────────────────────────────────────────────
-- ENABLE RLS on all tables
-- (Policies = Day 3 — migration 010_rls_policies.sql)
-- ─────────────────────────────────────────────
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


-- ─────────────────────────────────────────────
-- INDEXES — performance on hot paths
-- ─────────────────────────────────────────────

-- users
CREATE INDEX idx_users_auth_id   ON public.users(auth_id);
CREATE INDEX idx_users_role      ON public.users(role);

-- units
CREATE INDEX idx_units_host_id   ON public.units(host_id);
CREATE INDEX idx_units_status    ON public.units(status);
CREATE INDEX idx_units_pi        ON public.units(pi_pairing_code)
    WHERE pi_pairing_code IS NOT NULL;

-- guest_sessions — token lookups are the hottest path
CREATE INDEX idx_sessions_unit_id  ON public.guest_sessions(unit_id);
CREATE INDEX idx_sessions_expires  ON public.guest_sessions(token_expires_at);
CREATE INDEX idx_sessions_dates    ON public.guest_sessions(check_in, check_out);

-- events — Realtime + analytics queries
CREATE INDEX idx_events_unit       ON public.events(unit_id, created_at DESC);
CREATE INDEX idx_events_session    ON public.events(session_id);
CREATE INDEX idx_events_type       ON public.events(event_type, created_at DESC);

-- notifications — unread badge query
CREATE INDEX idx_notifs_recipient  ON public.notifications(recipient_id, created_at DESC);
CREATE INDEX idx_notifs_unread     ON public.notifications(recipient_id)
    WHERE read_at IS NULL;

-- devices — Pi state updates
CREATE INDEX idx_devices_unit      ON public.devices(unit_id);
CREATE INDEX idx_devices_type      ON public.devices(unit_id, device_type);
CREATE INDEX idx_devices_online    ON public.devices(unit_id, online);

-- automation_rules — Studio queries
CREATE INDEX idx_auto_scope        ON public.automation_rules(scope, scope_id);
CREATE INDEX idx_auto_enabled      ON public.automation_rules(enabled, scope)
    WHERE enabled = true;
CREATE INDEX idx_auto_runs_on      ON public.automation_rules(runs_on);
CREATE INDEX idx_auto_locked       ON public.automation_rules(locked_by_founder)
    WHERE locked_by_founder = true;

-- automation_executions — history viewer
CREATE INDEX idx_exec_automation   ON public.automation_executions(automation_id, executed_at DESC);
CREATE INDEX idx_exec_unit         ON public.automation_executions(unit_id, executed_at DESC);

-- audit_log — Founder audit viewer (§7 Scenario 2)
CREATE INDEX idx_audit_entity      ON public.audit_log(entity_type, entity_id, created_at DESC);
CREATE INDEX idx_audit_actor       ON public.audit_log(actor_id, created_at DESC);
CREATE INDEX idx_audit_critical    ON public.audit_log(created_at DESC)
    WHERE is_critical_change = true;

-- resource_limits / usage — permission engine lookups
CREATE INDEX idx_limits_lookup     ON public.resource_limits(scope, limit_key);
CREATE INDEX idx_usage_lookup      ON public.resource_usage(unit_id, metric_key, period_start);
