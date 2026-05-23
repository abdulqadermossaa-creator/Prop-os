import { motion } from "framer-motion";

const STATUS_CONFIG = {
  occupied: {
    color: "#00C896",
    bgColor: "bg-success",
    label: "Occupied",
    pulse: false,
    glowColor: "rgba(0,200,150,0.5)",
  },
  vacant: {
    color: "#FFB547",
    bgColor: "bg-warning",
    label: "Vacant",
    pulse: true,
    duration: 2,
    glowColor: "rgba(255,181,71,0.5)",
  },
  maintenance: {
    color: "#FF4D6A",
    bgColor: "bg-danger",
    label: "Maintenance",
    pulse: true,
    duration: 1,
    glowColor: "rgba(255,77,106,0.5)",
  },
  pending: {
    color: "#2F80FF",
    bgColor: "bg-blue",
    label: "Pending",
    pulse: true,
    duration: 2.5,
    glowColor: "rgba(47,128,255,0.5)",
  },
};

export default function StatusIndicator({ status = "occupied", className = "" }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.occupied;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative flex items-center justify-center">
        {config.pulse ? (
          <>
            <motion.div
              className="absolute rounded-full"
              style={{
                width: 8,
                height: 8,
                backgroundColor: config.color,
                opacity: 0.3,
              }}
              animate={{
                scale: [1, 1.8, 1],
                opacity: [0.3, 0, 0.3],
              }}
              transition={{
                duration: config.duration,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <div
              className="w-2 h-2 rounded-full relative z-10"
              style={{ backgroundColor: config.color }}
            />
          </>
        ) : (
          <motion.div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: config.color }}
            animate={{
              boxShadow: [
                `0 0 4px ${config.glowColor}`,
                `0 0 8px ${config.glowColor}`,
                `0 0 4px ${config.glowColor}`,
              ],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        )}
      </div>
      <span className="text-xs font-medium" style={{ color: config.color }}>
        {config.label}
      </span>
    </div>
  );
}
