import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Wifi, Moon, CalendarCheck, Users, Thermometer, Shield } from "lucide-react";
import { usePropertyState, DevStatePicker } from "../context/PropertyStateEngine";

const STATE_LABELS = {
  VACANT:        { ar: "فارغة",          color: "#4ADE80" },
  BOOKED:        { ar: "محجوزة",         color: "#FB923C" },
  PREPARING:     { ar: "جاري التحضير",   color: "#60A5FA" },
  GUEST_ARRIVING:{ ar: "الضيف في الطريق",color: "#C8A96A" },
  OCCUPIED:      { ar: "مُشغولة",        color: "#C8A96A" },
  SLEEP:         { ar: "وضع النوم",      color: "#A78BFA" },
  CHECKOUT_SOON: { ar: "مغادرة قريباً",  color: "#F87171" },
  CLEANING:      { ar: "تنظيف",          color: "#A78BFA" },
  READY:         { ar: "جاهزة",          color: "#4ADE80" },
};

/* Time-of-day modifier for the ambient (layered on top of state color) */
function getTimeModifier(hour) {
  if (hour >= 5  && hour < 9)  return { warm: 0.08, cool: 0 };   // dawn: warm tint
  if (hour >= 9  && hour < 18) return { warm: 0,    cool: 0.04 }; // day: neutral
  if (hour >= 18 && hour < 22) return { warm: 0.06, cool: 0 };   // dusk: warm
  return { warm: 0, cool: 0 };                                    // night: pure
}

