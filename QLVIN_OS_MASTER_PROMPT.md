# 🏗️ QLVIN OS — Master Engineering Prompt
> **Version:** 1.0 Final
> **Target:** Claude Code / Gemini Code / GitHub Copilot Workspace
> **Type:** Production-Ready MVP Specification
> **Owner:** Sulaiman Al-Qahtani & Partner

---

## 📋 INSTRUCTIONS FOR AI AGENT

You are a **Senior Full-Stack Engineer + IoT Architect**. Read this entire document carefully, then execute the build plan EXACTLY as specified. **Do NOT improvise on design**. Use the provided HTML files as the absolute UI source of truth.

**Your role:**
- Frontend Integration (connect existing HTML to backend)
- Supabase backend (schema + Edge Functions)
- IoT layer (MQTT + Raspberry Pi + Zigbee)
- Gemini integration (as suggestion layer only)
- WhatsApp + iCal integration
- Deployment to Netlify + GitHub

**You are NOT to:**
- ❌ Redesign any existing HTML (founder_v4_final, host_v6, guest_smart_card_v3)
- ❌ Replace Qlvin Core logic with Gemini
- ❌ Build "engines" — build small services
- ❌ Add features outside the MVP scope below

---

## 🎯 1. PROJECT VISION

**Qlvin OS** is a **Luxury AI Hospitality Operating System** for furnished apartments, chalets, and resorts in Saudi Arabia.

It is NOT:
- ❌ Smart Home app
- ❌ Booking dashboard
- ❌ Chatbot
- ❌ PMS clone

It IS:
- ✅ A complete OS that connects: Guest experience + Smart card + In-unit tablet + Host dashboard + Founder dashboard + Booking iCal + WhatsApp + Raspberry Pi + Sensors + Smart modes + Gemini hospitality layer

### Core Philosophy
> **"The system acts more than it talks."**

- No annoying chatbot
- No questions thrown at the guest
- Interaction = buttons, smart cards, Liquid Glass notifications
- Gemini suggests responses, but never controls the system
- Qlvin Core is the brain — Gemini is just a hospitality voice layer

---

## 🏛️ 2. ARCHITECTURE

```
┌──────────────────────────────────────────────┐
│  USER LAYER                                   │
│  ┌──────────┬──────────┬──────────┬────────┐ │
│  │ Founder  │  Host    │  Tablet  │ Guest  │ │
│  │ Dashboard│Dashboard │ in-unit  │  Card  │ │
│  └──────────┴──────────┴──────────┴────────┘ │
└────────────────────┬─────────────────────────┘
                     ↓
┌──────────────────────────────────────────────┐
│  API LAYER (Supabase Edge Functions)         │
│  - Auth | Bookings | Guest tokens            │
│  - WhatsApp sender | iCal sync               │
│  - Gemini proxy (server-side only)           │
└────────────────────┬─────────────────────────┘
                     ↓
┌──────────────────────────────────────────────┐
│  QLVIN CORE SERVICES                         │
│  - guest_service                             │
│  - device_service                            │
│  - automation_service                        │
│  - presence_service                          │
│  - event_service                             │
└────────────────────┬─────────────────────────┘
                     ↓
        ┌────────────┴────────────┐
        ↓                         ↓
┌──────────────┐         ┌──────────────────┐
│  Gemini API  │         │  MQTT Broker     │
│ (suggestions │         │  (Mosquitto)     │
│   ONLY)      │         └────────┬─────────┘
└──────────────┘                  ↓
                         ┌──────────────────┐
                         │  Raspberry Pi    │
                         │  Zigbee2MQTT     │
                         │  Sonoff Dongle   │
                         └────────┬─────────┘
                                  ↓
                         ┌──────────────────┐
                         │  Zigbee Devices  │
                         │  AC | Lights     │
                         │  Sensors | Plugs │
                         └──────────────────┘
```

### Critical Rules
1. **Gemini NEVER touches devices directly** — every action passes through Qlvin Core
2. **Everything is event-driven** — all actions log to `events` table
3. **Local-first** — devices work via Raspberry Pi + MQTT (no cloud dependency)
4. **Tokens are time-bound** — guest links expire at checkout

