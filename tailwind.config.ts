import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: { 950: "#070A12", 900: "#0B1020", 850: "#0F1730" }
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(255,255,255,0.08), 0 10px 40px rgba(0,0,0,0.6)"
      }
    }
  },
  plugins: []
} satisfies Config;

