import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

export default function SleepMode() {
  const navigate = useNavigate();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });

  return (
    <div
      className="relative w-full h-screen overflow-hidden flex flex-col items-center justify-center"
      style={{ background: "#030305", cursor: "pointer" }}
      onClick={() => navigate("/")}
    >
      {/* Ultra-faint purple ghost */}
      <div className="absolute pointer-events-none" style={{
        top: "50%", left: "50%", transform: "translate(-50%, -50%)",
        width: "55vw", height: "55vw",
        background: "radial-gradient(circle, rgba(100,80,160,0.03) 0%, transparent 70%)",
      }} />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 3, ease: "easeInOut" }}
        className="relative z-10 text-center select-none"
      >
        {/* Barely-visible moon */}
        <motion.div
          animate={{ opacity: [0.25, 0.45, 0.25] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          style={{ marginBottom: 36, fontSize: 18, color: "rgba(255,255,255,0.1)" }}
        >
          ☽
        </motion.div>

        {/* Time — intentionally subtle */}
        <div style={{
          fontSize: "clamp(64px, 15vw, 148px)",
          fontWeight: 100,
          letterSpacing: "-0.045em",
          color: "rgba(255,255,255,0.5)",
          lineHeight: 1,
          fontVariantNumeric: "tabular-nums",
        }}>
          {timeStr}
        </div>

        <div style={{
          marginTop: 24,
          fontSize: 10,
          fontWeight: 200,
          letterSpacing: "0.45em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.08)",
        }}>
          لا تزعج
        </div>
      </motion.div>

      {/* Tap hint — appears after 4 seconds */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 4, duration: 2 }}
        style={{
          position: "absolute",
          bottom: 40,
          fontSize: 10,
          fontWeight: 200,
          letterSpacing: "0.22em",
          color: "rgba(255,255,255,0.07)",
        }}
      >
        اضغط للعودة
      </motion.div>
    </div>
  );
}