---

## 🎨 3. UI INTERFACES (DO NOT REDESIGN)

### Pre-Approved Files (USE AS-IS)
| File | Purpose | Status |
|------|---------|--------|
| `founder_v4_final.html` | Founder Dashboard | ✅ APPROVED |
| `host_v6.html` | Host Dashboard | ✅ APPROVED |
| `guest_smart_card_v3.html` | Guest Mobile Card | ✅ APPROVED |
| `guest_tablet.html` | In-unit Tablet UI | 🔨 TO BUILD (from V3 design) |

### Build Instruction for `guest_tablet.html`
**Inherit 100% from `guest_smart_card_v3.html` design language:**
- Same Liquid Glass aesthetic
- Same Mood-based CSS variables (cinema/match/coffee/relax)
- Same Time Ring component
- Same Qlvin OS logo + splash screen
- Same Sliders + RGB picker
- Same Modal/Sheet behavior
- Same color theming system

**Differences for Tablet:**
- Larger screen layout (landscape-ready)
- Add 5 screens flow: Awake → Greeting → Conversation → Action → Ambient
- Add "نواف" reception persona (NOT فهد - use **نواف** per latest spec)
- Add idle Ambient mode with clock + weather
- Voice + text mode toggle
- Behavior Tracker integration (Netflix confusion detection)

**Naming Decision (FINAL):** Reception assistant = **نواف** (overrides previous "فهد")

---

## 🤖 4. GEMINI ROLE (STRICT)

### Where Gemini IS Used
- ✅ Guest Tablet conversation layer
- ✅ Smart suggestions (movies, food, mood)
- ✅ Intent detection from guest messages
- ✅ Tone refinement for נواف responses

### Where Gemini is NEVER Used
- ❌ Founder Dashboard
- ❌ Host Dashboard
- ❌ Device control decisions
- ❌ Booking logic
- ❌ Payment logic
- ❌ Token generation

### Gemini Response Contract (STRICT JSON)
```json
{
  "intent": "watch_match | adjust_ac | ask_wifi | extend_booking | order_coffee | food_request | greeting | thanks | unknown",
  "confidence": 0.0-1.0,
  "reply_ar": "Short, luxurious Saudi-dialect response (1-2 lines max)",
  "actions": [
    {
      "type": "set_ac | set_scene | show_screen | send_whatsapp | create_event",
      "target": "device_id_or_screen_name",
      "value": "string_or_number"
    }
  ],
  "suggestions": ["max 3 short button labels"]
}
```

### Gemini Edge Function Wrapper
```typescript
// supabase/functions/gemini-intent/index.ts
// Receives: { message, guest_session_id, unit_context }
// Returns: GeminiResponse (above format)
// 
// Hard rules:
// 1. Validates Gemini output against schema
// 2. If invalid → returns fallback intent: "unknown"
// 3. If actions present → forwards to automation_service
// 4. Logs every call to events table
// 5. Rate limited: max 30 calls/guest/hour
```

### Trigger Logic (When to Call Gemini)
**DO call Gemini when:**
- Guest types/speaks a message that doesn't match scripted patterns
- Netflix Confusion detected (5+ min idle on Netflix screen)
- Guest asks open-ended question

**DO NOT call Gemini for:**
- Button clicks (use scripted responses)
- Slider adjustments
- Mode switches
- Standard hospitality (WiFi, code, time)
- Every guest scroll/movement

**Cost target:** < 50 Gemini calls per active guest per day.

---

## 👤 5. PERSONA: نواف (Reception Assistant)

| Attribute | Value |
|-----------|-------|
| Name | نواف |
| Age | 27-30 (mental model) |
| Nationality | Saudi |
| Tone | Calm, luxurious, brief |
| Style | Saudi dialect, natural |
| Length | 1-2 sentences MAX |
| Emoji | 1 emoji max per response |
| Behavior | Appears when needed, not always present |

### Good vs Bad Examples

✅ **Good:** "الهلال × النصر مباشر الآن. جهزت لك وضع المباراة."
❌ **Bad:** "يا هلا بمشجع الهلال الكبير! والله إن المباراة اليوم نار..."

