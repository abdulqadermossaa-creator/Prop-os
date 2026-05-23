import { motion } from "framer-motion";

function Spinner() {
  return (
    <motion.span
      className="inline-block w-4 h-4 rounded-full border-2 border-white/30 border-t-white"
      animate={{ rotate: 360 }}
      transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
      style={{ display: "inline-block" }}
    />
  );
}

export default function Button({
  children,
  variant = "primary",
  onClick,
  disabled,
  loading = false,
  className = "",
  type = "button",
}) {
  const base =
    "px-5 py-2.5 rounded-xl font-medium text-sm cursor-pointer select-none inline-flex items-center justify-center gap-2";

  const styles = {
    primary:
      "bg-blue text-white shadow-glow hover:shadow-[0_0_35px_rgba(47,128,255,0.6)]",
    secondary:
      "bg-panel-light border border-blue/30 text-white hover:border-blue/60 hover:bg-blue/10",
    ghost: "bg-transparent text-gray-300 hover:text-white hover:bg-panel-light",
    cyan: "bg-transparent border border-cyan/40 text-cyan shadow-cyanGlow hover:bg-cyan/10",
    gold: "bg-transparent border border-gold/40 text-gold shadow-goldGlow hover:bg-gold/10",
    danger: "bg-danger/10 border border-danger/40 text-danger hover:bg-danger/20",
  };

  const hoverScale = {
    primary: 1.04,
    secondary: 1.02,
    ghost: 1.01,
    cyan: 1.04,
    gold: 1.02,
    danger: 1.02,
  };

  const isDisabled = disabled || loading;

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      whileHover={isDisabled ? {} : { scale: hoverScale[variant] ?? 1.02 }}
      whileTap={isDisabled ? {} : { scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 15 }}
      className={`${base} ${styles[variant] ?? styles.primary} ${
        isDisabled ? "opacity-40 cursor-not-allowed" : ""
      } ${className}`}
    >
      {loading ? <Spinner /> : children}
    </motion.button>
  );
}
