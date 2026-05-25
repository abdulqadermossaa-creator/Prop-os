import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Volume2, Lightbulb, Thermometer } from "lucide-react";

export default function MatchMode() {
  const navigate  = useNavigate();
  const [minute, setMinute] = useState(67);
  const [score]   = useState({ home: 1, away: 0 });

  useEffect(() => {
    const t = setInterval(() => setMinute(p => (p < 90 ? p + 1 : p)), 60_000);
    return () => clearInterval(t);
  }, []);

  return (
    <div
      className="relative w-full h-screen overflow-hidden flex flex-col"
      style={{ background: "#03070A" }}
    >
      {/* Green ambient glow */}
      <div className="absolute pointer-events-none" style={{
        top: "20%", left: "50%", transform: "translateX(-50%)",
        width: "90vw", height: "55vh",
        background: "radial-gradient(ellipse, rgba(34,197,94,0.06) 0%, transparent 70%)",
      }} />
      <div className="absolute pointer-events-none" style={{
        bottom: 0, left: "50%", transform: "translateX(-50%)",
        width: "60vw", height: "30vh",
        background: "radial-gradient(ellipse at bottom, rgba(34,197,94,0.04) 0%, transparent 70%)",
      }} />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-8 pt-8">
        <button
          onClick={() => navigate("/")}
          style={{ display: "flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,0.22)" }}
        >
          <ChevronLeft size={14} />
          <span style={{ fontSize: 12, fontWeight: 200 }}>الرئيسية</span>
        </button>

        {/* LIVE badge */}
        <div style={{
          display: "flex", alignItems: "center", gap: 7,
          padding: "7px 16px", borderRadius: 20,
          background: "rgba(34,197,94,0.08)",
          border: "0.5px solid rgba(34,197,94,0.2)",
        }}>
          <motion.span
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.2, repeat: Infinity }}
            style={{ width: 6, height: 6, borderRadius: "50%", background: "#22C55E" }}
          />
          <span style={{ fontSize: 11, fontWeight: 300, color: "#22C55E", letterSpacing: "0.08em" }}>
            Match Mode
          </span>
        </div>
      </div>

      {/* Score */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center">
        {/* Teams row */}
        <div style={{ display: "flex", alignItems: "center", gap: "10vw", marginBottom: 32 }}>
          {/* Home */}
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 11, fontWeight: 200, letterSpacing: "0.2em", color: "rgba(255,255,255,0.3)", marginBottom: 16 }}>
              الهلال
            </div>
            <div style={{
              fontSize: "clamp(72px, 17vw, 130px)",
              fontWeight: 100,
              letterSpacing: "-0.05em",
              color: "rgba(255,255,255,0.92)",
              lineHeight: 1,
              fontVariantNumeric: "tabular-nums",
            }}>
              {score.home}
            </div>
          </div>

          {/* Divider */}
          <div style={{ fontSize: 28, fontWeight: 100, color: "rgba(255,255,255,0.1)" }}>—</div>

          {/* Away */}
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 11, fontWeight: 200, letterSpacing: "0.2em", color: "rgba(255,255,255,0.3)", marginBottom: 16 }}>
              النصر
            </div>
            <div style={{
              fontSize: "clamp(72px, 17vw, 130px)",
              fontWeight: 100,
              letterSpacing: "-0.05em",
              color: "rgba(255,255,255,0.25)",
              lineHeight: 1,
              fontVariantNumeric: "tabular-nums",
            }}>
              {score.away}
            </div>
          </div>
        </div>

        {/* Minute pill */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "8px 20px", borderRadius: 20, marginBottom: 48,
          background: "rgba(34,197,94,0.07)",
          border: "0.5px solid rgba(34,197,94,0.15)",
        }}>
          <span style={{ fontSize: 13, fontWeight: 200, color: "#22C55E" }}>
            الدقيقة {minute}′
          </span>
        </div>

        {/* Quick controls */}
        <div style={{ display: "flex", gap: 12 }}>
          {[
            { icon: Volume2,     label: "الصوت",    value: "مرتفع" },
            { icon: Lightbulb,   label: "الإضاءة",  value: "مريح"  },
            { icon: Thermometer, label: "التكييف",  value: "22°C"  },
          ].map((c, i) => (
            <div
              key={i}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                padding: "18px 24px", borderRadius: 18,
                background: "rgba(255,255,255,0.04)",
                border: "0.5px solid rgba(255,255,255,0.07)",
                backdropFilter: "blur(30px)",
              }}
            >
              <c.icon size={14} style={{ color: "rgba(255,255,255,0.32)" }} />
              <span style={{ fontSize: 12, fontWeight: 200, color: "rgba(255,255,255,0.7)" }}>{c.label}</span>
              <span style={{ fontSize: 11, fontWeight: 200, color: "rgba(255,255,255,0.25)" }}>{c.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
