import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Wifi, MapPin, Clock, ChevronRight } from "lucide-react";
import { usePropertyState } from "../context/PropertyStateEngine";

export default function WelcomeScene() {
  const navigate = useNavigate();
  const { guest, scenario } = usePropertyState();
  const [showWifi, setShowWifi] = useState(false);
  const [phase, setPhase] = useState(0); // 0=greeting, 1=info

  const accent = scenario?.accent || "#C8A96A";

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 2200);
    const t2 = setTimeout(() => navigate("/"), 18000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [navigate]);

  return (
    <div
      className="relative w-full h-screen overflow-hidden flex flex-col items-center justify-center"
      style={{ background: "#070705" }}
      onClick={() => navigate("/")}
    >
      {/* Warm ambient */}
      <div className="absolute pointer-events-none" style={{
        top: "10%", left: "50%", transform: "translateX(-50%)",
        width: "70vw", height: "50vh",
        background: `radial-gradient(ellipse, ${accent}08 0%, transparent 70%)`,
      }} />
      <div className="absolute pointer-events-none" style={{
        bottom: 0, left: "50%", transform: "translateX(-50%)",
        width: "50vw", height: "30vh",
        background: `radial-gradient(ellipse, ${accent}05 0%, transparent 70%)`,
      }} />

      <motion.div
        className="relative z-10 flex flex-col items-center text-center"
        style={{ maxWidth: 420, width: "100%", padding: "0 40px" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Q mark — entrance */}
        <motion.div
          initial={{ opacity: 0, scale: 0.7, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1.4, ease: [0.34, 1.56, 0.64, 1] }}
          style={{
            width: 72, height: 72, borderRadius: 20,
            background: `${accent}0E`,
            border: `0.5px solid ${accent}28`,
            display: "flex", alignItems: "center", justifyContent: "center",
            marginBottom: 36,
          }}
        >
          <span style={{ fontSize: 32, fontWeight: 100, color: accent }}>Q</span>
        </motion.div>

        {/* أهلاً */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 1.2 }}
          style={{ fontSize: 12, fontWeight: 200, letterSpacing: "0.35em", color: "rgba(255,255,255,0.25)", marginBottom: 10 }}
        >
          أهلاً وسهلاً
        </motion.div>

        {/* Guest name */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 1.3, ease: [0.16, 1, 0.3, 1] }}
          style={{
            fontSize: "clamp(34px, 6vw, 48px)",
            fontWeight: 100,
            color: "rgba(255,255,255,0.92)",
            letterSpacing: "-0.02em",
            marginBottom: 10,
          }}
        >
          {guest.name}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 1 }}
          style={{ fontSize: 13, fontWeight: 200, color: "rgba(255,255,255,0.22)", marginBottom: 44, letterSpacing: "0.04em" }}
        >
          مرحباً بك في إقامتك · {guest.unitId}
        </motion.div>

        {/* Info cards — appear after phase 1 */}
        <AnimatePresence>
          {phase === 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: [0.4, 0, 0.2, 1] }}
              style={{ width: "100%", display: "flex", flexDirection: "column", gap: 10 }}
            >
              {[
                {
                  icon: Wifi,
                  label: "الإنترنت",
                  value: showWifi ? "qlvin-A204" : "اضغط للكشف",
                  sub: showWifi ? "كلمة المرور: 2026@secure" : undefined,
                  action: () => setShowWifi(true),
                },
                {
                  icon: MapPin,
                  label: guest.building,
                  value: `الوحدة ${guest.unitId} · الدور الثاني`,
                  action: null,
                },
                {
                  icon: Clock,
                  label: "وقت المغادرة",
                  value: `${guest.checkoutDate} · ${guest.checkoutTime}`,
                  action: () => navigate("/checkout"),
                },
              ].map((item, i) => (
                <button
                  key={i}
                  onClick={item.action || undefined}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "16px 20px",
                    borderRadius: 18,
                    background: "rgba(255,255,255,0.05)",
                    border: "0.5px solid rgba(255,255,255,0.08)",
                    backdropFilter: "blur(32px)",
                    textAlign: "left",
                    cursor: item.action ? "pointer" : "default",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <item.icon size={14} style={{ color: "rgba(255,255,255,0.32)" }} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 300, color: "rgba(255,255,255,0.8)" }}>{item.label}</div>
                      <div style={{ fontSize: 11, fontWeight: 200, color: "rgba(255,255,255,0.28)", marginTop: 2 }}>{item.value}</div>
                      {item.sub && (
                        <div style={{ fontSize: 11, fontWeight: 200, color: accent, marginTop: 1 }}>{item.sub}</div>
                      )}
                    </div>
                  </div>
                  {item.action && <ChevronRight size={13} style={{ color: "rgba(255,255,255,0.18)" }} />}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Skip hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3.5, duration: 1.5 }}
          style={{ marginTop: 40, fontSize: 11, fontWeight: 200, letterSpacing: "0.2em", color: "rgba(255,255,255,0.12)" }}
        >
          اضغط للمتابعة
        </motion.div>
      </motion.div>
    </div>
  );
}
