// apps/tablet/src/feature-renderer.js
// Connects guest_tablet_v1.html to Supabase via token in URL
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SUPABASE_URL, SUPABASE_ANON } from '../../_shared/supabase.js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

let currentToken = null;
let currentUnitId = null;
let currentSessionId = null;
let heartbeatInterval = null;
let realtimeChannel = null;

// ============================================
// Init
// ============================================
async function init() {
    const params = new URLSearchParams(window.location.search);
    currentToken = params.get('token');

    if (!currentToken) {
        showTokenError('no_token');
        return;
    }

    try {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/guest-token-validate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON },
            body: JSON.stringify({ token: currentToken, source: 'tablet' })
        });

        const data = await res.json();

        if (!res.ok || data.error) {
            showTokenError(data.error || 'unknown');
            return;
        }

        applySessionData(data);
        startHeartbeat();
        subscribeRealtime();
        patchSelectMode();
        patchSliders();

    } catch (err) {
        console.error('[Tablet] init error:', err);
        showTokenError('network_error');
    }
}

// ============================================
// Apply session data to DOM
// ============================================
function applySessionData(data) {
    currentUnitId = data.unit_id;
    currentSessionId = data.session_id;

    // Guest name
    const nameEl = document.querySelector('.guest-name');
    if (nameEl && data.guest_name) nameEl.textContent = data.guest_name;

    // Unit name
    const unitEl = document.querySelector('.guest-unit');
    if (unitEl && data.unit_name) unitEl.textContent = data.unit_name;

    // Unit code in header
    const unitCodeEl = document.querySelector('.tb-unit-code');
    if (unitCodeEl && data.unit_name) {
        unitCodeEl.textContent = `QLVN-${String(currentUnitId || '').slice(-4).toUpperCase() || '----'}`;
    }

    // Status indicator
    const statusEl = document.querySelector('.tb-status');
    if (statusEl) statusEl.textContent = 'LIVE';

    // Checkout time
    if (data.checkout_time) {
        const checkoutDate = new Date(data.checkout_time);
        const checkoutStr = checkoutDate.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });

        const checkoutLabel = document.querySelector('.ring-checkout');
        if (checkoutLabel) checkoutLabel.textContent = `checkout · ${checkoutStr}`;

        // Calculate remaining minutes
        const now = new Date();
        const diffMs = checkoutDate - now;
        const remainingMins = Math.max(0, Math.floor(diffMs / 60000));

        // Update global state and ring
        window.state.totalMinutes = remainingMins + 60; // approximate total
        window.state.remainingMinutes = remainingMins;

        if (typeof window.updateTimeRing === 'function') {
            window.updateTimeRing();
        }
    }

    // WiFi - show in Nawaf if available
    if (data.wifi_ssid && data.wifi_password) {
        window._wifiInfo = { ssid: data.wifi_ssid, password: data.wifi_password };
    }

    // Active mode sync
    if (data.active_mode && data.active_mode !== 'default') {
        syncModeFromRemote(data.active_mode);
    }
}

