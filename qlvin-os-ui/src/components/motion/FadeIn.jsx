import { motion } from "framer-motion";
import { easing } from "../../tokens/index";

export default function FadeIn({ children, delay = 0, y = 20, duration = 0.4, className = "" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration, delay, ease: easing.smooth }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
