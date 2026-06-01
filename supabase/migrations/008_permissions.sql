-- ═══════════════════════════════════════════════════════
-- Migration 008: Permission matrix + check function
--
-- Schema from §4 — verbatim.
-- §6: Permission Engine (JS layer) calls check_permission()
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

COMMENT ON TABLE public.permissions IS 'RBAC matrix. Queried by check_permission() and the JS Permission Engine (§6).';


-- ─────────────────────────────────────────────
-- 👑 FOUNDER: all-powerful (from §4 exactly)
-- ─────────────────────────────────────────────
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


-- ─────────────────────────────────────────────
-- 🏠 HOST: scoped, with notifications (from §4)
-- ─────────────────────────────────────────────
INSERT INTO public.permissions (role, action, resource, allowed, triggers_notification, severity) VALUES
    ('host', 'automation.create', 'own_unit',         true,  true,  'info'),
    ('host', 'automation.create', 'platform',         false, false, 'info'),
    ('host', 'automation.edit',   'own_unit_unlocked', true,  true,  'info'),
    ('host', 'automation.edit',   'locked',            false, false, 'critical'),
    ('host', 'automation.delete', 'own_unit_unlocked', true,  true,  'warning'),
    ('host', 'automation.delete', 'locked',            false, false, 'critical'),
    ('host', 'unit.create',       'own',               true,  false, 'info'),
    ('host', 'unit.edit',         'own_approved',      true,  true,  'warning'),
    ('host', 'limits.set',        'any',               false, false, 'critical'),
    ('host', 'studio.access',     'own_units',         true,  false, 'info');


-- ─────────────────────────────────────────────
-- 🎫 GUEST: session-scoped only (from §4)
-- ─────────────────────────────────────────────
INSERT INTO public.permissions (role, action, resource, allowed, triggers_notification, severity) VALUES
    ('guest', 'mode.set',          'current_session', true,  false, 'info'),
    ('guest', 'slider.adjust',     'current_session', true,  false, 'info'),
    ('guest', 'order.create',      'current_session', true,  false, 'info'),
    ('guest', 'extension.request', 'current_session', true,  false, 'info'),
    ('guest', 'automation.create', 'any',             false, false, 'critical');


-- ═══════════════════════════════════════════════════════
-- check_permission() — called by JS Permission Engine (§6)
--
-- Returns 1 row with the permission details.
-- If no matching rule: defaults to denied + critical.
-- ═══════════════════════════════════════════════════════
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
    -- LEFT JOIN against a constant row guarantees exactly 1 row returned.
    -- If no permission found, COALESCE fills in safe defaults (denied).
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
