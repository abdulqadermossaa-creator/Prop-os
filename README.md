# 🏗️ QLVIN OS — Master Build Specification v2.0

> **Audience:** Claude Code / Gemini Code / Cursor / GitHub Copilot Workspace
> **Mode:** Autonomous full-stack implementation
> **Status:** Production MVP — ready to execute
> **Owner:** Sulaiman Al-Qahtani (سليمان القحطاني) + Abdulkader (عبدالقادر)
> **Version:** 2.0 (with Automation Studio + Permission Matrix + Audit System)

-----

## 🚨 IMPORTANT: READ ENTIRE DOCUMENT BEFORE STARTING

This document is your **only source of truth**. The founder has reviewed every section. Do not improvise. Do not skip. Do not redesign approved UI.

If anything is unclear: ASK before coding.

-----

## 🎯 0. WHAT YOU’RE BUILDING (in one paragraph)

You are building **Qlvin OS** — a Luxury AI Hospitality Operating System for furnished apartments in Saudi Arabia. The system has 4 user interfaces (Founder, Host, Guest Card, In-Suite Tablet), a Supabase backend, a Gemini intent layer (NOT for control), a Raspberry Pi local controller via MQTT/Zigbee, WhatsApp/iCal integrations, and a powerful **Automation Studio** that allows the Founder to control everything across all 4 pages and Hosts to customize within Founder-defined limits. **The UI is already designed and approved — do not redesign it.**

-----

## 🚨 1. NON-NEGOTIABLE RULES (12 + 6 new)

### Original 12:

1. **NEVER redesign approved HTML files** (founder_v4_final, host_v6, guest_smart_card_v3, guest_tablet_v1)
1. **NEVER let Gemini control devices directly** — only returns JSON intent
1. **NEVER skip Founder approval** for any new unit
1. **NEVER expose API keys** in client code
1. **NEVER reuse guest tokens** — fresh per booking, expires at checkout
1. **ALWAYS log to `events` table** — every action is an event
1. **ALWAYS use `unit.features` JSONB config** — never hardcode tablet UI
1. **ALWAYS validate inputs** server-side
1. **ALWAYS use Realtime channels** for live sync
1. **ALWAYS prefer scripted Nawaf responses** (80/20)
1. **THE ASSISTANT IS NAMED “نواف”** — Saudi, 27-30, calm, brief, 1 emoji max
1. **EVERY BUTTON MUST WORK** — no dead clicks

### NEW 6 Rules (v2.0):

1. **NEVER let a Host edit Founder-protected automations** — enforce permission matrix strictly
1. **ALWAYS audit every automation change** — who, what, when, where
1. **ALWAYS check resource limits** before allowing host actions
1. **ALWAYS notify the founder** when a critical automation changes
1. **ALWAYS make founder workflows Plug & Play** — minimum clicks
1. **ALWAYS show “edited by [host_name]”** on every automation in founder view

-----

## 🏛️ 2. ARCHITECTURE

```
┌────────────────────────────────────────────────────────────┐
│  CLIENTS (HTML — DO NOT REDESIGN)                           │
│  Founder · Host · Guest Card · Tablet                       │
│  All include ⚡ Automation Studio (scoped per role)          │
└─────────────────────────┬──────────────────────────────────┘
                          ↓ (HTTPS + Realtime)
┌────────────────────────────────────────────────────────────┐
│  SUPABASE BACKEND                                           │
│  ├─ 20 tables (incl. automation_rules, audit_log, limits)   │
│  ├─ Auth + RLS + Realtime                                   │
│  ├─ 10 Edge Functions                                       │
│  └─ Permission Engine + Audit Triggers                      │
└─────────────────────────┬──────────────────────────────────┘
                          ↓
       ┌──────────────────┴──────────────────┐
       ↓                                     ↓
┌──────────────┐                  ┌────────────────────┐
│ Gemini Flash │                  │  MQTT + Pi + Zigbee│
│ (intent only)│                  └────────────────────┘
└──────────────┘
```

