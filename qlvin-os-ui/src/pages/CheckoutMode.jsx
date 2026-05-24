import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Circle, CheckCircle2 } from "lucide-react";

const CHECKLIST = [
  { id: "keys",      label: "تسليم المفتاح أو البطاقة الذكية" },
  { id: "items",     label: "المتعلقات الشخصية كاملة" },
  { id: "windows",   label: "إغلاق النوافذ" },
  { id: "ac",        label: "إيقاف التكييف والأجهزة" },
  { id: "checkout",  label: "تأكيد المغادرة" },
];

export default function CheckoutMode() {
  const navigate = useNavigate();
  const [done, setDone] = useState({});
  const allDone = CHECKLIST.every(c => done[c.id]);

  const toggle = id => setDone(d => ({ ...d, [id]: !d[id] }));

  return (
    <div
      className="relative w-full h-screen overflow-hidden flex flex-col"
      style={{ background: "#07090E" }}
    >
      {/* Warm glow at bottom */}
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: 0, left: "50%", transform: "translateX(-50%)",
          width: "80vw", height: "45vh",
          background: "radial-gradient(ellipse at bottom, rgba(200,169,106,0.05) 0%, transparent 70%)",
        }}
      />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-6 pt-8 pb-4">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2"
          style={{ color: "rgba(255,255,255,0.28)" }}
        >
          <ChevronLeft size={15} />
          <span className="font-light" style={{ fontSize: 12 }}>الرئيسية</span>
        </button>
        <div className="font-light tracking-[0.28em]" style={{ fontSize: 10, color: "rgba(255,255,255,0.18)" }}>
          Checkout
        </div>
        <div style={{ width: 64 }} />
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 px-6 overflow-y-auto pb-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.4, 0, 0.2, 1] }}
        >
          {/* Time */}
          <div className="mb-10">
            <div className="font-light tracking-[0.3em] mb-3" style={{ fontSize: 11, color: "rgba(255,255,255,0.22)" }}>
              وقت المغادرة
            </div>
            <div
              className="text-white font-thin mb-1"
              style={{ fontSize: "clamp(52px, 12vw, 88px)", letterSpacing: "-0.04em", lineHeight: 1 }}
            >
              11:00
            </div>
            <div className="font-light" style={{ fontSize: 13, color: "rgba(255,255,255,0.28)" }}>
              الجمعة، 27 مايو 2026
            </div>
          </div>

          {/* Remaining time */}
          <div
            className="flex items-center gap-3 px-5 py-3.5 rounded-2xl mb-8"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <div className="font-light" style={{ fontSize: 13, color: "rgba(255,255,255,0.45)" }}>
              متبقي · 8 ساعات و 32 دقيقة
            </div>
          </div>

          {/* Checklist */}
          <div className="font-light tracking-widest mb-4" style={{ fontSize: 10, color: "rgba(255,255,255,0.2)" }}>
            قائمة المغادرة
          </div>
          <div className="space-y-2.5 mb-10">
            {CHECKLIST.map(item => (
              <button
                key={item.id}
                onClick={() => toggle(item.id)}
                className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-left transition-all"
                style={{
                  background: done[item.id] ? "rgba(200,169,106,0.06)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${done[item.id] ? "rgba(200,169,106,0.18)" : "rgba(255,255,255,0.07)"}`,
                }}
              >
                {done[item.id]
                  ? <CheckCircle2 size={16} style={{ color: "#C8A96A", flexShrink: 0 }} />
                  : <Circle      size={16} style={{ color: "rgba(255,255,255,0.15)", flexShrink: 0 }} />
                }
                <span
                  className="font-light"
                  style={{
                    fontSize: 13,
                    color: done[item.id] ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.7)",
                    textDecoration: done[item.id] ? "line-through" : "none",
                  }}
                >
                  {item.label}
                </span>
              </button>
            ))}
          </div>

          {/* Confirm button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/")}
            className="w-full py-4 rounded-2xl font-medium transition-all"
            style={{
              background: allDone ? "rgba(200,169,106,0.14)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${allDone ? "rgba(200,169,106,0.28)" : "rgba(255,255,255,0.07)"}`,
              color: allDone ? "#C8A96A" : "rgba(255,255,255,0.25)",
              fontSize: 14,
            }}
          >
            {allDone ? "تأكيد المغادرة" : "أكمل القائمة أولاً"}
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
