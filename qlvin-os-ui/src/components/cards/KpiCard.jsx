import StatDelta from "../ui/StatDelta";

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
    <div
      className={`bg-panel p-5 rounded-2xl border animate-fadeIn transition-all duration-300 hover:scale-[1.02] ${accents[accentColor] || accents.blue}`}
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs text-gray-400 uppercase tracking-wider">{title}</p>
        {Icon && (
          <div className={`p-2 rounded-lg ${iconColors[accentColor]}`}>
            <Icon size={14} />
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      <StatDelta value={trend} />
    </div>
  );
}