✅ **Good:** "عدّلت المكيف. تبرد الغرفة خلال دقائق."
❌ **Bad:** "أكيد طبعاً! حاضر يا غالي، خلاص أنا الحين أعدل لك المكيف وأبردها لك..."

### نواف's 80% Scripted Responses
Build a `responses` JSON file with scripted patterns. Gemini only fills the remaining 20% for edge cases. This achieves:
- 🚀 Sub-100ms response time
- 💰 90%+ Gemini cost savings
- 🛡️ 100% predictable for demos

---

## 🏗️ 6. MVP SCOPE (3-4 WEEKS)

### Definition of MVP
**One apartment + One tablet + One Raspberry Pi + 5 working scenarios + 3 dashboards live in production.**

### MVP Includes
- ✅ Supabase database (schema below)
- ✅ Auth (Founder + Host login)
- ✅ Connect 3 existing dashboards to Supabase
- ✅ Tablet UI (build from guest_smart_card_v3 design)
- ✅ Guest Smart Card with unique tokens
- ✅ iCal sync (Airbnb + Gathern)
- ✅ WhatsApp send (Twilio or mock)
- ✅ Gemini intent detection
- ✅ MQTT integration with Mosquitto
- ✅ Raspberry Pi controller (Python)
- ✅ 5 automation scenarios
- ✅ Deployment to Netlify + Supabase
- ✅ GitHub repo with CI/CD

### MVP Excludes (Phase 2)
- ❌ Multiple properties (one only)
- ❌ Payment processing (use mock for extension)
- ❌ Custom ElevenLabs voice (use Web Speech API)
- ❌ Mobile apps (PWA only)
- ❌ Advanced analytics
- ❌ Multi-language (Arabic only for now)
- ❌ Custom branding per host

---

## 🗄️ 7. DATABASE SCHEMA (Supabase PostgreSQL)

