// src/index.ts
// QLVN OS — MCP Server
// يربط Claude مباشرة بنظام Qlvin OS

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import express from 'express';
import { z } from 'zod';
import { supabase } from './supabase.js';

// ============================================
// إنشاء الـ MCP Server
// ============================================
const server = new McpServer({
  name: 'qlvn-mcp-server',
  version: '1.0.0',
});

// ============================================
// 🏠 1. qlvn_list_units — عرض كل الوحدات
// ============================================
server.registerTool(
  'qlvn_list_units',
  {
    title: 'List QLVN Units',
    description: 'عرض كل وحدات QLVN OS مع حالتها الحالية. يعرض: الاسم، الحالة، الضيف الحالي، حالة الـ Pi.',
    inputSchema: {
      host_id: z.string().optional().describe('فلتر حسب المضيف — اتركه فارغاً لعرض الكل (للمؤسس)'),
      status: z.enum(['available', 'occupied', 'cleaning', 'maintenance', 'all']).default('all').describe('فلتر حسب الحالة'),
    },
    annotations: { readOnlyHint: true, destructiveHint: false },
  },
  async ({ host_id, status }) => {
    // جلب الوحدات مع بيانات الضيف الحالي
    let query = supabase
      .from('units')
      .select(`
        id, name, qlvn_code, operational_status, approval_status,
        pi_status, pi_last_seen, neighborhood, current_temp, target_temp,
        hosts!inner(name, phone),
        guest_sessions(guest_name, status, checked_in_at, last_seen)
      `)
      .eq('approval_status', 'approved')
      .order('name');

    if (host_id) query = query.eq('host_id', host_id);
    if (status !== 'all') query = query.eq('operational_status', status);

    const { data, error } = await query;

    if (error) {
      return {
        content: [{ type: 'text', text: `❌ خطأ: ${error.message}` }],
        isError: true,
      };
    }

    const units = data?.map((u: any) => ({
      id: u.id,
      name: u.name,
      code: u.qlvn_code,
      status: u.operational_status,
      pi: u.pi_status,
      host: u.hosts?.name,
      current_temp: u.current_temp,
      active_guest: u.guest_sessions?.find((g: any) => g.status === 'active')?.guest_name || null,
    }));

    return {
      content: [{ type: 'text', text: JSON.stringify(units, null, 2) }],
      structuredContent: { units, total: units?.length || 0 },
    };
  }
);

// ============================================
// 🔍 2. qlvn_get_unit — تفاصيل وحدة
// ============================================
server.registerTool(
  'qlvn_get_unit',
  {
    title: 'Get QLVN Unit Details',
    description: 'عرض تفاصيل كاملة لوحدة محددة: حالتها، الأجهزة، الضيف الحالي، الحجوزات القادمة.',
    inputSchema: {
      unit_id: z.string().describe('معرّف الوحدة أو الـ QLVN code مثل QLVN-1042'),
    },
    annotations: { readOnlyHint: true },
  },
  async ({ unit_id }) => {
    // البحث بالـ ID أو الـ code
    const isCode = unit_id.startsWith('QLVN-');
    const { data: unit, error } = await supabase
      .from('units')
      .select(`
        *, hosts(name, phone, email),
        devices(name, type, status, state),
        guest_sessions(*, bookings(source, checkin_at, checkout_at)),
        ical_feeds(source, last_synced_at, sync_status)
      `)
      .eq(isCode ? 'qlvn_code' : 'id', unit_id)
      .single();

    if (error || !unit) {
      return {
        content: [{ type: 'text', text: `❌ الوحدة غير موجودة: ${unit_id}` }],
        isError: true,
      };
    }

    return {
      content: [{ type: 'text', text: JSON.stringify(unit, null, 2) }],
      structuredContent: unit,
    };
  }
);

