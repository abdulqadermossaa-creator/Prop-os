# 🏗️ QLVN OS — Master Build Specification (Final Merged)

> **اقرأ هذا الملف بالكامل قبل أي تعديل في الكود.**
> هذا هو "العقل" الكامل للمشروع. كل قرار تقني يجب يحترم الفلسفة المذكورة هنا.
> هذا الملف = مصدر الحقيقة الوحيد. أي تعارض بينه وبين الكود → الملف هو الصح.

---

## 🚨 قواعد Claude Code (اقرأها أولاً)

1. **اسأل قبل ما تغيّر معمارية** — لو حسّيت قرار يخالف هذا الملف، اسأل ولا تغيّر
2. **عدّل ملف واحد في كل خطوة** — لا تعدّل 5 ملفات وتتفاجأ
3. **لا تعدّل الـ HTML المعتمدة** — استخدمها كمرجع بصري فقط
4. **احترم الـ Plug-and-Play** — أي ميزة جديدة → toggle في `host_settings`
5. **التعليقات بالعربي** — الكود بالإنجليزي، الشرح بالعربي
6. **لا تخترع features** — اشتغل على المطلوب فقط
7. **Readable > Clever** — الكود واضح حتى لو كان أطول
8. **No Magic Numbers** — كل قيمة في `config.ts` أو `.env`
9. **NEVER expose API keys** في client code
10. **ALWAYS log** كل action في `activity_logs`

---

## 1️⃣ هوية المشروع

**QLVN OS** = Luxury AI Hospitality Operating System
نظام تشغيل متكامل للضيافة قصيرة الأجل في السعودية.

**الفكرة بسطر واحد:**
> الضيف يحجز → يجي → يدخل بدون أي تدخل بشري، والمضيف يدير كل شي من شاشة واحدة.

**المنظومة ثلاث طبقات:**
- 🖥️ **Software** — أربع واجهات سحابية (موجودة ومعتمدة)
- 🔧 **Hardware** — Raspberry Pi + Zigbee sensors داخل كل شقة
- 📊 **Data** — تحليل سلوك + ROI للمستثمر

---

## 2️⃣ الواجهات الأربع (الملفات المعتمدة — لا تعدّلها)

| الملف | المستخدم | الوظيفة |
|------|---------|--------|
| `guest_smart_card_v3.html` | الضيف | بوابة WhatsApp — كود الدخول، عروض، طلبات، Mood modes |
| `guest-card-luxury.html` | الضيف (Luxury) | QDR by Qlvin OS — iOS-style مع Match/Cinema/Relax |
| `guest_tablet_v1.html` | داخل الشقة | تابلت التحكم — إضاءة/مكيف/أوضاع |
| `host_v6.html` | المضيف | إدارة الوحدات، الدخل، الأكواد، السجلات |
| `founder_v4_final.html` | المؤسس | إدارة المضيفين، Ad Engine، PIN-protected |

**⚠️ قاعدة ذهبية:** هذه الواجهات هي **النموذج البصري النهائي**.
مهمة Claude Code = ربطها بـ Supabase فقط. لا تغيّر أي HTML.

---

## 3️⃣ المعمارية الكاملة

```
Zigbee Devices (Sensors / Smart Lock / Plug)
        ↓
Zigbee2MQTT (على Raspberry Pi)
        ↓
QLVN Local Agent (Python — على Pi)
        ↓
Realtime Event Bus (MQTT + Supabase Realtime)
        ↓
State Engine (Supabase Postgres + Triggers)
        ↓
Automation Graph (Supabase Edge Functions)
        ↓
AI Layer (Nawaf / Gemini — للضيف فقط)
        ↓
Dashboard / UI (الواجهات الخمس)
```

**ليش هذي المعمارية؟**
- كل طبقة مستقلة → تقدر تعدّل/تطفي/تغيّر أي طبقة بدون كسر الباقي
- AI logic منفصل عن UI → سهل التحسين
- Local Agent يشتغل offline → الشقة ما تتعطل لو النت قطع
- Gemini يفهم نية الضيف فقط — لا يتحكم بالأجهزة مباشرة

---

## 4️⃣ التقنيات المعتمدة (Stack)

