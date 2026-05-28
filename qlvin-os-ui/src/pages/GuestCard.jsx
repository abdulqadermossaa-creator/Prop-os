import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wifi, Film, Coffee, Moon, Radio, Sun, Volume2,
  BedDouble, UtensilsCrossed, Bell, Sparkles,
  Plus, ChevronRight, Shield, Phone, Calendar,
} from "lucide-react";

// ─── QLVIN OS Logo — exact brand match ───────────────────────────────────────
function QlvinLogo({ size = 80 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <radialGradient id="ringGrad" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#e5e7eb" />
          <stop offset="40%" stopColor="#d1d5db" />
          <stop offset="100%" stopColor="#6b7280" />
        </radialGradient>
        <linearGradient id="houseGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#2F80FF" />
        </linearGradient>
      </defs>
      {/* Outer ring — metallic silver */}
      <circle cx="47" cy="45" r="32" stroke="url(#ringGrad)" strokeWidth="5" />
      {/* House body */}
      <rect x="36" y="50" width="22" height="16" rx="1.5" fill="url(#houseGrad)" />
      {/* Roof */}
      <polygon points="33,51 47,38 61,51" fill="url(#houseGrad)" />
      {/* Door */}
      <rect x="43" y="56" width="8" height="10" rx="1" fill="white" fillOpacity="0.9" />
      {/* Up arrow inside roof */}
      <path d="M47 43 L47 49" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <path d="M44 46 L47 43 L50 46" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Q tail — magnifying glass handle */}
      <path d="M73 71 L84 82" stroke="url(#ringGrad)" strokeWidth="5.5" strokeLinecap="round" />
    </svg>
  );
}

// ─── Wordmark — QLVIN OS ─────────────────────────────────────────────────────
function QlvinWordmark({ size = "2xl" }) {
  const sizes = { lg: "text-2xl", xl: "text-3xl", "2xl": "text-4xl", "3xl": "text-5xl" };
  return (
    <div className={`font-black tracking-[0.12em] ${sizes[size]}`}>
      <span className="text-white">QLVIN </span>
      <span style={{ color: "#2F80FF" }}>OS</span>
    </div>
  );
}

// ─── Splash Screen ────────────────────────────────────────────────────────────
function SplashScreen({ onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2600);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{
        background: "radial-gradient(ellipse at 50% 45%, #0a1628 0%, #040a14 55%, #000000 100%)",
      }}
      exit={{ opacity: 0, scale: 1.04 }}
      transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Ambient glow behind logo */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 280, height: 280,
          background: "radial-gradient(circle, rgba(47,128,255,0.12) 0%, transparent 70%)",
        }}
        animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.p
        className="text-white/40 text-xs uppercase tracking-[0.3em] mb-8"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.8 }}
      >
        Powered By
      </motion.p>

      <motion.div
        initial={{ opacity: 0, scale: 0.75 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4, duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
      >
        <QlvinLogo size={96} />
      </motion.div>

      <motion.div
        className="mt-6"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.7 }}
      >
        <QlvinWordmark size="2xl" />
      </motion.div>

      {/* Loading line */}
      <motion.div
        className="mt-10 h-px rounded-full overflow-hidden"
        style={{ width: 120, background: "rgba(255,255,255,0.1)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1 }}
      >
        <motion.div
          className="h-full rounded-full"
          style={{ background: "linear-gradient(90deg, #2F80FF, #00E5FF)" }}
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ delay: 1.2, duration: 1.2, ease: "easeInOut" }}
        />
      </motion.div>
    </motion.div>
  );
}

