-- ═══════════════════════════════════════════════════════
-- Migration 001: Core users table
--
-- WHO GOES HERE:
--   Founder  → auth.users ✅
--   Host     → auth.users ✅
--   Guest    → guest_sessions (migration 003) ✅
--
-- Guests NEVER touch auth.users — token-only (§1 Rule #5)
-- ═══════════════════════════════════════════════════════

CREATE TABLE public.users (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Supabase Auth link — cascades on user deletion
    auth_id     UUID        UNIQUE NOT NULL
                            REFERENCES auth.users(id) ON DELETE CASCADE,

    name        TEXT        NOT NULL,
    email       TEXT        UNIQUE NOT NULL,
    phone       TEXT,

    -- 'founder' = god mode | 'host' = scoped to own units
    role        TEXT        NOT NULL
                            CHECK (role IN ('founder', 'host')),

    status      TEXT        NOT NULL DEFAULT 'active'
                            CHECK (status IN ('active', 'suspended', 'invited')),

    avatar_url  TEXT,
    metadata    JSONB       NOT NULL DEFAULT '{}',

    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- Reusable updated_at trigger (used by 002-005)
-- ─────────────────────────────────────────────
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
