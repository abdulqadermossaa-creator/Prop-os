import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Volume2, Lightbulb, Thermometer } from "lucide-react";

export default function MatchMode() {
  const navigate = useNavigate();
  const [minute, setMinute] = useState(67);
  const [score]  = useState({ home: 1, away: 0 });

  useEffect(() => {
    const t = setInterval(() => setMinute(p => (p < 90 ? p + 1 : p)), 60_000);
    return () => clearInterval(t);
  }, []);

  return (
    <div
      className="relative w-full h-screen overflow-hidden flex flex-col"
      style={{ background: "#05080A" }}
    >
      {/* Green ambient */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "25%", left: "50%", transform: "translateX(-50%)",
          width: "85vw", height: "50vh",
          background: "radial-gradient(ellipse, rgba(52,160,44,0.06) 0%, transparent 70%)",
        }}
      />

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-6 pt-8">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2"
          style={{ color: "rgba(255,255,255,0.28)" }}
        >
          <ChevronLeft size={15} />
          <span className="font-light" style={{ fontSize: 12 }}>الرئيسية</span>
        </button>

        {/* Live badge */}
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-full"
          style={{ background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.18)" }}
        >
          <motion.span
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.4, repeat: Infinity }}
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: "#4ADE80" }}
          />
          <span className="font-medium" style={{ fontSize: 11, color: "#4ADE80" }}>
            Match Mode
          </span>
        </div>
      </div>

      {/* Score */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center">
        {/* Teams */}
        <div className="flex items-center gap-14 mb-10">
          <div className="text-center">
            <div className="font-light tracking-widest mb-4" style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
              الهلال
            </div>
            <div
              className="text-white font-thin"
              style={{ fontSize: "clamp(64px, 14vw, 112px)", letterSpacing: "-0.04em", lineHeight: 1 }}
            >
              {score.home}
            </div>
          </div>

          <div className="font-thin" style={{ fontSize: 28, color: "rgba(255,255,255,0.12)" }}>—</div>

          <div className="text-center">
            <div className="font-light tracking-widest mb-4" style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
              النصر
            </div>
            <div
              className="font-thin"
              style={{
                fontSize: "clamp(64px, 14vw, 112px)",
                letterSpacing: "-0.04em",
                lineHeight: 1,
                color: "rgba(255,255,255,0.3)",
              }}
            >
              {score.away}
            </div>
          </div>
        </div>

        {/* Minute */}
        <div
          className="flex items-center gap-2 px-5 py-2.5 rounded-full mb-14"
          style={{ background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.15)" }}
        >
          <span className="font-light" style={{ fontSize: 13, color: "#4ADE80" }}>
            الدقيقة {minute}′
          </span>
        </div>

        {/* Quick controls */}
        <div className="flex gap-3">
          {[
            { icon: Volume2,     label: "الصوت",   value: "مرتفع" },
            { icon: Lightbulb,   label: "الإضاءة", value: "مريح" },
            { icon: Thermometer, label: "التكييف", value: "22°C" },
          ].map((c, i) => (
            <div
              key={i}
              className="flex flex-col items-center gap-2 px-6 py-4 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <c.icon size={15} style={{ color: "rgba(255,255,255,0.35)" }} />
              <span className="text-white font-light" style={{ fontSize: 12 }}>{c.label}</span>
              <span className="font-light" style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>{c.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
