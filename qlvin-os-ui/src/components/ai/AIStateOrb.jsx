import { motion } from "framer-motion";

const STATE_COLORS = {
  idle: "#9CA3AF",
  listening: "#00E5FF",
  thinking: "#2F80FF",
  responding: "#C8A96A",
};

const STATE_LABELS = {
  idle: "Idle",
  listening: "Listening",
  thinking: "Thinking",
  responding: "Responding",
};

function IdleOrb() {
  return (
    <motion.div
      className="w-16 h-16 rounded-full bg-blue flex items-center justify-center text-white font-black text-2xl shadow-glow"
      animate={{
        opacity: [0.7, 1, 0.7],
        scale: [0.98, 1, 0.98],
      }}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      Q
    </motion.div>
  );
}

function ListeningOrb() {
  const rings = [0, 1, 2];
  return (
    <div className="relative w-16 h-16 flex items-center justify-center">
      {rings.map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border border-cyan/60"
          style={{ width: 64, height: 64 }}
          animate={{
            width: [64, 64 + (i + 1) * 36],
            height: [64, 64 + (i + 1) * 36],
            opacity: [0.7, 0],
          }}
          transition={{
            duration: 2,
            delay: i * 0.5,
            repeat: Infinity,
            ease: "easeOut",
          }}
        />
      ))}
      <div className="w-16 h-16 rounded-full bg-blue flex items-center justify-center text-white font-black text-2xl shadow-cyanGlow z-10 relative">
        Q
      </div>
    </div>
  );
}

function ThinkingOrb() {
  const dots = [0, 1, 2, 3];
  const radius = 38;
  return (
    <div className="relative w-16 h-16 flex items-center justify-center">
      {dots.map((i) => {
        const angle = (i / 4) * 2 * Math.PI - Math.PI / 2;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        return (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{
              background: i % 2 === 0 ? "#2F80FF" : "#00E5FF",
              left: "50%",
              top: "50%",
              marginLeft: -4,
              marginTop: -4,
            }}
            animate={{
              x: [
                Math.cos(angle) * radius,
                Math.cos(angle + Math.PI / 2) * radius,
                Math.cos(angle + Math.PI) * radius,
                Math.cos(angle + (3 * Math.PI) / 2) * radius,
                Math.cos(angle + 2 * Math.PI) * radius,
              ],
              y: [
                Math.sin(angle) * radius,
                Math.sin(angle + Math.PI / 2) * radius,
                Math.sin(angle + Math.PI) * radius,
                Math.sin(angle + (3 * Math.PI) / 2) * radius,
                Math.sin(angle + 2 * Math.PI) * radius,
              ],
            }}
            transition={{
              duration: 2,
              delay: i * 0.5,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        );
      })}
      <div className="w-16 h-16 rounded-full bg-blue flex items-center justify-center text-white font-black text-2xl shadow-glow z-10 relative">
        Q
      </div>
    </div>
  );
}

function RespondingOrb() {
  return (
    <motion.div
      className="w-16 h-16 rounded-full bg-blue flex items-center justify-center text-white font-black text-2xl"
      style={{ color: "#C8A96A" }}
      animate={{
        boxShadow: [
          "0 0 15px rgba(200,169,106,0.4), 0 0 30px rgba(200,169,106,0.2)",
          "0 0 35px rgba(200,169,106,0.8), 0 0 70px rgba(200,169,106,0.4)",
          "0 0 15px rgba(200,169,106,0.4), 0 0 30px rgba(200,169,106,0.2)",
        ],
        scale: [1, 1.04, 1],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      Q
    </motion.div>
  );
}

export default function AIStateOrb({ state = "idle" }) {
  const orbMap = {
    idle: <IdleOrb />,
    listening: <ListeningOrb />,
    thinking: <ThinkingOrb />,
    responding: <RespondingOrb />,
  };

  return (
    <div className="flex flex-col items-center gap-3 select-none">
      <div className="relative flex items-center justify-center" style={{ width: 120, height: 120 }}>
        {orbMap[state] ?? orbMap.idle}
      </div>
      <motion.span
        key={state}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="text-xs font-semibold uppercase tracking-widest"
        style={{ color: STATE_COLORS[state] }}
      >
        {STATE_LABELS[state]}
      </motion.span>
    </div>
  );
}