| الطبقة | التقنية | السبب |
|--------|---------|------|
| **Backend** | Supabase | Auth + DB + Realtime + Storage + Edge Functions |
| **Database** | Postgres (Supabase) | RLS حسب الـ host_id |
| **Realtime** | Supabase Realtime + MQTT | Broadcasting لكل الواجهات فورياً |
| **Hardware Bridge** | Python على Raspberry Pi | Local Agent — يدير الـ MQTT |
| **Sensors** | Zigbee2MQTT | معيار صناعي + رخيص + موثوق |
| **Smart Lock** | Tuya / Zigbee | كود يتحدث عن بُعد |
| **Tunnel** | Cloudflare Tunnel | وصول للـ Pi بدون IP ثابت |
| **WhatsApp** | WhatsApp Cloud API (Meta) | إرسال أكواد + بطاقة الضيف |
| **Calendar** | iCal (Airbnb/Gathern) | استيراد حجوزات تلقائي |
| **MCP Server** | TypeScript + Streamable HTTP | يربط Claude مباشرة بالنظام |
| **AI** | Gemini 1.5 Flash | Intent detection للضيف فقط |
| **Frontend** | HTML خام → React لاحقاً | الـ HTML الموجود هو المرجع |

**❌ ممنوع:**
- ❌ Node.js Backend مخصص — استخدم Supabase Edge Functions
- ❌ MongoDB أو Firebase — Supabase يكفي
- ❌ تخزين بيانات حرجة في localStorage
- ❌ Gemini يتحكم بالأجهزة مباشرة

---

## 5️⃣ المنطق التقني الأساسي (Core Logic)

### 🫀 Heartbeat / Pulse
```
بوابة الضيف ترسل ping كل 30 ثانية
POST /api/heartbeat → يحدّث guests.last_seen
تتبع "آخر ظهور" بدون GPS
```

### 🚪 Silent Exit Detection
```
إذا انقطع: Motion Sensor + Guest Heartbeat لمدة 3 ساعات
Edge Function تشغّل:
- units.status = 'ready_for_cleaning'
- إشعار للمضيف عبر Supabase Realtime
- MQTT → إطفاء الأجهزة
```

### 🔐 Code Generation Flow
```
host_v6.html: "Generate Code"
    ↓
POST /api/codes → Supabase Edge Function
    ↓
1. حفظ الكود في DB (جدول access_codes)
    ↓
2. MQTT message → Smart Lock (يقبل الكود)
    ↓
3. WhatsApp Cloud API → الضيف يستقبل الكود
    ↓
4. Realtime broadcast → كل الواجهات تتحدث
```

### 📜 Unified Activity Logs
```
جدول activity_logs واحد يستقبل من كل المصادر:
- NFC unlock
- Code change
- Sensor event
- Guest action
- Automation execution

يظهر فوراً في host_v6.html عبر Realtime subscription
```

### 🎫 Guest Token System
```
كل حجز → token فريد (32 bytes hex)
يصلح فقط خلال مدة الحجز
ينتهي عند checkout_at + 2 ساعات
بعد انتهاء الحجز → الرابط يصير 401
حجز جديد = token جديد كلياً
```

### 🤖 Nawaf AI (للضيف فقط)
```
80% scripted responses (سريع + رخيص)
20% Gemini fallback (للطلبات غير المعروفة)
Gemini يرجع JSON فقط:
{
  intent, confidence, reply_ar,
  actions: [{type, target, value}],
  suggestions: []
}
الـ actions يمر على Qlvin Core — مو Gemini مباشرة
```

---

## 6️⃣ Plug-and-Play (الأهم)

**القاعدة:** المؤسس يضيف مضيف جديد + شقة من `founder_v4_final.html`
في **أقل من دقيقة**، بدون لمس الكود.

