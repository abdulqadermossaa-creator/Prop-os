/**
 * apps/guest-card-luxury/src/token-handler.js
 * ربط بطاقة الضيف الفاخرة (QDR Luxury) بـ Supabase
 * يُحقن في guest-card-luxury.html عبر: <script type="module" src="...">
 * لا يُعدّل HTML — يُكمّل فقط
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ─── الإعدادات الأساسية ───────────────────────────────────────────────────────
const SUPABASE_URL  = 'https://nrekvofyypdifqfghhnh.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yZWt2b2Z5eXBkaWZxZmdoaG5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0OTU2OTQsImV4cCI6MjA5NjA3MTY5NH0.C-KTMzXBntvuOIkiTACZPR1Bv5FTQuw57j5XfNA7LRk';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

// ─── الحالة المحلية ──────────────────────────────────────────────────────────
let guestToken     = null;   // token من URL
let sessionId      = null;   // session_id من validate
let unitId         = null;   // unit_id للجلسة
let checkoutTime   = null;   // Date object لوقت المغادرة
let totalMinutes   = 0;      // إجمالي مدة الإقامة بالدقائق
let heartbeatTimer = null;   // مؤقت heartbeat
let expired        = false;  // هل انتهت الجلسة؟

// ─── استخراج التوكن من URL ───────────────────────────────────────────────────

function extractToken() {
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get('token') || null;
  } catch (_) {
    return null;
  }
}

// ─── دوال مساعدة ─────────────────────────────────────────────────────────────

/** عرض toast بدون كسر الـ toast الموجود في HTML */
function showToast(ico, msg) {
  try {
    if (typeof window.toast === 'function') {
      window.toast(ico, msg);
    }
  } catch (_) {}
}

/** حساب الدقائق المتبقية حتى وقت المغادرة */
function calcRemainingMinutes(expiresAt) {
  try {
    const diff = new Date(expiresAt).getTime() - Date.now();
    return Math.max(0, Math.floor(diff / 60000));
  } catch (_) {
    return 0;
  }
}

/** تحويل ISO إلى نص ساعة:دقيقة */
function toTimeStr(isoStr) {
  try {
    const d = new Date(isoStr);
    return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  } catch (_) {
    return '—';
  }
}

// ─── التحقق من التوكن ────────────────────────────────────────────────────────

async function validateToken(token) {
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/guest-token-validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { valid: false, error: err.error || `HTTP ${res.status}` };
    }

    return await res.json();

  } catch (err) {
    console.warn('[GuestLux] فشل التحقق من التوكن:', err.message);
    return { valid: false, error: 'network_error' };
  }
}

// ─── تحديث واجهة المستخدم بالبيانات الحقيقية ──────────────────────────────

function applySessionToUI(sessionData) {
  try {
    const guestName = sessionData.guest?.name || 'ضيفنا الكريم';
    const unitName  = sessionData.unit?.name  || 'الوحدة';
    const expiresAt = sessionData.expires_at;

    // اسم الضيف في شاشة الترحيب
    const wlcNameEl = document.getElementById('wlc-name');
    if (wlcNameEl) wlcNameEl.textContent = guestName;

    // اسم الوحدة في الـ topbar
    const unitNameEl = document.getElementById('unit-name');
    if (unitNameEl) {
      unitNameEl.innerHTML = `${unitName} <span class="sep">·</span> ${sessionData.unit?.code || ''}`;
    }

    // اسم الضيف في قسم المعلومات
    const infoGuestEl = document.getElementById('info-guest');
    if (infoGuestEl) infoGuestEl.textContent = guestName;

    // رقم الحجز / session_id
    const infoBookingEl = document.getElementById('info-booking');
    if (infoBookingEl) infoBookingEl.textContent = `جلسة #${sessionData.session_id?.substring(0, 8) || '—'}`;

    // وقت المغادرة
    if (expiresAt) {
      checkoutTime = new Date(expiresAt);
      const remaining = calcRemainingMinutes(expiresAt);

      // الإقامة الكاملة (نفترض 24 ساعة كحد أقصى للعرض)
      totalMinutes = Math.max(remaining, totalMinutes || remaining);

      // تحديث state الموجود في HTML
      if (typeof window.state !== 'undefined') {
        window.state.remainingMinutes = remaining;
      }

      // تحديث hero timer مباشرة
      updateHeroTimer(remaining, expiresAt);

      // تحديث الوقت التالي في بطاقة المعلومات
      const nextTimeEl = document.getElementById('next-time');
      if (nextTimeEl) nextTimeEl.textContent = toTimeStr(expiresAt);
    }

    // تحديث الـ ring عبر دالة HTML الموجودة
    if (typeof window.updateTimeRing === 'function') {
      window.updateTimeRing();
    } else if (typeof window.refreshHero === 'function') {
      window.refreshHero();
    }

    console.log('[GuestLux] واجهة محدّثة بالبيانات الحقيقية — الضيف:', guestName);

  } catch (err) {
    console.warn('[GuestLux] خطأ في تحديث الواجهة:', err);
  }
}

