// apps/founder/src/supabase-client.js
// QLVN OS — Founder Dashboard Supabase Integration
// يُضاف كـ <script type="module"> في نهاية الصفحة
// الاستراتيجية: Supabase auth → PIN → dashboard بيانات حقيقية
// المرجع: CLAUDE_FINAL.md §8 + §9

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL  = 'https://nrekvofyypdifqfghhnh.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yZWt2b2Z5eXBkaWZxZmdoaG5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0OTU2OTQsImV4cCI6MjA5NjA3MTY5NH0.C-KTMzXBntvuOIkiTACZPR1Bv5FTQuw57j5XfNA7LRk';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

let currentUserId   = null;
let isFounderAuthed = false;
let hostsData       = [];

// ─────────────────────────────────────────────
// STEP 1 — Supabase Auth يظهر قبل شاشة الـ PIN
// ─────────────────────────────────────────────
function injectSupabaseAuth() {
  const lockScreen = document.getElementById('lock-screen');
  if (lockScreen) lockScreen.style.display = 'none';

  const overlay = document.createElement('div');
  overlay.id = 'qlvn-supabase-auth';
  overlay.style.cssText = `
    position:fixed;inset:0;background:#030305;z-index:2000;
    display:flex;align-items:center;justify-content:center;
    font-family:'Tajawal',sans-serif;
  `;
  overlay.innerHTML = `
    <div style="width:90%;max-width:320px;text-align:center;">
      <div style="font-size:30px;font-weight:900;letter-spacing:4px;color:#fff;margin-bottom:4px;">
        QLVIN <span style="color:#c5a059;font-size:13px;font-weight:400;">OS</span>
      </div>
      <div style="font-size:9px;color:rgba(255,255,255,0.3);letter-spacing:4px;margin-bottom:36px;">FOUNDER CENTER</div>

      <div id="sb-step1">
        <p style="font-size:12px;color:rgba(255,255,255,0.5);margin-bottom:14px;">ادخل برقم جوالك أو البريد الإلكتروني</p>
        <input id="sb-identity" type="text" placeholder="+966... أو founder@..."
          style="width:100%;padding:13px;background:rgba(255,255,255,0.05);
          border:1px solid rgba(197,160,89,0.25);border-radius:12px;
          color:#fff;font-size:13px;font-family:'Tajawal';
          text-align:center;outline:none;margin-bottom:10px;">
        <button id="sb-send"
          style="width:100%;padding:13px;background:#c5a059;color:#000;border:none;
          border-radius:12px;font-size:13px;font-weight:700;font-family:'Tajawal';cursor:pointer;">
          إرسال الرمز
        </button>
      </div>

      <div id="sb-step2" style="display:none;">
        <p id="sb-hint" style="font-size:11px;color:rgba(255,255,255,0.35);margin-bottom:14px;"></p>
        <input id="sb-otp" type="text" inputmode="numeric" maxlength="6" placeholder="000000"
          style="width:100%;padding:13px;background:rgba(255,255,255,0.05);
          border:1px solid rgba(197,160,89,0.25);border-radius:12px;
          color:#fff;font-size:24px;font-family:'Tajawal';
          letter-spacing:10px;text-align:center;outline:none;margin-bottom:10px;">
        <button id="sb-verify"
          style="width:100%;padding:13px;background:#10b981;color:#fff;border:none;
          border-radius:12px;font-size:13px;font-weight:700;font-family:'Tajawal';cursor:pointer;">
          تأكيد الدخول
        </button>
        <button id="sb-back"
          style="width:100%;padding:8px;background:transparent;color:rgba(255,255,255,0.3);
          border:none;font-size:11px;font-family:'Tajawal';cursor:pointer;margin-top:6px;">
          تغيير
        </button>
      </div>

      <div id="sb-err" style="color:#ff3b30;font-size:11px;margin-top:10px;min-height:16px;"></div>
    </div>
  `;
  document.body.appendChild(overlay);

  let identity = '';

  function setErr(msg) { document.getElementById('sb-err').textContent = msg; }
  function setBtn(id, txt, dis) {
    const b = document.getElementById(id);
    if (b) { b.textContent = txt; b.disabled = dis; }
  }

  document.getElementById('sb-send').addEventListener('click', async () => {
    identity = document.getElementById('sb-identity').value.trim();
    if (!identity) return;
    setErr('');
    setBtn('sb-send', '...', true);

    const isPhone = identity.startsWith('+') || /^\d{9,}$/.test(identity);
    const { error } = isPhone
      ? await supabase.auth.signInWithOtp({ phone: identity })
      : await supabase.auth.signInWithOtp({ email: identity });

    setBtn('sb-send', 'إرسال الرمز', false);
    if (error) { setErr(error.message); return; }

    document.getElementById('sb-step1').style.display = 'none';
    document.getElementById('sb-step2').style.display = 'block';
    document.getElementById('sb-hint').textContent = `تم إرسال الرمز إلى ${identity}`;
    document.getElementById('sb-otp').focus();
  });

  document.getElementById('sb-verify').addEventListener('click', async () => {
    const token = document.getElementById('sb-otp').value.trim();
    if (token.length < 6) return;
    setErr('');
    setBtn('sb-verify', '...', true);

    const isPhone = identity.startsWith('+') || /^\d{9,}$/.test(identity);
    const { error } = await supabase.auth.verifyOtp({
      [isPhone ? 'phone' : 'email']: identity,
      token,
      type: isPhone ? 'sms' : 'email',
    });

    setBtn('sb-verify', 'تأكيد الدخول', false);
    if (error) setErr(error.message);
    // onAuthStateChange يتولى الباقي
  });

  document.getElementById('sb-back').addEventListener('click', () => {
    document.getElementById('sb-step1').style.display = 'block';
    document.getElementById('sb-step2').style.display = 'none';
    setErr('');
  });

  document.getElementById('sb-identity').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('sb-send').click();
  });
  document.getElementById('sb-otp').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('sb-verify').click();
  });
}