// ============================================
// 👥 3. qlvn_list_active_guests — الضيوف النشطين
// ============================================
server.registerTool(
  'qlvn_list_active_guests',
  {
    title: 'List Active Guests',
    description: 'عرض كل الضيوف الموجودين الآن مع آخر نشاط (Heartbeat) وبقية وقتهم.',
    inputSchema: {
      unit_id: z.string().optional().describe('فلتر لوحدة معينة'),
    },
    annotations: { readOnlyHint: true },
  },
  async ({ unit_id }) => {
    let query = supabase
      .from('guest_sessions')
      .select(`
        id, guest_name, guest_phone, checked_in_at, last_seen,
        token_expires_at, status,
        units!inner(name, qlvn_code, operational_status)
      `)
      .eq('status', 'active')
      .order('checked_in_at', { ascending: false });

    if (unit_id) query = query.eq('unit_id', unit_id);

    const { data, error } = await query;

    if (error) {
      return {
        content: [{ type: 'text', text: `❌ خطأ: ${error.message}` }],
        isError: true,
      };
    }

    // احسب الوقت المتبقي
    const guests = data?.map((g: any) => {
      const remaining = new Date(g.token_expires_at).getTime() - Date.now();
      const hoursLeft = Math.max(0, Math.floor(remaining / 3600000));
      const lastSeen = g.last_seen
        ? `${Math.floor((Date.now() - new Date(g.last_seen).getTime()) / 60000)} دقيقة مضت`
        : 'غير معروف';

      return {
        name: g.guest_name,
        unit: g.units?.name,
        unit_code: g.units?.qlvn_code,
        hours_left: hoursLeft,
        last_seen: lastSeen,
        checked_in: g.checked_in_at,
      };
    });

    return {
      content: [{ type: 'text', text: JSON.stringify(guests, null, 2) }],
      structuredContent: { guests, total: guests?.length || 0 },
    };
  }
);

// ============================================
// 🔐 4. qlvn_generate_code — توليد كود دخول
// ============================================
server.registerTool(
  'qlvn_generate_code',
  {
    title: 'Generate Access Code',
    description: 'يولّد كود دخول جديد للوحدة، يحفظه في DB، ويرسله عبر WhatsApp للضيف.',
    inputSchema: {
      unit_id: z.string().describe('معرّف الوحدة'),
      guest_session_id: z.string().describe('معرّف جلسة الضيف'),
      send_whatsapp: z.boolean().default(true).describe('إرسال الكود عبر WhatsApp'),
    },
    annotations: { readOnlyHint: false, destructiveHint: false },
  },
  async ({ unit_id, guest_session_id, send_whatsapp }) => {
    // استدعاء Edge Function
    const { data, error } = await supabase.functions.invoke('generate-code', {
      body: { unit_id, guest_session_id, send_whatsapp },
    });

    if (error) {
      return {
        content: [{ type: 'text', text: `❌ فشل توليد الكود: ${error.message}` }],
        isError: true,
      };
    }

    // تسجيل في activity_logs
    await supabase.from('activity_logs').insert({
      unit_id,
      guest_session_id,
      event_type: 'code_generated',
      source: 'mcp',
      payload: { code_length: data?.code?.length, whatsapp_sent: send_whatsapp },
    });

    return {
      content: [{
        type: 'text',
        text: `✅ تم توليد الكود: ${data?.code}\n${send_whatsapp ? '📲 تم الإرسال عبر WhatsApp' : ''}`,
      }],
      structuredContent: { code: data?.code, sent_via_whatsapp: send_whatsapp },
    };
  }
);