-----

## 📦 3. REPO STRUCTURE

```
qlvin-os/
├── README.md
├── CLAUDE.md                       # this file
├── .env.example
├── apps/
│   ├── founder/index.html          # = founder_v4_final.html
│   ├── host/index.html             # = host_v6.html
│   ├── guest-card/index.html       # = guest_smart_card_v3.html
│   └── tablet/index.html           # = guest_tablet_v1.html
│
├── packages/
│   ├── qlvn-config/                # registries (features, triggers, actions)
│   ├── qlvn-automation/            # ⭐ NEW: runner, validator, audit, permissions
│   ├── qlvn-ui/                    # shared components (studio modals)
│   └── qlvn-events/
│
├── supabase/
│   ├── migrations/                 # 001 → 009
│   └── functions/                  # 10 Edge Functions
│
├── pi/                             # Python controller
│   ├── main.py
│   ├── services/
│   └── devices/
│
└── docs/
    ├── SCENARIOS.md                # ⭐ 3 key scenarios
    ├── AUTOMATION_STUDIO.md        # ⭐ Studio guide
    ├── PERMISSIONS.md              # ⭐ Permission matrix
    └── PI_SETUP.md
```

-----

## 🗄️ 4. DATABASE SCHEMA (NEW v2.0 tables)

### Migration 005: `automation_rules`

```sql
CREATE TABLE automation_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Scope: platform-wide, host-specific, unit-specific
    scope TEXT NOT NULL CHECK (scope IN ('platform', 'host', 'unit')),
    scope_id UUID,
    
    name TEXT NOT NULL,
    icon TEXT DEFAULT '⚡',
    category TEXT,
    
    -- ⭐ Where it executes
    runs_on TEXT NOT NULL CHECK (runs_on IN (
        'mobile_card', 'tablet', 'host_dashboard',
        'founder_dashboard', 'pi_local', 'cloud', 'multi'
    )),
    runs_on_multi TEXT[],
    
    -- ⚡ When + If + Then
    trigger_type TEXT NOT NULL,
    trigger_config JSONB NOT NULL,
    conditions JSONB DEFAULT '[]',
    actions JSONB NOT NULL,
    
    enabled BOOLEAN DEFAULT true,
    is_template BOOLEAN DEFAULT false,
    
    -- ⭐ Ownership
    created_by UUID REFERENCES users(id),
    locked_by_founder BOOLEAN DEFAULT false,
    visible_to_host BOOLEAN DEFAULT true,
    
    -- ⭐ Audit
    last_edited_by UUID REFERENCES users(id),
    last_edited_at TIMESTAMPTZ,
    
    cost_weight INT DEFAULT 1,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE automation_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    automation_id UUID REFERENCES automation_rules(id) ON DELETE CASCADE,
    unit_id UUID REFERENCES units(id),
    triggered_by TEXT,
    executed_at TIMESTAMPTZ DEFAULT NOW(),
    duration_ms INT,
    success BOOLEAN,
    error_message TEXT,
    actions_results JSONB DEFAULT '[]'
);
```

### Migration 006: `audit_log`