function removeSupabaseAuth() {
  const el = document.getElementById('qlvn-supabase-auth');
  if (el) { el.style.transition = 'opacity .35s'; el.style.opacity = '0'; setTimeout(() => el.remove(), 350); }
  const lockScreen = document.getElementById('lock-screen');
  if (lockScreen) lockScreen.style.display = '';
}

// ─────────────────────────────────────────────
// بعد نجاح الـ PIN — حمّل البيانات الحقيقية
// ─────────────────────────────────────────────
function patchPinSystem() {
  const lockScreen = document.getElementById('lock-screen');
  if (!lockScreen) return;

  const observer = new MutationObserver(() => {
    if (lockScreen.style.display === 'none') {
      observer.disconnect();
      loadFounderData();
    }
  });
  observer.observe(lockScreen, { attributes: true, attributeFilter: ['style'] });
}

// ─────────────────────────────────────────────
// تحميل بيانات المؤسس
// ─────────────────────────────────────────────
async function loadFounderData() {
  await Promise.all([renderRealHosts(), loadPlatformLogs()]);
}

async function renderRealHosts() {
  // جدول users حيث role = 'host' — مع وحداتهم وجلساتهم
  const { data, error } = await supabase
    .from('users')
    .select(`
      id, name, phone, email, status, created_at,
      units (
        id, name, location, building, floor,
        status, pi_connected, pi_pairing_code, pi_last_heartbeat,
        price_per_night,
        guest_sessions ( id, guest_name, check_in, check_out, current_mode )
      )
    `)
    .eq('role', 'host')
    .order('created_at', { ascending: false });

  if (error) { console.error('[QLVN Founder] renderRealHosts:', error); return; }

  hostsData = data;
  const tree = document.getElementById('owners-tree');
  if (!tree) return;

  tree.innerHTML = '';

  if (!data.length) {
    tree.innerHTML = `
      <div style="text-align:center;padding:40px 20px;color:rgba(255,255,255,0.3);">
        <div style="font-size:32px;margin-bottom:12px;">🏠</div>
        <div style="font-size:13px;">لا يوجد ملاك بعد — ابدأ بإضافة أول مضيف</div>
      </div>`;
    return;
  }

  data.forEach(host => tree.insertAdjacentHTML('beforeend', buildHostCard(host)));

  const countEl = document.getElementById('owners-count');
  if (countEl) countEl.textContent = `${data.length} ملاك`;
}