### Feature Flags لكل host
```sql
CREATE TABLE host_settings (
  host_id uuid PRIMARY KEY REFERENCES hosts(id),

  -- الواجهات
  card_style text DEFAULT 'cinema',       -- 'cinema' | 'luxury'
  tablet_layout text DEFAULT 'classic',   -- 'classic' | 'immersive'

  -- الميزات
  show_sports_widget boolean DEFAULT true,
  sports_league text DEFAULT 'saudi_pro_league',
  show_local_ads boolean DEFAULT true,
  show_extras_menu boolean DEFAULT true,
  ad_engine_enabled boolean DEFAULT true,
  nawaf_enabled boolean DEFAULT true,
  netflix_confusion_detection boolean DEFAULT true,
  extend_button boolean DEFAULT true,
  exit_button boolean DEFAULT true,
  order_coffee boolean DEFAULT false,
  order_popcorn boolean DEFAULT false,
  rgb_slider boolean DEFAULT false,

  -- الاتصال
  whatsapp_notifications boolean DEFAULT true,
  ical_sync_enabled boolean DEFAULT true,

  -- الحدود
  max_automations int DEFAULT 20,
  max_devices int DEFAULT 15,
  max_gemini_calls_per_day int DEFAULT 500,

  language text DEFAULT 'ar'
);
```

### Approval Workflow (مهم)
```
المضيف يضيف وحدة → status = 'pending_approval'
المؤسس يراجع → يوافق / يرفض / يعلّق
iCal sync لا يشتغل إلا بعد الموافقة
Guest tokens لا تتولّد إلا بعد الموافقة
```

---

## 7️⃣ Automation Studio

كل مضيف يقدر يبني Automation من الـ host dashboard:
```
WHEN: [door_open | presence | time | checkout | guest_message | match_detected]
IF:   [conditions optional]
THEN: [set_ac | set_lights | notify_host | send_whatsapp | set_mode | log_event]
RUNS ON: [tablet | mobile_card | pi_local | cloud]
```

**جدول automation_rules:**
```sql
CREATE TABLE automation_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid REFERENCES units(id),
  scope text,  -- 'platform' | 'host' | 'unit'
  name text NOT NULL,
  icon text DEFAULT '⚡',
  runs_on text,  -- 'tablet' | 'mobile_card' | 'pi_local' | 'cloud' | 'multi'
  trigger_type text NOT NULL,
  trigger_config jsonb,
  conditions jsonb DEFAULT '[]',
  actions jsonb NOT NULL,
  enabled boolean DEFAULT true,
  locked_by_founder boolean DEFAULT false,
  created_by uuid REFERENCES users(id),
  last_edited_by uuid REFERENCES users(id),
  last_edited_at timestamptz,
  created_at timestamptz DEFAULT now()
);
```

**قواعد Permissions:**
- المؤسس: يقدر يعدّل كل شي + يقفل automations
- المضيف: يقدر يعدّل unlocked فقط، كل تعديل → إشعار للمؤسس
- الضيف: لا يقدر يعدّل automations

---

## 8️⃣ قاعدة البيانات الكاملة (Supabase)