```sql
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES users(id),
    actor_name TEXT,
    actor_role TEXT,
    
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id UUID,
    target_scope TEXT,
    target_scope_id UUID,
    
    before_state JSONB,
    after_state JSONB,
    metadata JSONB DEFAULT '{}',
    
    severity TEXT DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
    is_critical_change BOOLEAN DEFAULT false,
    
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger: auto-log automation changes + notify founder on critical
CREATE FUNCTION log_automation_change() RETURNS TRIGGER AS $$
DECLARE
    actor_user_id UUID; actor_user_name TEXT; actor_user_role TEXT;
    is_critical BOOLEAN := false;
BEGIN
    SELECT id, name, role INTO actor_user_id, actor_user_name, actor_user_role
    FROM users WHERE auth_id = auth.uid();
    
    IF (NEW.scope = 'platform' OR NEW.locked_by_founder = true)
       AND actor_user_role = 'host' THEN
        is_critical := true;
    END IF;
    
    INSERT INTO audit_log (
        actor_id, actor_name, actor_role,
        action, entity_type, entity_id,
        before_state, after_state,
        severity, is_critical_change
    ) VALUES (
        actor_user_id, actor_user_name, actor_user_role,
        TG_OP, 'automation_rule', NEW.id,
        to_jsonb(OLD), to_jsonb(NEW),
        CASE WHEN is_critical THEN 'critical' ELSE 'info' END,
        is_critical
    );
    
    IF is_critical THEN
        INSERT INTO notifications (recipient_id, type, title, body, payload)
        SELECT u.id, 'critical_automation_change',
               '⚠️ تعديل حرج', actor_user_name || ' عدّل "' || NEW.name || '"',
               jsonb_build_object('automation_id', NEW.id)
        FROM users u WHERE u.role = 'founder';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_automation
    AFTER INSERT OR UPDATE OR DELETE ON automation_rules
    FOR EACH ROW EXECUTE FUNCTION log_automation_change();
```

### Migration 007: `resource_limits`

```sql
CREATE TABLE resource_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scope TEXT NOT NULL CHECK (scope IN ('platform_default', 'host_override', 'unit_override')),
    scope_id UUID,
    limit_key TEXT NOT NULL,
    limit_value JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(scope, scope_id, limit_key)
);

INSERT INTO resource_limits (scope, scope_id, limit_key, limit_value) VALUES
    ('platform_default', NULL, 'max_automations_per_unit', '20'),
    ('platform_default', NULL, 'max_devices_per_unit', '15'),
    ('platform_default', NULL, 'max_features_per_unit', '25'),
    ('platform_default', NULL, 'max_units_per_host', '10'),
    ('platform_default', NULL, 'max_gemini_calls_per_day', '500'),
    ('platform_default', NULL, 'max_whatsapp_messages_per_day', '100'),
    ('platform_default', NULL, 'allowed_device_types', 
     '["ac","light","led_strip","door","presence","plug","switch","leak","temp","tv","lock"]'),
    ('platform_default', NULL, 'allowed_automation_runs_on',
     '["mobile_card","tablet","host_dashboard","pi_local","cloud","multi"]');

CREATE TABLE resource_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id UUID REFERENCES units(id),
    host_id UUID REFERENCES users(id),
    metric_key TEXT NOT NULL,
    metric_value INT DEFAULT 0,
    period_start TIMESTAMPTZ,
    period_end TIMESTAMPTZ,
    UNIQUE(unit_id, host_id, metric_key, period_start)
);
```

### Migration 008: `permissions`