function buildHostCard(host) {
  const units  = host.units || [];
  const isActive = host.status !== 'suspended';
  const now = new Date();

  const totalGuests = units.reduce((acc, u) =>
    acc + (u.guest_sessions?.filter(s =>
      new Date(s.check_in) <= now && new Date(s.check_out) >= now
    ).length || 0), 0);

  const pendingCount = units.filter(u => u.status === 'pending_approval').length;
  const avatarLetters = host.name.substring(0, 2);
  const pendingBadge = pendingCount
    ? `<span style="background:rgba(255,159,10,.18);color:#ff9f0a;font-size:9px;padding:2px 7px;border-radius:8px;margin-right:6px;">⏳ ${pendingCount}</span>`
    : '';

  return `
    <div class="owner-card" id="qlvn-host-${host.id}">
      <div class="owner-header" onclick="document.getElementById('qlvn-c-${host.id}').classList.toggle('open');this.parentElement.classList.toggle('open')">
        <div class="owner-info">
          <div class="owner-avatar" style="background:linear-gradient(135deg,var(--sky),var(--accent));">${avatarLetters}</div>
          <div>
            <h3>${host.name} ${pendingBadge}</h3>
            <p>${host.phone || '—'} · ${units.length} وحدة · ${totalGuests} ضيف نشط</p>
          </div>
        </div>
        <div class="owner-actions" onclick="event.stopPropagation()">
          <button class="btn-status ${isActive ? 'btn-active' : 'btn-suspended'}"
            onclick="qlvnToggleHost('${host.id}', ${isActive})">
            ${isActive ? '🟢 نشط' : '🔴 موقوف'}
          </button>
          <span class="chevron">▼</span>
        </div>
      </div>
      <div class="apartments-container">
        <div class="apartments-inner" id="qlvn-c-${host.id}">
          ${units.length === 0
            ? '<div style="padding:16px;color:rgba(255,255,255,.3);font-size:11px;text-align:center;">لا توجد وحدات</div>'
            : units.map(u => buildUnitRow(u)).join('')}
          <button class="add-apt-btn" onclick="qlvnOpenAddUnit('${host.id}','${host.name}')">
            ➕ إضافة شقة لـ ${host.name}
          </button>
        </div>
      </div>
    </div>`;
}

function buildUnitRow(unit) {
  const now = new Date();
  const activeSession = unit.guest_sessions?.find(s =>
    new Date(s.check_in) <= now && new Date(s.check_out) >= now
  );
  const statusMap = {
    approved:         '✓ جاهزة',
    pending_approval: '⏳ بانتظار',
    suspended:        '⛔ موقوفة',
    inactive:         '🔧 معطلة',
  };
  const isPending = unit.status === 'pending_approval';
  const piOnline  = unit.pi_connected === true;

  return `
    <div class="apt-row" id="qlvn-unit-${unit.id}">
      <div class="apt-header-meta">
        <div class="apt-name">🏠 ${unit.name}</div>
        <div class="iot-status">
          <span class="pulse-lamp ${piOnline ? 'lamp-online' : 'lamp-offline'}"></span>
          <span class="txt-lamp ${piOnline ? '' : 'off'}">${piOnline ? 'Pi متصل' : 'Pi مفصول'}</span>
        </div>
      </div>
      <div class="apt-stats">
        <div class="apt-stat-item"><span class="stat-lbl">الكود</span><div class="stat-val" style="font-size:11px">${unit.pi_pairing_code || '—'}</div></div>
        <div class="apt-stat-item"><span class="stat-lbl">الحالة</span><div class="stat-val" style="font-size:11px">${statusMap[unit.status] || unit.status || '—'}</div></div>
        <div class="apt-stat-item"><span class="stat-lbl">الضيف</span><div class="stat-val" style="font-size:11px;color:${activeSession ? 'var(--accent)' : 'inherit'}">${activeSession?.guest_name || '—'}</div></div>
      </div>
      ${isPending
        ? `<div style="display:flex;gap:8px;margin-top:10px;">
            <button class="btn-control" style="flex:1;background:rgba(16,185,129,.15);color:#10b981" onclick="qlvnApproveUnit('${unit.id}')">✓ موافقة</button>
            <button class="btn-control btn-kill" onclick="qlvnRejectUnit('${unit.id}')">✕ رفض</button>
           </div>`
        : `<div class="apt-controls">
            <button class="btn-control btn-ota" onclick="window.toast?.('📡 OTA مجدول')">🔄 OTA</button>
            <button class="btn-control btn-kill" onclick="qlvnKillUnit('${unit.id}','${unit.name}')">⛔ إطفاء</button>
           </div>`}
    </div>`;
}