```sql
-- ============================================
-- 1. USERS (Founders + Hosts)
-- ============================================
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  role text NOT NULL CHECK (role IN ('founder', 'host')),
  phone text,
  email text,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- 2. HOSTS
-- ============================================
CREATE TABLE hosts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  name text NOT NULL,
  phone text,
  email text,
  subscription_status text DEFAULT 'active',  -- active | suspended
  units_count int DEFAULT 0,
  monthly_fee numeric DEFAULT 300,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- 3. UNITS
-- ============================================
CREATE TABLE units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id uuid REFERENCES hosts(id),
  name text NOT NULL,
  qlvn_code text UNIQUE,  -- e.g. "QLVN-1042"
  neighborhood text,       -- للـ Ad Engine
  address text,
  pi_device_id text,
  pi_api_key text,         -- مشفّر
  pi_status text DEFAULT 'offline',
  pi_last_seen timestamptz,

  -- Status
  approval_status text DEFAULT 'pending_approval'
    CHECK (approval_status IN ('pending_approval','approved','rejected','suspended')),
  operational_status text DEFAULT 'available'
    CHECK (operational_status IN ('available','occupied','cleaning','maintenance')),

  -- WiFi
  wifi_name text,
  wifi_password text,

  -- Climate
  current_temp numeric,
  target_temp numeric DEFAULT 22,

  -- Pricing
  base_price_per_night numeric,
  extension_price_per_hour numeric DEFAULT 50,

  -- Features config (JSON من feature-registry)
  features jsonb DEFAULT '{}',
  tablet_layout text DEFAULT 'classic',

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- 4. BOOKINGS (من iCal أو يدوي)
-- ============================================
CREATE TABLE bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid REFERENCES units(id),
  external_booking_id text,
  source text CHECK (source IN ('airbnb','gathern','booking','direct','manual')),
  guest_name text NOT NULL,
  guest_phone text,
  checkin_at timestamptz NOT NULL,
  checkout_at timestamptz NOT NULL,
  nights int,
  total_price numeric,
  status text DEFAULT 'confirmed',
  created_at timestamptz DEFAULT now(),
  UNIQUE(external_booking_id, source)
);

-- ============================================
-- 5. GUEST_SESSIONS (الإقامات النشطة + Tokens)
-- ============================================
CREATE TABLE guest_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id),
  unit_id uuid REFERENCES units(id),
  guest_name text NOT NULL,
  guest_phone text,
  access_code text,
  guest_token text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  token_expires_at timestamptz NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending','active','completed','cancelled')),
  checked_in_at timestamptz,
  checked_out_at timestamptz,
  last_seen timestamptz,  -- للـ Heartbeat
  preferences jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- 6. DEVICES
-- ============================================
CREATE TABLE devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid REFERENCES units(id),
  name text NOT NULL,
  type text CHECK (type IN ('ac','light','led_strip','door','presence','plug','switch','lock','temp','tv')),
  protocol text CHECK (protocol IN ('zigbee','mqtt','wifi','ir','gpio')),
  mqtt_topic text,
  state jsonb DEFAULT '{}',
  status text DEFAULT 'offline',
  last_seen timestamptz,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- 7. ACCESS_CODES
-- ============================================
CREATE TABLE access_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid REFERENCES units(id),
  guest_session_id uuid REFERENCES guest_sessions(id),
  code text NOT NULL,
  valid_from timestamptz,
  valid_until timestamptz,
  delivered_via text[],  -- ['whatsapp', 'sms']
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- 8. ACTIVITY_LOGS (كل شي يسجل هنا)
-- ============================================
CREATE TABLE activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid REFERENCES units(id),
  guest_session_id uuid REFERENCES guest_sessions(id),
  event_type text NOT NULL,  -- unlock | sensor | mode_change | code_change | automation | ai_intent
  source text,               -- pi | host | guest | system | nawaf
  severity text DEFAULT 'info' CHECK (severity IN ('info','warning','critical')),
  payload jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- 9. AUTOMATION_RULES
-- ============================================
-- (see §7 above)

-- ============================================
-- 10. MESSAGES (Nawaf conversations)
-- ============================================
CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_session_id uuid REFERENCES guest_sessions(id),
  role text CHECK (role IN ('guest','nawaf','system')),
  content text NOT NULL,
  intent text,
  used_gemini boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- 11. ICAL_FEEDS
-- ============================================
CREATE TABLE ical_feeds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid REFERENCES units(id),
  source text CHECK (source IN ('airbnb','gathern','booking','other')),
  url text NOT NULL,
  last_synced_at timestamptz,
  sync_status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- 12. ADS (Ad Engine)
-- ============================================
CREATE TABLE ads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  description text,
  image_url text,
  target_neighborhoods text[],
  active boolean DEFAULT true,
  clicks int DEFAULT 0,
  impressions int DEFAULT 0,
  starts_at timestamptz,
  ends_at timestamptz
);

-- ============================================
-- 13. EXTENSIONS (تمديد الإقامة)
-- ============================================
CREATE TABLE extensions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_session_id uuid REFERENCES guest_sessions(id),
  duration_hours int NOT NULL,
  price numeric NOT NULL,
  status text DEFAULT 'requested' CHECK (status IN ('requested','approved','rejected','paid')),
  requested_at timestamptz DEFAULT now(),
  new_checkout_at timestamptz
);

-- ============================================
-- 14. NOTIFICATIONS
-- ============================================
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id uuid REFERENCES users(id),
  type text NOT NULL,
  title text NOT NULL,
  body text,
  payload jsonb,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- REALTIME
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE units;
ALTER PUBLICATION supabase_realtime ADD TABLE guest_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE activity_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE devices;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE automation_rules;

-- ============================================
-- RLS
-- ============================================
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_sessions ENABLE ROW LEVEL SECURITY;

-- Hosts see only their units
CREATE POLICY "hosts_own_units" ON units FOR ALL
  USING (host_id IN (SELECT id FROM hosts WHERE user_id = auth.uid()));

-- Founders see all
CREATE POLICY "founders_all" ON units FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'founder'));

-- Pi reads only its unit (via service_role)
-- Guest: NO direct DB access — only via Edge Functions with token
```

