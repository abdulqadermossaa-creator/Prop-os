import { motion } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
  },
};

export function StaggerItem({ children, className = "" }) {
  return (
    <motion.div variants={itemVariants} className={className}>
      {children}
    </motion.div>
  );
}

export default function StaggerContainer({ children, className = "", delay = 0 }) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      transition={{ delayChildren: delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