// ─────────────────────────────────────────────
// Platform Logs — جدول events (يحل محل activity_logs)
// ─────────────────────────────────────────────
async function loadPlatformLogs() {
  const { data } = await supabase
    .from('events')
    .select('event_type, actor_type, actor_id, payload, created_at, units!unit_id(name, host:users!host_id(name))')
    .order('created_at', { ascending: false })
    .limit(25);

  const container = document.getElementById('platform-logs');
  if (!container || !data) return;

  container.innerHTML = '';
  if (!data.length) {
    container.innerHTML = '<div style="padding:16px;color:rgba(255,255,255,.3);font-size:11px;text-align:center;">لا يوجد نشاط</div>';
    return;
  }

  const typeMap = {
    guest_checked_in:  { icon: '✅', type: 'new',  label: 'CHECK-IN' },
    guest_checked_out: { icon: '🚪', type: 'stop', label: 'CHECK-OUT' },
    code_generated:    { icon: '🔐', type: 'ota',  label: 'CODE GEN' },
    unit_created:      { icon: '🆕', type: 'new',  label: 'NEW UNIT' },
    unit_approved:     { icon: '✅', type: 'new',  label: 'APPROVED' },
    whatsapp_sent:     { icon: '📲', type: 'ad',   label: 'WHATSAPP' },
    presence_lost:     { icon: '👻', type: 'stop', label: 'SILENT EXIT' },
  };

  data.forEach(log => {
    const meta = typeMap[log.event_type] || { icon: '●', type: 'sys', label: log.event_type };
    const time = new Date(log.created_at).toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' });
    const item = document.createElement('div');
    item.className = 'log-item';
    item.innerHTML = `
      <div class="log-icon">${meta.icon}</div>
      <div class="log-body">
        <div class="log-event">${log.payload?.message || log.event_type}</div>
        <div class="log-host">${log.units?.host?.name || '—'} · ${log.units?.name || '—'}</div>
        <span class="log-type lt-${meta.type}">${meta.label}</span>
      </div>
      <div class="log-time">${time}</div>`;
    container.appendChild(item);
  });
}

// ─────────────────────────────────────────────
// إجراءات
// ─────────────────────────────────────────────
window.qlvnToggleHost = async function(hostId, isCurrentlyActive) {
  const newStatus = isCurrentlyActive ? 'suspended' : 'active';
  // تحديث users.status (ليس hosts)
  await supabase.from('users').update({ status: newStatus }).eq('id', hostId);
  window.toast?.(isCurrentlyActive ? '⏸ تم إيقاف المضيف' : '✓ تم تفعيل المضيف', isCurrentlyActive ? 'danger' : 'success');
  await renderRealHosts();
};

