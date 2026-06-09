-- QLVN OS — Migration 010: RLS Policies for Founder + Host
-- شغّل هذا في SQL Editor بعد 009

-- ─────────────────────────────────────────────
-- users
-- ─────────────────────────────────────────────
CREATE POLICY "founder_read_all_users" ON public.users
  FOR SELECT USING (public.is_founder());

CREATE POLICY "host_read_own_user" ON public.users
  FOR SELECT USING (auth_id = auth.uid());

CREATE POLICY "founder_update_users" ON public.users
  FOR UPDATE USING (public.is_founder());

CREATE POLICY "own_user_update" ON public.users
  FOR UPDATE USING (auth_id = auth.uid());

-- ─────────────────────────────────────────────
-- units
-- ─────────────────────────────────────────────
CREATE POLICY "founder_all_units" ON public.units
  FOR ALL USING (public.is_founder());

CREATE POLICY "host_own_units" ON public.units
  FOR ALL USING (host_id = public.get_my_user_id());

-- ─────────────────────────────────────────────
-- guest_sessions
-- ─────────────────────────────────────────────
CREATE POLICY "founder_all_sessions" ON public.guest_sessions
  FOR ALL USING (public.is_founder());

CREATE POLICY "host_own_sessions" ON public.guest_sessions
  FOR ALL USING (
    unit_id IN (SELECT id FROM public.units WHERE host_id = public.get_my_user_id())
  );

-- ─────────────────────────────────────────────
-- events
-- ─────────────────────────────────────────────
CREATE POLICY "founder_all_events" ON public.events
  FOR ALL USING (public.is_founder());

CREATE POLICY "host_own_events" ON public.events
  FOR SELECT USING (
    unit_id IN (SELECT id FROM public.units WHERE host_id = public.get_my_user_id())
  );

CREATE POLICY "insert_events" ON public.events
  FOR INSERT WITH CHECK (true);

-- ─────────────────────────────────────────────
-- notifications
-- ─────────────────────────────────────────────
CREATE POLICY "own_notifications" ON public.notifications
  FOR ALL USING (recipient_id = public.get_my_user_id());

-- ─────────────────────────────────────────────
-- devices
-- ─────────────────────────────────────────────
CREATE POLICY "founder_all_devices" ON public.devices
  FOR ALL USING (public.is_founder());

CREATE POLICY "host_own_devices" ON public.devices
  FOR ALL USING (
    unit_id IN (SELECT id FROM public.units WHERE host_id = public.get_my_user_id())
  );

-- ─────────────────────────────────────────────
-- automation_rules
-- ─────────────────────────────────────────────
CREATE POLICY "founder_all_automations" ON public.automation_rules
  FOR ALL USING (public.is_founder());

CREATE POLICY "host_own_automations" ON public.automation_rules
  FOR ALL USING (
    scope = 'unit' AND scope_id IN (
      SELECT id FROM public.units WHERE host_id = public.get_my_user_id()
    )
  );

CREATE POLICY "host_view_platform_automations" ON public.automation_rules
  FOR SELECT USING (scope IN ('platform', 'host') AND visible_to_host = true);

-- ─────────────────────────────────────────────
-- automation_executions
-- ─────────────────────────────────────────────
CREATE POLICY "founder_all_executions" ON public.automation_executions
  FOR ALL USING (public.is_founder());

CREATE POLICY "host_own_executions" ON public.automation_executions
  FOR SELECT USING (
    unit_id IN (SELECT id FROM public.units WHERE host_id = public.get_my_user_id())
  );

-- ─────────────────────────────────────────────
-- audit_log — Founder فقط
-- ─────────────────────────────────────────────
CREATE POLICY "founder_all_audit" ON public.audit_log
  FOR ALL USING (public.is_founder());

-- ─────────────────────────────────────────────
-- resource_limits — قراءة للجميع، تعديل للمؤسس فقط
-- ─────────────────────────────────────────────
CREATE POLICY "read_resource_limits" ON public.resource_limits
  FOR SELECT USING (true);

CREATE POLICY "founder_manage_limits" ON public.resource_limits
  FOR ALL USING (public.is_founder());

-- ─────────────────────────────────────────────
-- resource_usage
-- ─────────────────────────────────────────────
CREATE POLICY "founder_all_usage" ON public.resource_usage
  FOR ALL USING (public.is_founder());

CREATE POLICY "host_own_usage" ON public.resource_usage
  FOR SELECT USING (host_id = public.get_my_user_id());

-- ─────────────────────────────────────────────
-- permissions — قراءة للجميع
-- ─────────────────────────────────────────────
CREATE POLICY "read_permissions" ON public.permissions
  FOR SELECT USING (true);

CREATE POLICY "founder_manage_permissions" ON public.permissions
  FOR ALL USING (public.is_founder());
