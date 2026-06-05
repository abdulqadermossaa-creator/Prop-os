// apps/guest-card/src/token-handler.js
// يستخرج الـ token من الـ URL، يتحقق منه، ويُحدّث بيانات الصفحة
// المرجع: CLAUDE_FINAL.md §5 + §9

const SUPABASE_URL    = 'https://nrekvofyypdifqfghhnh.supabase.co';
const VALIDATE_ENDPOINT = `${SUPABASE_URL}/functions/v1/guest-token-validate`;
const HEARTBEAT_ENDPOINT = `${SUPABASE_URL}/functions/v1/heartbeat`;
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yZWt2b2Z5eXBkaWZxZmdoaG5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0OTU2OTQsImV4cCI6MjA5NjA3MTY5NH0.C-KTMzXBntvuOIkiTACZPR1Bv5FTQuw57j5XfNA7LRk';

let guestData    = null;
let sessionToken = null;
let heartbeatTimer = null;

// ─────────────────────────────────────────────
// استخراج الـ token من URL
// ─────────────────────────────────────────────
function extractToken() {
  const params = new URLSearchParams(window.location.search);
  return params.get('token') || params.get('t');
}

// ─────────────────────────────────────────────
// التحقق من الـ token عبر Edge Function
// ─────────────────────────────────────────────
async function validateToken(token) {
  try {
    const res = await fetch(VALIDATE_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON}`,
        'apikey': SUPABASE_ANON,
      },
      body: JSON.stringify({ token }),
    });

    if (!res.ok) {
      const err = await res.json();
      return { valid: false, error: err.error || 'unknown' };
    }

    return await res.json();
  } catch (_err) {
    return { valid: false, error: 'network_error' };
  }
}

// ─────────────────────────────────────────────
// Heartbeat — كل 30 ثانية
// ─────────────────────────────────────────────
function startHeartbeat(token) {
  async function ping() {
    try {
      const res = await fetch(HEARTBEAT_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON}`,
          'apikey': SUPABASE_ANON,
        },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (data.expired) handleExpiredSession();
    } catch (_err) { /* صامت — الشبكة ممكن تنقطع */ }
  }

  heartbeatTimer = setInterval(ping, 30000);
}

function stopHeartbeat() {
  if (heartbeatTimer) { clearInterval(heartbeatTimer); heartbeatTimer = null; }
}

// ─────────────────────────────────────────────
// تطبيق بيانات الضيف على DOM الصفحة
// ─────────────────────────────────────────────
function applyGuestData(data) {
  guestData = data;
  const { guest, unit, expires_at } = data;

  // — الاسم —
  setTextIfExists('.guest-name',    guest.name);
  setTextIfExists('.hero-name',     guest.name);
  setTextIfExists('[data-guest-name]', guest.name);

  // — اسم الوحدة —
  setTextIfExists('.unit-name',     unit.name);
  setTextIfExists('.property-name', unit.name);
  setTextIfExists('[data-unit-name]', unit.name);

  // — الحي —
  setTextIfExists('.unit-neighborhood', unit.neighborhood || '');

  // — كلمة سر الـ WiFi —
  setTextIfExists('.wifi-password',  unit.wifi_password || '—');
  setTextIfExists('[data-wifi-pass]', unit.wifi_password || '—');

  // — وقت الخروج —
  if (expires_at) {
    const checkoutStr = new Date(expires_at).toLocaleString('ar-SA', {
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });
    setTextIfExists('.checkout-time',     checkoutStr);
    setTextIfExists('[data-checkout-time]', checkoutStr);
    updateCountdown(expires_at);
  }

  // — رقم المضيف —
  setTextIfExists('.host-phone', unit.host_phone || '');

  // — درجة الحرارة —
  if (unit.current_temp) {
    setTextIfExists('.current-temp', `${unit.current_temp}°`);
  }

  // إخفاء شاشة التحميل
  hideLoadingScreen();

  // تفعيل أزرار الإضافات الحقيقية
  wireupButtons(data);
}

function setTextIfExists(selector, value) {
  document.querySelectorAll(selector).forEach(el => {
    if (value) el.textContent = value;
  });
}