---

## 9️⃣ Edge Functions (9 وظائف)

| Function | الوظيفة |
|----------|---------|
| `generate-code` | يولّد كود دخول → DB + Lock + WhatsApp |
| `heartbeat` | يحدّث `guests.last_seen` كل 30 ثانية |
| `silent-exit-check` | cron كل 5 دقائق — يكتشف الخروج الصامت |
| `onboard-host` | يضيف مضيف جديد + شقق + settings |
| `guest-token-validate` | public endpoint — يتحقق من الـ token |
| `ical-sync` | cron كل 15 دقيقة — يسحب حجوزات Airbnb/Gathern |
| `send-whatsapp` | يرسل رسائل عبر WhatsApp Cloud API |
| `gemini-intent` | يفهم نية الضيف ويرجع JSON |
| `automation-execute` | ينفّذ automation rules |

---

## 🔟 Raspberry Pi (Python Agent)

```python
# pi-agent/main.py
# يشتغل offline — يكمل حتى لو النت قطع

async def main():
    await asyncio.gather(
        mqtt_service.connect(),        # يستقبل أوامر Cloud
        zigbee_handler.listen(),       # يستمع لـ Sensors
        supabase_sync.heartbeat(),     # يرسل heartbeat كل 30s
        automation_runner.run(),       # ينفّذ local automations
        cloudflare_tunnel.keep_alive() # يحافظ على الـ tunnel
    )
```

**MQTT Topics:**
```
qlvin/{unit_id}/device/{device_id}/set    # Cloud → Pi
qlvin/{unit_id}/device/{device_id}/state  # Pi → Cloud
qlvin/{unit_id}/scene/set                 # تشغيل مشهد
qlvin/{unit_id}/events                    # events stream
qlvin/{unit_id}/heartbeat                 # كل 30s
qlvin/{unit_id}/automation/reload         # إعادة تحميل rules
```

---

## 1️⃣1️⃣ MCP Server (للمطورين + Claude)

`qlvn-mcp-server` — TypeScript MCP Server يربط Claude مباشرة بـ Qlvin OS.

**Tools المتاحة:**

| Tool | الوظيفة |
|------|---------|
| `qlvn_list_units` | عرض كل الوحدات مع حالتها |
| `qlvn_get_unit` | تفاصيل وحدة محددة |
| `qlvn_list_active_guests` | الضيوف النشطين الآن |
| `qlvn_generate_code` | توليد كود دخول جديد |
| `qlvn_send_whatsapp` | إرسال واتساب للضيف |
| `qlvn_get_activity_logs` | سجل نشاط وحدة |
| `qlvn_control_device` | التحكم بجهاز (AC/Lights) |
| `qlvn_set_scene` | تشغيل مشهد (cinema/relax/match) |
| `qlvn_create_automation` | إنشاء automation جديد |
| `qlvn_list_automations` | عرض automations |
| `qlvn_get_unit_stats` | إحصائيات وحدة |
| `qlvn_onboard_host` | إضافة مضيف جديد |
| `qlvn_sync_ical` | مزامنة حجوزات iCal |

---

## 1️⃣2️⃣ بنية المشروع