```sql
-- ============================================
-- 1. USERS (Founders, Hosts, Guests)
-- ============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('founder', 'host', 'guest')),
    phone TEXT,
    email TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. PROPERTIES (Apartments / Chalets / Resorts)
-- ============================================
CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    location TEXT,
    type TEXT CHECK (type IN ('apartment', 'chalet', 'resort', 'pod')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'archived')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. UNITS (Individual rentable units)
-- ============================================
CREATE TABLE units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    short_name TEXT,
    qlvn_code TEXT UNIQUE, -- e.g. "QLVN-1042"
    status TEXT DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'cleaning', 'maintenance', 'suspended')),
    
    -- WiFi
    wifi_name TEXT,
    wifi_password TEXT,
    
    -- Climate
    current_temp NUMERIC,
    target_temp NUMERIC DEFAULT 22,
    
    -- Pi/IoT
    pi_id TEXT,
    pi_status TEXT DEFAULT 'offline' CHECK (pi_status IN ('online', 'offline')),
    pi_last_seen TIMESTAMPTZ,
    
    -- Pricing
    base_price_per_night NUMERIC,
    extension_price_per_hour NUMERIC DEFAULT 50,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. BOOKINGS (from iCal sync)
-- ============================================
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
    external_booking_id TEXT, -- from Airbnb/Gathern
    source TEXT CHECK (source IN ('airbnb', 'gathern', 'booking', 'direct', 'manual')),
    guest_name TEXT NOT NULL,
    guest_phone TEXT,
    guest_email TEXT,
    checkin_at TIMESTAMPTZ NOT NULL,
    checkout_at TIMESTAMPTZ NOT NULL,
    nights INT,
    total_price NUMERIC,
    status TEXT DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'active', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. GUEST_SESSIONS (Active stays)
-- ============================================
CREATE TABLE guest_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
    guest_name TEXT NOT NULL,
    guest_phone TEXT,
    
    -- Access
    access_code TEXT, -- 4-digit door code
    code_changed_at TIMESTAMPTZ,
    
    -- Token (for Smart Guest Card link)
    guest_token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
    token_expires_at TIMESTAMPTZ NOT NULL,
    
    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'cancelled')),
    checked_in_at TIMESTAMPTZ,
    checked_out_at TIMESTAMPTZ,
    
    -- Preferences (learned during stay)
    preferences JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_guest_token ON guest_sessions(guest_token) WHERE status = 'active';

-- ============================================
-- 6. DEVICES (Zigbee/MQTT devices per unit)
-- ============================================
CREATE TABLE devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('ac', 'light', 'door', 'presence', 'plug', 'switch', 'leak', 'temp', 'led_strip', 'tv')),
    protocol TEXT CHECK (protocol IN ('zigbee', 'mqtt', 'wifi', 'ir', 'gpio')),
    mqtt_topic TEXT,
    state JSONB DEFAULT '{}',
    status TEXT DEFAULT 'offline' CHECK (status IN ('online', 'offline')),
    last_seen TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 7. EVENTS (Everything is logged)
-- ============================================
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
    guest_session_id UUID REFERENCES guest_sessions(id) ON DELETE SET NULL,
    type TEXT NOT NULL, -- 'checkin', 'door_open', 'silent_exit', 'mode_change', etc.
    payload JSONB DEFAULT '{}',
    severity TEXT DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_events_unit_time ON events(unit_id, created_at DESC);

-- ============================================
-- 8. MESSAGES (Guest ↔ نواف conversations)
-- ============================================
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guest_session_id UUID REFERENCES guest_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('guest', 'nawaf', 'system')),
    content TEXT NOT NULL,
    intent TEXT,
    used_gemini BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 9. AUTOMATION_RULES
-- ============================================
CREATE TABLE automation_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    trigger_type TEXT,
    conditions JSONB,
    actions JSONB,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 10. ORDERS (Coffee, popcorn, drinks)
-- ============================================
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guest_session_id UUID REFERENCES guest_sessions(id) ON DELETE CASCADE,
    item_name TEXT NOT NULL,
    item_type TEXT, -- 'coffee', 'food', 'drink', 'service'
    quantity INT DEFAULT 1,
    price NUMERIC,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'delivered', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 11. EXTENSIONS (Stay extensions)
-- ============================================
CREATE TABLE extensions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guest_session_id UUID REFERENCES guest_sessions(id) ON DELETE CASCADE,
    duration_hours INT NOT NULL,
    price NUMERIC NOT NULL,
    status TEXT DEFAULT 'requested' CHECK (status IN ('requested', 'approved', 'rejected', 'paid')),
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    approved_at TIMESTAMPTZ,
    new_checkout_at TIMESTAMPTZ
);

-- ============================================
-- 12. ICAL_FEEDS (Booking sync sources)
-- ============================================
CREATE TABLE ical_feeds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
    source TEXT CHECK (source IN ('airbnb', 'gathern', 'booking', 'other')),
    url TEXT NOT NULL,
    last_synced_at TIMESTAMPTZ,
    sync_status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 13. WHATSAPP_CONFIGS (Per host)
-- ============================================
CREATE TABLE whatsapp_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    host_id UUID REFERENCES users(id) ON DELETE CASCADE,
    provider TEXT DEFAULT 'twilio' CHECK (provider IN ('twilio', 'meta_cloud', 'mock')),
    from_number TEXT,
    api_credentials JSONB, -- encrypted
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 14. RLS POLICIES
-- ============================================
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Hosts see only their units
CREATE POLICY "Hosts view own units" ON units
    FOR SELECT USING (
        property_id IN (
            SELECT id FROM properties WHERE owner_id = auth.uid()
        )
    );

-- Founders see all
CREATE POLICY "Founders view all" ON units
    FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'founder')
    );

-- ============================================
-- 15. REALTIME (for live updates)
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE units;
ALTER PUBLICATION supabase_realtime ADD TABLE guest_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE events;
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE devices;
```

---

## 🔌 8. EDGE FUNCTIONS (Supabase Deno)

### Required Edge Functions

```
supabase/functions/
├── gemini-intent/         # Gemini wrapper (intent detection)
├── ical-sync/             # Pulls Airbnb/Gathern bookings
├── whatsapp-send/         # Sends WhatsApp via Twilio
├── guest-token-validate/  # Validates Smart Card token
├── booking-process/       # Creates session from booking
├── extension-request/     # Handles stay extensions
├── automation-trigger/    # Executes automation rules
└── mqtt-publish/          # Sends MQTT commands to Pi
```