window.qlvnApproveUnit = async function(unitId) {
  await supabase.from('units').update({ status: 'approved' }).eq('id', unitId);
  // سجّل في events (يحل محل activity_logs)
  await supabase.from('events').insert({
    unit_id: unitId,
    event_type: 'unit_approved',
    actor_type: 'founder',
    actor_id: currentUserId,
    payload: {},
  });
  window.toast?.('✅ تمت الموافقة على الوحدة', 'success');
  await renderRealHosts();
  await loadPlatformLogs();
};

window.qlvnRejectUnit = async function(unitId) {
  if (!confirm('هل تريد رفض هذه الوحدة؟')) return;
  await supabase.from('units').update({ status: 'inactive' }).eq('id', unitId);
  window.toast?.('❌ تم رفض الوحدة', 'danger');
  await renderRealHosts();
};

window.qlvnKillUnit = async function(unitId, name) {
  if (!confirm(`⚠️ تعطيل ${name}؟`)) return;
  await supabase.from('units').update({ status: 'inactive' }).eq('id', unitId);
  window.toast?.(`⛔ تم تعطيل ${name}`, 'danger');
  await renderRealHosts();
};

// Modal إضافة شقة
window.qlvnOpenAddUnit = function(hostId, hostName) {
  const modal = document.createElement('div');
  modal.id = 'qlvn-add-unit-modal';
  modal.style.cssText = `position:fixed;inset:0;background:rgba(0,0,0,.7);
    display:flex;align-items:center;justify-content:center;z-index:3000;font-family:'Tajawal',sans-serif;`;
  modal.innerHTML = `
    <div style="background:#0a0a14;border:1px solid rgba(255,255,255,.08);border-radius:20px;padding:24px;width:90%;max-width:340px;">
      <div style="font-size:14px;font-weight:700;color:#fff;margin-bottom:16px;">➕ شقة جديدة لـ ${hostName}</div>
      <input id="qu-name" type="text" placeholder="اسم الشقة *"
        style="width:100%;padding:12px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);
        border-radius:10px;color:#fff;font-family:'Tajawal';font-size:13px;margin-bottom:8px;">
      <input id="qu-location" type="text" placeholder="الموقع / الحي (اختياري)"
        style="width:100%;padding:12px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);
        border-radius:10px;color:#fff;font-family:'Tajawal';font-size:13px;margin-bottom:8px;">
      <input id="qu-building" type="text" placeholder="المبنى (اختياري)"
        style="width:100%;padding:12px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);
        border-radius:10px;color:#fff;font-family:'Tajawal';font-size:13px;margin-bottom:14px;">
      <div style="display:flex;gap:8px;">
        <button id="qu-save" style="flex:1;padding:12px;background:#10b981;color:#fff;border:none;
          border-radius:10px;font-family:'Tajawal';font-weight:700;cursor:pointer;">حفظ</button>
        <button onclick="document.getElementById('qlvn-add-unit-modal').remove()"
          style="padding:12px 16px;background:rgba(255,255,255,.05);color:rgba(255,255,255,.5);
          border:none;border-radius:10px;font-family:'Tajawal';cursor:pointer;">إلغاء</button>
      </div>
      <div id="qu-err" style="color:#ff3b30;font-size:11px;margin-top:8px;"></div>
    </div>`;
  document.body.appendChild(modal);

  document.getElementById('qu-save').addEventListener('click', async () => {
    const name     = document.getElementById('qu-name').value.trim();
    const location = document.getElementById('qu-location').value.trim();
    const building = document.getElementById('qu-building').value.trim();
    if (!name) { document.getElementById('qu-err').textContent = 'أدخل اسم الشقة'; return; }

    const { data: unit, error } = await supabase.from('units').insert({
      host_id: hostId,
      name,
      location: location || null,
      building: building || null,
      status: 'pending_approval',
    }).select().single();

    if (error) { document.getElementById('qu-err').textContent = error.message; return; }

    await supabase.from('events').insert({
      unit_id: unit.id,
      event_type: 'unit_created',
      actor_type: 'founder',
      actor_id: currentUserId,
      payload: { unit_name: name },
    });

    modal.remove();
    window.toast?.(`✅ تم إضافة ${name} · بانتظار الموافقة`, 'success');
    await renderRealHosts();
    await loadPlatformLogs();
  });
};

