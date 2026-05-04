/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#1E2761",
          light: "#2a3577",
          dark: "#151b4a",
        },
        ice: {
          DEFAULT: "#CADCFC",
          muted: "#a8c4e8",
        },
      },
      fontFamily: {
        display: ["DM Sans", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
