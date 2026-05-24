import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Wifi, Users, Moon, CalendarCheck, Thermometer, Shield } from "lucide-react";

const STATES = {
  OCCUPIED:      { ar: "مُشغولة",        color: "#C8A96A" },
  VACANT:        { ar: "فارغة",          color: "#4ADE80" },
  PREPARING:     { ar: "جاري التحضير",   color: "#60A5FA" },
  CHECKOUT_SOON: { ar: "مغادرة قريباً",  color: "#F87171" },
  CLEANING:      { ar: "تنظيف",          color: "#A78BFA" },
};

function getAmbientColors(hour) {
  if (hour >= 5  && hour < 9)  return ["rgba(180,110,40,0.07)", "rgba(100,60,20,0.05)"];
  if (hour >= 9  && hour < 18) return ["rgba(30,50,110,0.07)",  "rgba(15,25,70,0.05)"];
  if (hour >= 18 && hour < 22) return ["rgba(90,25,45,0.08)",   "rgba(45,12,65,0.07)"];
  return ["rgba(15,10,30,0.04)", "rgba(8,5,20,0.03)"];
}

export default function AmbientScreen() {
  const navigate = useNavigate();
  const [now, setNow]           = useState(new Date());
  const [uiVisible, setUiVisible] = useState(true);
  const [idleTimer, setIdleTimer] = useState(null);

  const propertyState = STATES.OCCUPIED;

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const resetIdle = useCallback(() => {
    setUiVisible(true);
    if (idleTimer) clearTimeout(idleTimer);
    const t = setTimeout(() => setUiVisible(false), 14000);
    setIdleTimer(t);
  }, [idleTimer]);

  useEffect(() => {
    resetIdle();
    return () => { if (idleTimer) clearTimeout(idleTimer); };
  }, []);

  const hr = now.getHours();
  const [c1, c2] = getAmbientColors(hr);

  const timeStr = now.toLocaleTimeString("en-US", {
    hour: "2-digit", minute: "2-digit", hour12: false,
  });
  const dateStr = now.toLocaleDateString("ar-SA", {
    weekday: "long", day: "numeric", month: "long",
  });

  const tiles = [
    { icon: Thermometer, label: "22°C",    sub: "مريح",          path: null },
    { icon: Wifi,        label: "متصل",    sub: "qlvin-5G",      path: "/guest" },
    { icon: Users,       label: "ضيفان",   sub: "أحمد + سارة",  path: "/welcome" },
    { icon: CalendarCheck, label: "Checkout", sub: "الغد 11:00", path: "/checkout" },
    { icon: Moon,        label: "هادئ",    sub: "DND شغّال",     path: "/sleep" },
    { icon: Shield,      label: "آمن",     sub: "كل الأجهزة",   path: null },
  ];

  return (
    <div
      className="relative w-full h-screen overflow-hidden flex flex-col select-none"
      style={{ background: "#07090E" }}
      onClick={resetIdle}
    >
      {/* Ambient blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.12, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute", top: "-25%", left: "-15%",
            width: "60vw", height: "60vw", borderRadius: "50%",
            background: `radial-gradient(circle, ${c1} 0%, transparent 70%)`,
          }}
        />
        <motion.div
          animate={{ scale: [1, 1.09, 1], opacity: [0.5, 0.85, 0.5] }}
          transition={{ duration: 24, repeat: Infinity, ease: "easeInOut", delay: 7 }}
          style={{
            position: "absolute", bottom: "-20%", right: "-10%",
            width: "55vw", height: "55vw", borderRadius: "50%",
            background: `radial-gradient(circle, ${c2} 0%, transparent 70%)`,
          }}
        />
      </div>

      {/* Top bar */}
      <AnimatePresence>
        {uiVisible && (
          <motion.div
            key="topbar"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            className="relative z-20 flex items-center justify-between px-8 pt-8"
            onClick={e => e.stopPropagation()}
          >
            {/* Logo mark */}
            <div className="flex items-center gap-2.5" style={{ opacity: 0.25 }}>
              <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                   style={{ background: "rgba(255,255,255,0.08)" }}>
                <span className="text-white font-black" style={{ fontSize: 10 }}>Q</span>
              </div>
              <span className="text-white/60 text-xs font-light tracking-[0.25em]">QLVIN OS</span>
            </div>

            {/* State pill */}
            <motion.div
              className="flex items-center gap-2 px-4 py-2 rounded-full"
              style={{
                background: `${propertyState.color}14`,
                border: `1px solid ${propertyState.color}28`,
              }}
            >
              <motion.span
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 2.5, repeat: Infinity }}
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: propertyState.color }}
              />
              <span className="text-xs font-medium" style={{ color: propertyState.color }}>
                {propertyState.ar}
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Center — Clock */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 2.2, ease: [0.4, 0, 0.2, 1] }}
        >
          {/* Time */}
          <div
            className="text-white leading-none"
            style={{
              fontSize: "clamp(72px, 18vw, 196px)",
              fontWeight: 100,
              letterSpacing: "-0.045em",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {timeStr}
          </div>

          {/* Date */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 1.4 }}
            className="mt-5 font-light tracking-[0.18em]"
            style={{ color: "rgba(255,255,255,0.22)", fontSize: 14 }}
          >
            {dateStr}
          </motion.div>

          {/* Property */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.0, duration: 1.4 }}
            className="mt-2 font-light tracking-[0.4em] uppercase"
            style={{ color: "rgba(255,255,255,0.08)", fontSize: 11 }}
          >
            الوحدة A-204 · برج القلوين
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom tiles */}
      <AnimatePresence>
        {uiVisible && (
          <motion.div
            key="tiles"
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 28 }}
            transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
            className="relative z-20 px-6 pb-8"
            onClick={e => e.stopPropagation()}
          >
            <div className="grid grid-cols-6 gap-3">
              {tiles.map((tile, i) => (
                <motion.button
                  key={i}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => tile.path && navigate(tile.path)}
                  className="flex flex-col items-center gap-2.5 py-4 px-3 rounded-[22px] transition-colors"
                  style={{
                    background: "rgba(255,255,255,0.045)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    backdropFilter: "blur(24px)",
                    WebkitBackdropFilter: "blur(24px)",
                    cursor: tile.path ? "pointer" : "default",
                  }}
                >
                  <tile.icon size={15} style={{ color: "rgba(255,255,255,0.38)" }} />
                  <span className="text-white font-medium" style={{ fontSize: 11 }}>{tile.label}</span>
                  <span className="font-light" style={{ fontSize: 9, color: "rgba(255,255,255,0.22)" }}>{tile.sub}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
