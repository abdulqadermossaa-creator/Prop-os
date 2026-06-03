# QLVN OS — Setup Guide

## Supabase Project
**URL:** `https://nrekvofyypdifqfghhnh.supabase.co`

---

## 1️⃣ تطبيق الـ Migrations (مرة واحدة فقط)

افتح **Supabase Dashboard → SQL Editor** وشغّل بالترتيب:

```sql
-- 1. Schema (15 جدول)
-- انسخ محتوى: supabase/migrations/001_schema.sql
```

```sql
-- 2. RLS Policies
-- انسخ محتوى: supabase/migrations/002_rls.sql
```

```sql
-- 3. Realtime
-- انسخ محتوى: supabase/migrations/003_realtime.sql
```

```sql
-- 4. Seed Data
-- انسخ محتوى: supabase/migrations/004_seed.sql
```

---

## 2️⃣ إنشاء المؤسس الأول

**Supabase Dashboard → Authentication → Users → Invite User**
- أدخل الإيميل أو الجوال
- بعد التسجيل، شغّل في SQL Editor:

```sql
INSERT INTO users (auth_id, name, role, email, phone)
VALUES (
  '<auth_id_from_users_table>',
  'عبدالقادر',
  'founder',
  'abdulqader.mossaa@gmail.com',
  '+966...'
);
```

---

## 3️⃣ نشر Edge Functions

```bash
supabase login
supabase link --project-ref nrekvofyypdifqfghhnh

# نشر كل الوظائف دفعة واحدة
supabase functions deploy

# أو كل وظيفة منفردة
supabase functions deploy guest-token-validate
supabase functions deploy generate-code
supabase functions deploy onboard-host
supabase functions deploy heartbeat
supabase functions deploy send-whatsapp
```

---

## 4️⃣ إعداد المتغيرات في Supabase

**Dashboard → Edge Functions → Environment Variables:**

```
SUPABASE_URL = https://nrekvofyypdifqfghhnh.supabase.co
SUPABASE_SERVICE_ROLE_KEY = <من Dashboard → Settings → API>
WHATSAPP_TOKEN = <من Meta Developer Console>
WHATSAPP_PHONE_ID = <من Meta Developer Console>
WHATSAPP_VERIFY_TOKEN = <أي نص عشوائي>
GEMINI_API_KEY = <من Google AI Studio>
```

---

## 5️⃣ فتح الواجهات

| الواجهة | الملف | الرابط |
|---------|-------|--------|
| Host Dashboard | `apps/host/index.html` | افتح في المتصفح مباشرة |
| Guest Card | `apps/guest-card/index.html?token=xxx` | يحتاج token صالح |
| Guest Card Luxury | `apps/guest-card-luxury/index.html?token=xxx` | — |
| Tablet | `apps/tablet/index.html?token=xxx` | — |
| Founder | `apps/founder/index.html` | يحتاج auth كـ founder |

---

## تدفق تسجيل الدخول (Host)

```
1. افتح apps/host/index.html
2. أدخل رقم الجوال → استقبل OTP
3. سيُحمَّل الـ dashboard مع بيانات وحداتك من Supabase
```

## تدفق تجربة الضيف

```
1. المضيف يفتح checkin modal → يدخل اسم الضيف + رقمه
2. النظام يُنشئ booking + guest_session + كود دخول
3. يُرسَل الكود للضيف عبر WhatsApp
4. الضيف يفتح الرابط: apps/guest-card/index.html?token=<token>
5. الصفحة تتحقق من الـ token وتعرض بيانات الشقة
```