// ─── Mode Data ────────────────────────────────────────────────────────────────
const MODES = {
  cinema: {
    id: "cinema", label: "Cinema", icon: Film,
    gradient: "linear-gradient(150deg,#070A12 0%,#0D1B35 55%,#050810 100%)",
    blobs: [
      { color: "#1a2d5a", x: "-15%", y: "5%",  w: 520, h: 520 },
      { color: "#0d1f47", x: "55%",  y: "38%", w: 400, h: 380 },
    ],
    accent: "#2F80FF", rgb: "47,128,255",
    feature: {
      ambient: "Projector ready · Lights at 15%",
      title: "Tonight's Picks",
      sub: "Curated for your taste",
      items: ["The Creator — Sci-Fi · 2h 13m", "Dune: Part Two — Epic · 2h 46m", "Past Lives — Drama · 1h 46m"],
    },
    aiText: "Your cinema setup is optimal. Projector at 4K, lighting set to cinematic mode.",
  },
  match: {
    id: "match", label: "Match", icon: Radio,
    gradient: "linear-gradient(150deg,#030D08 0%,#0A2E1A 55%,#051208 100%)",
    blobs: [
      { color: "#0a2e1a", x: "-10%", y: "8%",  w: 500, h: 480 },
      { color: "#0f3d22", x: "58%",  y: "42%", w: 380, h: 360 },
    ],
    accent: "#00C896", rgb: "0,200,150",
    feature: {
      ambient: "TV · SSC Sports · Live",
      title: "Live Now",
      sub: "Saudi Pro League · Round 28",
      items: ["Al Hilal  2 — 1  Al Nassr  · 67′", "Al Ittihad  1 — 1  Al Ahli  · HT", "Nearest sports bar · 2 min"],
    },
    aiText: "Al Hilal leads by 1. Match ends in ~23 min. Al Baik nearby open until 1 AM.",
  },
  coffee: {
    id: "coffee", label: "Coffee", icon: Coffee,
    gradient: "linear-gradient(150deg,#0D0806 0%,#2E1A0A 55%,#0d0604 100%)",
    blobs: [
      { color: "#2e1a0a", x: "-5%",  y: "12%", w: 480, h: 460 },
      { color: "#3d2210", x: "55%",  y: "36%", w: 360, h: 360 },
    ],
    accent: "#C8A96A", rgb: "200,169,106",
    feature: {
      ambient: "Sunrise mode · Curtains 40%",
      title: "Morning Service",
      sub: "Order to your suite",
      items: ["Arabica Pour-Over · 8 min", "Cardamom Latte · 10 min", "Saffron Cold Brew · 6 min"],
    },
    aiText: "Your preferred order: Arabica, no sugar. Ready in 8 minutes. Tap to reorder.",
  },
  relax: {
    id: "relax", label: "Relax", icon: Moon,
    gradient: "linear-gradient(150deg,#08050D 0%,#1A0E2E 55%,#08050d 100%)",
    blobs: [
      { color: "#1a0e2e", x: "-10%", y: "8%",  w: 540, h: 520 },
      { color: "#22103d", x: "58%",  y: "40%", w: 380, h: 380 },
    ],
    accent: "#A78BFA", rgb: "167,139,250",
    feature: {
      ambient: "DND active · Sleep mode on",
      title: "Wellness Suite",
      sub: "Your evening ritual",
      items: ["Guided Meditation · 10 min", "Rain Sounds · Ambient loop", "Sleep Temp: 19°C active"],
    },
    aiText: "Do Not Disturb is on. Blackout curtains closed. Room set to 19°C. Sleep well.",
  },
};

// ─── Ambient Background ───────────────────────────────────────────────────────
function AmbientBg({ mode }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={mode.id}
        className="absolute inset-0 overflow-hidden"
        style={{ background: mode.gradient }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1.4, ease: "easeInOut" }}
      >
        {mode.blobs.map((b, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{ width: b.w, height: b.h, background: b.color, left: b.x, top: b.y, filter: "blur(90px)", opacity: 0.6 }}
            animate={{ x: [0, 28, -16, 0], y: [0, -20, 26, 0], scale: [1, 1.09, 0.95, 1] }}
            transition={{ duration: 12 + i * 4, repeat: Infinity, ease: "easeInOut", delay: i * 2 }}
          />
        ))}
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Glass Tile ───────────────────────────────────────────────────────────────
function Tile({ children, className = "", onClick, accentRgb, active }) {
  return (
    <motion.div
      onClick={onClick}
      whileTap={onClick ? { scale: 0.93 } : {}}
      transition={{ type: "spring", stiffness: 420, damping: 22 }}
      className={`rounded-2xl overflow-hidden select-none ${onClick ? "cursor-pointer" : ""} ${className}`}
      style={{
        backdropFilter: "blur(22px)",
        WebkitBackdropFilter: "blur(22px)",
        background: active && accentRgb ? `rgba(${accentRgb},0.13)` : "rgba(255,255,255,0.065)",
        border: active && accentRgb ? `1px solid rgba(${accentRgb},0.3)` : "1px solid rgba(255,255,255,0.09)",
      }}
    >
      {children}
    </motion.div>
  );
}

