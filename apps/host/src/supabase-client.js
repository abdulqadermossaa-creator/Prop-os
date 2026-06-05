// apps/host/src/supabase-client.js
// Supabase integration layer for host_v6.html
// يُحقن في نهاية الصفحة — يستبدل البيانات الوهمية ببيانات حقيقية
// المرجع: CLAUDE_FINAL.md §8 + §9

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ─────────────────────────────────────────────
// الإعداد
// ─────────────────────────────────────────────
const SUPABASE_URL  = 'https://nrekvofyypdifqfghhnh.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yZWt2b2Z5eXBkaWZxZmdoaG5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0OTU2OTQsImV4cCI6MjA5NjA3MTY5NH0.C-KTMzXBntvuOIkiTACZPR1Bv5FTQuw57j5XfNA7LRk';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

// ─────────────────────────────────────────────
// STATE
// ─────────────────────────────────────────────
let currentHostId   = null;
let currentUserId   = null;
let realtimeChannel = null;

// ─────────────────────────────────────────────
// AUTH — شاشة الدخول عبر OTP
// ─────────────────────────────────────────────
function injectAuthScreen() {
  const overlay = document.createElement('div');
  overlay.id = 'qlvn-auth-overlay';
  overlay.style.cssText = `
    position:fixed;inset:0;background:#030305;
    display:flex;flex-direction:column;align-items:center;
    justify-content:center;z-index:9999;
    font-family:'Tajawal',sans-serif;color:#fff;
  `;
  overlay.innerHTML = `
    <div style="max-width:340px;width:90%;text-align:center;">
      <div style="font-size:28px;font-weight:900;letter-spacing:3px;margin-bottom:6px;">
        QLVIN <span style="color:#64d2ff;font-size:14px;font-weight:400;">OS</span>
      </div>
      <div style="font-size:10px;color:rgba(255,255,255,0.4);letter-spacing:3px;margin-bottom:40px;">
        HOST COMMAND CENTER
      </div>

      <div id="qlvn-auth-step1">
        <div style="font-size:13px;color:rgba(255,255,255,0.6);margin-bottom:16px;">أدخل رقم جوالك</div>
        <input id="qlvn-phone" type="tel" placeholder="+966501234567"
          style="width:100%;padding:14px;background:rgba(255,255,255,0.05);
          border:1px solid rgba(255,255,255,0.1);border-radius:12px;
          color:#fff;font-family:'Tajawal';font-size:14px;
          text-align:center;outline:none;margin-bottom:12px;">
        <button id="qlvn-send-otp"
          style="width:100%;padding:14px;background:#64d2ff;color:#000;
          border:none;border-radius:12px;font-family:'Tajawal';
          font-size:14px;font-weight:700;cursor:pointer;">
          إرسال الرمز
        </button>
      </div>

      <div id="qlvn-auth-step2" style="display:none;">
        <div style="font-size:13px;color:rgba(255,255,255,0.6);margin-bottom:6px;">أدخل الرمز المرسل</div>
        <div style="font-size:11px;color:rgba(255,255,255,0.35);margin-bottom:16px;" id="qlvn-otp-hint"></div>
        <input id="qlvn-otp" type="text" inputmode="numeric" maxlength="6" placeholder="٠٠٠٠٠٠"
          style="width:100%;padding:14px;background:rgba(255,255,255,0.05);
          border:1px solid rgba(255,255,255,0.1);border-radius:12px;
          color:#fff;font-family:'Tajawal';font-size:22px;
          text-align:center;letter-spacing:8px;outline:none;margin-bottom:12px;">
        <button id="qlvn-verify-otp"
          style="width:100%;padding:14px;background:#10b981;color:#fff;
          border:none;border-radius:12px;font-family:'Tajawal';
          font-size:14px;font-weight:700;cursor:pointer;">
          تأكيد الدخول
        </button>
        <button id="qlvn-back-phone"
          style="width:100%;padding:10px;background:transparent;
          color:rgba(255,255,255,0.4);border:none;font-family:'Tajawal';
          font-size:12px;cursor:pointer;margin-top:8px;">
          تغيير الرقم
        </button>
      </div>

      <div id="qlvn-auth-error" style="color:#ff3b30;font-size:12px;margin-top:12px;"></div>
    </div>
  `;
  document.body.appendChild(overlay);

  let phoneValue = '';

  document.getElementById('qlvn-send-otp').addEventListener('click', async () => {
    phoneValue = document.getElementById('qlvn-phone').value.trim();
    if (!phoneValue) return showAuthError('أدخل رقم الجوال');
    setAuthError('');

    const btn = document.getElementById('qlvn-send-otp');
    btn.textContent = 'جاري الإرسال...';
    btn.disabled = true;

    const { error } = await supabase.auth.signInWithOtp({ phone: phoneValue });
    btn.textContent = 'إرسال الرمز';
    btn.disabled = false;

    if (error) return showAuthError(error.message);

    document.getElementById('qlvn-auth-step1').style.display = 'none';
    document.getElementById('qlvn-auth-step2').style.display = 'block';
    document.getElementById('qlvn-otp-hint').textContent = `تم إرسال الرمز إلى ${phoneValue}`;
  });

  document.getElementById('qlvn-verify-otp').addEventListener('click', async () => {
    const token = document.getElementById('qlvn-otp').value.trim();
    if (token.length < 6) return showAuthError('الرمز يجب أن يكون 6 أرقام');
    setAuthError('');

    const btn = document.getElementById('qlvn-verify-otp');
    btn.textContent = 'جاري التحقق...';
    btn.disabled = true;

    const { error } = await supabase.auth.verifyOtp({
      phone: phoneValue,
      token,
      type: 'sms',
    });

    btn.textContent = 'تأكيد الدخول';
    btn.disabled = false;

    if (error) return showAuthError(error.message);
    // supabase.auth.onAuthStateChange will handle the rest
  });

  document.getElementById('qlvn-back-phone').addEventListener('click', () => {
    document.getElementById('qlvn-auth-step1').style.display = 'block';
    document.getElementById('qlvn-auth-step2').style.display = 'none';
    setAuthError('');
  });

  function showAuthError(msg) { document.getElementById('qlvn-auth-error').textContent = msg; }
  function setAuthError(msg)   { document.getElementById('qlvn-auth-error').textContent = msg; }
}

