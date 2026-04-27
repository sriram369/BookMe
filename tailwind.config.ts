import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#17211b",
        moss: "#244d3b",
        sage: "#718879",
        cream: "#f7f1e7",
        parchment: "#fcfaf5",
        brass: "#b48746",
        coral: "#d96f55",
      },
      boxShadow: {
        soft: "0 24px 80px rgba(23, 33, 27, 0.12)",
        card: "0 16px 50px rgba(23, 33, 27, 0.10)",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
