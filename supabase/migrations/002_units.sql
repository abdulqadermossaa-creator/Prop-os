-- ═══════════════════════════════════════════════════════
-- Migration 002: Units (furnished apartments)
--
-- §1 Rule #7: ALWAYS use unit.features JSONB — never
--             hardcode tablet UI. All device/feature
--             config lives in the features column.
-- ═══════════════════════════════════════════════════════

CREATE TABLE public.units (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    host_id             UUID        NOT NULL
                                    REFERENCES public.users(id) ON DELETE RESTRICT,

    -- Identity
    name                TEXT        NOT NULL,
    location            TEXT,
    floor               TEXT,
    building            TEXT,

    -- §1 Rule #7: unit.features JSONB — tablet UI, enabled devices, feature flags
    features            JSONB       NOT NULL DEFAULT '{}',

    -- WiFi (shown on guest card)
    wifi_ssid           TEXT,
    wifi_password       TEXT,

    -- iCal sync — §8 Function 2
    ical_airbnb         TEXT,
    ical_booking        TEXT,
    ical_other          TEXT,

    -- Pricing
    price_per_night     DECIMAL(10, 2),
    currency            TEXT        NOT NULL DEFAULT 'SAR',

    -- Approval (§7 Scenario 1 — Founder approves new units)
    status              TEXT        NOT NULL DEFAULT 'pending_approval'
                                    CHECK (status IN (
                                        'pending_approval',
                                        'approved',
                                        'suspended',
                                        'inactive'
                                    )),
    approved_by         UUID        REFERENCES public.users(id) ON DELETE SET NULL,
    approved_at         TIMESTAMPTZ,

    -- Pi pairing (§9 — unique code like QLVN-PAIR-7842)
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