```sql
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role TEXT NOT NULL,
    action TEXT NOT NULL,
    resource TEXT NOT NULL,
    allowed BOOLEAN DEFAULT true,
    requires_approval BOOLEAN DEFAULT false,
    triggers_notification BOOLEAN DEFAULT false,
    severity TEXT DEFAULT 'info'
);

-- 👑 FOUNDER: all powerful
INSERT INTO permissions (role, action, resource, allowed, severity) VALUES
    ('founder', 'automation.create', 'platform', true, 'info'),
    ('founder', 'automation.create', 'host', true, 'info'),
    ('founder', 'automation.create', 'unit', true, 'info'),
    ('founder', 'automation.edit', 'any', true, 'info'),
    ('founder', 'automation.delete', 'any', true, 'info'),
    ('founder', 'automation.lock', 'any', true, 'info'),
    ('founder', 'host.create', 'platform', true, 'info'),
    ('founder', 'host.suspend', 'any', true, 'critical'),
    ('founder', 'unit.create', 'any', true, 'info'),
    ('founder', 'unit.approve', 'any', true, 'info'),
    ('founder', 'limits.set', 'any', true, 'critical'),
    ('founder', 'audit.view', 'any', true, 'info'),
    ('founder', 'studio.access', 'any', true, 'info');

-- 🏠 HOST: scoped, with notifications
INSERT INTO permissions (role, action, resource, allowed, triggers_notification, severity) VALUES
    ('host', 'automation.create', 'own_unit', true, true, 'info'),
    ('host', 'automation.create', 'platform', false, false, 'info'),
    ('host', 'automation.edit', 'own_unit_unlocked', true, true, 'info'),
    ('host', 'automation.edit', 'locked', false, false, 'critical'),
    ('host', 'automation.delete', 'own_unit_unlocked', true, true, 'warning'),
    ('host', 'automation.delete', 'locked', false, false, 'critical'),
    ('host', 'unit.create', 'own', true, false, 'info'),
    ('host', 'unit.edit', 'own_approved', true, true, 'warning'),
    ('host', 'limits.set', 'any', false, false, 'critical'),
    ('host', 'studio.access', 'own_units', true, false, 'info');

-- 🎫 GUEST: only via session
INSERT INTO permissions (role, action, resource, allowed) VALUES
    ('guest', 'mode.set', 'current_session', true),
    ('guest', 'slider.adjust', 'current_session', true),
    ('guest', 'order.create', 'current_session', true),
    ('guest', 'extension.request', 'current_session', true),
    ('guest', 'automation.create', 'any', false);

CREATE FUNCTION check_permission(p_user_role TEXT, p_action TEXT, p_resource TEXT)
RETURNS TABLE (allowed BOOLEAN, requires_approval BOOLEAN, 
               triggers_notification BOOLEAN, severity TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT p.allowed, p.requires_approval, p.triggers_notification, p.severity
    FROM permissions p
    WHERE p.role = p_user_role AND p.action = p_action AND p.resource = p_resource;
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, false, false, 'critical';
    END IF;
END;
$$ LANGUAGE plpgsql STABLE;
```

-----

## ⚡ 5. AUTOMATION STUDIO

### 5.1 — Concept

A unified UI inside Founder & Host dashboards. Like iOS Shortcuts, but for hospitality.

- **Founder Studio:** sees all automations across platform, with filters
- **Host Studio:** sees only own units, respects founder locks
- **Guest Card & Tablet:** RUN automations but don’t show Studio

### 5.2 — Founder Studio Layout

```
╔════════════════════════════════════════════════════════════╗
║  ⚡ AUTOMATION STUDIO — Founder View                  [×]   ║
║  ───────────────────                                        ║
║                                                              ║
║  Filters (top):                                             ║
║  [ كل المضيفين ▼ ] [ كل الشقق ▼ ] [ كل الصفحات ▼ ]        ║
║                                                              ║
║  Active Automations (15)                                    ║
║  ┌────────────────────────────────────────────────────┐    ║
║  │ 🌅 الترحيب الصباحي                  [🟢 ON]        │    ║
║  │ IF: time = 7:00 AND guest_present                  │    ║
║  │ THEN: lights→30%, AC→24°                           │    ║
║  │ Runs on: 📺 Tablet · Edited by: عبدالله · 2h ago   │    ║
║  │ Locked: 🔒 NO                                       │    ║
║  │ [▶ Test] [✏️ Edit] [🔒 Lock] [🗑️ Delete]           │    ║
║  └────────────────────────────────────────────────────┘    ║
║                                                              ║
║  [ + إضافة أتمتة ] [ 📚 من قوالب ] [ 📊 سجل التنفيذ ]    ║
╚════════════════════════════════════════════════════════════╝
```

### 5.3 — Create New Automation (6-step wizard)

```
Step 1: Name + Icon + Category
Step 2: Where it runs (mobile_card/tablet/pi_local/cloud/multi)
Step 3: Trigger (WHEN) — pick from registry
Step 4: Conditions (IF) — optional, AND'd
Step 5: Actions (THEN) — ordered list from registry
Step 6: Review + Save
```

### 5.4 — Triggers & Actions Registry

`packages/qlvn-config/automation-triggers.json`:

```json
{
  "triggers": [
    { "key": "time_of_day", "label_ar": "وقت محدد", "icon": "⏰" },
    { "key": "door_open", "label_ar": "فتح الباب", "icon": "🚪" },
    { "key": "presence_detected", "label_ar": "اكتشاف وجود", "icon": "🚶" },
    { "key": "presence_lost", "label_ar": "انتهاء الوجود", "icon": "👻" },
    { "key": "guest_checked_in", "label_ar": "وصول الضيف", "icon": "✈️" },
    { "key": "checkout_time_reached", "label_ar": "وقت المغادرة", "icon": "🏁" },
    { "key": "guest_message", "label_ar": "رسالة من الضيف", "icon": "💬" },
    { "key": "match_detected", "label_ar": "مباراة قريبة", "icon": "⚽" },
    { "key": "temperature_threshold", "label_ar": "حد الحرارة", "icon": "🌡️" },
    { "key": "manual", "label_ar": "تشغيل يدوي", "icon": "🎮" }
  ]
}
```

`packages/qlvn-config/automation-actions.json`:

```json
{
  "actions": [
    { "key": "set_ac", "label_ar": "تعديل المكيف", "icon": "❄️" },
    { "key": "set_lights", "label_ar": "تعديل الإضاءة", "icon": "💡" },
    { "key": "set_led_rgb", "label_ar": "تغيير لون RGB", "icon": "🌈" },
    { "key": "set_mode", "label_ar": "تفعيل وضع", "icon": "🎭" },
    { "key": "show_notification", "label_ar": "إظهار إشعار", "icon": "🔔" },
    { "key": "show_nawaf_card", "label_ar": "إظهار بطاقة نواف", "icon": "🤖" },
    { "key": "send_whatsapp", "label_ar": "إرسال واتساب", "icon": "📲" },
    { "key": "notify_host", "label_ar": "تنبيه المضيف", "icon": "👨‍💼" },
    { "key": "log_event", "label_ar": "تسجيل حدث", "icon": "📝" },
    { "key": "change_unit_status", "label_ar": "تغيير حالة", "icon": "🔄" },
    { "key": "lock_door", "label_ar": "قفل الباب", "icon": "🔐" }
  ]
}
```

-----

## 🔐 6. PERMISSION ENGINE

### `packages/qlvn-automation/permission-check.js`

```javascript
class PermissionEngine {
  constructor(supabase) { this.sb = supabase; }
  
  async check({ user, action, target }) {
    // 1. Check permission record
    const { data: perm } = await this.sb.rpc('check_permission', {
      p_user_role: user.role,
      p_action: action,
      p_resource: this._resolveResource(target)
    });
    
    if (!perm.allowed) {
      return { allowed: false, reason: `Role "${user.role}" cannot ${action}` };
    }
    
    // 2. Verify ownership for hosts
    if (user.role === 'host') {
      const owns = await this._verifyOwnership(user.id, target);
      if (!owns) return { allowed: false, reason: 'لا تملك صلاحية' };
    }
    
    // 3. Check locks
    if (target.automation?.locked_by_founder && user.role !== 'founder') {
      return { allowed: false, reason: '🔒 محمية من المؤسس' };
    }
    
    // 4. Check resource limits
    if (action === 'automation.create') {
      const within = await this._checkLimits(user, target);
      if (!within) return { allowed: false, reason: '⚠️ تجاوزت الحد' };
    }
    
    return { 
      allowed: true,
      triggers_notification: perm.triggers_notification,
      severity: perm.severity
    };
  }
}
```

-----

## 🎬 7. THE 3 KEY SCENARIOS

### SCENARIO 1: Founder Onboards New Host (Plug & Play)

```
1. Founder clicks [+ إضافة مضيف]
   Modal: Name, Phone, Email, Commission
2. Submit → Creates user, sends WhatsApp with login
3. Founder clicks [+ إضافة شقة] for that host
   Modal: Name, Location, WiFi, iCal URLs, Price
4. Selects default features + default automations (templates)
5. Clicks [إنشاء + موافقة فورية] (founder can self-approve)
6. System creates unit, generates Pi pairing code
7. WhatsApp sent: "✅ شقتك جاهزة، رمز Pi: QLVN-PAIR-7842"
8. Host logs in → sees everything ready
   ✓ TOTAL TIME: < 3 minutes
   ✓ TOTAL CLICKS: ~12
```

