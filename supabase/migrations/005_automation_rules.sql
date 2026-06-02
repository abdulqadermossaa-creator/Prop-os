-- ═══════════════════════════════════════════════════════
-- Migration 005: Automation rules & executions
--
-- Schema from §4 — verbatim.
-- Core of the ⚡ Automation Studio (§5).
--
-- scope_id is polymorphic:
--   scope = 'platform' → scope_id = NULL
--   scope = 'host'     → scope_id = users.id
--   scope = 'unit'     → scope_id = units.id
-- (Enforced at application layer — not FK constraint)
-- ═══════════════════════════════════════════════════════

CREATE TABLE public.automation_rules (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

    -- ─────────────────────────────────────────
    -- Scope (§5.2: Founder sees all, Host sees own)
    -- ─────────────────────────────────────────
    scope               TEXT        NOT NULL
                                    CHECK (scope IN ('platform', 'host', 'unit')),
    scope_id            UUID,       -- see polymorphic note above

    -- Identity
    name                TEXT        NOT NULL,
    icon                TEXT        NOT NULL DEFAULT '⚡',
    category            TEXT,

    -- ─────────────────────────────────────────
    -- Where it executes (§5.3 Step 2)
    -- ─────────────────────────────────────────
    runs_on             TEXT        NOT NULL
                                    CHECK (runs_on IN (
                                        'mobile_card', 'tablet', 'host_dashboard',
                                        'founder_dashboard', 'pi_local', 'cloud', 'multi'
                                    )),
    -- populated when runs_on = 'multi'
    runs_on_multi       TEXT[],

    -- ─────────────────────────────────────────
    -- WHEN + IF + THEN (§5.3 Steps 3-5)
    -- ─────────────────────────────────────────
    trigger_type        TEXT        NOT NULL,
    trigger_config      JSONB       NOT NULL,
    conditions          JSONB       NOT NULL DEFAULT '[]',
    actions             JSONB       NOT NULL,

    enabled             BOOLEAN     NOT NULL DEFAULT true,
    is_template         BOOLEAN     NOT NULL DEFAULT false,

    -- ─────────────────────────────────────────
    -- Ownership & Locking (§1 Rules #13-14)
    -- ─────────────────────────────────────────
    created_by          UUID        REFERENCES public.users(id) ON DELETE SET NULL,

    -- When true: Host CANNOT edit or delete (§1 Rule #13)
    locked_by_founder   BOOLEAN     NOT NULL DEFAULT false,
    visible_to_host     BOOLEAN     NOT NULL DEFAULT true,

    -- ─────────────────────────────────────────
    -- Audit trail (§1 Rule #18: "edited by [host_name]")
    -- ─────────────────────────────────────────
    last_edited_by      UUID        REFERENCES public.users(id) ON DELETE SET NULL,
    last_edited_at      TIMESTAMPTZ,

    -- Relative resource weight for limit checks (migration 007)
    cost_weight         INT         NOT NULL DEFAULT 1,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_automation_rules_updated_at
    BEFORE UPDATE ON public.automation_rules
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


-- ─────────────────────────────────────────────
-- Execution history (for audit viewer + analytics)
-- ─────────────────────────────────────────────
CREATE TABLE public.automation_executions (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    automation_id       UUID        REFERENCES public.automation_rules(id) ON DELETE CASCADE,
    unit_id             UUID        REFERENCES public.units(id)             ON DELETE SET NULL,

    triggered_by        TEXT,           -- event_type that fired this
    executed_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    duration_ms         INT,
    success             BOOLEAN,
    error_message       TEXT,
    actions_results     JSONB       NOT NULL DEFAULT '[]'
);

COMMENT ON TABLE  public.automation_rules                    IS 'Automation engine core. Scope: platform (Founder), host, or unit.';
COMMENT ON COLUMN public.automation_rules.scope_id          IS 'Polymorphic: NULL for platform, users.id for host, units.id for unit.';
COMMENT ON COLUMN public.automation_rules.locked_by_founder IS 'true → Host sees 🔒 and cannot edit/delete.';
COMMENT ON COLUMN public.automation_rules.last_edited_by    IS '"Edited by [host_name]" shown in Founder Studio view.';
COMMENT ON COLUMN public.automation_rules.runs_on_multi     IS 'Populated only when runs_on = multi. e.g. ["tablet","mobile_card"]';
COMMENT ON TABLE  public.automation_executions              IS 'Every run logged here for Founder audit viewer.';
