// supabase/functions/generate-code/index.ts
// يولّد كود دخول → يحفظه في DB → يرسله عبر WhatsApp
// المرجع: CLAUDE_FINAL.md §9

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

function generateNumericCode(length = 6): string {
  const digits = '0123456789';
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes).map(b => digits[b % 10]).join('');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // فقط service_role أو المضيف المصرّح له يصل لهذه الوظيفة
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

    const { unit_id, guest_session_id, send_whatsapp = true, code_type = 'door' } = await req.json();

    if (!unit_id || !guest_session_id) {
      return Response.json(
        { error: 'unit_id and guest_session_id are required' },
        { status: 400, headers: corsHeaders },
      );
    }

    // تحقق أن الجلسة موجودة ونشطة
    const { data: session, error: sessionError } = await supabase
      .from('guest_sessions')
      .select('id, guest_name, guest_phone, unit_id, token_expires_at, status')
      .eq('id', guest_session_id)
      .eq('unit_id', unit_id)
      .eq('status', 'active')
      .single();

    if (sessionError || !session) {
      return Response.json(
        { error: 'session_not_found_or_inactive' },
        { status: 404, headers: corsHeaders },
      );
    }

    // توليد كود فريد
    let code = generateNumericCode(6);
    let attempts = 0;

    // تأكد أن الكود غير مستخدم حالياً
    while (attempts < 5) {
      const { data: existing } = await supabase
        .from('access_codes')
        .select('id')
        .eq('unit_id', unit_id)
        .eq('code', code)
        .eq('is_active', true)
        .maybeSingle();

      if (!existing) break;
      code = generateNumericCode(6);
      attempts++;
    }

    // إلغاء الكودات السابقة لهذه الجلسة
    await supabase
      .from('access_codes')
      .update({ is_active: false })
      .eq('unit_id', unit_id)
      .eq('guest_session_id', guest_session_id)
      .eq('is_active', true);

    // حفظ الكود الجديد
    const { data: newCode, error: insertError } = await supabase
      .from('access_codes')
      .insert({
        unit_id,
        guest_session_id,
        code,
        code_type,
        is_active: true,
        expires_at: session.token_expires_at,
      })
      .select()
      .single();

    if (insertError) {
      return Response.json(
        { error: `failed_to_save_code: ${insertError.message}` },
        { status: 500, headers: corsHeaders },
      );
    }

    // تسجيل الحدث
    await supabase.from('activity_logs').insert({
      unit_id,
      guest_session_id,
      event_type: 'code_generated',
      source: 'edge_function',
      payload: { code_id: newCode.id, code_type },
    });

    let whatsappSent = false;

    // إرسال عبر WhatsApp إذا طُلب
    if (send_whatsapp && session.guest_phone) {
      const { error: waError } = await supabase.functions.invoke('send-whatsapp', {
        body: {
          phone: session.guest_phone,
          message:
            `🔐 كود دخول شقتك:\n` +
            `*${code}*\n\n` +
            `صالح حتى: ${new Date(session.token_expires_at).toLocaleString('ar-SA')}\n\n` +
            `_QLVIN OS — خدمتك أولويتنا_`,
          unit_id,
          guest_session_id,
        },
      });

      whatsappSent = !waError;

      if (waError) {
        console.error('WhatsApp send failed:', waError);
      }
    }

    return Response.json(
      {
        success: true,
        code,
        code_id: newCode.id,
        expires_at: session.token_expires_at,
        whatsapp_sent: whatsappSent,
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
