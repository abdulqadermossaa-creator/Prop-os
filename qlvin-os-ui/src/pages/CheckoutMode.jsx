import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Circle, CheckCircle2 } from "lucide-react";
import { usePropertyState } from "../context/PropertyStateEngine";

const CHECKLIST = [
  { id: "keys",    label: "تسليم المفتاح أو البطاقة الذكية" },
  { id: "items",   label: "المتعلقات الشخصية كاملة"         },
  { id: "windows", label: "إغلاق النوافذ والأبواب"          },
  { id: "ac",      label: "إيقاف الأجهزة والتكييف"          },
  { id: "confirm", label: "تأكيد المغادرة مع الاستقبال"     },
];

export default function CheckoutMode() {
  const navigate = useNavigate();
  const { guest, scenario } = usePropertyState();
  const [done, setDone] = useState({});
  const accent = scenario?.accent || "#C8A96A";
  const allDone = CHECKLIST.every(c => done[c.id]);
  const doneCount = CHECKLIST.filter(c => done[c.id]).length;

  const toggle = id => setDone(d => ({ ...d, [id]: !d[id] }));

  return (
    <div
      className="relative w-full h-screen overflow-hidden flex flex-col"
      style={{ background: "#08060A" }}
    >
      {/* Bottom warm glow */}
      <div className="absolute pointer-events-none" style={{
        bottom: 0, left: "50%", transform: "translateX(-50%)",
        width: "80vw", height: "40vh",
        background: `radial-gradient(ellipse at bottom, ${accent}07 0%, transparent 70%)`,
      }} />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-7 pt-8 pb-2">
        <button
          onClick={() => navigate("/")}
          style={{ display: "flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,0.25)" }}
        >
          <ChevronLeft size={14} />
          <span style={{ fontSize: 12, fontWeight: 200 }}>الرئيسية</span>
        </button>
        <div style={{ fontSize: 10, fontWeight: 200, letterSpacing: "0.3em", color: "rgba(255,255,255,0.15)" }}>
          Checkout
        </div>
        <div style={{ width: 70 }} />
      </div>

      <div className="relative z-10 flex-1 overflow-y-auto px-7 pb-10" style={{ scrollbarWidth: "none" }}>
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Checkout time */}
          <div style={{ marginBottom: 36, paddingTop: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 200, letterSpacing: "0.32em", color: "rgba(255,255,255,0.2)", marginBottom: 12 }}>
              وقت المغادرة
            </div>
            <div style={{
              fontSize: "clamp(56px, 13vw, 90px)",
              fontWeight: 100,
              letterSpacing: "-0.045em",
              color: "rgba(255,255,255,0.9)",
              lineHeight: 1,
            }}>
              {guest.checkoutTime.split(" ")[0]}
            </div>
            <div style={{ fontSize: 14, fontWeight: 200, color: "rgba(255,255,255,0.28)", marginTop: 8 }}>
              {guest.checkoutDate}
            </div>
          </div>

          {/* Progress indicator */}
          <div style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "14px 18px",
            borderRadius: 16,
            background: "rgba(255,255,255,0.04)",
            border: "0.5px solid rgba(255,255,255,0.07)",
            marginBottom: 24,
          }}>
            <div style={{ flex: 1, height: 2, borderRadius: 1, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
              <motion.div
                animate={{ width: `${(doneCount / CHECKLIST.length) * 100}%` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                style={{ height: "100%", background: accent, borderRadius: 1 }}
              />
            </div>
            <div style={{ fontSize: 12, fontWeight: 200, color: "rgba(255,255,255,0.35)", whiteSpace: "nowrap" }}>
              {doneCount} / {CHECKLIST.length}
            </div>
          </div>

          {/* Checklist */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 32 }}>
            {CHECKLIST.map((item, i) => (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06, duration: 0.5 }}
                onClick={() => toggle(item.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "16px 18px",
                  borderRadius: 16,
                  background: done[item.id] ? `${accent}0A` : "rgba(255,255,255,0.04)",
                  border: `0.5px solid ${done[item.id] ? `${accent}22` : "rgba(255,255,255,0.07)"}`,
                  cursor: "pointer", textAlign: "left",
                  transition: "all 0.25s ease",
                }}
              >
                <AnimatePresence mode="wait">
                  {done[item.id]
                    ? <motion.div key="check" initial={{ scale: 0.6 }} animate={{ scale: 1 }}>
                        <CheckCircle2 size={16} style={{ color: accent }} />
                      </motion.div>
                    : <motion.div key="circle" initial={{ scale: 0.6 }} animate={{ scale: 1 }}>
                        <Circle size={16} style={{ color: "rgba(255,255,255,0.15)" }} />
                      </motion.div>
                  }
                </AnimatePresence>
                <span style={{
                  fontSize: 13, fontWeight: 200,
                  color: done[item.id] ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.75)",
                  textDecoration: done[item.id] ? "line-through" : "none",
                  transition: "all 0.25s",
                }}>
                  {item.label}
                </span>
              </motion.button>
            ))}
          </div>

          {/* Confirm button */}
          <motion.button
            whileHover={allDone ? { scale: 1.02 } : {}}
            whileTap={allDone ? { scale: 0.98 } : {}}
            onClick={() => allDone && navigate("/")}
            style={{
              width: "100%",
              padding: "18px",
              borderRadius: 18,
              background: allDone ? `${accent}14` : "rgba(255,255,255,0.03)",
              border: `0.5px solid ${allDone ? `${accent}30` : "rgba(255,255,255,0.06)"}`,
              fontSize: 14, fontWeight: allDone ? 300 : 200,
              color: allDone ? accent : "rgba(255,255,255,0.2)",
              cursor: allDone ? "pointer" : "default",
              transition: "all 0.4s ease",
            }}
          >
            {allDone ? "تأكيد المغادرة" : `أكمل القائمة (${CHECKLIST.length - doneCount} متبقٍ)`}
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
