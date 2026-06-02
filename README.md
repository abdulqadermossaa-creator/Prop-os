# 🏗️ QLVN OS — Luxury AI Hospitality Operating System

> **اقرأ [CLAUDE_FINAL.md](./CLAUDE_FINAL.md) للمواصفات التقنية الكاملة**
> 
> نظام تشغيل متكامل للضيافة قصيرة الأجل في السعودية

---

## 🎯 الفكرة بسطر واحد

الضيف يحجز → يجي → **يدخل بدون أي تدخل بشري**، والمضيف يدير **كل شي من شاشة واحدة**.

---

## 📊 المنظومة

```
🖥️  Software       → 5 واجهات سحابية معتمدة
🔧 Hardware       → Raspberry Pi + Zigbee sensors
📈 Data Analytics → سلوك الضيف + ROI للمستثمر
```

---

## 🎨 الواجهات الخمس (المرجع البصري النهائي)

| الواجهة | المستخدم | الملف | الوظيفة |
|---------|---------|------|---------|
| 👤 **Guest Card** | الضيف | `guest_smart_card_v3.html` | بوابة WhatsApp — أكواد دخول، عروض، طلبات |
| 👑 **Luxury Card** | الضيف (Premium) | `guest-card-luxury.html` | QDR by Qlvin OS — iOS-style Cinema/Relax/Match |
| 🖥️ **Tablet** | داخل الشقة | `guest_tablet_v1.html` | تحكم: إضاءة، مكيف، مشاهد |
| 📋 **Host Dashboard** | المضيف | `host_v6.html` | إدارة وحدات، دخل، أكواد، سجلات |
| 👨‍💼 **Founder Console** | المؤسس | `founder_v4_final.html` | إدارة مضيفين + Ad Engine + إحصائيات |

---

## 🏗️ المعمارية

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

**✅ لماذا هذه المعمارية؟**
- كل طبقة مستقلة → يمكن تعديل/إطفاء أي طبقة بدون كسر النظام
- AI logic منفصل عن UI → سهل التحسين
- Local Agent يعمل offline → الشقة لا تتعطل لو النت قطع
- Gemini يفهم النية فقط — لا يتحكم بالأجهزة مباشرة

---

## 🛠️ التقنيات المعتمدة (Stack)

| الطبقة | التقنية | السبب |
|--------|---------|------|
| **Backend** | Supabase | Auth + DB + Realtime + Storage + Edge Functions |
| **Database** | PostgreSQL | Row-Level Security حسب host_id |
| **Realtime** | Supabase Realtime + MQTT | Broadcast فوري لكل الواجهات |
| **Local Agent** | Python على Raspberry Pi | يدير MQTT بدون انقطاع |
| **Sensors** | Zigbee2MQTT | معيار صناعي + موثوق + رخيص |
| **Smart Lock** | Tuya / Zigbee | تحكم عن بعد بالأكواد |
| **Tunnel** | Cloudflare Tunnel | وصول للـ Pi بدون IP ثابت |
| **Messaging** | WhatsApp Cloud API | أكواد + تنبيهات للضيف |
| **Calendar** | iCal | استيراد حجوزات Airbnb/Gathern |
| **AI** | Gemini 1.5 Flash | كشف النية للضيف |
| **MCP** | TypeScript MCP Server | ربط Claude بالنظام |

---

## 💡 الميزات الأساسية

### 1️⃣ **Plug-and-Play Onboarding**
```
المؤسس: اضغط "Add Host"
    ↓
في <1 دقيقة: مضيف جديد + شقة + إعدادات
    ↓
بدون تعديل كود
```

### 2️⃣ **Silent Exit Detection**
```
Motion Sensor + Guest Heartbeat لمدة 3 ساعات
    ↓
الشقة تُعتبر فارغة تلقائياً
    ↓
تنظيف + إطفاء أجهزة
```

### 3️⃣ **Code Generation**
```
host_v6.html: "Generate Code"
    ↓
POST /api/codes
    ↓
1. حفظ في DB
2. Smart Lock يقبل الكود
3. WhatsApp للضيف
4. Realtime broadcast
```

### 4️⃣ **Unified Activity Logs**
```
سجل واحد يستقبل:
• NFC unlock
• تغيير الكود
• sensor events
• تفاعلات الضيف
• تنفيذ automations

يظهر فوراً في host dashboard عبر Realtime
```

### 5️⃣ **Guest Token System**
```
كل حجز → token فريد (32 bytes)
    ↓
يصلح فقط خلال مدة الحجز
    ↓
ينتهي عند checkout + 2 ساعات
    ↓
حجز جديد = token جديد كلياً
```

