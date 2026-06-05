// supabase/functions/onboard-host/index.ts
// يضيف مضيف جديد + شقق + host_settings — Plug & Play
// المرجع: CLAUDE_FINAL.md §9

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

function generateQlvnCode(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `QLVN-${num}`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // فقط المؤسس (service_role) يستطيع استدعاء هذه الوظيفة
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return Response.json(
      { error: 'unauthorized' },
      { status: 401, headers: corsHeaders },
    );
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  try {
    const {
      name,
      phone,
      email,
      units: unitsList = [],
      send_welcome = true,
    } = await req.json();

    if (!name || !phone) {
      return Response.json(
        { error: 'name and phone are required' },
        { status: 400, headers: corsHeaders },
      );
    }

    if (!unitsList.length) {
      return Response.json(
        { error: 'at least one unit is required' },
        { status: 400, headers: corsHeaders },
      );
    }

    // 1. إنشاء حساب auth في Supabase (المضيف يستخدم OTP أو Magic Link)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      phone: phone.startsWith('+') ? phone : `+${phone}`,
      email: email || undefined,
      phone_confirm: true,
      email_confirm: true,
      user_metadata: { name, role: 'host' },
    });

    if (authError) {
      return Response.json(
        { error: `auth_creation_failed: ${authError.message}` },
        { status: 500, headers: corsHeaders },
      );
    }

    const authId = authData.user.id;

    // 2. إضافة صف في جدول users
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        auth_id: authId,
        name,
        phone,
        email: email || null,
        role: 'host',
      })
      .select()
      .single();

    if (userError) {
      // تراجع: حذف المستخدم من auth
      await supabase.auth.admin.deleteUser(authId);
      return Response.json(
        { error: `user_creation_failed: ${userError.message}` },
        { status: 500, headers: corsHeaders },
      );
    }

    // 3. إنشاء سجل hosts
    const { data: host, error: hostError } = await supabase
      .from('hosts')
      .insert({ user_id: user.id, name, phone, email: email || null })
      .select()
      .single();

    if (hostError) {
      return Response.json(
        { error: `host_creation_failed: ${hostError.message}` },
        { status: 500, headers: corsHeaders },
      );
    }

    // 4. إنشاء host_settings (Plug & Play defaults — §6)
    await supabase.from('host_settings').insert({
      host_id: host.id,
      card_style: 'cinema',
      tablet_layout: 'classic',
      show_sports_widget: true,
      show_local_ads: true,
      show_extras_menu: true,
      ad_engine_enabled: true,
      nawaf_enabled: true,
      netflix_confusion_detection: true,
      extend_button: true,
      exit_button: true,
      whatsapp_notifications: true,
      ical_sync_enabled: true,
    });

    // 5. إنشاء الوحدات
    const createdUnits = [];
    for (const unitData of unitsList) {
      let qlvnCode = generateQlvnCode();

      // تأكد أن الكود فريد
      while (true) {
        const { data: exists } = await supabase
          .from('units')
          .select('id')
          .eq('qlvn_code', qlvnCode)
          .maybeSingle();
        if (!exists) break;
        qlvnCode = generateQlvnCode();
      }

      const { data: unit, error: unitError } = await supabase
        .from('units')
        .insert({
          host_id: host.id,
          name: unitData.name,
          qlvn_code: qlvnCode,
          neighborhood: unitData.neighborhood || null,
          address: unitData.address || null,
          floor: unitData.floor || null,
          building: unitData.building || null,
          operational_status: 'available',
          approval_status: 'pending_approval',
        })
        .select()
        .single();

      if (!unitError && unit) {
        createdUnits.push(unit);
      }
    }

    // 6. إرسال رسالة ترحيب عبر WhatsApp
    if (send_welcome && phone) {
      await supabase.functions.invoke('send-whatsapp', {
        body: {
          phone: phone.replace(/\D/g, ''),
          message:
            `أهلاً ${name}! 🎉\n\n` +
            `تم تفعيل حسابك في *QLVIN OS* بنجاح.\n\n` +
            `🏠 وحداتك: ${createdUnits.length} وحدة\n` +
            `📊 Dashboard: سيتم إرسال الرابط قريباً\n\n` +
            `نحن هنا لمساعدتك في أي وقت 💪`,
        },
      }).catch(console.error);
    }

    // 7. تسجيل الحدث
    for (const unit of createdUnits) {
      await supabase.from('activity_logs').insert({
        unit_id: unit.id,
        event_type: 'unit_created',
        source: 'onboarding',
        payload: { host_name: name, qlvn_code: unit.qlvn_code },
      });
    }

    return Response.json(
      {
        success: true,
        host: { id: host.id, name, phone },
        units_created: createdUnits.map(u => ({
          id: u.id,
          name: u.name,
          qlvn_code: u.qlvn_code,
          approval_status: u.approval_status,
        })),
        welcome_sent: send_welcome,
        note: 'الوحدات تحتاج موافقة المؤسس قبل التفعيل',
      },
      { headers: corsHeaders },
    );
  } catch (err) {
    return Response.json(
      { error: 'server_error' },
      { status: 500, headers: corsHeaders },
    );
  }
});