// ─── iOS Vertical Slider ──────────────────────────────────────────────────────
function VerticalSlider({ icon: Icon, label, value, onChange, accentRgb }) {
  return (
    <div className="flex flex-col items-center gap-2 h-full">
      <p className="text-[9px] text-white/35 uppercase tracking-widest">{label}</p>
      <div
        className="relative flex-1 w-full rounded-[20px] overflow-hidden cursor-pointer"
        style={{ background: "rgba(0,0,0,0.55)", border: "1px solid rgba(255,255,255,0.07)", minHeight: 100 }}
        onClick={() => onChange(value >= 100 ? 0 : Math.min(100, value + 20))}
      >
        <motion.div
          className="absolute bottom-0 left-0 right-0"
          animate={{ height: `${value}%` }}
          transition={{ type: "spring", stiffness: 180, damping: 22 }}
          style={{ background: `linear-gradient(to top, rgb(${accentRgb}), rgba(${accentRgb},0.45))`, borderRadius: "0 0 20px 20px" }}
        />
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <Icon size={13} className="text-white/55" />
        </div>
      </div>
      <span className="text-[10px] text-white/40 font-mono tabular-nums">{value}%</span>
    </div>
  );
}

// ─── Feature Card ─────────────────────────────────────────────────────────────
function FeatureCard({ mode }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={mode.id}
        initial={{ opacity: 0, filter: "blur(12px)", scale: 0.97 }}
        animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
        exit={{ opacity: 0, filter: "blur(8px)", scale: 0.97 }}
        transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
        className="rounded-2xl p-5 h-full flex flex-col"
        style={{
          backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
          background: `rgba(${mode.rgb},0.09)`,
          border: `1px solid rgba(${mode.rgb},0.22)`,
          boxShadow: `0 0 32px rgba(${mode.rgb},0.07)`,
        }}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0 pr-2">
            <p className="text-[10px] uppercase tracking-widest font-semibold mb-1" style={{ color: `rgba(${mode.rgb},0.65)` }}>
              {mode.feature.ambient}
            </p>
            <h3 className="text-xl font-bold text-white leading-tight">{mode.feature.title}</h3>
            <p className="text-xs text-white/40 mt-0.5">{mode.feature.sub}</p>
          </div>
          <motion.div
            className="flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ background: `rgba(${mode.rgb},0.18)` }}
            animate={{ scale: [1, 1.1, 1], opacity: [0.75, 1, 0.75] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <mode.icon size={17} style={{ color: `rgb(${mode.rgb})` }} />
          </motion.div>
        </div>
        <div className="space-y-1 flex-1">
          {mode.feature.items.map((item, i) => (
            <motion.div
              key={item}
              initial={{ opacity: 0, x: 14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.08 + i * 0.07, duration: 0.38 }}
              className="flex items-center gap-3 py-2.5 px-3 rounded-xl cursor-pointer"
              style={{ background: "rgba(255,255,255,0.03)" }}
              whileHover={{ background: "rgba(255,255,255,0.07)" }}
              whileTap={{ scale: 0.98 }}
            >
              <motion.div
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ background: `rgb(${mode.rgb})` }}
                animate={{ scale: [1, 1.5, 1] }}
                transition={{ duration: 2.5, delay: i * 0.5, repeat: Infinity }}
              />
              <span className="text-sm text-white/72 flex-1 leading-tight">{item}</span>
              <ChevronRight size={11} className="text-white/20 flex-shrink-0" />
            </motion.div>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Mode Switcher ────────────────────────────────────────────────────────────
function ModeSwitcher({ active, onChange }) {
  return (
    <div className="flex gap-1 p-1 rounded-2xl"
      style={{ background: "rgba(0,0,0,0.38)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.08)" }}
    >
      {Object.values(MODES).map((m) => {
        const isActive = active === m.id;
        return (
          <motion.button
            key={m.id}
            onClick={() => onChange(m.id)}
            className="relative flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-medium"
            style={{ color: isActive ? `rgb(${m.rgb})` : "rgba(255,255,255,0.38)" }}
            whileTap={{ scale: 0.94 }}
          >
            {isActive && (
              <motion.div
                layoutId="modeIndicator"
                className="absolute inset-0 rounded-xl"
                style={{ background: `rgba(${m.rgb},0.14)`, border: `1px solid rgba(${m.rgb},0.32)` }}
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            <m.icon size={13} className="relative z-10 flex-shrink-0" />
            <span className="relative z-10 hidden sm:inline">{m.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}

// ─── Live Clock ───────────────────────────────────────────────────────────────
function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <span className="text-white/55 text-sm font-light tabular-nums">
      {time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}
    </span>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function GuestCard() {
  const [splash, setSplash] = useState(true);
  const [activeMode, setActiveMode] = useState("cinema");
  const [brightness, setBrightness] = useState(40);
  const [volume, setVolume] = useState(60);
  const [dnd, setDnd] = useState(false);
  const [wifiVisible, setWifiVisible] = useState(false);

  const mode = MODES[activeMode];

  return (
    <div className="relative w-full min-h-screen overflow-auto" style={{ background: "#07090F" }}>
      {/* Splash */}
      <AnimatePresence>
        {splash && <SplashScreen onDone={() => setSplash(false)} />}
      </AnimatePresence>

      <AmbientBg mode={mode} />

      {/* Main content */}
      <motion.div
        className="relative z-10 flex flex-col min-h-screen max-w-[430px] mx-auto w-full px-4 pb-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: splash ? 0 : 1 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        {/* Status Bar */}
        <div className="flex items-center justify-between pt-5 pb-1">
          <LiveClock />
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4].map((b) => (
              <div key={b} className="w-[3px] rounded-sm"
                style={{ height: b * 3 + 3, background: b <= 3 ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.2)" }}
              />
            ))}
            <Wifi size={12} className="text-white/50 ml-1" />
          </div>
        </div>

        {/* Top Bar */}
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <QlvinLogo size={38} />
            <div>
              <div className="text-sm font-black text-white tracking-wider leading-none">
                QLVIN <span style={{ color: "#2F80FF" }}>OS</span>
              </div>
              <div className="text-[10px] text-white/38 mt-0.5 font-light" style={{ direction: "rtl" }}>
                حلول عقارية ذكية
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold text-white leading-tight">Al Hamra Suite</div>
            <div className="text-[10px] text-white/38 mt-0.5">Room 501 · Floor 12</div>
          </div>
        </div>

        {/* Welcome */}
        <div className="py-4">
          <p className="text-white/38 text-[10px] uppercase tracking-[0.2em] mb-1.5">Good Evening</p>
          <h1 className="text-[2rem] font-bold text-white leading-none mb-3">Welcome Back</h1>
          <div className="flex items-center gap-2.5 flex-wrap">
            {[{ icon: Calendar, text: "May 23 – 26" }, { icon: BedDouble, text: "3 nights left" }].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-white/55"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <Icon size={10} />{text}
              </div>
            ))}
          </div>
        </div>

        {/* Mode Switcher */}
        <div className="mb-4">
          <ModeSwitcher active={activeMode} onChange={setActiveMode} />
        </div>

        {/* Control Grid */}
        <div className="flex gap-3 mb-3" style={{ minHeight: 240 }}>
          <div className="flex-1 min-w-0">
            <FeatureCard mode={mode} />
          </div>
          <div className="flex gap-2.5" style={{ width: 108 }}>
            <div className="flex-1">
              <VerticalSlider icon={Volume2} label="Vol" value={volume} onChange={setVolume} accentRgb={mode.rgb} />
            </div>
            <div className="flex-1">
              <VerticalSlider icon={Sun} label="Light" value={brightness} onChange={setBrightness} accentRgb={mode.rgb} />
            </div>
          </div>
        </div>

        {/* Quick Tiles */}
        <div className="grid grid-cols-4 gap-2.5 mb-2.5">
          <Tile onClick={() => setWifiVisible(v => !v)} active={wifiVisible} accentRgb={mode.rgb}
            className="p-3 flex flex-col items-center justify-center gap-1.5 aspect-square">
            <Wifi size={19} style={{ color: wifiVisible ? `rgb(${mode.rgb})` : "rgba(255,255,255,0.6)" }} />
            <p className="text-[9px] text-white/45">WiFi</p>
            <AnimatePresence>
              {wifiVisible && (
                <motion.p initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  className="text-[8px] font-mono text-center" style={{ color: `rgb(${mode.rgb})` }}>
                  QLVIN501
                </motion.p>
              )}
            </AnimatePresence>
          </Tile>

          <Tile onClick={() => setDnd(d => !d)} active={dnd} accentRgb="167,139,250"
            className="p-3 flex flex-col items-center justify-center gap-1.5 aspect-square">
            <Shield size={19} style={{ color: dnd ? "#A78BFA" : "rgba(255,255,255,0.6)" }} />
            <p className="text-[9px] text-white/45">{dnd ? "DND On" : "DND"}</p>
          </Tile>

          <Tile onClick={() => {}} className="p-3 flex flex-col items-center justify-center gap-1.5 aspect-square">
            <Plus size={19} className="text-white/60" />
            <p className="text-[9px] text-white/45 text-center">Extend</p>
          </Tile>

          <Tile onClick={() => {}} className="p-3 flex flex-col items-center justify-center gap-1.5 aspect-square">
            <Bell size={19} className="text-white/60" />
            <p className="text-[9px] text-white/45">Bell</p>
          </Tile>
        </div>

        {/* Wide Tiles */}
        <div className="grid grid-cols-2 gap-2.5 mb-4">
          <Tile onClick={() => {}} className="p-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(255,255,255,0.07)" }}>
              <UtensilsCrossed size={15} className="text-white/60" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white/85 leading-none">Room Service</p>
              <p className="text-[10px] text-white/38 mt-1">24h · Order now</p>
            </div>
          </Tile>
          <Tile onClick={() => {}} className="p-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(255,255,255,0.07)" }}>
              <Phone size={15} className="text-white/60" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white/85 leading-none">Front Desk</p>
              <p className="text-[10px] text-white/38 mt-1">Dial: 0</p>
            </div>
          </Tile>
        </div>

        {/* AI Bar */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeMode + "_ai"}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.45 }}
            className="rounded-2xl p-4 flex items-start gap-3.5 mb-6"
            style={{
              backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
              background: `rgba(${mode.rgb},0.07)`, border: `1px solid rgba(${mode.rgb},0.18)`,
            }}
          >
            <motion.div className="w-9 h-9 rounded-2xl flex-shrink-0 flex items-center justify-center"
              style={{ background: `rgba(${mode.rgb},0.18)` }}
              animate={{ scale: [1, 1.1, 1], opacity: [0.75, 1, 0.75] }}
              transition={{ duration: 3, repeat: Infinity }}>
              <Sparkles size={15} style={{ color: `rgb(${mode.rgb})` }} />
            </motion.div>
            <div className="flex-1">
              <p className="text-[9px] uppercase tracking-[0.2em] font-semibold mb-1.5" style={{ color: `rgba(${mode.rgb},0.65)` }}>
                QLVIN AI
              </p>
              <p className="text-sm text-white/68 leading-relaxed">{mode.aiText}</p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Footer */}
        <div className="flex flex-col items-center gap-3 pb-2">
          <div className="flex items-center gap-2 opacity-25">
            <QlvinLogo size={14} />
            <p className="text-[9px] text-white tracking-[0.2em] uppercase">
              Powered by QLVIN OS · Welcome to the NXT LVL
            </p>
          </div>
          <div className="w-28 h-1 rounded-full bg-white/20 mt-1" />
        </div>
      </motion.div>
    </div>
  );
}
