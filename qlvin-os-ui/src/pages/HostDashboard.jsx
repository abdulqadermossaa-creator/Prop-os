import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Calendar } from "lucide-react";

const BOOKINGS = [
  { guest: "أحمد العمري",   unit: "A-204", checkin: "22 مايو", checkout: "27 مايو", nights: 5, revenue: 2_100, active: true  },
  { guest: "سارة المطيري",  unit: "A-101", checkin: "24 مايو", checkout: "26 مايو", nights: 2, revenue: 840,   active: true  },
  { guest: "منصور الغامدي", unit: "C-101", checkin: "23 مايو", checkout: "31 مايو", nights: 8, revenue: 3_360, active: true  },
  { guest: "نورة القحطاني", unit: "B-204", checkin: "22 مايو", checkout: "24 مايو", nights: 2, revenue: 980,   active: false },
  { guest: "خالد السبيعي",  unit: "B-101", checkin: "26 مايو", checkout: "29 مايو", nights: 3, revenue: 1_260, active: false },
];

const STATS = [
  { label: "إيراد الأسبوع", value: "8,540", unit: "ريال",  color: "#C8A96A" },
  { label: "حجوزات نشطة",   value: "3",     unit: "حجز",   color: "#60A5FA" },
  { label: "للتنظيف غداً",  value: "2",     unit: "وحدات", color: "#A78BFA" },
];

export default function HostDashboard() {
  const navigate = useNavigate();

  return (
    <div
      className="relative w-full h-screen overflow-hidden flex flex-col"
      style={{ background: "#07080A" }}
    >
      {/* Ambient */}
      <div className="absolute pointer-events-none" style={{
        bottom: 0, right: 0,
        width: "40vw", height: "40vh",
        background: "radial-gradient(circle at bottom right, rgba(200,169,106,0.04) 0%, transparent 70%)",
      }} />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-8 pt-8 pb-5">
        <button
          onClick={() => navigate("/dashboard")}
          style={{ display: "flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,0.22)" }}
        >
          <ChevronLeft size={14} />
          <span style={{ fontSize: 12, fontWeight: 200 }}>Mission Control</span>
        </button>
        <div style={{ fontSize: 10, fontWeight: 200, letterSpacing: "0.32em", color: "rgba(255,255,255,0.15)" }}>
          Host Dashboard
        </div>
        <div style={{ width: 100 }} />
      </div>

      <div
        className="relative z-10 flex-1 overflow-y-auto px-8 pb-10"
        style={{ scrollbarWidth: "none" }}
      >
        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 32 }}>
          {STATS.map((s, i) => (
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
              <div style={{ fontSize: 11, fontWeight: 200, color: "rgba(255,255,255,0.25)", marginBottom: 10 }}>
                {s.label}
              </div>
              <div style={{ fontSize: 26, fontWeight: 100, color: s.color, letterSpacing: "-0.025em", marginBottom: 4 }}>
                {s.value}
              </div>
              <div style={{ fontSize: 10, fontWeight: 200, color: "rgba(255,255,255,0.18)" }}>
                {s.unit}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bookings label */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8, marginBottom: 14,
        }}>
          <Calendar size={11} style={{ color: "rgba(255,255,255,0.2)" }} />
          <span style={{ fontSize: 10, fontWeight: 200, letterSpacing: "0.35em", color: "rgba(255,255,255,0.18)" }}>
            الحجوزات
          </span>
        </div>

        {/* Bookings list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {BOOKINGS.map((b, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.18 + i * 0.07, duration: 0.6 }}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "18px 20px", borderRadius: 18,
                background: b.active ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)",
                border: `0.5px solid ${b.active ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.04)"}`,
                borderLeft: b.active ? "2px solid rgba(200,169,106,0.4)" : "2px solid rgba(255,255,255,0.06)",
              }}
            >
              <div>
                <div style={{
                  fontSize: 14, fontWeight: 200,
                  color: b.active ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.3)",
                  marginBottom: 4,
                }}>
                  {b.guest}
                </div>
                <div style={{ fontSize: 11, fontWeight: 200, color: "rgba(255,255,255,0.22)" }}>
                  {b.unit} · {b.checkin} → {b.checkout}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{
                  fontSize: 14, fontWeight: 200,
                  color: b.active ? "#C8A96A" : "rgba(200,169,106,0.3)",
                  marginBottom: 3,
                }}>
                  {b.revenue.toLocaleString()}
                </div>
                <div style={{ fontSize: 10, fontWeight: 200, color: "rgba(255,255,255,0.18)" }}>
                  {b.nights} ليالٍ
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
