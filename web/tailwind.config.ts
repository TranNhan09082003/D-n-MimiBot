import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        mimi: {
          night: "var(--mimi-night)",
          surface: "var(--mimi-surface)",
          card: "var(--mimi-card)",
          lilac: "var(--mimi-lilac)",
          pink: "var(--mimi-pink)",
          cyan: "var(--mimi-cyan)",
          cream: "var(--mimi-cream)",
          text: "var(--mimi-text)",
          muted: "var(--mimi-muted)",
          success: "var(--mimi-success)",
          warning: "var(--mimi-warning)",
          danger: "var(--mimi-danger)",
          border: "var(--mimi-border)",
        },
      },
      fontFamily: {
        display: ["var(--font-sora)", "system-ui", "sans-serif"],
        sans: ["var(--font-be-vietnam)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
      },
      keyframes: {
        "pulse-ring": {
          "0%": { transform: "scale(0.8)", opacity: "0.7" },
          "100%": { transform: "scale(2.4)", opacity: "0" },
        },
        "float-slow": {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-12px)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "pulse-ring": "pulse-ring 3s cubic-bezier(0.4,0,0.6,1) infinite",
        "float-slow": "float-slow 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
