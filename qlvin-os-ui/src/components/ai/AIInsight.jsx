import { Sparkles, TrendingUp, AlertTriangle, Info } from "lucide-react";

const iconMap = {
  insight: Sparkles,
  trend: TrendingUp,
  alert: AlertTriangle,
  info: Info,
};

export default function AIInsight({ text, type = "insight", confidence }) {
  const Icon = iconMap[type] || Sparkles;

  return (
    <div className="bg-panel border-cyan-glow p-5 rounded-2xl shadow-cyanGlow animate-fadeIn">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 rounded-lg bg-cyan/10">
          <Icon size={14} className="text-cyan" />
        </div>
        <span className="text-xs font-semibold text-cyan uppercase tracking-widest">
          QLVIN AI
        </span>
        {confidence && (
          <span className="ml-auto text-xs text-gray-500">
            {confidence}% confidence
          </span>
        )}
      </div>
      <p className="text-sm text-gray-200 leading-relaxed">{text}</p>
    </div>
  );
}