### 6️⃣ **Nawaf AI** (الذكي)
```
80% scripted responses (سريع + رخيص)
    ↓
20% Gemini fallback (للطلبات المعقدة)
    ↓
Gemini يرجع JSON فقط:
{
  intent,
  confidence,
  reply_ar,
  actions: [{type, target, value}],
  suggestions: []
}
```

### 7️⃣ **Automation Studio**
```
WHEN: [door_open | presence | time | checkout | guest_message]
    ↓
IF: [conditions optional]
    ↓
THEN: [set_ac | set_lights | notify_host | send_whatsapp]
    ↓
RUNS ON: [tablet | mobile | pi_local | cloud]
```

---

## 📁 بنية المشروع

```
qlvn-os/
├── README.md                    # ← أنت هنا
├── CLAUDE_FINAL.md              # المواصفات الكاملة (اقرأه أولاً)
├── .env.example
│
├── apps/
│   ├── founder/
│   │   └── index.html           # = founder_v4_final.html
│   ├── host/
│   │   └── index.html           # = host_v6.html
│   ├── guest-card/
│   │   └── index.html           # = guest_smart_card_v3.html
│   ├── guest-card-luxury/
│   │   └── index.html           # = guest-card-luxury.html
│   └── tablet/
│       └── index.html           # = guest_tablet_v1.html
│
├── supabase/
│   ├── migrations/
│   │   ├── 001_schema.sql       # 14 جداول كاملة
│   │   ├── 002_rls.sql          # Row-Level Security
│   │   ├── 003_realtime.sql     # Realtime subscriptions
│   │   └── 004_seed.sql         # بيانات تجريبية
│   └── functions/               # 9 Edge Functions
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
├── qlvn-mcp-server/
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

## 🚀 Quick Start

### المتطلبات
- Node.js 18+
- Python 3.11+
- Supabase account
- Raspberry Pi 4 (للـ hardware)
- WhatsApp Business account (للرسائل)

### 1. الإعداد الأولي
```bash
# Clone المشروع
git clone https://github.com/abdulqadermossaa-creator/Prop-os.git
cd Prop-os

# نسخ الإعدادات
cp .env.example .env

# تثبيت الـ dependencies
npm install
```

### 2. Supabase Setup
```bash
# إنشاء project جديد في Supabase

# تطبيق الـ migrations
npm run supabase:migrate

# تحديث متغيرات البيئة
# SUPABASE_URL=...
# SUPABASE_ANON_KEY=...
# SUPABASE_SERVICE_ROLE_KEY=...
```

### 3. تشغيل الواجهات
```bash
# Founder Console
npm run dev:founder

# Host Dashboard
npm run dev:host

# Guest Card
npm run dev:guest-card
```

### 4. Pi Agent (على Raspberry Pi)
```bash
cd pi-agent

# تثبيت dependencies
pip install -r requirements.txt

