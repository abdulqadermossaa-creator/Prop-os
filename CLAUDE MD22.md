# 🚀 QLVN OS — Project Context for Claude Code

> **اقرأ هذا الملف بالكامل قبل أي تعديل في الكود.**
> هذا هو "العقل" الكامل للمشروع. كل قرار تقني يجب يحترم الفلسفة المذكورة هنا.

---

## 1️⃣ هوية المشروع

**QLVN OS** = Next-Generation Property Operating System  
نظام تشغيل متكامل للضيافة قصيرة الأجل في السعودية.

**الفكرة بسطر واحد:**
> الضيف يحجز → يجي → يدخل بدون أي تدخل بشري، والمضيف يدير كل شي من شاشة واحدة.

**المنظومة ثلاث طبقات:**
- 🖥️ **Software** — أربع واجهات سحابية (موجودة)
- 🔧 **Hardware** — Raspberry Pi + Zigbee sensors داخل كل شقة
- 📊 **Data** — تحليل سلوك + ROI للمستثمر

---

## 2️⃣ الواجهات الأربع (الملفات الحالية)

| الملف | المستخدم | الوظيفة |
|------|---------|--------|
| `guest_smart_card_v3.html` | الضيف | بوابة QR/WhatsApp — كود الدخول، عروض محلية، طلبات |
| `tablet_v2.html` | داخل الشقة | تحكم بالإضاءة/المكيف، طلبات سريعة، عرض الكود |
| `host_v6.html` | المضيف | إدارة الوحدات، الدخل، تغيير الأكواد، سجلات موحدة |
| `founder_v4_final.html` | المؤسس (B2B) | إدارة المضيفين، Ad Engine، اشتراكات، PIN-protected |

**⚠️ قاعدة ذهبية:** هذه الواجهات هي **النموذج البصري النهائي**. أي تعديل في الـ HTML يجب يحترم نفس الهوية (الألوان، الخطوط، الـ Glassmorphism).

---

## 3️⃣ المعمارية المعتمدة (Architecture)

**لا تربط أي Sensor مباشرة بالـ UI. اتبع هذا التسلسل دائماً:**

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
AI Layer (Heartbeat / Silent Exit / Ad Targeting)
        ↓
