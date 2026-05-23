export const colors = {
  bg: { primary: "#070A12", panel: "#0E1628", surface: "#131E35" },
  brand: { blue: "#2F80FF", cyan: "#00E5FF", gold: "#C8A96A" },
  ai: { success: "#00C896", warning: "#FFB547", risk: "#FF4D6A", thinking: "#A78BFA" },
};

export const motion = {
  fastAction: 0.15,      // 150ms
  uiResponse: 0.25,      // 250ms
  systemMotion: 0.8,     // 800ms
  aiBreathing: 3.0,      // 3000ms
};

export const radius = { sm: "8px", md: "12px", lg: "16px", xl: "24px" };

export const easing = {
  smooth: [0.4, 0, 0.2, 1],
  spring: { type: "spring", stiffness: 260, damping: 20 },
  bouncy: { type: "spring", stiffness: 400, damping: 15 },
};
