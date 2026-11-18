/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        forest: {
          DEFAULT: "#0F3D2E",
          deep: "#0A2A1F",
          soft: "#1A4D3A",
        },
        moss: {
          DEFAULT: "#1F7A54",
          light: "#2D9B6A",
          pale: "#E6F2EC",
        },
        stone: {
          DEFAULT: "#F3F0EA",
          dark: "#E7E2D8",
          ink: "#14201B",
          muted: "#5C6B63",
        },
        surface: "#FFFCF7",
      },
      fontFamily: {
        display: ['"Fraunces"', "Georgia", "serif"],
        sans: ['"Manrope"', "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 10px 40px -16px rgba(15, 61, 46, 0.18)",
        lift: "0 16px 40px -12px rgba(15, 61, 46, 0.28)",
      },
    },
  },
  plugins: [],
}
