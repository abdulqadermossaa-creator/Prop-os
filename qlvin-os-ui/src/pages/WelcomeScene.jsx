import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Wifi, MapPin, Clock, ChevronRight } from "lucide-react";

export default function WelcomeScene() {
  const navigate = useNavigate();
  const [showWifi, setShowWifi] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => navigate("/"), 16000);
    return () => clearTimeout(t);
  }, [navigate]);

  const info = [
    {
      icon: Wifi,
      label: "الإنترنت",
      value: showWifi ? "qlvin-A204" : "اضغط للكشف",
      sub: showWifi ? "كلمة المرور: 2026@secure" : "محمي",
      action: () => setShowWifi(true),
    },
    {
      icon: MapPin,
      label: "الموقع",
      value: "الوحدة A-204",
      sub: "الدور الثاني · برج القلوين · الرياض",
      action: null,
    },
    {
      icon: Clock,
      label: "وقت المغادرة",
      value: "الجمعة 11:00 ص",
      sub: "3 ليالٍ متبقية",
      action: () => navigate("/checkout"),
    },
  ];

  return (
    <div
      className="relative w-full h-screen overflow-hidden flex flex-col items-center justify-center"
      style={{ background: "#07090E" }}
    >
      {/* Warm ambient glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "15%", left: "50%", transform: "translateX(-50%)",
          width: "65vw", height: "45vh",
          background: "radial-gradient(ellipse, rgba(200,169,106,0.07) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 w-full max-w-md px-8 flex flex-col items-center text-center">
        {/* Q mark */}
        <motion.div
          initial={{ opacity: 0, scale: 0.75 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: [0.34, 1.56, 0.64, 1] }}
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-8"
          style={{
            background: "rgba(200,169,106,0.09)",
            border: "1px solid rgba(200,169,106,0.18)",
          }}
        >
          <span style={{ fontSize: 28, fontWeight: 100, color: "#C8A96A" }}>Q</span>
        </motion.div>

        {/* Greeting label */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 1 }}
          className="font-light tracking-[0.32em] mb-3"
          style={{ fontSize: 12, color: "rgba(255,255,255,0.28)" }}
        >
          أهلاً وسهلاً
        </motion.p>

        {/* Guest name */}
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 1.1 }}
          className="text-white font-thin mb-3"
          style={{ fontSize: "clamp(36px, 7vw, 52px)", letterSpacing: "-0.025em" }}
        >
          أحمد العمري
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="font-light mb-12"
          style={{ fontSize: 13, color: "rgba(255,255,255,0.22)", letterSpacing: "0.05em" }}
        >
          مرحباً بك في إقامتك
        </motion.p>

        {/* Info cards */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.9 }}
          className="w-full space-y-3"
        >
          {info.map((item, i) => (
            <button
              key={i}
              onClick={item.action}
              className="w-full flex items-center justify-between px-5 py-4 rounded-2xl text-left transition-all"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)",
                cursor: item.action ? "pointer" : "default",
              }}
            >
              <div className="flex items-center gap-3.5">
                <item.icon size={15} style={{ color: "rgba(255,255,255,0.35)" }} />
                <div>
                  <div className="text-white font-medium" style={{ fontSize: 13 }}>{item.label}</div>
                  <div className="font-light mt-0.5" style={{ fontSize: 11, color: "rgba(255,255,255,0.28)" }}>
                    {item.value}
                  </div>
                  {item.sub && (
                    <div className="font-light mt-0.5" style={{ fontSize: 10, color: "rgba(255,255,255,0.18)" }}>
                      {item.sub}
                    </div>
                  )}
                </div>
              </div>
              {item.action && (
                <ChevronRight size={13} style={{ color: "rgba(255,255,255,0.18)" }} />
              )}
            </button>
          ))}
        </motion.div>

        {/* Skip */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.5, duration: 1 }}
          onClick={() => navigate("/")}
          className="mt-10 font-light tracking-widest transition-colors"
          style={{ fontSize: 11, color: "rgba(255,255,255,0.18)" }}
          onMouseEnter={e => e.target.style.color = "rgba(255,255,255,0.4)"}
          onMouseLeave={e => e.target.style.color = "rgba(255,255,255,0.18)"}
        >
          الواجهة الرئيسية ←
        </motion.button>
      </div>
    </div>
  );
}