// ============================================
// Heartbeat every 30s
// ============================================
function startHeartbeat() {
    heartbeatInterval = setInterval(async () => {
        try {
            await fetch(`${SUPABASE_URL}/functions/v1/heartbeat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON },
                body: JSON.stringify({ token: currentToken, source: 'tablet' })
            });
        } catch (_) {}
    }, 30000);
}

// ============================================
// Realtime — sync mode + controls from guest card
// ============================================
function subscribeRealtime() {
    if (!currentUnitId) return;

    realtimeChannel = supabase
        .channel(`tablet-unit-${currentUnitId}`)
        .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'units',
            filter: `id=eq.${currentUnitId}`
        }, (payload) => {
            const u = payload.new;

            // Mode changed from guest card — sync tablet
            if (u.active_mode && u.active_mode !== window.state?.mode) {
                syncModeFromRemote(u.active_mode);
            }

            // Light level changed
            if (typeof u.light_level === 'number' && u.light_level !== window.state?.light) {
                updateSliderFromExternal('light', u.light_level);
            }

            // Status indicator
            const statusEl = document.querySelector('.tb-status');
            if (statusEl) statusEl.textContent = 'SYNCED';
            setTimeout(() => { if (statusEl) statusEl.textContent = 'LIVE'; }, 2000);
        })
        .subscribe();
}

// ============================================
// Sync mode from remote (guest card → tablet)
// ============================================
function syncModeFromRemote(mode) {
    if (!mode || mode === window.state?.mode) return;

    // Update body mood
    if (mode === 'match') {
        document.body.setAttribute('data-mood', 'match');
        document.body.setAttribute('data-team', window.state?.selectedTeam || 'hilal');
    } else {
        document.body.setAttribute('data-mood', mode);
        document.body.removeAttribute('data-team');
    }

    if (window.state) window.state.mode = mode;

    // Update active mode UI
    document.querySelectorAll('.mode-row').forEach(r => r.classList.remove('active'));
    const modeMap = { cinema: 0, match: 1, coffee: 2, relax: 3 };
    const idx = modeMap[mode];
    if (idx !== undefined) {
        const rows = document.querySelectorAll('.mode-row');
        if (rows[idx]) rows[idx].classList.add('active');
    }

    if (typeof window.updateStageHint === 'function') {
        window.updateStageHint(mode);
    }
}

// ============================================
// Update slider from external change
// ============================================
function updateSliderFromExternal(type, value) {
    if (type === 'light') {
        if (window.state) window.state.light = value;
        const valEl = document.getElementById('light-val');
        if (valEl) valEl.innerHTML = `${value}<small>%</small>`;
    }
}

// ============================================
// Patch selectMode to persist to Supabase
// ============================================
function patchSelectMode() {
    const original = window.selectMode;
    window.selectMode = async function(mode) {
        original.call(this, mode);

        if (!currentUnitId) return;
        try {
            await supabase
                .from('units')
                .update({ active_mode: mode })
                .eq('id', currentUnitId);

            await supabase.from('activity_logs').insert({
                unit_id: currentUnitId,
                event_type: 'mode_changed',
                source: 'tablet',
                payload: { mode, token: currentToken?.slice(0, 8) + '...' }
            });
        } catch (err) {
            console.warn('[Tablet] mode sync error:', err);
        }
    };
}

// ============================================
// Patch sliders to log changes
// ============================================
function patchSliders() {
    // Log slider changes to activity after 1s debounce
    let sliderTimer = null;

    const logSlider = (type, value) => {
        clearTimeout(sliderTimer);
        sliderTimer = setTimeout(async () => {
            if (!currentUnitId) return;
            try {
                await supabase.from('activity_logs').insert({
                    unit_id: currentUnitId,
                    event_type: 'slider_changed',
                    source: 'tablet',
                    payload: { type, value }
                });
            } catch (_) {}
        }, 1000);
    };

    // Watch state.light / state.sound / state.rgb via proxy
    const originalState = window.state;
    const handler = {
        set(target, prop, value) {
            target[prop] = value;
            if (prop === 'light') logSlider('light', value);
            if (prop === 'sound') logSlider('sound', value);
            if (prop === 'rgb') logSlider('rgb', value);
            return true;
        }
    };
    // Only proxy if Proxy is available (it always is in modern browsers)
    try {
        window.state = new Proxy(originalState, handler);
    } catch (_) {}
}

// ============================================
// Error screen
// ============================================
function showTokenError(reason) {
    const reasonMap = {
        no_token: 'لا يوجد رمز دخول في الرابط',
        token_not_found: 'رمز الدخول غير صالح',
        token_expired: 'انتهت صلاحية رمز الدخول',
        network_error: 'خطأ في الاتصال — تحقق من الشبكة',
        unknown: 'خطأ غير معروف'
    };

    const msg = reasonMap[reason] || reasonMap.unknown;

    // Inject error over splash
    const errDiv = document.createElement('div');
    errDiv.style.cssText = `
        position:fixed; inset:0; z-index:9999;
        background:#000; display:flex; flex-direction:column;
        align-items:center; justify-content:center; gap:16px;
        font-family:'Tajawal',sans-serif; color:#fff; text-align:center;
        padding:40px;
    `;
    errDiv.innerHTML = `
        <div style="font-size:48px; opacity:0.3">⚠</div>
        <div style="font-size:18px; opacity:0.8">${msg}</div>
        <div style="font-size:12px; opacity:0.4; margin-top:8px; direction:ltr">${reason}</div>
    `;
    document.body.appendChild(errDiv);

    // Hide splash if showing
    const splash = document.getElementById('splash');
    if (splash) splash.style.display = 'none';
}

init();