# تشغيل
python main.py
```

---

## 📝 قواعد Claude Code (اقرأها أولاً!)

1. **اسأل قبل تغيير المعمارية** — إذا شعرت بتعارض مع CLAUDE_FINAL.md، اسأل
2. **عدّل ملف واحد في كل خطوة** — لا تعدّل 5 ملفات دفعة واحدة
3. **لا تعدّل الـ HTML المعتمدة** — استخدمها كمرجع بصري فقط
4. **احترم Plug-and-Play** — أي ميزة جديدة = toggle في `host_settings`
5. **التعليقات بالعربي** — الكود بالإنجليزي، الشرح بالعربي
6. **لا تخترع features** — اشتغل على المطلوب فقط
7. **وضوح أكثر من ذكاء** — الكود واضح حتى لو أطول
8. **لا magic numbers** — كل قيمة في `config.ts` أو `.env`
9. **لا تفضح API keys** في client code
10. **دائماً log** كل action في `activity_logs`

---

## 📊 قاعدة البيانات (Supabase)

### 14 جدول رئيسي:
1. **users** — Founders + Hosts
2. **hosts** — معلومات المضيفين
3. **units** — الشقق/الوحدات
4. **bookings** — الحجوزات (من iCal)
5. **guest_sessions** — الإقامات النشطة + tokens
6. **devices** — الأجهزة الذكية (AC/Lights/Lock)
7. **access_codes** — أكواد الدخول
8. **activity_logs** — سجل كل الأحداث
9. **automation_rules** — قواعد الأتمتة
10. **messages** — محادثات Nawaf
11. **ical_feeds** — روابط التقويمات
12. **ads** — الإعلانات المحلية
13. **extensions** — تمديد الإقامات
14. **notifications** — التنبيهات

**RLS:** كل host يرى فقط وحداته (Row-Level Security)

---

## 🔌 9 Edge Functions

| Function | الوظيفة | القيمة |
|----------|---------|--------|
| `generate-code` | توليد كود دخول | كود + DB + Lock + WhatsApp |
| `heartbeat` | تحديث آخر ظهور | كل 30 ثانية من Guest Card |
| `silent-exit-check` | كشف الخروج الصامت | cron كل 5 دقائق |
| `onboard-host` | إضافة مضيف جديد | <1 دقيقة شاملة |
| `guest-token-validate` | التحقق من token | public endpoint |
| `ical-sync` | مزامنة الحجوزات | cron كل 15 دقيقة |
| `send-whatsapp` | إرسال WhatsApp | Async + retries |
| `gemini-intent` | كشف النية | 20% من Nawaf |
| `automation-execute` | تنفيذ rules | Local + cloud |

---

## 🤖 MCP Server (للمطورين)

`qlvn-mcp-server` — TypeScript MCP Server يربط Claude بالنظام.

**Available Tools:**
```
qlvn_list_units              # عرض الوحدات
qlvn_get_unit                # تفاصيل وحدة
qlvn_list_active_guests      # الضيوف النشطين
qlvn_generate_code           # كود دخول جديد
qlvn_send_whatsapp           # رسالة WhatsApp
qlvn_get_activity_logs       # السجلات
qlvn_control_device          # تحكم AC/Lights
qlvn_set_scene               # مشهد cinema/relax
qlvn_create_automation       # automation جديد
qlvn_list_automations        # عرض automations
qlvn_get_unit_stats          # إحصائيات
qlvn_onboard_host            # مضيف جديد
qlvn_sync_ical               # مزامنة حجوزات
```

---

## 🎨 الهوية البصرية

| العنصر | القيمة |
|--------|--------|
| الخلفية | `#030305` (Black) |
| الأزرق الأساسي | `#64d2ff` (Cyan) |
| الذهبي | `#d4a853` (Gold) |
| الزمردي | `#10b981` (Emerald) |
| الخط الرئيسي | Tajawal (300/400/700/900) |
| الأسلوب | Glassmorphism + Dark Mode |
| Border Radius | 20-28px |
| الاتجاه | RTL |

---

## 📍 Roadmap

### Phase 1 — الأساس (الأسبوع 1-2)
- [ ] Supabase project + schema + RLS
- [ ] ربط host_v6.html بـ Supabase
- [ ] Edge Function: `generate-code`
- [ ] Edge Function: `onboard-host`
- [ ] Edge Function: `guest-token-validate`

### Phase 2 — Realtime (الأسبوع 3)
- [ ] Supabase Realtime في كل الواجهات
- [ ] Heartbeat من Guest Card
- [ ] ربط founder_v4_final.html
- [ ] iCal sync

### Phase 3 — Hardware (الأسبوع 4-5)
- [ ] Pi Local Agent بـ Python
- [ ] Smart Lock عبر MQTT
- [ ] Zigbee Motion Sensor
- [ ] Silent Exit Detection
- [ ] Cloudflare Tunnel

### Phase 4 — الذكاء (الأسبوع 6)
- [ ] WhatsApp Cloud API
- [ ] Gemini Intent Detection
- [ ] Automation Studio
- [ ] Ad Engine

### Phase 5 — التشغيل (الأسبوع 7+)
- [ ] MCP Server deployment
- [ ] Monitoring + Logs
- [ ] Pilot في 3 شقق

---

## 💰 نموذج العمل

| المصدر | القيمة |
|--------|--------|
| **Setup Fee** | 5,000 ر.س/شقة (Pi + Sensors + تركيب) |
| **Monthly** | 300 ر.س/شقة (Software + دعم) |
| **Ad Engine** | عمولة من الإعلانات المحلية |
| **Services** | نسبة من قهوة/توصيل/خدمات |

---

## 📞 التواصل

- **Founder:** Sulaiman Al-Qahtani
- **Partner:** Abdulkader
- **GitHub:** [github.com/abdulqadermossaa-creator/Prop-os](https://github.com/abdulqadermossaa-creator/Prop-os)
- **Documentation:** [CLAUDE_FINAL.md](./CLAUDE_FINAL.md)

---

## 📚 المراجع

- [CLAUDE_FINAL.md](./CLAUDE_FINAL.md) — المواصفات التقنية الكاملة
- [DEPLOYMENT.md](./docs/DEPLOYMENT.md) — دليل النشر
- [PI_SETUP.md](./docs/PI_SETUP.md) — إعداد Raspberry Pi
- [API.md](./docs/API.md) — توثيق API

---

## 📄 الترخيص

Proprietary — QLVN OS 2026

---

**QLVN OS · 2026 · Building the future of smart hospitality in Saudi Arabia** 🏗️✨