function removeAuthScreen() {
  const el = document.getElementById('qlvn-auth-overlay');
  if (el) { el.style.opacity = '0'; setTimeout(() => el.remove(), 400); }
}

// ─────────────────────────────────────────────
// تحميل بيانات المضيف
// ─────────────────────────────────────────────
async function loadHostData(userId) {
  const { data: host } = await supabase
    .from('hosts')
    .select('id, name')
    .eq('user_id', userId)
    .single();

  if (!host) return console.error('QLVN: host record not found for user', userId);
  currentHostId = host.id;

  await Promise.all([loadUnits(), loadActivityLogs(), loadNotifications()]);
  subscribeRealtime();
}

// ─────────────────────────────────────────────
// تحميل الوحدات من Supabase
// ─────────────────────────────────────────────
async function loadUnits() {
  const { data: dbUnits, error } = await supabase
    .from('units')
    .select(`
      id, name, qlvn_code, operational_status, pi_status,
      base_price_per_night, wifi_name, wifi_password,
      guest_sessions (
        id, guest_name, guest_phone, access_code,
        status, checked_in_at, token_expires_at
      )
    `)
    .eq('host_id', currentHostId)
    .order('name');

  if (error) return console.error('QLVN: loadUnits error', error);

  // تحويل للصيغة التي يفهمها host_v6.html
  units = dbUnits.map(u => {
    const activeSession = u.guest_sessions?.find(s => s.status === 'active');
    const income = u.base_price_per_night
      ? `${(u.base_price_per_night).toLocaleString('ar-SA')}`
      : '—';

    let timeRemaining = '—';
    if (activeSession?.token_expires_at) {
      const ms = new Date(activeSession.token_expires_at) - Date.now();
      if (ms > 0) {
        const hrs = Math.floor(ms / 3600000);
        timeRemaining = hrs > 0 ? `${hrs} ساعة` : 'أقل من ساعة';
      }
    }

    return {
      _db_id:    u.id,             // UUID الحقيقي
      id:        u.id,             // host_v6 uses this for openDetail
      name:      u.name,
      shortName: u.name.replace(/شقة |apartment /gi, '').trim(),
      icon:      '🏠',
      guest:     activeSession?.guest_name || '—',
      phone:     activeSession?.guest_phone || '',
      income,
      time:      timeRemaining,
      status:    mapStatus(u.operational_status),
      pi:        u.pi_status === 'online' ? 'online' : 'offline',
      code:      activeSession?.access_code || '——',
      booking:   activeSession ? `جلسة نشطة` : 'لا يوجد',
      source:    'QLVIN',
      alert:     null,
      _session_id: activeSession?.id || null,
      _unit_id:    u.id,
    };
  });

  // ملء select الوحدات في modal الـ checkin
  const select = document.getElementById('ci-unit');
  if (select) {
    select.innerHTML = units
      .map(u => `<option value="${u._unit_id}">${u.name}</option>`)
      .join('');
  }

  renderUnits();
}

