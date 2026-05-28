/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#070A12",
        panel: "#0E1628",
        "panel-light": "#131E35",
        blue: "#2F80FF",
        cyan: "#00E5FF",
        gold: "#C8A96A",
        success: "#00C896",
        warning: "#FFB547",
        danger: "#FF4D6A",
      },
      boxShadow: {
        glow: "0 0 25px rgba(47,128,255,0.4)",
        cyanGlow: "0 0 25px rgba(0,229,255,0.3)",
        goldGlow: "0 0 25px rgba(200,169,106,0.3)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      animation: {
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        fadeIn: "fadeIn 0.3s ease-in-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
}
