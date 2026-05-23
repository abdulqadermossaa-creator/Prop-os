import { motion } from "framer-motion";
import StatDelta from "../ui/StatDelta";
import { motion as motionTokens, easing } from "../../tokens/index";

export default function KpiCard({ title, value, trend, icon: Icon, accentColor = "blue" }) {
  const accents = {
    blue: "border-blue/20 shadow-glow",
    cyan: "border-cyan/20 shadow-cyanGlow",
    gold: "border-gold/20 shadow-goldGlow",
    success: "border-success/20",
  };

  const iconColors = {
    blue: "text-blue bg-blue/10",
    cyan: "text-cyan bg-cyan/10",
    gold: "text-gold bg-gold/10",
    success: "text-success bg-success/10",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: motionTokens.uiResponse, ease: easing.smooth }}
      whileHover={{ y: -2, scale: 1.02 }}
      className={`bg-panel p-5 rounded-2xl border transition-shadow duration-300 cursor-default ${
        accents[accentColor] ?? accents.blue
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs text-gray-400 uppercase tracking-wider">{title}</p>
        {Icon && (
          <div className={`p-2 rounded-lg ${iconColors[accentColor] ?? iconColors.blue}`}>
            <Icon size={14} />
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      <StatDelta value={trend} />
    </motion.div>
  );
}