// ============================================
// 📲 5. qlvn_send_whatsapp — إرسال واتساب
// ============================================
server.registerTool(
  'qlvn_send_whatsapp',
  {
    title: 'Send WhatsApp Message',
    description: 'يرسل رسالة WhatsApp للضيف عبر WhatsApp Cloud API.',
    inputSchema: {
      phone: z.string().describe('رقم الجوال بصيغة دولية مثل 966501234567'),
      message: z.string().describe('نص الرسالة بالعربي'),
      unit_id: z.string().optional().describe('معرّف الوحدة للتسجيل في اللوق'),
    },
    annotations: { destructiveHint: false },
  },
  async ({ phone, message, unit_id }) => {
    const { data, error } = await supabase.functions.invoke('send-whatsapp', {
      body: { phone, message, unit_id },
    });

    if (error) {
      return {
        content: [{ type: 'text', text: `❌ فشل الإرسال: ${error.message}` }],
        isError: true,
      };
    }

    if (unit_id) {
      await supabase.from('activity_logs').insert({
        unit_id,
        event_type: 'whatsapp_sent',
        source: 'mcp',
        payload: { phone, message_preview: message.substring(0, 50) },
      });
    }

    return {
      content: [{ type: 'text', text: `✅ تم إرسال الرسالة لـ ${phone}` }],
      structuredContent: { success: true, phone },
    };
  }
);

