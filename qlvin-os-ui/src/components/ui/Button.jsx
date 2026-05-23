export default function Button({ children, variant = "primary", onClick, disabled, className = "" }) {
  const base =
    "px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 cursor-pointer select-none";

  const styles = {
    primary: "bg-blue text-white shadow-glow hover:scale-105 hover:shadow-[0_0_35px_rgba(47,128,255,0.6)] active:scale-95",
    secondary: "bg-panel-light border border-blue/30 text-white hover:border-blue/60 hover:bg-blue/10",
    ghost: "bg-transparent text-gray-300 hover:text-white hover:bg-panel-light",
    cyan: "bg-transparent border border-cyan/40 text-cyan shadow-cyanGlow hover:bg-cyan/10 hover:scale-105",
    gold: "bg-transparent border border-gold/40 text-gold shadow-goldGlow hover:bg-gold/10",
    danger: "bg-danger/10 border border-danger/40 text-danger hover:bg-danger/20",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${styles[variant]} ${disabled ? "opacity-40 cursor-not-allowed" : ""} ${className}`}
    >
      {children}
    </button>
  );
}