function mapStatus(opStatus) {
  const map = { available: 'empty', occupied: 'active', cleaning: 'clean', maintenance: 'clean' };
  return map[opStatus] || 'empty';
}

// ─────────────────────────────────────────────
// تحميل سجل النشاط
// ─────────────────────────────────────────────
async function loadActivityLogs() {
  const { data, error } = await supabase
    .from('activity_logs')
    .select('event_type, source, severity, payload, created_at, unit_id, units(name)')
    .in('unit_id', units.map(u => u._unit_id))
    .order('created_at', { ascending: false })
    .limit(30);

  if (error) return console.error('QLVN: loadActivityLogs error', error);

  globalLogs.length = 0;
  data.forEach(log => {
    globalLogs.push(mapLog(log));
  });

  const logsEl = document.getElementById('logs-list');
  if (logsEl) renderLogs(logsEl, globalLogs);
}

function mapLog(log) {
  const typeMap = {
    guest_checked_in:  { icon: '✅', typeLabel: 'CHECK-IN',     type: 'checkin' },
    guest_checked_out: { icon: '🚪', typeLabel: 'CHECK-OUT',    type: 'checkout' },
    code_generated:    { icon: '🔐', typeLabel: 'CODE CHANGE',  type: 'sys' },
    door_unlocked:     { icon: '🔑', typeLabel: 'ACCESS',       type: 'nfc' },
    presence_lost:     { icon: '👻', typeLabel: 'SILENT EXIT',  type: 'warn' },
    pi_offline:        { icon: '📡', typeLabel: 'PI OFFLINE',   type: 'danger' },
    whatsapp_sent:     { icon: '📲', typeLabel: 'WHATSAPP',     type: 'sys' },
    mode_change:       { icon: '🎭', typeLabel: 'MODE CHANGE',  type: 'sys' },
  };
  const meta = typeMap[log.event_type] || { icon: '●', typeLabel: log.event_type, type: 'sys' };
  const timeStr = new Date(log.created_at).toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' });

  return {
    icon:      meta.icon,
    event:     log.payload?.message || log.event_type,
    unit:      log.units?.name || '',
    time:      timeStr,
    type:      meta.type,
    typeLabel: meta.typeLabel,
  };
}

// ─────────────────────────────────────────────
// تحميل الإشعارات
// ─────────────────────────────────────────────
async function loadNotifications() {
  const { data } = await supabase
    .from('notifications')
    .select('*')
    .eq('recipient_id', currentUserId)
    .is('read_at', null)
    .order('created_at', { ascending: false })
    .limit(20);

  if (!data?.length) return;

  notifications.length = 0;
  data.forEach(n => {
    notifications.push({
      type:  n.type === 'critical' ? 'danger' : 'warn',
      icon:  n.payload?.icon || '🔔',
      title: n.title,
      desc:  n.body || '',
      time:  new Date(n.created_at).toLocaleString('ar-SA', { timeStyle: 'short', dateStyle: 'short' }),
      action: () => {},
    });
  });

  const count = document.getElementById('notif-count');
  if (count) count.textContent = notifications.length;
}

// ─────────────────────────────────────────────
// Realtime Subscriptions
// ─────────────────────────────────────────────
function subscribeRealtime() {
  if (realtimeChannel) supabase.removeChannel(realtimeChannel);

  realtimeChannel = supabase
    .channel('host-dashboard')
    .on('postgres_changes', {
      event: '*', schema: 'public', table: 'units',
      filter: `host_id=eq.${currentHostId}`,
    }, () => loadUnits())
    .on('postgres_changes', {
      event: 'INSERT', schema: 'public', table: 'activity_logs',
    }, (payload) => {
      const log = mapLog(payload.new);
      globalLogs.unshift(log);
      if (globalLogs.length > 50) globalLogs.pop();
      const el = document.getElementById('logs-list');
      if (el) renderLogs(el, globalLogs);
    })
    .on('postgres_changes', {
      event: '*', schema: 'public', table: 'guest_sessions',
    }, () => loadUnits())
    .subscribe();
}