Dashboard / UI (الواجهات الأربع)
```

**ليش هذي المعمارية؟**
- كل طبقة مستقلة → تقدر تعدّل/تطفي/تغيّر أي طبقة بدون كسر الباقي
- AI logic منفصل عن UI → سهل التحسين
- Local Agent يشتغل offline → الشقة ما تتعطل لو النت قطع

---

## 4️⃣ التقنيات المعتمدة (Stack)

| الطبقة | التقنية | السبب |
|--------|---------|------|
| **Backend** | Supabase | Auth + DB + Realtime + Storage + Edge Functions جاهزة |
| **Database** | Postgres (Supabase) | Row-Level Security حسب الـ host_id |
| **Realtime** | Supabase Realtime + MQTT | Broadcasting لكل الواجهات فورياً |
| **Hardware Bridge** | Python على Raspberry Pi | Local Agent — يدير الـ MQTT + GPIO |
| **Sensors** | Zigbee2MQTT | معيار صناعي + رخيص + موثوق |
| **Smart Lock** | Tuya / Zigbee | كود يتحدث عن بُعد |
| **External Tunnel** | Cloudflare Tunnel | وصول للـ Pi من خارج الشبكة بدون IP ثابت |
| **WhatsApp** | WhatsApp Cloud API (Meta) | إرسال أكواد الدخول للضيف |
| **Calendar Sync** | iCal (Airbnb/Gathern) + Google Calendar API | استيراد حجوزات |
| **Frontend** | HTML خام حالياً → React (لاحقاً) | الـ HTML الموجود هو المرجع البصري |
| **Encryption** | TLS 1.3 + API Keys per device | الاتصال بين Pi والسيرفر |

**❌ ممنوع:**
- ❌ Node.js Backend مخصص — استخدم Supabase Edge Functions
- ❌ MongoDB أو Firebase — Supabase يكفي
- ❌ تخزين أي بيانات في `localStorage` للأشياء الحرجة
- ❌ في `RAM فقط` — كل شي يروح Postgres

---

## 5️⃣ المنطق التقني الأساسي (Core Logic)

### 🫀 Heartbeat / Pulse
- بوابة الضيف ترسل ping كل **30 ثانية**
- Endpoint: `POST /api/heartbeat` → يحدّث `guests.last_seen`
- تتبع "آخر ظهور" بدون GPS

### 🚪 Silent Exit Detection
- إذا انقطع: (Motion Sensor) **+** (Guest Heartbeat) لمدة **3 ساعات**
- Edge Function تشغّل: تحديث `unit.status = 'ready_for_cleaning'`
- إشعار للمضيف عبر Supabase Realtime

### 📜 Unified Activity Logs
- جدول `activity_logs` واحد يستقبل من كل المصادر:
  - NFC unlock
  - Code change
  - Sensor event
  - Guest action
- يظهر فوراً في `host_v6.html` عبر Supabase Realtime subscription

### 📢 Ad Engine (B2B)
- جدول `ads` — Slot-based حسب الموقع الجغرافي للوحدة
- المؤسس يدير الإعلانات من `founder_v4_final.html`
- الإعلان يظهر للضيف (`guest_smart_card_v3.html`) والتابلت (`tablet_v2.html`)
- **Targeting:** حسب `unit.neighborhood` (الراكة، بن خلدون...)

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

---

## 6️⃣ ⭐ فلسفة Plug-and-Play (الأهم)

**القاعدة:** يجب يقدر المؤسس يضيف مضيف جديد + شقة جديدة من `founder_v4_final.html` في **أقل من دقيقة**، بدون لمس الكود.

### ✅ كل ميزة يجب تكون قابلة للتشغيل/الإطفاء (Feature Flags)

كل host عنده جدول `host_settings` فيه toggles:

```sql
CREATE TABLE host_settings (
  host_id uuid PRIMARY KEY,
  show_sports_widget boolean DEFAULT true,
  sports_league text DEFAULT 'saudi_pro_league',  -- 'saudi_pro_league' | 'champions_league' | 'all'
  show_local_ads boolean DEFAULT true,
  show_extras_menu boolean DEFAULT true,          -- قهوة، فشار، توصيل
  ad_engine_enabled boolean DEFAULT true,
  whatsapp_notifications boolean DEFAULT true,
  language text DEFAULT 'ar',
  -- أضف toggles جديدة هنا بسهولة
);
```

**في الـ UI:**
- اجعل كل ميزة `if (settings.show_xxx) { render }`
- لا تكتب أي ميزة hardcoded
- استخدم Supabase Realtime لتحديث الـ toggles فوراً

### ✅ إضافة مضيف جديد (One-Click Onboarding)

من `founder_v4_final.html`:
1. اسم المضيف + جواله + إيميل
2. عدد الوحدات + المواقع
3. اختيار الميزات المفعّلة (toggles)
4. ⚡ زر "Create" → Edge Function تنفّذ:
   - إنشاء user في Supabase Auth
   - إنشاء صفوف في `hosts`, `units`, `host_settings`
   - توليد API Key لكل Pi
   - إرسال welcome WhatsApp للمضيف
5. تم. المضيف عنده dashboard جاهز.

### ✅ مبادئ البرمجة الإلزامية

- **Readable > Clever** — الكود واضح حتى لو كان أطول
- **Comment in Arabic** — التعليقات في الكود بالعربي عشان نسهّل الصيانة
- **No Magic Numbers** — كل قيمة في `config.ts` أو `.env`
- **Component-based** — لما نروح React، كل widget مكوّن مستقل
- **Single Source of Truth** — Supabase هو المصدر الوحيد، Pi و UI يقروا منه

---

## 7️⃣ القضايا الحرجة من المرحلة السابقة (لازم تتحل)

| # | المشكلة | الحل المطلوب |
|---|---------|--------------|
| 🔴 | لا يوجد Database — كل البيانات في RAM | استخدم Supabase Postgres مع جداول مذكورة أدناه |
| 🔴 | الكود المولّد لا يصل للقفل ولا للضيف | اربط Generate → Edge Function → MQTT + WhatsApp |
| 🔴 | لا يوجد Authentication — أي شخص يتحكم | API Key per device + Supabase Auth للمضيفين |
| 🟠 | الواجهات منفصلة — لا state مشترك | Supabase Realtime subscriptions في كل واجهة |
| 🟡 | الـ Pi محلي فقط — لا وصول خارجي | Cloudflare Tunnel على كل Pi |
| 🟡 | localStorage يختلف من جهاز لجهاز | كل state من Supabase، localStorage للـ UI prefs فقط |

---

## 8️⃣ مخطط قاعدة البيانات المقترح (Supabase)

```sql
-- 👑 المؤسس / المضيفون
hosts (
  id uuid PRIMARY KEY,
  name text,
  phone text,
  email text,
  subscription_status text,  -- active | suspended
  units_count int,
  monthly_fee numeric DEFAULT 300,
  created_at timestamptz
)