/** تحديث مؤقت الـ hero بالوقت المتبقي الحقيقي */
function updateHeroTimer(remainingMins, expiresAt) {
  try {
    // hero-t — العنصر الرئيسي للوقت
    const heroT = document.getElementById('hero-t');
    if (heroT) {
      const hrs = Math.floor(remainingMins / 60);
      const min = remainingMins % 60;
      if (hrs > 0) {
        heroT.innerHTML = `${hrs}<span class="hero-unit"> س ${min} د</span>`;
      } else {
        heroT.innerHTML = `${min}<span class="hero-unit"> د</span>`;
      }
    }

    // hero-end — وقت انتهاء الإقامة
    const heroEnd = document.getElementById('hero-end');
    if (heroEnd && expiresAt) {
      heroEnd.textContent = `ينتهي الساعة ${toTimeStr(expiresAt)}`;
    }

    // ring SVG — circumference = 2 * π * 45 ≈ 282.74
    const C = 2 * Math.PI * 45;
    const ringEl = document.getElementById('ring');
    if (ringEl && totalMinutes > 0) {
      const pct = Math.min(1, remainingMins / totalMinutes);
      ringEl.style.strokeDashoffset = C * (1 - pct);

      // تحديث النسبة المئوية
      const rpctEl = document.getElementById('rpct');
      if (rpctEl) rpctEl.textContent = Math.round(pct * 100) + '%';

      // شريط التقدم
      const pbarEl = document.getElementById('pbar');
      if (pbarEl) pbarEl.style.width = (pct * 100) + '%';
    }

    // تحذير عند 10 دقائق أو أقل
    if (remainingMins <= 10 && !expired) {
      const heroTEl = document.getElementById('hero-t');
      if (heroTEl) heroTEl.classList.add('urgent');
      if (ringEl) ringEl.classList.add('urgent');
      const pbarEl = document.getElementById('pbar');
      if (pbarEl) pbarEl.classList.add('urgent');

      const extCard = document.getElementById('extend-card');
      if (extCard) extCard.classList.add('urgent');
      const extHint = document.getElementById('ext-hint');
      if (extHint) extHint.textContent = '⚠️ مدّد الآن';

      showAlert('🔴', 'باقي ' + remainingMins + ' دقائق!', 'مدّد الآن قبل فوات الأوان');
    }

  } catch (_) {}
}

/** عرض بانر التنبيه */
function showAlert(ico, title, sub) {
  try {
    const banner = document.getElementById('alert-banner');
    const aIco   = document.getElementById('ab-ico');
    const aTitle = document.getElementById('ab-title');
    const aSub   = document.getElementById('ab-sub');

    if (aIco)   aIco.textContent   = ico;
    if (aTitle) aTitle.textContent = title;
    if (aSub)   aSub.textContent   = sub;
    if (banner) banner.classList.add('show');
  } catch (_) {}
}

