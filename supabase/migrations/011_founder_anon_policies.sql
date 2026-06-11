-- Migration 011: Allow anon key to read/write hosts for founder dashboard
-- الداشبورد يعمل بـ PIN فقط (بدون Supabase Auth) — نحتاج policies للـ anon key

-- قراءة الملاك (role=host) بدون auth
CREATE POLICY "anon_read_hosts" ON public.users
  FOR SELECT USING (role = 'host');

-- إضافة مالك جديد بدون auth
CREATE POLICY "anon_insert_hosts" ON public.users
  FOR INSERT WITH CHECK (role = 'host');

-- قراءة الوحدات بدون auth
CREATE POLICY "anon_read_units" ON public.units
  FOR SELECT USING (true);

-- إضافة وحدة بدون auth
CREATE POLICY "anon_insert_units" ON public.units
  FOR INSERT WITH CHECK (true);