host_settings (host_id, *toggles* ...)  -- كما في القسم 6

-- 🏠 الوحدات
units (
  id uuid PRIMARY KEY,
  host_id uuid REFERENCES hosts,
  name text,                  -- "شقة الراكة 1"
  neighborhood text,          -- للـ Ad Engine
  address text,
  pi_device_id text,          -- معرّف الـ Raspberry Pi
  pi_api_key text,            -- مشفّر
  status text,                -- vacant | occupied | cleaning | maintenance
  current_code text,
  current_guest_id uuid
)

-- 👤 الضيوف والحجوزات
guests (
  id uuid PRIMARY KEY,
  unit_id uuid REFERENCES units,
  name text,
  phone text,
  check_in timestamptz,
  check_out timestamptz,
  source text,                -- airbnb | gathern | direct
  last_seen timestamptz,      -- للـ Heartbeat
  status text                 -- upcoming | active | checked_out
)

-- 🔐 الأكواد
access_codes (
  id uuid PRIMARY KEY,
  unit_id uuid,
  guest_id uuid,
  code text,
  valid_from timestamptz,
  valid_until timestamptz,
  delivered_via text[]        -- ['whatsapp', 'sms']
)

-- 📜 السجل الموحد
activity_logs (
  id uuid PRIMARY KEY,
  unit_id uuid,
  guest_id uuid,
  event_type text,            -- unlock | sensor | code_change | ...
  source text,                -- pi | host | guest | system
  payload jsonb,
  created_at timestamptz
)

-- 📢 الإعلانات
ads (
  id uuid PRIMARY KEY,
  title text,
  description text,
  image_url text,
  target_neighborhoods text[],
  active boolean,
  clicks int DEFAULT 0,
  impressions int DEFAULT 0,
  starts_at timestamptz,
  ends_at timestamptz
)

-- 💰 الاشتراكات والفواتير
subscriptions (host_id, plan, amount, status, next_billing_date, ...)
```

**RLS (Row-Level Security) أساسي:**
- كل host يشوف فقط `units` اللي `units.host_id = auth.uid()`
- المؤسس فقط يشوف كل شي
- الـ Pi يقرأ فقط بياناته عبر `pi_api_key`

---

## 9️⃣ نموذج العمل (Business Model)

- **Setup Fee:** 5,000 SAR لكل شقة (Pi + Sensors + التركيب)
- **Monthly:** 300 SAR/شقة (Software + الدعم + التحديثات)
- **Ad Engine Revenue:** عمولة من الإعلانات المحلية
- **Service Commission:** نسبة من خدمات الشراكات (توصيل، مطاعم، قهوة)

---

## 🔟 الهوية البصرية (Design System)

| العنصر | القيمة |
|--------|--------|
| الخلفية | `#030305` |
| الأزرق التقني (Sky) | `#64d2ff` |
| الذهبي (Gold) | `#d4a853` |
| الزمردي (Emerald) | `#10b981` |
| الخط | Tajawal (300/400/700/900) |
| الأسلوب | Glassmorphism + Dark Mode |
| Border Radius | 20-28px |
| الحركة | micro-animations + heartbeat pulses + radial gradients |
| الاتجاه | RTL (Right-to-Left) |

