import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, LayoutGrid } from "lucide-react";

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
  { label: "وحدات شغّالة", value: "4/8",   sub: "3 متاحة",          color: "#60A5FA" },
  { label: "إيراد اليوم",  value: "4,200", sub: "ريال سعودي",       color: "#4ADE80" },
  { label: "تنبيهات",      value: "1",     sub: "جهاز منخفض",       color: "#F87171" },
];

export default function FounderDashboard() {
  const navigate = useNavigate();

  return (
    <div
      className="relative w-full h-screen overflow-hidden flex flex-col"
      style={{ background: "#07090E" }}
    >
      {/* Subtle ambient */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: 0, right: 0,
          width: "40vw", height: "40vh",
          background: "radial-gradient(circle at top right, rgba(47,128,255,0.04) 0%, transparent 70%)",
        }}
      />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-8 pt-8 pb-6">
        <div>
          <div className="font-light tracking-[0.32em] mb-1" style={{ fontSize: 10, color: "rgba(255,255,255,0.2)" }}>
            QLVIN OS
          </div>
          <div className="text-white font-light" style={{ fontSize: 22, letterSpacing: "-0.015em" }}>
            Mission Control
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 rounded-xl font-light transition-colors"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.07)",
              fontSize: 12,
              color: "rgba(255,255,255,0.35)",
            }}
          >
            الواجهة الرئيسية
          </button>
          <button
            onClick={() => navigate("/host")}
            className="px-4 py-2 rounded-xl font-light transition-colors"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.07)",
              fontSize: 12,
              color: "rgba(255,255,255,0.35)",
            }}
          >
            Host View
          </button>
        </div>
      </div>

      <div className="relative z-10 flex-1 overflow-y-auto px-8 pb-8">
        {/* KPIs */}
        <div className="grid grid-cols-4 gap-3 mb-8">
          {KPIS.map((kpi, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, duration: 0.6 }}
              className="px-5 py-5 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div className="font-light mb-2" style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
                {kpi.label}
              </div>
              <div className="font-light mb-1" style={{ fontSize: 26, color: kpi.color, letterSpacing: "-0.025em" }}>
                {kpi.value}
              </div>
              <div className="font-light" style={{ fontSize: 10, color: "rgba(255,255,255,0.18)" }}>
                {kpi.sub}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Units */}
        <div className="flex items-center gap-2 mb-4">
          <LayoutGrid size={12} style={{ color: "rgba(255,255,255,0.22)" }} />
          <span className="font-light tracking-widest" style={{ fontSize: 10, color: "rgba(255,255,255,0.2)" }}>
            الوحدات
          </span>
        </div>

        <div className="grid grid-cols-4 gap-3">
          {UNITS.map((unit, i) => {
            const s = STATE_MAP[unit.state];
            return (
              <motion.div
                key={unit.id}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.18 + i * 0.05, duration: 0.55 }}
                className="p-5 rounded-2xl cursor-pointer transition-all"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                whileHover={{ background: "rgba(255,255,255,0.055)" }}
                onClick={() => navigate("/")}
              >
                {/* State */}
                <div className="flex items-center gap-1.5 mb-4">
                  <motion.span
                    animate={unit.state === "OCCUPIED" || unit.state === "CHECKOUT_SOON"
                      ? { opacity: [1, 0.4, 1] }
                      : { opacity: 1 }
                    }
                    transition={{ duration: 2.5, repeat: Infinity }}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: s.color }}
                  />
                  <span className="font-medium" style={{ fontSize: 10, color: s.color }}>{s.ar}</span>
                </div>

                {/* Unit ID */}
                <div className="text-white font-light mb-1" style={{ fontSize: 16, letterSpacing: "-0.01em" }}>
                  {unit.id}
                </div>

                {/* Guest */}
                <div className="font-light mb-3" style={{ fontSize: 11, color: "rgba(255,255,255,0.28)" }}>
                  {unit.guest || "—"}
                </div>

                {/* Checkout */}
                {unit.checkout && (
                  <div className="font-light mb-3" style={{ fontSize: 10, color: "rgba(255,255,255,0.18)" }}>
                    {unit.checkout}
                  </div>
                )}

                {/* Device health bar */}
                <div className="flex items-center gap-2 mt-auto">
                  <div className="flex-1 h-px rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${unit.health}%`,
                        background: unit.health > 95 ? "rgba(74,222,128,0.6)" : "rgba(248,113,113,0.6)",
                      }}
                    />
                  </div>
                  <span style={{ fontSize: 9, color: "rgba(255,255,255,0.18)" }}>{unit.health}%</span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Alert */}
        <div
          className="flex items-center gap-3 px-5 py-4 rounded-2xl mt-6"
          style={{ background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.12)" }}
        >
          <AlertTriangle size={14} style={{ color: "#F87171" }} />
          <div>
            <span className="font-medium" style={{ fontSize: 12, color: "#F87171" }}>تنبيه · </span>
            <span className="font-light" style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
              جهاز B-201 بطارية منخفضة — يحتاج إعادة شحن
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