### SCENARIO 2: Host Edits Automation (with Founder Notification)

```
1. Host logs in, opens Automation Studio
2. Sees automations — locked ones show 🔒
3. Edits "الترحيب الصباحي" (unlocked)
4. Changes AC from 24° to 22°, adds WhatsApp action
5. Clicks [💾 حفظ]
6. PermissionEngine: ALLOWED, triggers_notification=true
7. System:
   ✓ UPDATE automation_rules
   ✓ Trigger logs to audit_log
   ✓ Creates notification for founder
   ✓ Realtime push
8. Founder dashboard:
   🔔 "عبدالله عدّل أتمتة"
   Audit shows: AC 24° → 22° (diff highlighted)
   Actions: [موافق ✓] [التراجع 🔄] [قفل 🔒]
```

### SCENARIO 3: Guest Mode Change Cascades Everywhere

```
1. Guest clicks "🎬 Cinema Mode" on phone card
2. Mobile Card: UI changes to purple instantly
3. UPDATE guest_sessions + INSERT event
4. Supabase Realtime broadcasts to 4 channels:
   • Tablet: receives → rebuilds UI → purple in 200ms
   • Host Dashboard: live feed entry
   • Founder Dashboard: counter +1
   • Pi: via MQTT publishes scene
5. Pi executes:
   • light_controller.set(20%)  → Zigbee
   • ac_controller.set(22°)     → IR
6. Pi publishes state back → all UIs sync
7. After 5 min idle on Cinema → Nawaf appears with suggestions
   ✓ END-TO-END LATENCY: < 500ms
   ✓ OFFLINE-SAFE: Pi continues if internet drops
```

-----

## 🔌 8. EDGE FUNCTIONS (10)

1. `gemini-intent` — Nawaf brain
1. `ical-sync` — booking puller (15min cron)
1. `whatsapp-send` — Twilio wrapper
1. `guest-token-create` — on booking insert
1. `guest-token-validate` — public endpoint
1. `extension-request` — stay extensions
1. `automation-execute` ⭐ — cloud-scope automation runner
1. `automation-validate` ⭐ — pre-save validation
1. `audit-notify` ⭐ — critical change alerts
1. `mqtt-publish` — cloud → Pi

-----

## 🥧 9. RASPBERRY PI

```python
# pi/services/automation_runner.py
class AutomationRunner:
    async def sync_rules(self):
        """Pull pi_local + multi rules every 5min"""
        
    async def on_event(self, event_type, payload):
        """Match against local_rules, execute matches"""
        
    async def _execute_actions(self, actions):
        """Run actions sequentially via device controllers"""
```

Works **offline** — rules cached locally, executed without internet.

-----

## 🎨 10-11. FEATURE BUILDER + REALTIME (same as v1)

(unchanged — see original CLAUDE.md sections)

-----

## 🚀 12. EXECUTION ORDER (4 weeks)

```
WEEK 1: Foundation
├─ Day 1: Init repo, copy HTML
├─ Day 2: Supabase + migrations 001-009
├─ Day 3: RLS + seed data
├─ Day 4: Permission engine
└─ Day 5: Resource limits + tests

WEEK 2: Founder Layer  
├─ Day 1: Founder auth + dashboard
├─ Day 2: Hosts CRUD
├─ Day 3: Add unit on behalf (Scenario 1)
├─ Day 4: Approval workflow
└─ Day 5: Audit viewer

WEEK 3: Host Layer + Studio
├─ Day 1: Host auth + dashboard
├─ Day 2: Unit management + Tablet Builder
├─ Day 3: Automation Studio (founder)
├─ Day 4: Automation Studio (host, scoped)
└─ Day 5: Permission tests (Scenario 2)

WEEK 4: Guest + Pi + E2E
├─ Day 1: Guest token + iCal
├─ Day 2: Tablet renderer + automation runner
├─ Day 3: Pi Python controller
├─ Day 4: End-to-end (Scenario 3)
└─ Day 5: Deploy + demo
```

