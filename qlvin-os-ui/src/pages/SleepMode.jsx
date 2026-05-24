import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Moon } from "lucide-react";

export default function SleepMode() {
  const navigate = useNavigate();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  const timeStr = now.toLocaleTimeString("en-US", {
    hour: "2-digit", minute: "2-digit", hour12: false,
  });

  return (
    <div
      className="relative w-full h-screen overflow-hidden flex flex-col items-center justify-center"
      style={{ background: "#040406", cursor: "pointer" }}
      onClick={() => navigate("/")}
    >
      {/* Ultra subtle ambient */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "50%", left: "50%", transform: "translate(-50%, -50%)",
          width: "50vw", height: "50vw",
          background: "radial-gradient(circle, rgba(90,70,140,0.035) 0%, transparent 70%)",
        }}
      />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2.5, ease: [0.4, 0, 0.2, 1] }}
        className="relative z-10 text-center"
      >
        <motion.div
          animate={{ opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="flex justify-center mb-10"
        >
          <Moon size={22} style={{ color: "rgba(255,255,255,0.15)" }} />
        </motion.div>

        <div
          className="text-white font-thin"
          style={{
            fontSize: "clamp(56px, 13vw, 130px)",
            letterSpacing: "-0.04em",
            lineHeight: 1,
            opacity: 0.55,
          }}
        >
          {timeStr}
        </div>

        <div
          className="mt-8 font-light tracking-[0.45em] uppercase"
          style={{ fontSize: 10, color: "rgba(255,255,255,0.1)" }}
        >
          لا تزعج
        </div>
      </motion.div>

      {/* Tap hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3, duration: 2 }}
        className="absolute bottom-10 font-light"
        style={{ fontSize: 10, color: "rgba(255,255,255,0.08)", letterSpacing: "0.2em" }}
      >
        اضغط للعودة
      </motion.div>
    </div>
  );
}
