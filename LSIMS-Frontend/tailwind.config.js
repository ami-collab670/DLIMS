// tailwind.config.js
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
        colors: {
            primary: "#000000",
            secondary: "#ffffff",
            accent: "#000000",
            accentLight: "#ffffff",
            accentDark: "#000000",
            accentLightDark: "#ffffff",
            accentDarkLight: "#000000",
            accentLightDark: "#ffffff",
        },
    },
  },
  plugins: [],
};