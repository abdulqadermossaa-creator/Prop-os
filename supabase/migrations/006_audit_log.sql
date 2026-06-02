-- ═══════════════════════════════════════════════════════
-- Migration 006: Audit log + auto-trigger
--
-- Schema from §4 — verbatim.
-- §1 Rule #14: ALWAYS audit every automation change.
-- §1 Rule #16: ALWAYS notify founder on critical change.
-- §1 Rule #18: ALWAYS show "edited by [host_name]".
-- ═══════════════════════════════════════════════════════

CREATE TABLE public.audit_log (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Who made the change
    actor_id            UUID        REFERENCES public.users(id) ON DELETE SET NULL,
    actor_name          TEXT,
    actor_role          TEXT,

    -- What changed
    action              TEXT        NOT NULL,   -- INSERT | UPDATE | DELETE
    entity_type         TEXT,                   -- 'automation_rule'
    entity_id           UUID,

    -- Where (scope context)
    target_scope        TEXT,
    target_scope_id     UUID,

    -- State diff (§7 Scenario 2: "AC 24° → 22° diff highlighted")
    before_state        JSONB,
    after_state         JSONB,
    metadata            JSONB       NOT NULL DEFAULT '{}',

    -- Severity
    severity            TEXT        NOT NULL DEFAULT 'info'
                                    CHECK (severity IN ('info', 'warning', 'critical')),
    is_critical_change  BOOLEAN     NOT NULL DEFAULT false,

    -- Request context
    ip_address          INET,
    user_agent          TEXT,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.audit_log                   IS 'Immutable audit trail. Every automation change is recorded here.';
COMMENT ON COLUMN public.audit_log.before_state      IS 'Full row snapshot before change. NULL for INSERT.';
COMMENT ON COLUMN public.audit_log.after_state       IS 'Full row snapshot after change. NULL for DELETE.';
COMMENT ON COLUMN public.audit_log.is_critical_change IS 'true → Founder gets real-time notification.';


-- ═══════════════════════════════════════════════════════
-- Trigger function: auto-log + founder notification
-- SECURITY DEFINER so it bypasses RLS on users/notifications
-- ═══════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.log_automation_change()
RETURNS TRIGGER AS $$
DECLARE
    actor_user_id   UUID;
    actor_user_name TEXT;
    actor_user_role TEXT;
    is_critical     BOOLEAN := false;
    current_row     public.automation_rules;
BEGIN
    -- For DELETE: NEW is NULL, use OLD
    current_row := CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;

    -- Resolve actor from Supabase Auth session
    -- auth.uid() = NULL when called by Pi/service-role → actor_ stays NULL (graceful)
    SELECT id, name, role
    INTO   actor_user_id, actor_user_name, actor_user_role
    FROM   public.users
    WHERE  auth_id = auth.uid();

    -- Critical conditions (§4 trigger logic):
    --   1. A host touched a platform-scope automation
    --   2. A host touched a founder-locked automation
    IF actor_user_role = 'host' AND (
        current_row.scope = 'platform' OR
        current_row.locked_by_founder = true
    ) THEN
        is_critical := true;
    END IF;

    -- Write audit record
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

    -- §1 Rule #16: notify ALL founders on critical change
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
