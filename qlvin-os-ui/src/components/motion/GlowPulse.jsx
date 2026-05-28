import { motion } from "framer-motion";
import { motion as motionTokens } from "../../tokens/index";

export default function GlowPulse({ color = "#2F80FF", children, className = "" }) {
  return (
    <motion.div
      animate={{
        boxShadow: [
          `0 0 10px ${color}33, 0 0 20px ${color}22`,
          `0 0 25px ${color}77, 0 0 50px ${color}44`,
          `0 0 10px ${color}33, 0 0 20px ${color}22`,
        ],
        opacity: [0.85, 1, 0.85],
      }}
      transition={{
        duration: motionTokens.aiBreathing,
        repeat: Infinity,
        repeatType: "reverse",
        ease: "easeInOut",
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