// ─────────────────────────────────────────────
// Countdown للوقت المتبقي
// ─────────────────────────────────────────────
function updateCountdown(expiresAt) {
  function tick() {
    const ms = new Date(expiresAt) - Date.now();
    if (ms <= 0) { handleExpiredSession(); return; }

    const hrs  = Math.floor(ms / 3600000);
    const mins = Math.floor((ms % 3600000) / 60000);
    const str  = `${hrs} س ${mins} د`;

    setTextIfExists('.time-remaining',     str);
    setTextIfExists('[data-time-remaining]', str);

    // ring progress (0-1)
    const totalMs = new Date(guestData.expires_at) - Date.now() + ms;
    // نعتمد على أقصى إقامة 30 يوم كـ reference
    const progress = Math.min(1, ms / (30 * 24 * 3600000));
    const ring = document.querySelector('.time-ring, [data-time-ring]');
    if (ring) {
      const r = ring.r?.baseVal?.value || 45;
      const circ = 2 * Math.PI * r;
      ring.style.strokeDasharray = `${circ}`;
      ring.style.strokeDashoffset = `${circ * (1 - progress)}`;
    }
  }

  tick();
  setInterval(tick, 60000);
}

// ─────────────────────────────────────────────
// ربط الأزرار بالعمليات الحقيقية
// ─────────────────────────────────────────────
function wireupButtons(data) {
  // زر الواتساب — التواصل مع المضيف
  document.querySelectorAll('.btn-whatsapp, [data-action="contact-host"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const phone = data.unit.host_phone?.replace(/\D/g, '') || '';
      if (phone) window.open(`https://wa.me/${phone}`, '_blank');
    });
  });

  // زر نسخ الـ WiFi
  document.querySelectorAll('.btn-copy-wifi, [data-action="copy-wifi"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const pass = data.unit.wifi_password || '';
      if (pass && navigator.clipboard) {
        navigator.clipboard.writeText(pass);
        showToast('✅ تم نسخ كلمة سر الـ WiFi');
      }
    });
  });
}

// ─────────────────────────────────────────────
// شاشة الخطأ / الانتهاء
// ─────────────────────────────────────────────
function showErrorScreen(errorCode) {
  const msgs = {
    token_not_found: 'الرابط غير صحيح أو منتهي الصلاحية',
    token_expired:   'انتهت مدة إقامتك — شكراً على زيارتك! 🌟',
    invalid_token_format: 'رابط غير صالح',
    network_error:   'تعذّر الاتصال — تحقق من الإنترنت',
  };

  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position:fixed;inset:0;background:#000;
    display:flex;flex-direction:column;align-items:center;justify-content:center;
    z-index:9999;font-family:'Inter','Tajawal',sans-serif;color:#fff;text-align:center;padding:24px;
  `;
  overlay.innerHTML = `
    <div style="font-size:48px;margin-bottom:16px;">
      ${errorCode === 'token_expired' ? '🌙' : '🔒'}
    </div>
    <div style="font-size:18px;font-weight:600;margin-bottom:8px;">
      ${errorCode === 'token_expired' ? 'شكراً لاختيارك QLVIN' : 'غير مصرّح'}
    </div>
    <div style="font-size:13px;color:rgba(255,255,255,0.5);">
      ${msgs[errorCode] || errorCode}
    </div>
  `;
  document.body.appendChild(overlay);
}

function handleExpiredSession() {
  stopHeartbeat();
  showErrorScreen('token_expired');
}

function hideLoadingScreen() {
  // يخفي أي overlay تحميل موجود في الصفحة
  document.querySelectorAll('#loading, .loading-screen, #splash').forEach(el => {
    el.style.opacity = '0';
    setTimeout(() => (el.style.display = 'none'), 600);
  });
}

function showToast(msg) {
  if (typeof window.showNotif === 'function') {
    window.showNotif('✅', msg);
  } else {
    const t = document.getElementById('toast');
    if (t) { t.textContent = msg; t.className = 'toast show success'; setTimeout(() => t.classList.remove('show'), 2500); }
  }
}

// ─────────────────────────────────────────────
// Init
// ─────────────────────────────────────────────
async function init() {
  const token = extractToken();

  if (!token) {
    showErrorScreen('invalid_token_format');
    return;
  }

  sessionToken = token;

  const result = await validateToken(token);

  if (!result.valid) {
    showErrorScreen(result.error);
    return;
  }

  applyGuestData(result);
  startHeartbeat(token);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
