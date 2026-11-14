import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        fb: {
          blue: "#3b5998",
          dark: "#2f477a",
          border: "#d3d6db",
          bg: "#f4f5f7",
          text: "#1d2129",
          muted: "#6b7280",
        },
      },
      fontFamily: {
        sans: [
          "Tahoma",
          "Verdana",
          "Segoe UI",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "0 1px 2px rgba(0, 0, 0, 0.04)",
        pop: "0 8px 24px rgba(0, 0, 0, 0.14)",
      },
    },
  },
  plugins: [],
};

export default config;
