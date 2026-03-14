/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          ink: "#0f172a",
          primary: "#2563eb",
          teal: "#14b8a6",
          warning: "#f59e0b",
          danger: "#ef4444",
          mist: "#eef3fb"
        }
      },
      fontFamily: {
        display: ["Sora", "sans-serif"],
        body: ["DM Sans", "sans-serif"]
      },
      boxShadow: {
        soft: "0 18px 42px -26px rgba(15, 23, 42, 0.38)",
        glow: "0 0 0 1px rgba(37, 99, 235, 0.22), 0 24px 48px -24px rgba(37, 99, 235, 0.4)"
      }
    }
  },
  plugins: []
};
