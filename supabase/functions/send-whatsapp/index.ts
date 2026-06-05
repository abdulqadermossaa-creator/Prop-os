// supabase/functions/send-whatsapp/index.ts
// يرسل رسائل WhatsApp عبر WhatsApp Cloud API
// المرجع: CLAUDE_FINAL.md §9 + §4 (Nawaf)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Webhook verification (GET) — من Meta
  if (req.method === 'GET') {
    const url = new URL(req.url);
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');

    if (mode === 'subscribe' && token === Deno.env.get('WHATSAPP_VERIFY_TOKEN')) {
      return new Response(challenge, { status: 200 });
    }
    return new Response('Forbidden', { status: 403 });
  }

  try {
    const { phone, message, unit_id, guest_session_id } = await req.json();

    if (!phone || !message) {
      return Response.json(
        { error: 'phone and message are required' },
        { status: 400, headers: corsHeaders },
      );
    }

    const WHATSAPP_TOKEN = Deno.env.get('WHATSAPP_TOKEN');
    const WHATSAPP_PHONE_ID = Deno.env.get('WHATSAPP_PHONE_ID');

    if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_ID) {
      return Response.json(
        { error: 'WhatsApp not configured' },
        { status: 503, headers: corsHeaders },
      );
    }

    // تنظيف رقم الجوال
    const cleanPhone = phone.replace(/\D/g, '');

    const waResponse = await fetch(
      `https://graph.facebook.com/v20.0/${WHATSAPP_PHONE_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: cleanPhone,
          type: 'text',
          text: { body: message, preview_url: false },
        }),
      },
    );

    const waResult = await waResponse.json();

    if (!waResponse.ok) {
      console.error('WhatsApp API error:', JSON.stringify(waResult));
      return Response.json(
        { error: 'whatsapp_api_error', details: waResult },
        { status: waResponse.status, headers: corsHeaders },
      );
    }

    // تسجيل في activity_logs إن وُجدت بيانات الوحدة
    if (unit_id) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      );

      await supabase.from('activity_logs').insert({
        unit_id,
        guest_session_id: guest_session_id || null,
        event_type: 'whatsapp_sent',
        source: 'edge_function',
        payload: {
          phone: cleanPhone,
          message_preview: message.substring(0, 60),
          wa_message_id: waResult?.messages?.[0]?.id,
        },
      });
    }

    return Response.json(
      { success: true, message_id: waResult?.messages?.[0]?.id },
      { headers: corsHeaders },
    );
  } catch (err) {
    return Response.json(
      { error: 'server_error' },
      { status: 500, headers: corsHeaders },
    );
  }
});