// ─── شاشة انتهاء الجلسة (goodbye luxury) ────────────────────────────────────

function showExpiryScreen() {
  try {
    expired = true;

    // إيقاف heartbeat
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }

    // إنشاء طبقة goodbye فاخرة
    const overlay = document.createElement('div');
    overlay.id = 'qlvn-goodbye';
    overlay.style.cssText = `
      position: fixed; inset: 0; z-index: 9999;
      background: linear-gradient(160deg, #0d0d14 0%, #06060c 100%);
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      gap: 16px; text-align: center; padding: 32px;
      font-family: 'Tajawal', sans-serif;
      animation: fadeIn .6s ease;
    `;

    overlay.innerHTML = `
      <style>
        @keyframes fadeIn { from { opacity:0; transform:scale(.95); } to { opacity:1; transform:scale(1); } }
        @keyframes shimmerGold { 0%,100%{opacity:.7} 50%{opacity:1} }
      </style>

      <!-- شعاع ذهبي خلفي -->
      <div style="
        position:absolute; width:300px; height:300px; border-radius:50%;
        background:radial-gradient(circle, rgba(201,168,76,.15) 0%, transparent 70%);
        animation: shimmerGold 3s ease-in-out infinite;
        pointer-events:none;
      "></div>

      <!-- أيقونة وداع -->
      <div style="font-size:64px; position:relative; z-index:1;">✨</div>

      <!-- الاسم -->
      <div style="
        font-size:10px; color:rgba(201,168,76,.8);
        letter-spacing:.3em; text-transform:uppercase;
        position:relative; z-index:1;
      ">QDR Luxury by Qlvin OS</div>

      <div style="
        font-size:32px; font-weight:900; color:#fff;
        position:relative; z-index:1;
      ">شكراً لاختيارك</div>

      <div style="
        font-size:14px; color:rgba(255,255,255,.5);
        max-width:280px; line-height:1.6;
        position:relative; z-index:1;
      ">
        انتهت إقامتك. نتمنى أن تكون تجربتك معنا استثنائية.
        <br><br>
        نراك في زيارة قادمة 🌙
      </div>

      <!-- خط ذهبي -->
      <div style="
        width:80px; height:1px; margin-top:8px;
        background:linear-gradient(90deg,transparent,rgba(201,168,76,.6),transparent);
        position:relative; z-index:1;
      "></div>

      <div style="
        font-size:11px; color:rgba(255,255,255,.3);
        letter-spacing:.2em;
        position:relative; z-index:1;
      ">QLVIN OS · Hospitality Reimagined</div>
    `;

    document.body.appendChild(overlay);

    console.log('[GuestLux] جلسة منتهية — عرض شاشة الوداع');

  } catch (_) {}
}

// ─── Heartbeat كل 30 ثانية ────────────────────────────────────────────────────

async function sendHeartbeat() {
  if (!guestToken || expired) return;

  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/heartbeat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: guestToken, source: 'guest_card_luxury' }),
    });

    if (!res.ok) return;

    const data = await res.json();

    // إذا انتهت الجلسة من طرف السيرفر
    if (data.expired) {
      showExpiryScreen();
      return;
    }

    // تحديث الوقت المتبقي
    if (data.expires_at && checkoutTime) {
      const remaining = calcRemainingMinutes(data.expires_at);
      if (typeof window.state !== 'undefined') {
        window.state.remainingMinutes = remaining;
      }
      updateHeroTimer(remaining, data.expires_at);
    }

  } catch (_) {
    // صامت — لا نكسر الواجهة إذا فشل heartbeat
  }
}

function startHeartbeat() {
  if (heartbeatTimer) clearInterval(heartbeatTimer);
  heartbeatTimer = setInterval(sendHeartbeat, 30000);
}

// ─── تسجيل أحداث التحكم في activity_logs ────────────────────────────────────

