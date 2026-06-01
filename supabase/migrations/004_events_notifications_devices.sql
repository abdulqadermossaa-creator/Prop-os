-- ═══════════════════════════════════════════════════════
-- Migration 004: Events, Notifications, Devices
--
-- §1 Rule #6: ALWAYS log to events table —
--             every action is an event. Immutable.
-- ═══════════════════════════════════════════════════════


-- ─────────────────────────────────────────────
-- EVENTS — append-only log of every action
-- ─────────────────────────────────────────────
CREATE TABLE public.events (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

    unit_id     UUID        REFERENCES public.units(id)          ON DELETE SET NULL,
    session_id  UUID        REFERENCES public.guest_sessions(id)  ON DELETE SET NULL,
    actor_id    UUID        REFERENCES public.users(id)           ON DELETE SET NULL,

    -- What happened
    event_type  TEXT        NOT NULL,

    -- Who triggered it
    source      TEXT        CHECK (source IN (
                                'guest_card', 'tablet', 'founder',
                                'host', 'pi', 'automation', 'ical', 'system'
                            )),

    -- Full payload (device state, mode change, etc.)
    payload     JSONB       NOT NULL DEFAULT '{}',

    -- Immutable — no updated_at, no UPDATE allowed
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.events            IS 'Immutable event log. Every system action appends here. Never updated or deleted.';
COMMENT ON COLUMN public.events.event_type IS 'e.g. mode.changed, device.toggled, guest.checkin, automation.executed';


-- ─────────────────────────────────────────────
-- NOTIFICATIONS — real-time alerts for users
-- ─────────────────────────────────────────────
CREATE TABLE public.notifications (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id    UUID        NOT NULL
                                REFERENCES public.users(id) ON DELETE CASCADE,

    type            TEXT        NOT NULL,
    title           TEXT,
    body            TEXT,
    payload         JSONB       NOT NULL DEFAULT '{}',

    -- NULL = unread
    read_at         TIMESTAMPTZ,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.notifications              IS 'Push notifications for Founder/Host. Written by audit trigger and automation engine.';
COMMENT ON COLUMN public.notifications.type        IS 'e.g. critical_automation_change, unit_approved, new_booking';
COMMENT ON COLUMN public.notifications.read_at     IS 'NULL = unread. Set when user opens the notification.';


-- ─────────────────────────────────────────────
-- DEVICES — IoT devices per unit
-- ─────────────────────────────────────────────
CREATE TABLE public.devices (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id         UUID        NOT NULL
                                REFERENCES public.units(id) ON DELETE CASCADE,

    -- Type must match allowed_device_types in resource_limits (migration 007)
    device_type     TEXT        NOT NULL
                                CHECK (device_type IN (
                                    'ac', 'light', 'led_strip', 'door', 'presence',
                                    'plug', 'switch', 'leak', 'temp', 'tv', 'lock'
                                )),

    name            TEXT        NOT NULL,
    room            TEXT,

    -- Pi/Zigbee identifiers (§9)
    zigbee_id       TEXT,
    mqtt_topic      TEXT,

    -- Live state — updated in real-time by Pi heartbeat
    state           JSONB       NOT NULL DEFAULT '{}',
    online          BOOLEAN     NOT NULL DEFAULT false,
    last_seen       TIMESTAMPTZ,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_devices_updated_at
    BEFORE UPDATE ON public.devices
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

COMMENT ON TABLE  public.devices            IS 'IoT devices per unit. state JSONB updated in real-time by Pi.';
COMMENT ON COLUMN public.devices.device_type IS 'Must match allowed_device_types in resource_limits. Validated at insert.';
COMMENT ON COLUMN public.devices.state      IS 'e.g. {"power":"on","temp":22,"mode":"cool"} for AC.';
COMMENT ON COLUMN public.devices.mqtt_topic IS 'e.g. qlvin/units/{unit_id}/devices/{device_id}/state';
