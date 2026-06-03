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
- `supabase/migrations/001_schema.sql` — 15 جدول
- `supabase/migrations/002_rls.sql` — RLS + helpers
- `supabase/migrations/003_realtime.sql` — 6 جداول Realtime
- `supabase/migrations/004_seed.sql` — seed data
- `packages/qlvn-config/` — triggers + actions registries
- `.env.example`

### 🔲 التالي — Phase 1
- [ ] Edge Function: `guest-token-validate`
- [ ] Edge Function: `generate-code`
- [ ] Edge Function: `onboard-host`
- [ ] Edge Function: `heartbeat`
- [ ] ربط `host_v6.html` بـ Supabase