// ─────────────────────────────────────────────
// Override submitNewClient (modal إضافة مالك)
// ─────────────────────────────────────────────
window.submitNewClient = async function(e) {
  e.preventDefault();

  const name     = document.getElementById('host_name')?.value?.trim();
  const phone    = document.getElementById('host_phone')?.value?.trim();
  const email    = document.getElementById('host_email')?.value?.trim();
  const area     = document.getElementById('host_area')?.value?.trim();
  const unitName = document.getElementById('unit_name')?.value?.trim();
  const airbnbUrl  = document.getElementById('airbnb_ical')?.value?.trim();
  const gathernUrl = document.getElementById('gathern_ical')?.value?.trim();

  if (!name || !phone) { window.toast?.('❌ الاسم والجوال إلزاميان', 'danger'); return; }

  const btn = document.getElementById('submitBtn');
  if (btn) { btn.textContent = 'جاري الإضافة...'; btn.disabled = true; }

  try {
    const { data, error } = await supabase.functions.invoke('onboard-host', {
      body: {
        name, phone,
        email: email || null,
        units: [{ name: unitName || `شقة ${name}`, location: area || null }],
        send_welcome: true,
      },
    });

    if (error) throw new Error(error.message || JSON.stringify(error));

    // تحديث iCal مباشرة على جدول units (يحل محل ical_feeds)
    const firstUnitId = data?.units_created?.[0]?.id;
    if (firstUnitId && (airbnbUrl || gathernUrl)) {
      await supabase.from('units').update({
        ical_airbnb:  airbnbUrl  || null,
        ical_booking: gathernUrl || null,
      }).eq('id', firstUnitId);
    }

    window.closeAddClient?.();
    document.getElementById('addClientForm')?.reset();
    window.toast?.(`✅ تم إضافة ${name} + إرسال ترحيب واتساب`, 'success');
    await renderRealHosts();
    await loadPlatformLogs();

  } catch (err) {
    console.error('[QLVN Founder] submitNewClient:', err);
    window.toast?.(`❌ فشل: ${err.message}`, 'danger');
  } finally {
    if (btn) { btn.textContent = '✓ إضافة وإرسال الترحيب'; btn.disabled = false; }
  }
};

// ─────────────────────────────────────────────
// Realtime — يراقب users وunits وevents
// ─────────────────────────────────────────────
function subscribeRealtime() {
  supabase.channel('founder-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'units' }, () => renderRealHosts())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => renderRealHosts())
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'events' }, () => loadPlatformLogs())
    .subscribe();
}

// ─────────────────────────────────────────────
// Init
// ─────────────────────────────────────────────
async function init() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) { injectSupabaseAuth(); return; }
  await handleSession(session);

  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session) { removeSupabaseAuth(); await handleSession(session); }
    else if (event === 'SIGNED_OUT')      { location.reload(); }
  });
}

async function handleSession(session) {
  const { data: user } = await supabase
    .from('users').select('id, role').eq('auth_id', session.user.id).single();

  if (!user || user.role !== 'founder') {
    document.body.innerHTML = `
      <div style="position:fixed;inset:0;background:#030305;display:flex;align-items:center;justify-content:center;font-family:'Tajawal',sans-serif;">
        <div style="text-align:center;color:#fff;">
          <div style="font-size:40px;margin-bottom:12px;">🚫</div>
          <div>غير مصرّح — المؤسسون فقط</div>
        </div>
      </div>`;
    return;
  }

  currentUserId   = user.id;
  isFounderAuthed = true;
  removeSupabaseAuth();
  patchPinSystem();

  // إذا كان الـ dashboard مرئياً مسبقاً (بدون PIN)
  const dash = document.getElementById('dashboard');
  if (dash && getComputedStyle(dash).display !== 'none') await loadFounderData();

  subscribeRealtime();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
