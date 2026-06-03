-- ═══════════════════════════════════════════════════════
-- Migration 004: Seed Data
-- بيانات أولية للنظام
-- ═══════════════════════════════════════════════════════

-- ─────────────────────────────────────────────
-- إعلان demo (للاختبار — يُحذف في Production)
-- ─────────────────────────────────────────────
INSERT INTO ads (title, description, target_neighborhoods, active, starts_at, ends_at)
VALUES
    (
        'مطعم الأصيل',
        'خصم 15% للضيوف القادمين من Qlvin — أرقى مطاعم المنطقة',
        ARRAY['حي النرجس', 'حي الياسمين', 'حي الملقا'],
        true,
        NOW(),
        NOW() + INTERVAL '90 days'
    );

-- ─────────────────────────────────────────────
-- Automation templates عامة (scope = 'platform')
-- تُطبّق على كل الوحدات تلقائياً
-- ─────────────────────────────────────────────
INSERT INTO automation_rules (scope, name, icon, runs_on, trigger_type, trigger_config, actions, locked_by_founder)
VALUES
    (
        'platform',
        'الترحيب عند الوصول',
        '🎉',
        'tablet',
        'guest_checked_in',
        '{}',
        '[
            {"type": "set_lights", "params": {"brightness": 80}},
            {"type": "set_ac", "params": {"power": "on", "temperature": 22, "mode": "cool"}},
            {"type": "show_nawaf_card", "params": {"message": "أهلاً وسهلاً! نواف في خدمتك 24/7"}}
        ]'::jsonb,
        true
    ),
    (
        'platform',
        'وضع الليل عند منتصف الليل',
        '🌙',
        'pi_local',
        'time_of_day',
        '{"time": "00:00", "days": ["sun","mon","tue","wed","thu","fri","sat"]}'::jsonb,
        '[
            {"type": "set_lights", "params": {"brightness": 0}},
            {"type": "set_ac", "params": {"temperature": 23}}
        ]'::jsonb,
        false
    ),
    (
        'platform',
        'تنبيه الخروج الصامت',
        '👻',
        'cloud',
        'presence_lost',
        '{"timeout_minutes": 180}'::jsonb,
        '[
            {"type": "change_unit_status", "params": {"operational_status": "cleaning"}},
            {"type": "notify_host", "params": {"title": "🧹 الشقة جاهزة للتنظيف", "body": "لم يُكتشف وجود منذ 3 ساعات"}}
        ]'::jsonb,
        true
    );

-- ─────────────────────────────────────────────
-- ملاحظة: المؤسس الأول يُنشأ يدوياً من Supabase Auth Dashboard
-- ثم يُضاف صف في جدول users بالـ auth_id المقابل:
--
-- INSERT INTO users (auth_id, name, role, email, phone)
-- VALUES ('<auth_id_from_dashboard>', 'سليمان القحطاني', 'founder', '...', '...');
-- ─────────────────────────────────────────────