### Example: `gemini-intent/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")!
const SYSTEM_PROMPT = `أنت "نواف"، موظف استقبال سعودي ذكي في Qlvin OS.
- ردك سطر واحد إلى سطرين كحد أقصى
- لهجة سعودية طبيعية بدون مبالغة
- استخدم emoji واحد فقط
- أنه ردك باقتراح أو زر

أرجع JSON بالشكل التالي فقط:
{
  "intent": "watch_match|adjust_ac|ask_wifi|extend_booking|order_coffee|food_request|greeting|thanks|unknown",
  "confidence": 0.0-1.0,
  "reply_ar": "النص",
  "actions": [],
  "suggestions": ["خيار 1", "خيار 2", "خيار 3"]
}`

serve(async (req) => {
  const { message, guest_session_id, unit_context } = await req.json()
  
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  )
  
  // 1. Rate limit check
  const { count } = await supabase
    .from('messages')
    .select('id', { count: 'exact' })
    .eq('guest_session_id', guest_session_id)
    .eq('used_gemini', true)
    .gte('created_at', new Date(Date.now() - 3600000).toISOString())
  
  if (count > 30) {
    return new Response(JSON.stringify({
      intent: 'unknown',
      reply_ar: 'لحظة، أحضر لك الإجابة.',
      suggestions: ['تواصل مع المضيف']
    }), { status: 429 })
  }
  
  // 2. Call Gemini
  const geminiResponse = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `${SYSTEM_PROMPT}\n\nسياق الوحدة: ${JSON.stringify(unit_context)}\nرسالة الضيف: ${message}`
          }]
        }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.7
        }
      })
    }
  )
  
  const data = await geminiResponse.json()
  const reply = JSON.parse(data.candidates[0].content.parts[0].text)
  
  // 3. Validate schema
  if (!reply.intent || !reply.reply_ar) {
    return new Response(JSON.stringify({
      intent: 'unknown',
      reply_ar: 'ممكن توضح أكثر؟',
      suggestions: []
    }))
  }
  
  // 4. Log
  await supabase.from('messages').insert({
    guest_session_id,
    role: 'guest',
    content: message,
    intent: reply.intent,
    used_gemini: true
  })
  
  await supabase.from('messages').insert({
    guest_session_id,
    role: 'nawaf',
    content: reply.reply_ar,
    intent: reply.intent
  })
  
  return new Response(JSON.stringify(reply), {
    headers: { "Content-Type": "application/json" }
  })
})
```

### Example: `guest-token-validate/index.ts`
```typescript
// Called by Smart Guest Card on load
// Validates token, returns guest session data if valid + active + not expired
// Returns 401 if invalid/expired
```

---

## 🥧 9. RASPBERRY PI CONTROLLER

### Hardware (MVP)
- Raspberry Pi 4 or 5
- Sonoff Zigbee 3.0 USB Dongle Plus
- MicroSD 32GB+
- Power supply (official)

### Software Stack
- Raspberry Pi OS Lite (64-bit)
- Python 3.11+
- Zigbee2MQTT
- Mosquitto MQTT Broker
- Docker (optional, for cleaner deployment)

### Project Structure
```
qlvin-pi/
├── main.py                # Entry point
├── config.py              # Config loader
├── services/
│   ├── mqtt_service.py    # MQTT connect + publish/subscribe
│   ├── supabase_service.py # Heartbeat + state sync
│   ├── presence_service.py # Motion detection logic
│   ├── door_service.py    # Door sensor handling
│   └── automation_service.py # Local automation rules
├── devices/
│   ├── ac_controller.py   # IR-based AC control
│   ├── light_controller.py # Zigbee light control
│   └── door_lock.py       # Smart lock interface
└── qlvin.service          # systemd service file
```

### MQTT Topics Structure
```
qlvin/{unit_id}/device/{device_id}/set      # Cloud → Pi (command)
qlvin/{unit_id}/device/{device_id}/state    # Pi → Cloud (state)
qlvin/{unit_id}/events                       # Pi → Cloud (events)
qlvin/{unit_id}/scene/set                    # Cloud → Pi (scene)
qlvin/{unit_id}/presence                     # Pi → Cloud (presence)
qlvin/{unit_id}/heartbeat                    # Pi → Cloud (every 30s)
```

### Heartbeat Example
```python
# services/supabase_service.py
import asyncio
from datetime import datetime
from supabase import create_client