// ─────────────────────────────────────────────
// تسجيل دخول ضيف حقيقي (override للـ confirmCheckin الوهمية)
// ─────────────────────────────────────────────
const _originalConfirmCheckin = window.confirmCheckin;
window.confirmCheckin = async function () {
  const name    = document.getElementById('ci-name').value.trim();
  const phone   = document.getElementById('ci-phone').value.trim();
  const unitSel = document.getElementById('ci-unit');
  const unit_id = unitSel?.value;
  const durSel  = document.getElementById('ci-duration');
  const price   = parseFloat(document.getElementById('ci-price').value || '0');

  if (!name || !phone || !unit_id) {
    window.toast('❌ أدخل الاسم والجوال واختر الوحدة', 'danger');
    return;
  }

  // احسب وقت الخروج من مدة الإقامة
  const durMap = { '1d': 1, '2d': 2, '3d': 3, '7d': 7, '14d': 14, '30d': 30 };
  const durDays = durMap[durSel?.value] || 1;
  const checkoutAt = new Date(Date.now() + durDays * 86400000).toISOString();

  try {
    // 1. إنشاء booking
    const { data: booking, error: bErr } = await supabase
      .from('bookings')
      .insert({
        unit_id,
        source:       'manual',
        guest_name:   name,
        guest_phone:  phone,
        checkin_at:   new Date().toISOString(),
        checkout_at:  checkoutAt,
        nights:       durDays,
        total_price:  price,
      })
      .select()
      .single();

    if (bErr) throw bErr;

    // 2. إنشاء guest_session
    const { data: session, error: sErr } = await supabase
      .from('guest_sessions')
      .insert({
        booking_id:      booking.id,
        unit_id,
        guest_name:      name,
        guest_phone:     phone,
        token_expires_at: checkoutAt,
        status:          'pending',
      })
      .select()
      .single();

    if (sErr) throw sErr;

    // 3. توليد كود الدخول عبر Edge Function
    const { data: codeData, error: cErr } = await supabase.functions.invoke('generate-code', {
      body: { unit_id, guest_session_id: session.id, send_whatsapp: true },
    });

    if (cErr) throw cErr;

    // 4. تحديث حالة الوحدة
    await supabase
      .from('units')
      .update({ operational_status: 'occupied' })
      .eq('id', unit_id);

    window.toast(`✅ تم تسجيل دخول ${name} · الكود: ${codeData.code}`, 'success');
    closeModals();
    await loadUnits();
    await loadActivityLogs();
  } catch (err) {
    console.error('QLVN: confirmCheckin error', err);
    window.toast(`❌ فشل تسجيل الدخول: ${err.message}`, 'danger');
  }
};

// ─────────────────────────────────────────────
// تسجيل خروج ضيف (override)
// ─────────────────────────────────────────────
const _originalConfirmCheckout = window.confirmCheckout;
window.confirmCheckout = async function () {
  const unit = window.currentProp;
  if (!unit?._session_id) return;

  try {
    await supabase
      .from('guest_sessions')
      .update({ status: 'completed', checked_out_at: new Date().toISOString() })
      .eq('id', unit._session_id);

    await supabase
      .from('units')
      .update({ operational_status: 'cleaning' })
      .eq('id', unit._unit_id);

    await supabase.from('activity_logs').insert({
      unit_id:          unit._unit_id,
      guest_session_id: unit._session_id,
      event_type:       'guest_checked_out',
      source:           'host',
      payload:          { guest_name: unit.guest },
    });

    window.toast(`🚪 تم تسجيل خروج ${unit.guest}`, 'success');
    closeModals();
    window.goBack?.();
    await loadUnits();
    await loadActivityLogs();
  } catch (err) {
    window.toast(`❌ فشل: ${err.message}`, 'danger');
  }
};

// ─────────────────────────────────────────────
// Init — نقطة الدخول
// ─────────────────────────────────────────────
async function init() {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    injectAuthScreen();
  } else {
    await handleSession(session);
  }

  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session) {
      removeAuthScreen();
      await handleSession(session);
    } else if (event === 'SIGNED_OUT') {
      injectAuthScreen();
    }
  });
}

async function handleSession(session) {
  const { data: user } = await supabase
    .from('users')
    .select('id, role')
    .eq('auth_id', session.user.id)
    .single();

  if (!user) {
    console.error('QLVN: user record not found in DB');
    injectAuthScreen();
    return;
  }

  currentUserId = user.id;
  await loadHostData(user.id);
}

// تشغيل بعد تحميل الصفحة
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
