import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { usePropertyState, DevStatePicker } from "../context/PropertyStateEngine";

const STATE_MAP = {
  OCCUPIED:      { ar: "مُشغولة",        color: "#C8A96A" },
  VACANT:        { ar: "فارغة",          color: "#4ADE80" },
  PREPARING:     { ar: "تحضير",          color: "#60A5FA" },
  CHECKOUT_SOON: { ar: "مغادرة قريباً",  color: "#F87171" },
  CLEANING:      { ar: "تنظيف",          color: "#A78BFA" },
  BOOKED:        { ar: "محجوزة",         color: "#FB923C" },
};

const UNITS = [
  { id: "A-101", state: "OCCUPIED",      guest: "سارة المطيري",   checkout: "الغد 10:00",   health: 98 },
  { id: "A-201", state: "VACANT",        guest: null,              checkout: null,             health: 100 },
  { id: "A-204", state: "OCCUPIED",      guest: "أحمد العمري",    checkout: "الجمعة 11:00",  health: 97 },
  { id: "A-301", state: "CLEANING",      guest: null,              checkout: null,             health: 95 },
  { id: "B-101", state: "BOOKED",        guest: "خالد السبيعي",   checkout: null,             health: 100 },
  { id: "B-201", state: "PREPARING",     guest: null,              checkout: null,             health: 93 },
  { id: "B-204", state: "CHECKOUT_SOON", guest: "نورة القحطاني",  checkout: "اليوم 12:00",   health: 99 },
  { id: "C-101", state: "OCCUPIED",      guest: "منصور الغامدي",  checkout: "السبت 10:00",   health: 96 },
];

const KPIS = [
  { label: "الإشغال",      value: "74%",   sub: "+3% هذا الأسبوع", color: "#C8A96A" },
  { label: "وحدات شغّالة", value: "4/8",   sub: "3 متاحة",         color: "#60A5FA" },
  { label: "إيراد اليوم",  value: "4,200", sub: "ريال",            color: "#4ADE80" },
  { label: "تنبيهات",      value: "1",     sub: "جهاز منخفض",      color: "#F87171" },
];

export default function FounderDashboard() {
  const navigate = useNavigate();

  return (
    <div
      className="relative w-full h-screen overflow-hidden flex flex-col"
      style={{ background: "#06080C" }}
    >
      {/* Top-right cool glow */}
      <div className="absolute pointer-events-none" style={{
        top: 0, right: 0,
        width: "40vw", height: "40vh",
        background: "radial-gradient(circle at top right, rgba(47,128,255,0.04) 0%, transparent 70%)",
      }} />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-9 pt-9 pb-7">
        <div>
          <div style={{ fontSize: 10, fontWeight: 200, letterSpacing: "0.35em", color: "rgba(255,255,255,0.18)", marginBottom: 6 }}>
            QLVIN OS
          </div>
          <div style={{ fontSize: 24, fontWeight: 100, color: "rgba(255,255,255,0.92)", letterSpacing: "-0.02em" }}>
            Mission Control
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {[{ label: "الواجهة الرئيسية", path: "/" }, { label: "Host View", path: "/host" }].map(b => (
            <button
              key={b.path}
              onClick={() => navigate(b.path)}
              style={{
                padding: "8px 16px", borderRadius: 12,
                background: "rgba(255,255,255,0.04)",
                border: "0.5px solid rgba(255,255,255,0.08)",
                fontSize: 12, fontWeight: 200, color: "rgba(255,255,255,0.4)",
              }}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative z-10 flex-1 overflow-y-auto px-9 pb-9" style={{ scrollbarWidth: "none" }}>
        {/* KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 32 }}>
          {KPIS.map((kpi, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, duration: 0.7 }}
              style={{
                padding: "22px 20px",
                borderRadius: 20,
                background: "rgba(255,255,255,0.03)",
                border: "0.5px solid rgba(255,255,255,0.06)",
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 200, color: "rgba(255,255,255,0.28)", marginBottom: 10 }}>
                {kpi.label}
              </div>
              <div style={{ fontSize: 28, fontWeight: 100, color: kpi.color, letterSpacing: "-0.03em", marginBottom: 6 }}>
                {kpi.value}
              </div>
              <div style={{ fontSize: 10, fontWeight: 200, color: "rgba(255,255,255,0.18)" }}>
                {kpi.sub}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Section label */}
        <div style={{ fontSize: 10, fontWeight: 200, letterSpacing: "0.35em", color: "rgba(255,255,255,0.18)", marginBottom: 14 }}>
          الوحدات
        </div>

        {/* Units grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
          {UNITS.map((unit, i) => {
            const s = STATE_MAP[unit.state];
            return (
              <motion.div
                key={unit.id}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + i * 0.05, duration: 0.6 }}
                style={{
                  padding: "20px",
                  borderRadius: 20,
                  background: "rgba(255,255,255,0.03)",
                  border: "0.5px solid rgba(255,255,255,0.06)",
                  borderLeft: `2px solid ${s.color}60`,
                  cursor: "pointer",
                  transition: "background 0.2s",
                }}
                whileHover={{ backgroundColor: "rgba(255,255,255,0.055)" }}
              >
                {/* State */}
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
                  <motion.span
                    animate={unit.state === "OCCUPIED" || unit.state === "CHECKOUT_SOON"
                      ? { opacity: [1, 0.35, 1] }
                      : { opacity: 1 }}
                    transition={{ duration: 2.8, repeat: Infinity }}
                    style={{ width: 6, height: 6, borderRadius: "50%", background: s.color, flexShrink: 0 }}
                  />
                  <span style={{ fontSize: 10, fontWeight: 400, color: s.color, letterSpacing: "0.03em" }}>
                    {s.ar}
                  </span>
                </div>

                {/* Unit ID */}
                <div style={{ fontSize: 17, fontWeight: 100, color: "rgba(255,255,255,0.9)", letterSpacing: "-0.01em", marginBottom: 4 }}>
                  {unit.id}
                </div>

                {/* Guest */}
                <div style={{ fontSize: 11, fontWeight: 200, color: "rgba(255,255,255,0.28)", marginBottom: 12 }}>
                  {unit.guest || "—"}
                </div>

                {/* Checkout */}
                {unit.checkout && (
                  <div style={{ fontSize: 10, fontWeight: 200, color: "rgba(255,255,255,0.18)", marginBottom: 12 }}>
                    {unit.checkout}
                  </div>
                )}

                {/* Health bar */}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ flex: 1, height: 1, borderRadius: 1, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                    <div style={{
                      height: "100%",
                      width: `${unit.health}%`,
                      background: unit.health > 95 ? "rgba(74,222,128,0.5)" : "rgba(248,113,113,0.5)",
                      borderRadius: 1,
                    }} />
                  </div>
                  <span style={{ fontSize: 9, fontWeight: 200, color: "rgba(255,255,255,0.18)" }}>{unit.health}%</span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Alert */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "14px 18px", borderRadius: 16,
            background: "rgba(248,113,113,0.05)",
            border: "0.5px solid rgba(248,113,113,0.12)",
          }}
        >
          <AlertTriangle size={13} style={{ color: "#F87171", flexShrink: 0 }} />
          <div style={{ fontSize: 12, fontWeight: 200 }}>
            <span style={{ color: "#F87171" }}>تنبيه · </span>
            <span style={{ color: "rgba(255,255,255,0.38)" }}>جهاز B-201 بطارية منخفضة — يحتاج إعادة شحن</span>
          </div>
        </motion.div>
      </div>

      <DevStatePicker />
    </div>
  );
}
