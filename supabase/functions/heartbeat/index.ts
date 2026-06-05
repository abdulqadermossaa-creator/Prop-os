// supabase/functions/heartbeat/index.ts
// يحدّث guest_sessions.last_seen كل 30 ثانية
// المرجع: CLAUDE_FINAL.md §9
// تُستدعى من: Guest Card (browser) + Pi Agent

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { token, session_id, source = 'guest_card' } = await req.json();

    if (!token && !session_id) {
      return Response.json(
        { error: 'token or session_id required' },
        { status: 400, headers: corsHeaders },
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const now = new Date().toISOString();

    let query = supabase
      .from('guest_sessions')
      .update({ last_seen: now })
      .eq('status', 'active');

    if (token) {
      query = query.eq('guest_token', token);
    } else {
      query = query.eq('id', session_id);
    }

    const { data, error } = await query.select('id, unit_id, token_expires_at').single();

    if (error || !data) {
      return Response.json(
        { error: 'session_not_found' },
        { status: 404, headers: corsHeaders },
      );
    }

    // تحقق من انتهاء الصلاحية
    if (new Date(data.token_expires_at) < new Date()) {
      await supabase
        .from('guest_sessions')
        .update({ status: 'expired' })
        .eq('id', data.id);

      return Response.json(
        { expired: true, message: 'session_expired' },
        { status: 200, headers: corsHeaders },
      );
    }

    return Response.json(
      {
        ok: true,
        session_id: data.id,
        last_seen: now,
        expires_at: data.token_expires_at,
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
