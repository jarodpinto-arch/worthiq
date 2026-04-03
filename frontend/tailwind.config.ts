import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        worthiq: {
          black: "#000000",
          surface: "#0A0C10",
          panel: "#11141B",
          /** Slightly lifted surfaces for cards / inputs */
          raised: "#161A24",
          cyan: "#46C2E9",
          "cyan-dim": "#2A9FBE",
          bull: "#52B788",
          bear: "#E63946",
        },
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(18px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "logo-settle": {
          "0%": { opacity: "0", transform: "scale(0.92) translateY(12px)" },
          "100%": { opacity: "1", transform: "scale(1) translateY(0)" },
        },
        /** Soft teal/cyan ambient pulse — keep opacity-only so layout stays stable */
        "worthiq-glow-pulse": {
          "0%, 100%": { opacity: "0.32" },
          "50%": { opacity: "0.52" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s cubic-bezier(0.22, 1, 0.36, 1) both",
        "fade-up-delay-1": "fade-up 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.1s both",
        "fade-up-delay-2": "fade-up 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.2s both",
        "fade-up-delay-3": "fade-up 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.3s both",
        "fade-in": "fade-in 0.45s ease-out both",
        "logo-settle": "logo-settle 0.85s cubic-bezier(0.22, 1, 0.36, 1) both",
        "worthiq-glow-pulse": "worthiq-glow-pulse 5.5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
