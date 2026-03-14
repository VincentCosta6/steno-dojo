/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#080810",
        panel: "#111120",
        border: "#1e1e3a",
        cyan: "#00d4ff",
        green: "#00ff88",
        red: "#ff3c3c",
        gold: "#ffd700",
        muted: "#556066",
        text: "#d0d8e8",
      },
      fontFamily: {
        mono: ["JetBrains Mono", "Fira Code", "Consolas", "monospace"],
        display: ["Inter", "system-ui", "sans-serif"],
      },
      animation: {
        "pulse-fast": "pulse 0.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "slide-right": "slideRight 0.3s ease-out",
        "flash-green": "flashGreen 0.4s ease-out",
        "flash-red": "flashRed 0.4s ease-out",
      },
      keyframes: {
        slideRight: {
          "0%": { transform: "translateX(-4px)", opacity: "0.5" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        flashGreen: {
          "0%": { backgroundColor: "#00ff88", transform: "scale(1.05)" },
          "100%": { backgroundColor: "transparent", transform: "scale(1)" },
        },
        flashRed: {
          "0%": { backgroundColor: "#ff3c3c33", transform: "scale(1.02)" },
          "100%": { backgroundColor: "transparent", transform: "scale(1)" },
        },
      },
    },
  },
  plugins: [],
};