**ممنوع:**
- ❌ ألوان جديدة بدون مبرر
- ❌ خطوط ثانية
- ❌ Light Mode (لا يدعم WebView في التابلت)

---

## 1️⃣1️⃣ بنية المشروع المقترحة

```
qlvn-os/
├── apps/
│   ├── guest/              ← guest_smart_card_v3.html بعد تحويله React
│   ├── tablet/             ← tablet_v2.html
│   ├── host/               ← host_v6.html
│   └── founder/            ← founder_v4_final.html (PIN-protected)
│
├── packages/
│   ├── ui/                 ← components مشتركة (Glassmorphism, buttons...)
│   ├── supabase-client/    ← Supabase queries مشتركة
│   └── types/              ← TypeScript types (Guest, Unit, Ad...)
│
├── supabase/
│   ├── migrations/         ← schema SQL
│   ├── functions/          ← Edge Functions
│   │   ├── generate-code/
│   │   ├── heartbeat/
│   │   ├── silent-exit-check/
│   │   ├── send-whatsapp/
│   │   └── onboard-host/
│   └── policies/           ← RLS policies
│
├── pi-agent/               ← Python Local Agent للـ Raspberry Pi
│   ├── main.py
│   ├── mqtt_client.py
│   ├── zigbee_handler.py
│   ├── lock_controller.py
│   └── supabase_sync.py
│
└── docs/
    └── CLAUDE.md           ← هذا الملف
```

---

## 1️⃣2️⃣ ⭐ أولوية الخطوات (Roadmap)

### Phase 1 — الأساس (الأسبوع 1-2)
1. ✅ إنشاء Supabase project
2. ✅ تطبيق الـ schema + RLS policies
3. ✅ ربط `host_v6.html` بـ Supabase (Auth + Read units)
4. ✅ Edge Function: `generate-code` (DB save فقط، بدون hardware بعد)

### Phase 2 — Realtime (الأسبوع 3)
5. ✅ Supabase Realtime subscriptions في الواجهات الأربع
6. ✅ ربط `founder_v4_final.html` — إضافة مضيف جديد
7. ✅ ربط Heartbeat من `guest_smart_card_v3.html`

### Phase 3 — Hardware (الأسبوع 4-5)
8. ✅ Pi Local Agent بـ Python
9. ✅ ربط Smart Lock عبر MQTT
10. ✅ Zigbee Motion Sensor → Silent Exit Logic

### Phase 4 — التكاملات (الأسبوع 6)
11. ✅ WhatsApp Cloud API
12. ✅ Airbnb/Gathern iCal sync
13. ✅ Ad Engine activation

### Phase 5 — التشغيل (الأسبوع 7+)
14. ✅ Cloudflare Tunnel لكل Pi
15. ✅ Monitoring + Logs
16. ✅ Pilot في 3 شقق حقيقية

---

## 1️⃣3️⃣ قواعد التعامل معك يا Claude Code

1. **اسأل قبل ما تغيّر معمارية.** لو حسّيت قرار يخالف هذا الملف، اسأل ولا تغيّر.
2. **عدّل ملف واحد في كل خطوة.** لا تعدّل 5 ملفات وتتفاجأ.
3. **اكتب اختبارات بسيطة.** كل Edge Function لها test case.
4. **لا تستخدم مكتبات ثقيلة.** كل dependency يجب يكون له مبرر.
5. **احترم الـ Plug-and-Play.** أي ميزة جديدة → toggle في `host_settings`.
6. **التعليقات بالعربي.** الكود بالإنجليزي، الشرح بالعربي.
7. **لا تخترع features.** اشتغل على المطلوب فقط.

---

## 📞 جهات الاتصال السريعة

- **Supabase Project:** [يضاف بعد الإنشاء]
- **GitHub Repo:** [يضاف بعد الإنشاء]
- **Founder PIN (للـ founder_v4_final.html):** يحفظ في `.env`

---

**QLVN OS · 2026 · Building the future of smart hospitality**
**هذا الملف هو المرجع. أي تعارض بينه وبين الكود → الملف هو الصح.**
