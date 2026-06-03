# QLVN OS — Master Build Specification (Final)

> **المرجع الأساسي:** `CLAUDE_FINAL.md` في هذا الـ repository.
> **القاعدة الذهبية:** CLAUDE_FINAL.md = مصدر الحقيقة الوحيد.

---

## قواعد Claude Code

1. اسأل قبل ما تغيّر معمارية
2. **لا تعدّل الـ HTML المعتمدة** — مرجع بصري فقط
3. الـ Plug-and-Play → كل ميزة toggle في `host_settings`
4. التعليقات بالعربي، الكود بالإنجليزي
5. NEVER expose API keys في client code
6. ALWAYS log كل action في `activity_logs`

---

## الواجهات المعتمدة (لا تعدّل HTML)

- `guest_smart_card_v3.html` — بوابة الضيف
- `guest-card-luxury.html` — QDR Luxury
- `guest_tablet_v1.html` — تابلت الشقة
- `host_v6.html` — داشبورد المضيف
- `founder_v4_final.html` — داشبورد المؤسس

---

## حالة المشروع

### ✅ مكتمل
- `supabase/migrations/001_schema.sql` — 15 جدول (مطابق CLAUDE_FINAL.md §6+7+8)
- `supabase/migrations/002_rls.sql` — RLS + SECURITY DEFINER helpers
- `supabase/migrations/003_realtime.sql` — 6 جداول Realtime
- `supabase/migrations/004_seed.sql` — seed data
- `packages/qlvn-config/` — triggers + actions registries
- `.env.example`
- `supabase/functions/guest-token-validate/` — token validation + auto checkin
- `supabase/functions/generate-code/` — 6-digit code → DB + WhatsApp
- `supabase/functions/onboard-host/` — auth + user + host + settings + units
- `supabase/functions/heartbeat/` — last_seen update + expiry check
- `supabase/functions/send-whatsapp/` — WhatsApp Cloud API wrapper
- `supabase/functions/_shared/cors.ts` — shared CORS headers
- `index.ts` (root) — MCP Server (13 tools)
- `apps/host/index.html` — host_v6.html + Supabase integration
- `apps/host/src/supabase-client.js` — host dashboard: auth OTP + units + logs + realtime
- `apps/guest-card/index.html` — guest_smart_card_v3.html + token handler
- `apps/guest-card/src/token-handler.js` — token validate + heartbeat + DOM binding
- `SETUP.md` — تعليمات التطبيق خطوة بخطوة

### 🔲 Phase 1 — المتبقي
- [ ] تشغيل migrations في Supabase Dashboard
- [ ] إنشاء المؤسس الأول في Auth
- [ ] نشر Edge Functions (`supabase functions deploy`)

### 🔲 Phase 2
- [ ] `apps/tablet/` — guest_tablet_v1.html + Supabase
- [ ] `apps/guest-card-luxury/` — guest-card-luxury.html + token handler
- [ ] `apps/founder/` — founder_v4_final.html + Supabase
- [ ] iCal sync (Airbnb/Gathern)

### 🔲 Phase 3+
- [ ] Pi Local Agent (Python)
- [ ] WhatsApp Gemini/Nawaf
- [ ] Automation Studio