```
qlvn-os/
├── CLAUDE.md                    # ← هذا الملف
├── .env.example
│
├── apps/
│   ├── founder/
│   │   ├── index.html           # = founder_v4_final.html (لا تعدّل)
│   │   └── src/supabase-client.js
│   ├── host/
│   │   ├── index.html           # = host_v6.html (لا تعدّل)
│   │   └── src/supabase-client.js
│   ├── guest-card/
│   │   ├── index.html           # = guest_smart_card_v3.html (لا تعدّل)
│   │   └── src/token-handler.js
│   ├── guest-card-luxury/
│   │   ├── index.html           # = guest-card-luxury.html (لا تعدّل)
│   │   └── src/token-handler.js
│   └── tablet/
│       ├── index.html           # = guest_tablet_v1.html (لا تعدّل)
│       └── src/feature-renderer.js
│
├── supabase/
│   ├── migrations/
│   │   ├── 001_schema.sql
│   │   ├── 002_rls.sql
│   │   ├── 003_realtime.sql
│   │   └── 004_seed.sql
│   └── functions/
│       ├── generate-code/
│       ├── heartbeat/
│       ├── silent-exit-check/
│       ├── onboard-host/
│       ├── guest-token-validate/
│       ├── ical-sync/
│       ├── send-whatsapp/
│       ├── gemini-intent/
│       └── automation-execute/
│
├── pi-agent/
│   ├── main.py
│   ├── mqtt_client.py
│   ├── zigbee_handler.py
│   ├── lock_controller.py
│   ├── supabase_sync.py
│   ├── automation_runner.py
│   └── cloudflare_tunnel.py
│
├── qlvn-mcp-server/             # ← MCP Server
│   ├── src/index.ts
│   ├── src/tools/
│   ├── package.json
│   └── tsconfig.json
│
└── docs/
    ├── DEPLOYMENT.md
    ├── PI_SETUP.md
    └── API.md
```

---

## 1️⃣3️⃣ Roadmap

### Phase 1 — الأساس (الأسبوع 1-2)
- [ ] Supabase project + schema + RLS
- [ ] ربط `host_v6.html` بـ Supabase
- [ ] Edge Function: `generate-code`
- [ ] Edge Function: `onboard-host`
- [ ] Edge Function: `guest-token-validate`

### Phase 2 — Realtime (الأسبوع 3)
- [ ] Supabase Realtime في الواجهات الخمس
- [ ] Heartbeat من Guest Card
- [ ] ربط `founder_v4_final.html` — إضافة مضيف
- [ ] iCal sync (Airbnb/Gathern)

### Phase 3 — Hardware (الأسبوع 4-5)
- [ ] Pi Local Agent بـ Python
- [ ] ربط Smart Lock عبر MQTT
- [ ] Zigbee Motion Sensor
- [ ] Silent Exit Detection
- [ ] Cloudflare Tunnel

### Phase 4 — الذكاء (الأسبوع 6)
- [ ] WhatsApp Cloud API
- [ ] Gemini Intent Detection (Nawaf)
- [ ] Automation Studio في host dashboard
- [ ] Ad Engine

### Phase 5 — التشغيل (الأسبوع 7+)
- [ ] MCP Server deployment
- [ ] Monitoring + Logs
- [ ] Pilot في 3 شقق حقيقية

---

## 1️⃣4️⃣ نموذج العمل

| المصدر | القيمة |
|--------|--------|
| Setup Fee | 5,000 ر.س/شقة (Pi + Sensors + تركيب) |
| Monthly | 300 ر.س/شقة (Software + دعم) |
| Ad Engine | عمولة من الإعلانات المحلية |
| Services | نسبة من قهوة/توصيل/خدمات |

---

## 1️⃣5️⃣ الهوية البصرية

| العنصر | القيمة |
|--------|--------|
| الخلفية | `#030305` |
| الأزرق | `#64d2ff` |
| الذهبي | `#d4a853` |
| الزمردي | `#10b981` |
| الخط | Tajawal (300/400/700/900) |
| الأسلوب | Glassmorphism + Dark Mode + Liquid Glass |
| Border Radius | 20-28px |
| الاتجاه | RTL |

---

## 📞 جهات الاتصال

- **Founder:** Sulaiman Al-Qahtani
- **Partner:** Abdulkader
- **GitHub:** github.com/abdulqadermossaa-creator/Prop-os
- **Supabase:** [يضاف بعد الإنشاء]

---

**QLVN OS · 2026 · Building the future of smart hospitality in Saudi Arabia**
