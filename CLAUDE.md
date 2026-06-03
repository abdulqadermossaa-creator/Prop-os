# QLVN OS — Master Build Specification (Final)

> **المرجع:** CLAUDE_FINAL.md (رُفع من المؤسس)
> **القاعدة الذهبية:** هذا الملف = مصدر الحقيقة الوحيد.

## قواعد Claude Code

1. اسأل قبل ما تغيّر معمارية
2. عدّل ملف واحد في كل خطوة
3. **لا تعدّل الـ HTML المعتمدة** — مرجع بصري فقط
4. الـ Plug-and-Play → كل ميزة toggle في `host_settings`
5. التعليقات بالعربي، الكود بالإنجليزي
6. No Magic Numbers — كل قيمة في `config.ts` أو `.env`
7. NEVER expose API keys في client code
8. ALWAYS log كل action في `activity_logs`

## الواجهات المعتمدة (لا تعدّل)

- `guest_smart_card_v3.html`
- `guest-card-luxury.html`
- `guest_tablet_v1.html`
- `host_v6.html`
- `founder_v4_final.html`

## حالة المشروع

### ✅ مكتمل
- `supabase/migrations/001_schema.sql` — 15 جدول
- `supabase/migrations/002_rls.sql` — RLS + policies
- `supabase/migrations/003_realtime.sql` — 6 جداول Realtime
- `supabase/migrations/004_seed.sql` — Demo data + platform automations
- `packages/qlvn-config/automation-triggers.json`
- `packages/qlvn-config/automation-actions.json`
- `.env.example`

### 🔲 التالي — Phase 1 (من CLAUDE_FINAL.md §13)
- [ ] Edge Function: `guest-token-validate`
- [ ] Edge Function: `generate-code`
- [ ] Edge Function: `onboard-host`
- [ ] ربط `host_v6.html` بـ Supabase (supabase-client.js)
- [ ] Edge Function: `heartbeat`
