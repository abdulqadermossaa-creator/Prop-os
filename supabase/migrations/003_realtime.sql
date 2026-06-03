-- ═══════════════════════════════════════════════════════
-- Migration 003: Realtime Publications
-- المرجع: CLAUDE_FINAL.md §8 (REALTIME section)
--
-- هذه الجداول تُبثّ تلقائياً لكل المشتركين
-- عبر Supabase Realtime WebSocket.
-- ═══════════════════════════════════════════════════════

-- الجداول التي تحتاج Realtime (من CLAUDE_FINAL.md §8 بالضبط)
ALTER PUBLICATION supabase_realtime ADD TABLE units;
ALTER PUBLICATION supabase_realtime ADD TABLE guest_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE activity_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE devices;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE automation_rules;

-- ─────────────────────────────────────────────
-- ملاحظات القنوات (تُستخدم في الواجهات):
--
-- channel: units:{unit_id}
--   → host_v6.html يشترك — يشوف تحديث الحالة فوراً
--
-- channel: guest_sessions:{unit_id}
--   → tablet + mobile_card يشتركان — mode change يُطبّق < 200ms
--
-- channel: activity_logs:{unit_id}
--   → host_v6.html Live Feed
--
-- channel: devices:{unit_id}
--   → كل الواجهات تشترك — state sync فوري
--
-- channel: notifications:{user_id}
--   → founder + host يستقبلان تنبيهات فورية
--
-- channel: automation_rules:{unit_id}
--   → Pi يعيد تحميل الـ rules عند التغيير
-- ─────────────────────────────────────────────
