import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        beige: "#c8b299",
        carbon: "#202120",
        "carbon-light": "#2c2d2c",
        "carbon-mid": "#3a3b3a",
        "text-primary": "#f0ece6",
        "text-muted": "#9a9590",
        "status-green": "#4caf7d",
        "status-yellow": "#e8c547",
        "status-red": "#e05252",
        "status-blue": "#5b9bd5",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
