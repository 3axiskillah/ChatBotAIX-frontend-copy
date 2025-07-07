/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],

  theme: {
    extend: {
      colors: {
        primary: "#4B1F1F",      // deep maroon
        accent: "#D1A75D",       // gold
        soft: "#E7D8C1",         // soft beige
        hoverGold: "#c49851",    // hover gold
        sidebar: "#3A1818",      // dark sidebar
      },
    },
  },

  plugins: [],
}