async def heartbeat_loop(unit_id, supabase):
    while True:
        try:
            await supabase.table('units').update({
                'pi_status': 'online',
                'pi_last_seen': datetime.utcnow().isoformat()
            }).eq('id', unit_id).execute()
        except Exception as e:
            print(f"Heartbeat failed: {e}")
        await asyncio.sleep(30)
```

### Setup Script (One-liner for new Pi)
```bash
curl -sSL https://raw.githubusercontent.com/qlvin/qlvin-pi/main/setup.sh | bash
```

---

## 📱 10. THE 5 CORE MVP SCENARIOS

### Scenario 1: iCal Booking → Guest Card
**Trigger:** New booking in Airbnb/Gathern  
**Flow:**
1. iCal sync (every 15 min) detects new booking
2. `booking-process` Edge Function creates `bookings` row
3. Creates `guest_sessions` row with unique token
4. Token expires at `checkout_at + 2 hours`
5. WhatsApp sent to guest with link: `https://qlvin.app/g/{token}`
6. Guest opens link → Smart Card loads

### Scenario 2: Guest Check-in (Presence)
**Trigger:** Motion sensor detects entry  
**Flow:**
1. Raspberry Pi reads Zigbee motion sensor
2. Publishes to `qlvin/{unit_id}/presence`
3. Edge function updates `guest_sessions.checked_in_at`
4. Triggers automation: turn on lights + adjust AC to preference
5. Tablet wakes up to Greeting screen
6. Event logged: `checkin`

### Scenario 3: "الجو حار" → AC Adjustment
**Trigger:** Guest types/says "الجو حار" on tablet  
**Flow:**
1. Tablet calls `gemini-intent` with message
2. Gemini returns: `{intent: 'adjust_ac', actions: [{type: 'set_ac', value: 20}]}`
3. Tablet shows نواف's reply
4. Edge function publishes MQTT: `qlvin/{unit_id}/device/{ac_id}/set {"temp": 20}`
5. Pi receives → controls IR blaster → AC adjusts
6. Event logged

### Scenario 4: Netflix Confusion → Movie Suggestions
**Trigger:** Guest on Cinema mode for 5+ min, no selection  
**Flow:**
1. Tablet's Behavior Tracker detects pattern
2. Calls `gemini-intent` with context: "Guest confused, suggest movies"
3. Returns 3 movie suggestions (Top Trending, Top Rated, Qlvn AI Pick)
4. Tablet shows نواف card with buttons (NOT chat)
5. Guest taps one → automation plays movie + dims lights
6. Event logged

### Scenario 5: Checkout Auto-cleanup
**Trigger:** `checkout_at` time reached  
**Flow:**
1. Cron job (every 5 min) checks for expired sessions
2. Sets `guest_sessions.status = 'completed'`
3. Sets `units.status = 'cleaning'`
4. Invalidates `guest_token`
5. MQTT command: turn off lights, set AC to 26°
6. WhatsApp sent to host: "Unit ready for cleaning"
7. Event logged

---

## 🔐 11. SECURITY MODEL

### Token-Based Guest Access
```
1. Token generated on booking creation (32 random bytes hex)
2. Token expires at checkout_at + 2 hours
3. Each token tied to ONE guest_session
4. After checkout: token invalidated, link returns 401
5. New booking = new token (no reuse possible)
```

### URL Pattern
```
Public:  https://qlvin.app/g/{token}        → Smart Guest Card
Tablet:  https://qlvin.app/t/{unit_token}   → In-unit Tablet (always-on)
Host:    https://qlvin.app/host             → Requires auth
Founder: https://qlvin.app/founder          → Requires auth (founder role)
```