// ============================================
// 📊 6. qlvn_get_activity_logs — سجل النشاط
// ============================================
server.registerTool(
  'qlvn_get_activity_logs',
  {
    title: 'Get Activity Logs',
    description: 'عرض سجل نشاط وحدة: فتح الباب، تغيير الكود، أحداث الحساسات، اتصالات Nawaf.',
    inputSchema: {
      unit_id: z.string().describe('معرّف الوحدة'),
      limit: z.number().min(1).max(100).default(20).describe('عدد السجلات'),
      event_type: z.string().optional().describe('فلتر نوع الحدث: unlock | sensor | mode_change | code_change'),
      severity: z.enum(['info', 'warning', 'critical', 'all']).default('all'),
    },
    annotations: { readOnlyHint: true },
  },
  async ({ unit_id, limit, event_type, severity }) => {
    let query = supabase
      .from('activity_logs')
      .select('*')
      .eq('unit_id', unit_id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (event_type) query = query.eq('event_type', event_type);
    if (severity !== 'all') query = query.eq('severity', severity);

    const { data, error } = await query;

    if (error) {
      return {
        content: [{ type: 'text', text: `❌ خطأ: ${error.message}` }],
        isError: true,
      };
    }

    return {
      content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
      structuredContent: { logs: data, total: data?.length || 0 },
    };
  }
);

// ============================================
// 🎛️ 7. qlvn_control_device — التحكم بجهاز
// ============================================
server.registerTool(
  'qlvn_control_device',
  {
    title: 'Control Device',
    description: 'التحكم بجهاز في الشقة: المكيف، الإضاءة، LED. يرسل أمر عبر MQTT للـ Raspberry Pi.',
    inputSchema: {
      unit_id: z.string().describe('معرّف الوحدة'),
      device_type: z.enum(['ac', 'light', 'led_strip']).describe('نوع الجهاز'),
      command: z.record(z.unknown()).describe('الأمر مثل: {power: true, temp: 22} أو {brightness: 50}'),
    },
    annotations: { destructiveHint: false, idempotentHint: true },
  },
  async ({ unit_id, device_type, command }) => {
    // إيجاد الجهاز
    const { data: device, error: deviceError } = await supabase
      .from('devices')
      .select('id, mqtt_topic, status')
      .eq('unit_id', unit_id)
      .eq('type', device_type)
      .single();

    if (deviceError || !device) {
      return {
        content: [{ type: 'text', text: `❌ الجهاز غير موجود: ${device_type} في الوحدة ${unit_id}` }],
        isError: true,
      };
    }

    if (device.status === 'offline') {
      return {
        content: [{ type: 'text', text: `⚠️ الجهاز offline — الأمر سيُحفظ ويُنفَّذ عند الاتصال` }],
      };
    }

    // نشر الأمر عبر Edge Function → MQTT → Pi
    const { error } = await supabase.functions.invoke('mqtt-publish', {
      body: {
        topic: device.mqtt_topic,
        payload: { command: `set_${device_type}`, value: command },
      },
    });

    if (error) {
      return {
        content: [{ type: 'text', text: `❌ فشل إرسال الأمر: ${error.message}` }],
        isError: true,
      };
    }

    // تسجيل الحدث
    await supabase.from('activity_logs').insert({
      unit_id,
      event_type: 'device_control',
      source: 'mcp',
      payload: { device_type, command },
    });

    return {
      content: [{ type: 'text', text: `✅ تم إرسال الأمر لـ ${device_type}: ${JSON.stringify(command)}` }],
      structuredContent: { success: true, device_type, command },
    };
  }
);

// ============================================
// 🎭 8. qlvn_set_scene — تشغيل مشهد
// ============================================
server.registerTool(
  'qlvn_set_scene',
  {
    title: 'Set Scene/Mode',
    description: 'تشغيل مشهد في الشقة: cinema, relax, match, coffee, welcome, energy_save. يغير الإضاءة والمكيف والـ LED معاً.',
    inputSchema: {
      unit_id: z.string().describe('معرّف الوحدة'),
      scene: z.enum(['cinema', 'relax', 'match', 'coffee', 'welcome', 'energy_save']).describe('اسم المشهد'),
      team: z.enum(['hilal', 'nassr', 'ittihad', 'ahli', 'qadisiya']).optional().describe('الفريق (للـ match mode فقط)'),
    },
    annotations: { idempotentHint: true },
  },
  async ({ unit_id, scene, team }) => {
    const { data, error } = await supabase.functions.invoke('mqtt-publish', {
      body: {
        topic: `qlvin/${unit_id}/scene/set`,
        payload: { scene, team: team || null },
      },
    });

    if (error) {
      return {
        content: [{ type: 'text', text: `❌ فشل: ${error.message}` }],
        isError: true,
      };
    }

    await supabase.from('activity_logs').insert({
      unit_id,
      event_type: 'mode_change',
      source: 'mcp',
      payload: { scene, team },
    });

    const sceneNames: Record<string, string> = {
      cinema: 'السينما 🎬',
      relax: 'الاسترخاء 🌙',
      match: `المباراة ⚽ ${team ? `- ${team}` : ''}`,
      coffee: 'القهوة ☕',
      welcome: 'الترحيب 🏠',
      energy_save: 'توفير الطاقة ⚡',
    };

    return {
      content: [{ type: 'text', text: `✅ تم تفعيل وضع ${sceneNames[scene]}` }],
      structuredContent: { scene, team, success: true },
    };
  }
);

// ============================================
// ⚡ 9. qlvn_create_automation — إنشاء automation
// ============================================
server.registerTool(
  'qlvn_create_automation',
  {
    title: 'Create Automation Rule',
    description: 'إنشاء قاعدة أتمتة جديدة: متى تشتغل، ما الشرط، ما الإجراء، وأين تُنفَّذ.',
    inputSchema: {
      unit_id: z.string().describe('معرّف الوحدة'),
      name: z.string().describe('اسم الأتمتة بالعربي مثل: الترحيب الصباحي'),
      icon: z.string().default('⚡').describe('أيقونة'),
      trigger_type: z.enum([
        'time_of_day', 'door_open', 'presence_detected', 'presence_lost',
        'guest_checked_in', 'checkout_time_reached', 'guest_message',
        'match_detected', 'temperature_threshold', 'manual'
      ]),
      trigger_config: z.record(z.unknown()).default({}).describe('إعدادات المشغّل مثل {time: "07:00"}'),
      conditions: z.array(z.record(z.unknown())).default([]).describe('شروط إضافية'),
      actions: z.array(z.record(z.unknown())).describe('الإجراءات مثل [{type: set_ac, value: 22}]'),
      runs_on: z.enum(['tablet', 'mobile_card', 'pi_local', 'cloud', 'multi']).default('pi_local'),
    },
    annotations: { destructiveHint: false },
  },
  async ({ unit_id, name, icon, trigger_type, trigger_config, conditions, actions, runs_on }) => {
    const { data, error } = await supabase
      .from('automation_rules')
      .insert({
        unit_id,
        scope: 'unit',
        name,
        icon,
        trigger_type,
        trigger_config,
        conditions,
        actions,
        runs_on,
        enabled: true,
        locked_by_founder: false,
      })
      .select()
      .single();

    if (error) {
      return {
        content: [{ type: 'text', text: `❌ فشل إنشاء الأتمتة: ${error.message}` }],
        isError: true,
      };
    }

    return {
      content: [{ type: 'text', text: `✅ تم إنشاء الأتمتة: ${name} (ID: ${data.id})` }],
      structuredContent: data,
    };
  }
);

// ============================================
// 📋 10. qlvn_list_automations — عرض automations
// ============================================
server.registerTool(
  'qlvn_list_automations',
  {
    title: 'List Automations',
    description: 'عرض كل قواعد الأتمتة لوحدة أو لكل الوحدات.',
    inputSchema: {
      unit_id: z.string().optional().describe('معرّف الوحدة — فارغ = كل الوحدات'),
      enabled_only: z.boolean().default(false),
    },
    annotations: { readOnlyHint: true },
  },
  async ({ unit_id, enabled_only }) => {
    let query = supabase
      .from('automation_rules')
      .select('*, units(name, qlvn_code)')
      .order('created_at', { ascending: false });

    if (unit_id) query = query.eq('unit_id', unit_id);
    if (enabled_only) query = query.eq('enabled', true);

    const { data, error } = await query;

    if (error) {
      return {
        content: [{ type: 'text', text: `❌ خطأ: ${error.message}` }],
        isError: true,
      };
    }

    return {
      content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
      structuredContent: { automations: data, total: data?.length || 0 },
    };
  }
);

// ============================================
// 📈 11. qlvn_get_unit_stats — إحصائيات
// ============================================
server.registerTool(
  'qlvn_get_unit_stats',
  {
    title: 'Get Unit Statistics',
    description: 'إحصائيات وحدة: نسبة الإشغال، عدد الضيوف، الدخل المقدّر، الأحداث.',
    inputSchema: {
      unit_id: z.string().describe('معرّف الوحدة'),
      days: z.number().min(1).max(90).default(30).describe('عدد الأيام للإحصاء'),
    },
    annotations: { readOnlyHint: true },
  },
  async ({ unit_id, days }) => {
    const since = new Date(Date.now() - days * 86400000).toISOString();

    // جلب الإحصائيات
    const [sessionsRes, logsRes, unitRes] = await Promise.all([
      supabase
        .from('guest_sessions')
        .select('status, checked_in_at, checked_out_at')
        .eq('unit_id', unit_id)
        .gte('created_at', since),
      supabase
        .from('activity_logs')
        .select('event_type')
        .eq('unit_id', unit_id)
        .gte('created_at', since),
      supabase
        .from('units')
        .select('name, qlvn_code, base_price_per_night, operational_status')
        .eq('id', unit_id)
        .single(),
    ]);

    const sessions = sessionsRes.data || [];
    const logs = logsRes.data || [];
    const unit = unitRes.data;

    const completedSessions = sessions.filter(s => s.status === 'completed').length;
    const occupancyRate = Math.round((completedSessions / days) * 100);
    const estimatedRevenue = completedSessions * (unit?.base_price_per_night || 0);

    const stats = {
      unit: unit?.name,
      period_days: days,
      total_sessions: sessions.length,
      completed_sessions: completedSessions,
      occupancy_rate: `${occupancyRate}%`,
      estimated_revenue: `${estimatedRevenue.toLocaleString('ar-SA')} ر.س`,
      total_events: logs.length,
      events_by_type: logs.reduce((acc: Record<string, number>, log: any) => {
        acc[log.event_type] = (acc[log.event_type] || 0) + 1;
        return acc;
      }, {}),
    };

    return {
      content: [{ type: 'text', text: JSON.stringify(stats, null, 2) }],
      structuredContent: stats,
    };
  }
);

// ============================================
// 👑 12. qlvn_onboard_host — إضافة مضيف
// ============================================
server.registerTool(
  'qlvn_onboard_host',
  {
    title: 'Onboard New Host',
    description: 'إضافة مضيف جديد مع شققه وإعداداته — Plug & Play في أقل من دقيقة.',
    inputSchema: {
      name: z.string().describe('اسم المضيف'),
      phone: z.string().describe('رقم الجوال بصيغة دولية'),
      email: z.string().email().optional().describe('الإيميل'),
      units: z.array(z.object({
        name: z.string(),
        neighborhood: z.string().optional(),
        address: z.string().optional(),
      })).min(1).describe('الوحدات الأولية'),
      send_welcome: z.boolean().default(true).describe('إرسال رسالة ترحيب عبر WhatsApp'),
    },
    annotations: { destructiveHint: false },
  },
  async ({ name, phone, email, units, send_welcome }) => {
    const { data, error } = await supabase.functions.invoke('onboard-host', {
      body: { name, phone, email, units, send_welcome },
    });

    if (error) {
      return {
        content: [{ type: 'text', text: `❌ فشل إضافة المضيف: ${error.message}` }],
        isError: true,
      };
    }

    return {
      content: [{
        type: 'text',
        text: `✅ تم إضافة المضيف: ${name}\n` +
              `📱 رابط Dashboard: ${data?.dashboard_url}\n` +
              `🏠 الوحدات: ${units.length}\n` +
              `${send_welcome ? '📲 تم إرسال رسالة ترحيب عبر WhatsApp' : ''}`,
      }],
      structuredContent: data,
    };
  }
);

// ============================================
// 📅 13. qlvn_sync_ical — مزامنة iCal
// ============================================
server.registerTool(
  'qlvn_sync_ical',
  {
    title: 'Sync iCal Bookings',
    description: 'مزامنة حجوزات Airbnb/Gathern لوحدة أو كل الوحدات.',
    inputSchema: {
      unit_id: z.string().optional().describe('معرّف الوحدة — فارغ = كل الوحدات'),
    },
    annotations: { readOnlyHint: false },
  },
  async ({ unit_id }) => {
    const { data, error } = await supabase.functions.invoke('ical-sync', {
      body: { unit_id: unit_id || 'all' },
    });

    if (error) {
      return {
        content: [{ type: 'text', text: `❌ فشل المزامنة: ${error.message}` }],
        isError: true,
      };
    }

    return {
      content: [{
        type: 'text',
        text: `✅ تمت المزامنة\n` +
              `📅 حجوزات جديدة: ${data?.new_bookings || 0}\n` +
              `🎟️ بطاقات ضيف تم توليدها: ${data?.tokens_generated || 0}`,
      }],
      structuredContent: data,
    };
  }
);

// ============================================
// 🚀 تشغيل الـ Server
// ============================================
const transport_mode = process.env.MCP_TRANSPORT || 'stdio';

if (transport_mode === 'http') {
  // HTTP mode — للـ remote access
  const app = express();
  app.use(express.json());

  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });

  app.all('/mcp', async (req, res) => {
    await transport.handleRequest(req, res, req.body);
  });

  await server.connect(transport);

  const PORT = parseInt(process.env.PORT || '3000');
  app.listen(PORT, () => {
    console.log(`🚀 QLVN MCP Server يشتغل على http://localhost:${PORT}/mcp`);
    console.log(`🔧 Tools متاحة: 13 tool`);
  });
} else {
  // stdio mode — للـ local Claude Code
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('🚀 QLVN MCP Server جاهز (stdio mode)');
}
