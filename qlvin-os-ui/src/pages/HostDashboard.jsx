import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Calendar } from "lucide-react";

const BOOKINGS = [
  { guest: "أحمد العمري",   unit: "A-204", checkin: "22 مايو", checkout: "27 مايو", nights: 5, revenue: 2_100, active: true },
  { guest: "سارة المطيري",  unit: "A-101", checkin: "24 مايو", checkout: "26 مايو", nights: 2, revenue: 840,   active: true },
  { guest: "منصور الغامدي", unit: "C-101", checkin: "23 مايو", checkout: "31 مايو", nights: 8, revenue: 3_360, active: true },
  { guest: "نورة القحطاني", unit: "B-204", checkin: "22 مايو", checkout: "24 مايو", nights: 2, revenue: 980,   active: false },
  { guest: "خالد السبيعي",  unit: "B-101", checkin: "26 مايو", checkout: "29 مايو", nights: 3, revenue: 1_260, active: false },
];

const STATS = [
  { label: "إيراد الأسبوع", value: "8,540", unit: "ريال",    color: "#C8A96A" },
  { label: "حجوزات نشطة",   value: "3",     unit: "حجز",     color: "#60A5FA" },
  { label: "للتنظيف غداً",  value: "2",     unit: "وحدات",   color: "#A78BFA" },
];

export default function HostDashboard() {
  const navigate = useNavigate();

  return (
    <div
      className="relative w-full h-screen overflow-hidden flex flex-col"
      style={{ background: "#07090E" }}
    >
      {/* Ambient */}
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: 0, right: 0,
          width: "40vw", height: "40vh",
          background: "radial-gradient(circle at bottom right, rgba(200,169,106,0.04) 0%, transparent 70%)",
        }}
      />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-6 pt-8 pb-4">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2"
          style={{ color: "rgba(255,255,255,0.28)" }}
        >
          <ChevronLeft size={15} />
          <span className="font-light" style={{ fontSize: 12 }}>Mission Control</span>
        </button>
        <div className="font-light tracking-[0.28em]" style={{ fontSize: 10, color: "rgba(255,255,255,0.18)" }}>
          Host Dashboard
        </div>
        <div style={{ width: 100 }} />
      </div>

      <div className="relative z-10 flex-1 overflow-y-auto px-6 pb-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {STATS.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, duration: 0.6 }}
              className="px-4 py-5 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div className="font-light mb-2" style={{ fontSize: 10, color: "rgba(255,255,255,0.28)" }}>
                {s.label}
              </div>
              <div className="font-light mb-0.5" style={{ fontSize: 24, color: s.color, letterSpacing: "-0.02em" }}>
                {s.value}
              </div>
              <div className="font-light" style={{ fontSize: 10, color: "rgba(255,255,255,0.18)" }}>
                {s.unit}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bookings */}
        <div className="flex items-center gap-2 mb-4">
          <Calendar size={12} style={{ color: "rgba(255,255,255,0.22)" }} />
          <span className="font-light tracking-widest" style={{ fontSize: 10, color: "rgba(255,255,255,0.2)" }}>
            الحجوزات
          </span>
        </div>

        <div className="space-y-2.5">
          {BOOKINGS.map((b, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.07, duration: 0.55 }}
              className="flex items-center justify-between px-5 py-4 rounded-2xl"
              style={{
                background: b.active ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)",
                border: `1px solid ${b.active ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.04)"}`,
              }}
            >
              <div>
                <div
                  className="text-white font-light"
                  style={{ fontSize: 13, opacity: b.active ? 1 : 0.45 }}
                >
                  {b.guest}
                </div>
                <div className="font-light mt-0.5" style={{ fontSize: 11, color: "rgba(255,255,255,0.22)" }}>
                  {b.unit} · {b.checkin} → {b.checkout}
                </div>
              </div>
              <div className="text-right">
                <div
                  className="font-light"
                  style={{ fontSize: 13, color: b.active ? "#C8A96A" : "rgba(200,169,106,0.4)" }}
                >
                  {b.revenue.toLocaleString("ar-SA")}
                </div>
                <div className="font-light" style={{ fontSize: 10, color: "rgba(255,255,255,0.18)" }}>
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