export default function AmbientScreen() {
  const navigate    = useNavigate();
  const { propertyState, scenario, guest } = usePropertyState();
  const [now, setNow]         = useState(new Date());
  const [uiVisible, setUiVisible] = useState(true);
  const timerRef = useRef(null);

  const stateLabel = STATE_LABELS[propertyState] || STATE_LABELS.OCCUPIED;

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const resetIdle = useCallback(() => {
    setUiVisible(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setUiVisible(false), 16000);
  }, []);

  useEffect(() => {
    resetIdle();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  const hr  = now.getHours();
  const mod = getTimeModifier(hr);

  const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
  const dateStr = now.toLocaleDateString("ar-SA",  { weekday: "long", day: "numeric", month: "long" });

  const tiles = [
    { icon: Thermometer,   label: "22°C",      sub: "مريح",          path: null,        },
    { icon: Wifi,          label: "متصل",      sub: "qlvin-5G",      path: "/guest",    },
    { icon: Users,         label: guest.partySize === 1 ? "ضيف" : "ضيفان",
                                               sub: guest.name,      path: "/welcome",  },
    { icon: CalendarCheck, label: "Checkout",  sub: guest.checkoutTime, path: "/checkout" },
    { icon: Moon,          label: "هادئ",      sub: "DND شغّال",     path: "/sleep",    },
    { icon: Shield,        label: "آمن",       sub: "جميع الأجهزة",  path: null,        },
  ];

  return (
    <div
      className="relative w-full h-screen overflow-hidden flex flex-col select-none"
      style={{ background: scenario.bg, transition: "background 2s ease" }}
      onClick={resetIdle}
    >
      {/* ── Layer 1: State-driven glow (large, slow) ── */}
      <motion.div
        className="absolute pointer-events-none"
        animate={{ scale: [1, 1.18, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        style={{
          top: "-30%", left: "-20%",
          width: "70vw", height: "70vw",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${scenario.glow} 0%, transparent 70%)`,
        }}
      />
      {/* ── Layer 2: Warm/cool time modifier ── */}
      {mod.warm > 0 && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: `radial-gradient(ellipse at 40% 85%, rgba(200,150,80,${mod.warm}) 0%, transparent 60%)` }}
        />
      )}
      {/* ── Layer 3: Subtle secondary glow (bottom-right) ── */}
      <motion.div
        className="absolute pointer-events-none"
        animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 28, repeat: Infinity, ease: "easeInOut", delay: 10 }}
        style={{
          bottom: "-25%", right: "-15%",
          width: "55vw", height: "55vw",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${scenario.glow} 0%, transparent 70%)`,
        }}
      />

      {/* ── Top bar ── */}
      <AnimatePresence>
        {uiVisible && (
          <motion.div
            key="topbar"
            initial={{ opacity: 0, y: -14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
            className="relative z-20 flex items-center justify-between px-9 pt-9"
            onClick={e => e.stopPropagation()}
          >
            {/* QLVIN wordmark */}
            <div className="flex items-center gap-3" style={{ opacity: 0.22 }}>
              <div
                className="w-7 h-7 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.08)" }}
              >
                <span className="text-white font-black" style={{ fontSize: 11 }}>Q</span>
              </div>
              <div>
                <div className="text-white font-light tracking-[0.25em]" style={{ fontSize: 11 }}>QLVIN OS</div>
                <div className="font-light tracking-[0.15em]" style={{ fontSize: 9, color: "rgba(255,255,255,0.5)" }}>
                  {guest.building} · {guest.unitId}
                </div>
              </div>
            </div>

            {/* Property state pill */}
            <AnimatePresence mode="wait">
              <motion.div
                key={propertyState}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4 }}
                className="flex items-center gap-2.5 px-4 py-2 rounded-full"
                style={{
                  background: `${stateLabel.color}12`,
                  border: `1px solid ${stateLabel.color}22`,
                  backdropFilter: "blur(20px)",
                }}
              >
                <motion.span
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 2.8, repeat: Infinity }}
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: stateLabel.color }}
                />
                <span className="font-light tracking-wide" style={{ fontSize: 12, color: stateLabel.color }}>
                  {stateLabel.ar}
                </span>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CENTER: Clock ── */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 2.5, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Time — hero element */}
          <div
            style={{
              fontSize: "clamp(88px, 21vw, 220px)",
              fontWeight: 100,
              letterSpacing: "-0.05em",
              fontVariantNumeric: "tabular-nums",
              color: "rgba(255,255,255,0.94)",
              lineHeight: 0.9,
            }}
          >
            {timeStr}
          </div>

          {/* Date */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 1.8 }}
            style={{
              marginTop: 24,
              fontSize: 14,
              fontWeight: 200,
              letterSpacing: "0.2em",
              color: "rgba(255,255,255,0.2)",
            }}
          >
            {dateStr}
          </motion.div>

          {/* Property label */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 1.8 }}
            style={{
              marginTop: 8,
              fontSize: 10,
              fontWeight: 200,
              letterSpacing: "0.42em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.07)",
            }}
          >
            {guest.unitId} · {guest.building}
          </motion.div>
        </motion.div>
      </div>

      {/* ── Bottom: iOS Control Center tiles ── */}
      <AnimatePresence>
        {uiVisible && (
          <motion.div
            key="tiles"
            initial={{ opacity: 0, y: 36 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 36 }}
            transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
            className="relative z-20 px-8 pb-10"
            onClick={e => e.stopPropagation()}
          >
            <div className="grid grid-cols-3 gap-3.5">
              {tiles.map((tile, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i, duration: 0.5 }}
                  whileHover={{ scale: 1.04, backgroundColor: "rgba(255,255,255,0.08)" }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => tile.path && navigate(tile.path)}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    gap: 0,
                    padding: "18px 20px 16px",
                    borderRadius: 20,
                    background: "rgba(255,255,255,0.055)",
                    border: "0.5px solid rgba(255,255,255,0.09)",
                    backdropFilter: "blur(40px)",
                    WebkitBackdropFilter: "blur(40px)",
                    cursor: tile.path ? "pointer" : "default",
                    textAlign: "left",
                  }}
                >
                  <tile.icon size={15} style={{ color: "rgba(255,255,255,0.38)", marginBottom: 12 }} />
                  <div style={{ fontSize: 14, fontWeight: 300, color: "rgba(255,255,255,0.92)" }}>
                    {tile.label}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 200, color: "rgba(255,255,255,0.28)", marginTop: 2 }}>
                    {tile.sub}
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <DevStatePicker />
    </div>
  );
}
