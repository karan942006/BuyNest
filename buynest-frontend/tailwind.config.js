/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: "#FFFFFF",
        secondary: "#F8FAFC",
        tertiary: "#F1F5F9",
        accent: {
          DEFAULT: "#2563EB",
          dark: "#1D4ED8",
          light: "#EFF6FF"
        },
        success: "#10B981",
        danger: "#EF4444",
        warning: "#F59E0B",
        info: "#0EA5E9",
        dark: "#111827",
        text: "#1E293B",
        muted: "#64748B",
        border: "#E2E8F0",
        gold: "#F59E0B"
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"]
      },
      boxShadow: {
        premium: "0 4px 30px rgba(0, 0, 0, 0.03)",
        glass: "0 8px 32px 0 rgba(31, 38, 135, 0.04)"
      },
      backdropBlur: {
        premium: "12px"
      }
    },
  },
  plugins: [],
}
