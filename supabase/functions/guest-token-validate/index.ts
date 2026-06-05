// supabase/functions/guest-token-validate/index.ts
// public endpoint — لا يحتاج auth — يتحقق من token الضيف
// المرجع: CLAUDE_FINAL.md §9

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { token } = await req.json();

    if (!token || typeof token !== 'string' || token.length !== 64) {
      return Response.json(
        { valid: false, error: 'invalid_token_format' },
        { status: 400, headers: corsHeaders },
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: session, error } = await supabase
      .from('guest_sessions')
      .select(`
        id, guest_name, guest_phone, status,
        checked_in_at, token_expires_at, last_seen,
        unit_id,
        units!inner(
          name, qlvn_code, neighborhood, floor, building,
          operational_status, current_temp, target_temp,
          hosts!inner(name, phone)
        )
      `)
      .eq('guest_token', token)
      .eq('status', 'active')
      .single();

    if (error || !session) {
      return Response.json(
        { valid: false, error: 'token_not_found' },
        { status: 404, headers: corsHeaders },
      );
    }

    // تحقق من انتهاء الصلاحية
    if (new Date(session.token_expires_at) < new Date()) {
      // تحديث الحالة تلقائياً
      await supabase
        .from('guest_sessions')
        .update({ status: 'expired' })
        .eq('id', session.id);

      return Response.json(
        { valid: false, error: 'token_expired' },
        { status: 401, headers: corsHeaders },
      );
    }

    // تسجيل أول استخدام إذا كانت هذه أول مرة
    if (!session.checked_in_at) {
      await supabase
        .from('guest_sessions')
        .update({
          checked_in_at: new Date().toISOString(),
          last_seen: new Date().toISOString(),
        })
        .eq('id', session.id);

      await supabase.from('activity_logs').insert({
        unit_id: session.unit_id,
        guest_session_id: session.id,
        event_type: 'guest_checked_in',
        source: 'guest_card',
        payload: { guest_name: session.guest_name },
      });
    }

    const unit = (session as any).units;

    return Response.json(
      {
        valid: true,
        session_id: session.id,
        guest: {
          name: session.guest_name,
          phone: session.guest_phone,
        },
        unit: {
          id: session.unit_id,
          name: unit.name,
          code: unit.qlvn_code,
          neighborhood: unit.neighborhood,
          floor: unit.floor,
          building: unit.building,
          current_temp: unit.current_temp,
          target_temp: unit.target_temp,
          host_name: unit.hosts?.name,
          host_phone: unit.hosts?.phone,
        },
        expires_at: session.token_expires_at,
      },
      { headers: corsHeaders },
    );
  } catch (err) {
    return Response.json(
      { valid: false, error: 'server_error' },
      { status: 500, headers: corsHeaders },
    );
  }
});