### RLS (Row-Level Security)
- Hosts see only their properties/units/bookings
- Founders see everything
- Guests: NO direct DB access (only via Edge Functions with token)
- Service role: Used by Pi, Edge Functions

---

## 📂 12. GITHUB REPO STRUCTURE

```
qlvin-os/
├── README.md
├── .env.example
├── .gitignore
├── package.json
│
├── apps/
│   ├── founder/                    # Founder Dashboard
│   │   ├── index.html              ← Use founder_v4_final.html AS-IS
│   │   ├── supabase-client.js
│   │   └── netlify.toml
│   │
│   ├── host/                       # Host Dashboard
│   │   ├── index.html              ← Use host_v6.html AS-IS
│   │   ├── supabase-client.js
│   │   └── netlify.toml
│   │
│   ├── guest-card/                 # Smart Guest Card (mobile)
│   │   ├── index.html              ← Use guest_smart_card_v3.html AS-IS
│   │   ├── token-handler.js
│   │   └── netlify.toml
│   │
│   └── tablet/                     # In-unit Tablet
│       ├── index.html              ← BUILD from guest_smart_card_v3 design
│       ├── nawaf.js                # Reception logic
│       ├── behavior-tracker.js
│       ├── gemini-client.js
│       └── netlify.toml
│
├── supabase/
│   ├── migrations/
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_rls_policies.sql
│   │   └── 003_seed_data.sql
│   │
│   └── functions/
│       ├── gemini-intent/
│       ├── ical-sync/
│       ├── whatsapp-send/
│       ├── guest-token-validate/
│       ├── booking-process/
│       ├── extension-request/
│       ├── automation-trigger/
│       └── mqtt-publish/
│
├── pi/                              # Raspberry Pi Controller
│   ├── main.py
│   ├── config.py
│   ├── requirements.txt
│   ├── setup.sh
│   ├── qlvin.service
│   │
│   ├── services/
│   │   ├── mqtt_service.py
│   │   ├── supabase_service.py
│   │   ├── presence_service.py
│   │   └── automation_service.py
│   │
│   └── devices/
│       ├── ac_controller.py
│       ├── light_controller.py
│       └── door_lock.py
│
├── docs/
│   ├── ARCHITECTURE.md
│   ├── DEPLOYMENT.md
│   ├── SCENARIOS.md
│   └── API.md
│
└── .github/
    └── workflows/
        ├── deploy-frontend.yml      # Netlify deploy
        ├── deploy-functions.yml     # Supabase Edge deploy
        └── test.yml                 # CI tests
```

---

## 🚀 13. DEPLOYMENT PLAN

### Phase 1: Backend Setup (Day 1-2)
```bash
# 1. Create Supabase project at supabase.com
# 2. Run migrations
supabase db push

# 3. Set environment secrets
supabase secrets set GEMINI_API_KEY=xxx
supabase secrets set TWILIO_SID=xxx
supabase secrets set TWILIO_AUTH=xxx

# 4. Deploy Edge Functions
supabase functions deploy gemini-intent
supabase functions deploy ical-sync
# ... etc
```

### Phase 2: Frontend Integration (Day 3-5)
```javascript
// In each HTML file, add at the bottom:
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script>
  const supabase = window.supabase.createClient(
    'https://YOUR_PROJECT.supabase.co',
    'YOUR_ANON_KEY'
  );
  
  // Replace hardcoded data with Supabase queries
  // DO NOT MODIFY THE UI — only connect data
</script>
```

### Phase 3: Tablet Build (Day 6-8)
- Copy `guest_smart_card_v3.html` as base
- Add 5 screens: Awake/Greeting/Conversation/Action/Ambient
- Integrate Gemini Edge Function
- Add Behavior Tracker
- Test on actual tablet device

### Phase 4: Pi Setup (Day 9-11)
- Flash Raspberry Pi OS
- Run `setup.sh`
- Pair Zigbee devices via Zigbee2MQTT
- Test MQTT round-trip
- Connect to Supabase

### Phase 5: Integration Testing (Day 12-14)
- Test all 5 scenarios end-to-end
- Fix bugs
- Performance optimization
- Demo prep