/**
 * تسجيل حدث تحكم (إضاءة، صوت، LED) في activity_logs.
 * بما أن RLS لا تسمح للأنون بالكتابة المباشرة، نسجّل محلياً
 * ونستعد للـ Edge Function المستقبلية (device-control).
 */
async function logDeviceControl(controlType, value) {
  if (!unitId) return;

  try {
    // تسجيل محلي للآن (للديباق)
    console.log('[GuestLux] تحكم:', { unitId, sessionId, controlType, value });

    // مستقبلاً: POST إلى edge function device-control
    // await fetch(`${SUPABASE_URL}/functions/v1/device-control`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ token: guestToken, type: controlType, value }),
    // });

  } catch (_) {}
}

// ─── ربط أحداث الـ sliders بالتسجيل ─────────────────────────────────────────

function wireSliderLogging() {
  try {
    // مراقبة تغييرات sliders الموجودة في HTML بعد أن يتم رسمها
    const observeSlider = (elId, controlType) => {
      const el = document.getElementById(elId);
      if (!el) return;

      el.addEventListener('change', () => {
        logDeviceControl(controlType, el.value);
      });
      // أيضاً oninput للتسجيل في نهاية التحريك
      el.addEventListener('input', () => {
        logDeviceControl(controlType, el.value);
      });
    };

    observeSlider('light-range', 'light');
    observeSlider('sound-range', 'sound');
    observeSlider('led-range',   'led_brightness');

  } catch (_) {}
}

/** ربط تغييرات الـ mode لتسجيلها */
function wireModeLogging() {
  try {
    // تجاوز setMode لتسجيل التغيير
    const _origSetMode = window.setMode;
    if (typeof _origSetMode !== 'function') return;

    window.setMode = function(mode, el) {
      // تنفيذ الدالة الأصلية أولاً
      _origSetMode.call(this, mode, el);
      // ثم تسجيل الحدث
      logDeviceControl('mode_change', mode);
    };
  } catch (_) {}
}

// ─── نقطة الدخول الرئيسية ───────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
  console.log('[GuestLux] token-handler.js loaded');

  // استخراج التوكن من URL
  guestToken = extractToken();

  if (!guestToken) {
    console.log('[GuestLux] لا يوجد token في URL — وضع العرض التجريبي');
    // ربط التسجيل في وضع التجريبي أيضاً
    wireSliderLogging();
    wireModeLogging();
    return;
  }

  console.log('[GuestLux] التحقق من token:', guestToken.substring(0, 12) + '...');

  // التحقق من التوكن
  const result = await validateToken(guestToken);

  if (!result.valid) {
    console.warn('[GuestLux] توكن غير صالح:', result.error);

    if (result.error === 'token_expired') {
      showExpiryScreen();
    } else {
      // رسالة خطأ هادئة — لا نكسر الواجهة
      showAlert('⚠️', 'رابط غير صالح', 'تأكد من الرابط المرسل لك');
    }
    return;
  }

  // حفظ معلومات الجلسة
  sessionId  = result.session_id;
  unitId     = result.unit?.id;

  // حساب إجمالي الوقت كنقطة مرجعية للـ ring
  if (result.expires_at) {
    const remaining = calcRemainingMinutes(result.expires_at);
    totalMinutes = remaining; // نفترض الدخول الآن للحسابات النسبية
    checkoutTime = new Date(result.expires_at);
  }

  // تطبيق البيانات على الواجهة
  applySessionToUI(result);

  // ربط sliders للتسجيل
  wireSliderLogging();
  wireModeLogging();

  // بدء heartbeat
  startHeartbeat();

  // تشغيل heartbeat أول مرة بعد 5 ثواني
  setTimeout(sendHeartbeat, 5000);

  console.log('[GuestLux] الجلسة نشطة — session_id:', sessionId);
});

// ─── تنظيف عند إغلاق الصفحة ─────────────────────────────────────────────────
window.addEventListener('beforeunload', () => {
  if (heartbeatTimer) clearInterval(heartbeatTimer);
});
