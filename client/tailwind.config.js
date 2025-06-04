/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class", // Enable dark mode support
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          200: "#bae6fd",
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#0ea5e9", // Main blue for Zingle
          600: "#0284c7", // Darker blue
          700: "#0369a1",
          800: "#075985",
          900: "#0c4a6e",
          950: "#082f49",
        },
        // Dark mode specific colors
        dark: {
          bg: "#0f172a", // Dark background
          card: "#1e293b", // Card/container background
          border: "#334155", // Border color
          text: "#e2e8f0", // Primary text
          muted: "#94a3b8", // Secondary/muted text
        },
      },
    },
  },
  plugins: [],
};