-----

## ✅ 13. DEFINITION OF DONE

- [ ] Repo on GitHub, 4 apps on Netlify, Supabase live
- [ ] All 10 Edge Functions working
- [ ] Pi heartbeats every 30s
- [ ] Founder: adds host in 30s → WhatsApp sent
- [ ] Founder: full Studio with filters (host/unit/page)
- [ ] Founder: locks an automation → host sees 🔒
- [ ] Founder: real-time critical alerts
- [ ] Host: receives WhatsApp, logs in, adds unit
- [ ] Host: Tablet Builder works
- [ ] Host: Studio scoped to own units
- [ ] Host: cannot edit locked → clear error
- [ ] Guest: receives card link, opens, expires at checkout
- [ ] Tablet + Mobile Card sync in < 500ms
- [ ] Nawaf appears on Netflix confusion
- [ ] **Scenario 1 passes** ✓
- [ ] **Scenario 2 passes** ✓
- [ ] **Scenario 3 passes** ✓
- [ ] Pi works offline (test)

-----

## 💎 14. ADDING NEW FEATURES (Plug & Play)

### New trigger:

1. Edit `automation-triggers.json`
1. Update Pi runner if needed
1. Done — appears in Studio wizard

### New action:

1. Edit `automation-actions.json`
1. Add handler in `automation-runner.js` (or .py)
1. Done

### New tablet feature:

1. Edit `feature-registry.json`
1. Add renderer in `feature-renderer.js`
1. Done — appears in Tablet Builder

-----

## 🌍 15. ENV VARIABLES

```bash
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
GEMINI_API_KEY=...
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_WHATSAPP_FROM=whatsapp:+...
MQTT_BROKER_URL=mqtt://broker.qlvin.app:1883
MQTT_USERNAME=qlvin
MQTT_PASSWORD=...
APP_URL=https://qlvin.app
```

-----

## 🆘 16. TROUBLESHOOTING

|Problem              |Solution                            |
|---------------------|------------------------------------|
|UI doesn’t update    |Check Realtime subscription         |
|Host can’t edit      |Check `locked_by_founder` flag      |
|Resource limit error |Check `resource_usage` table        |
|Token invalid        |Check `token_expires_at`            |
|Pi can’t reach broker|Check MQTT credentials              |
|Audit empty          |Check `trg_audit_automation` trigger|

-----

## 🚨 17. WHAT NEEDS A PROFESSIONAL DEVELOPER (Honest Assessment)

For the **MVP**, Claude Code + careful testing is enough.

For these phases, hire a backend developer:

|Phase                     |Why                                   |
|--------------------------|--------------------------------------|
|**Production deployment** |Security hardening, secrets management|
|**Scaling to 100+ units** |DB optimization, connection pooling   |
|**Penetration testing**   |Security audit                        |
|**Performance tuning**    |Realtime channels under load          |
|**iOS/Android native app**|Native development                    |
|**Payment integration**   |PCI compliance, fraud detection       |

-----

## 📞 18. CONTACTS

- **Founder:** Sulaiman Al-Qahtani — Saudi Arabia
- **Partner:** Abdulkader
- **Repo:** github.com/qlvin/qlvin-os
- **Domain:** qlvin.app

-----

## 📜 LICENSE

Proprietary. © 2026 Qlvin OS. All rights reserved.

-----

# 🎯 START HERE

1. ✅ Read all 18 sections
1. ✅ Understand the 3 scenarios in §7
1. ✅ Confirm: NO redesigning approved HTML
1. ✅ Begin Week 1 → Day 1 in §12

**This is not a prototype. This is a Saudi PropTech business foundation.**

Go ship it.

— Sulaiman & Abdulkader, May 2026
