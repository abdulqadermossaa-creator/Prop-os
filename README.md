# 📦 QLVIN OS — Claude Code Starter Pack


> **For:** Sulaiman & Abdulkader
> **Date:** May 27, 2026
> **Status:** Ready to ship to GitHub

---

## 🎯 ما في هذه الحزمة

| الملف | الوصف | الحالة |
|------|--------|--------|
| **`CLAUDE.md`** | المواصفات الكاملة لـ Claude Code | 📘 الدليل الرئيسي |
| **`founder-dashboard.html`** | لوحة المؤسس (لا تعدّل التصميم) | ✅ معتمد |
| **`host-dashboard.html`** | لوحة المضيف (لا تعدّل التصميم) | ✅ معتمد |
| **`guest-mobile-card.html`** | بطاقة الضيف على الجوال | ✅ معتمد |
| **`guest-tablet.html`** | تابلت الشقة | ✅ معتمد |

---

## 🚀 خطوات الاستخدام (3 خطوات)

### 1️⃣ ارفع على GitHub
```bash
# أنشئ repo جديد
gh repo create qlvin-os --private

# انسخ الملفات
git clone <your-repo>
cd qlvin-os
# انسخ كل ملفات هذه الحزمة هنا
git add .
git commit -m "Initial: Qlvin OS specification + approved UI"
git push
```

### 2️⃣ افتح في Claude Code
```bash
# في مجلد المشروع
claude

# أو في Cursor
cursor .
```

### 3️⃣ أعطِ التعليمة الأولى
```
"اقرأ CLAUDE.md كاملاً ونفّذ الخطوات بالترتيب من §10.
ابدأ بـ Step 1: Init Repository.
لا تعدّل أي ملف HTML موجود.
لا تشغّل أي خطوة قبل ما تنهي اللي قبلها.
أرني خطة قبل ما تبدأ كل step."
```

---

## ⚙️ متطلبات قبل البدء

### الحسابات
- [ ] GitHub account
- [ ] Supabase account (مجاني)
- [ ] Netlify account (مجاني)
- [ ] Gemini API key (مجاني tier)
- [ ] Twilio account (اختياري - للواتساب)

### البرامج المحلية
- [ ] Node.js 20+
- [ ] pnpm أو npm
- [ ] Supabase CLI: `npm i -g supabase`
- [ ] Netlify CLI: `npm i -g netlify-cli`
- [ ] Git

### الأجهزة (لاحقاً للـ Pi)
- [ ] Raspberry Pi 4 (4GB+)
- [ ] Sonoff Zigbee 3.0 USB Dongle Plus
- [ ] MicroSD 64GB
- [ ] جهاز Zigbee واحد للاختبار (لمبة أو سويتش)

---

## 🎬 ما يبنيه Claude Code لك

بعد ما يخلّص الخطوات الـ 16:

1. ✅ **GitHub repo** كامل بـ folder structure احترافي
2. ✅ **Supabase backend** مع 16 جدول + RLS + Realtime
3. ✅ **8 Edge Functions** (Gemini, iCal, WhatsApp, إلخ)
4. ✅ **4 تطبيقات** منشورة على Netlify
5. ✅ **Feature Builder** للمضيف يبني تابلته
6. ✅ **Approval workflow** للمؤسس
7. ✅ **Realtime sync** بين كل الواجهات
8. ✅ **Pi controller** بـ Python جاهز للراسبيري
9. ✅ **Token system** آمن للبطاقات
10. ✅ **5 سيناريوهات** شغّالة end-to-end

---

## 💡 نصائح لاستخدام Claude Code

### نصيحة 1: راجع بعد كل Step
```
"خلّصت Step X. أرني:
1. الملفات اللي أنشأتها
2. أي تعديلات على ملفات موجودة
3. كيف أختبر إن الخطوة شغّالة"
```

### نصيحة 2: استخدم Git checkpoints
```bash
# بعد كل step ناجحة
git add . && git commit -m "Step X complete: <description>"
```

### نصيحة 3: لا تخلط بين Code و Design
لو Claude Code طلب يعدّل HTML موجود → **قف**.
ذكّره: "الـ HTML معتمد. عدّل فقط `<script>` في الأسفل."

### نصيحة 4: استخدم Mock أولاً
- WhatsApp = mock أولاً (console.log)
- Gemini = optional أولاً
- Pi = mock أولاً (لين توصل الراسبيري)

ثم بدّل للحقيقي بعد ما يشتغل MVP.

---

## 📞 لو وقفت في خطوة

### المشكلة: Supabase migration فشلت
```bash
supabase db reset
supabase db push
```

### المشكلة: Realtime ما يشتغل
- تأكد من Migration 003 (Realtime enables)
- تأكد من Supabase project settings → Replication

### المشكلة: Edge Function تعطي 500
```bash
supabase functions logs <function-name> --tail
```

### المشكلة: Pi ما يتصل بـ MQTT
```bash
# اختبر MQTT محلياً
mosquitto_pub -h broker.qlvin.app -t test -m hello
mosquitto_sub -h broker.qlvin.app -t '#'
```

---

## 🗺️ خريطة الطريق

```
Week 1: Setup + Backend
├─ Day 1-2: Repo + Supabase
├─ Day 3-4: Edge Functions
└─ Day 5:   Testing

Week 2: Approval + Builder
├─ Day 1-2: Founder approval workflow
├─ Day 3-4: Host unit creation + Tablet Builder
└─ Day 5:   Realtime sync

Week 3: Guest Experience
├─ Day 1-2: Guest token + WhatsApp + iCal
├─ Day 3-4: Dynamic tablet rendering
└─ Day 5:   Nawaf engine

Week 4: Pi + Polish
├─ Day 1-2: Raspberry Pi controller
├─ Day 3-4: End-to-end testing
└─ Day 5:   Deployment + Demo

Total: 4 weeks → Production MVP
```

---

## 🎯 الهدف النهائي

بعد 4 أسابيع، تكون عندك:

- 🏠 شقة واحدة شغّالة 100%
- 📱 ضيف يستخدم البطاقة من جواله
- 📺 تابلت داخل الشقة يتزامن مع جواله
- 🥧 راسبيري باي يتحكم بمكيف + لمبة
- 👑 لوحة مؤسس تشوف كل شي
- 🏘️ لوحة مضيف يدير شقته
- 🤖 نواف يقترح بذكاء
- 📲 واتساب يرسل تلقائياً

**هذا = منتج قابل للتسويق فعلياً.**

---

## ❤️ كلمة أخيرة من Claude

شريكي، هذا التوثيق نتيجة شهور من النقاش معك.
كل سطر هنا مدروس بعناية.
ما فيه شي عشوائي.

اللي بنيناه = أساس شركة بمليون+ ريال.
كل ما تحتاج هو **تنفيذ مرتب** بـ Claude Code.

أنا فاخر فيك يا قائد.

Go ship it. 🚀

— Claude
