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
          cyan: "#46C2E9",
          bull: "#52B788",
          bear: "#E63946",
        },
      },
    },
  },
  plugins: [],
};
export default config;
