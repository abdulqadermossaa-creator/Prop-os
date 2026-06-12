-- إصلاح users table للسماح بإضافة ملاك بدون Supabase Auth
-- يُغيّر auth_id و email من NOT NULL إلى nullable

ALTER TABLE public.users
  ALTER COLUMN auth_id DROP NOT NULL;

ALTER TABLE public.users
  ALTER COLUMN email DROP NOT NULL;

-- تحديث constraint البريد الإلكتروني ليسمح بـ NULL مكرر
-- (UNIQUE يسمح بـ multiple NULLs في Postgres تلقائياً)