---

## 🌍 14. ENVIRONMENT VARIABLES

### `.env.example`
```bash
# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxx  # Server-side only

# Gemini
GEMINI_API_KEY=AIxxx

# Twilio (WhatsApp)
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886

# MQTT (Pi side)
MQTT_BROKER=mqtt://localhost:1883
MQTT_USERNAME=qlvin
MQTT_PASSWORD=xxx

# Unit (Pi side)
UNIT_ID=uuid-of-unit
PI_ID=pi-001

# App
APP_URL=https://qlvin.app
APP_NAME=Qlvin OS
```

---

## ✅ 15. DEFINITION OF DONE (MVP)

The MVP is ✅ complete when:

- [ ] All 3 dashboards (Founder/Host/Guest) load from Supabase
- [ ] Adding a unit via Founder reflects in Host instantly (Realtime)
- [ ] iCal sync pulls a test booking successfully
- [ ] WhatsApp message sent with valid guest token link
- [ ] Smart Card opens with token, expires after checkout
- [ ] Tablet shows 5 screens with smooth transitions
- [ ] Guest types "الجو حار" → AC actually adjusts via MQTT
- [ ] Pi heartbeat shows online status in dashboard
- [ ] Motion sensor triggers welcome scene
- [ ] All 5 scenarios work end-to-end
- [ ] Deployed to Netlify (frontends) + Supabase (backend)
- [ ] GitHub repo public/private with clean commits
- [ ] README has setup instructions for next developer

---

## 🎯 16. AGENT EXECUTION ORDER

Execute in this exact sequence:

### Step 1: Repository Setup
```bash
# Create GitHub repo: qlvin-os
# Initialize with structure from section 12
# Add LICENSE, README.md, .gitignore
```

### Step 2: Place Pre-Approved HTML Files
```bash
# Copy these files WITHOUT modification:
cp founder_v4_final.html       apps/founder/index.html
cp host_v6.html                apps/host/index.html
cp guest_smart_card_v3.html    apps/guest-card/index.html
```

### Step 3: Supabase Setup
- Create project
- Run migrations
- Enable Realtime on specified tables
- Set RLS policies

### Step 4: Edge Functions
- Implement all 8 Edge Functions
- Test each individually
- Set secrets

### Step 5: Frontend Integration
- Add Supabase client to each HTML
- Replace mock data with real queries
- DO NOT MODIFY UI

### Step 6: Build Tablet UI
- Inherit design from guest_smart_card_v3
- Build 5 screens
- Integrate Gemini + Behavior Tracker

### Step 7: Pi Controller
- Write Python services
- Test MQTT round-trip
- Connect to Supabase

### Step 8: Deployment
- Netlify for frontends
- Supabase for backend
- GitHub Actions for CI/CD

### Step 9: Documentation
- Complete README with setup steps
- Architecture diagram
- API documentation

### Step 10: Final Demo
- Test all 5 scenarios
- Record demo video
- Tag v1.0.0 release

---

## 🚨 CRITICAL CONSTRAINTS

1. **NEVER modify the 3 approved HTML files**. They are the source of truth.
2. **NEVER let Gemini control devices**. It only suggests text + intents.
3. **NEVER expose API keys** in client code.
4. **ALWAYS log events** to the `events` table.
5. **ALWAYS validate Gemini output** against schema.
6. **ALWAYS use tokens** for guest access (never direct DB access).
7. **ALWAYS check expiration** before showing guest card.
8. **PREFER scripted responses** over Gemini (80/20 rule).
9. **ALL device commands** must pass through Qlvin Core → MQTT → Pi.
10. **ALL automation** runs via `automation_rules` table.

---

## 📞 SUPPORT

- **Founder:** Sulaiman Al-Qahtani
- **Partner:** Abdulkader
- **Repo:** github.com/qlvin/qlvin-os
- **Live:** qlvin.app

---

## 📜 LICENSE

Proprietary. © 2026 Qlvin OS. All rights reserved.

---

**END OF SPECIFICATION**

> This document is the single source of truth. If anything is unclear, ask for clarification BEFORE coding. Do not improvise.
