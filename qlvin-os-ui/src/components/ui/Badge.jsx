const variants = {
  occupied: "bg-success/10 text-success border border-success/30",
  vacant: "bg-warning/10 text-warning border border-warning/30",
  maintenance: "bg-danger/10 text-danger border border-danger/30",
  pending: "bg-blue/10 text-blue border border-blue/30",
  default: "bg-panel-light text-gray-400 border border-white/10",
};

export default function Badge({ label, type = "default" }) {
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${variants[type] || variants.default}`}>
      {label}
    </span>
  );
}
