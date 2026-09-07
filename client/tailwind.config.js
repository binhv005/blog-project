/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./client/index.html",
    "./client/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "surface": "#15111d",
        "surface-dim": "#15111d",
        "surface-bright": "#3c3745",
        "surface-container-lowest": "#100c18",
        "surface-container-low": "#1e1a26",
        "surface-container": "#221e2a",
        "surface-container-high": "#2c2835",
        "surface-container-highest": "#373340",
        "surface-variant": "#373340",
        "surface-tint": "#ffb3b5",
        "background": "#15111d",
        "on-background": "#e8dff1",
        "on-surface": "#e8dff1",
        "on-surface-variant": "#ad8888",
        "outline": "#ad8888",
        "outline-variant": "#5d3f40",
        "primary": "#ffb3b5",
        "primary-container": "#ff5167",
        "on-primary": "#680019",
        "on-primary-container": "#5b0015",
        "secondary": "#4cd7f6",
        "secondary-container": "#03b5d3",
        "on-secondary": "#003640",
        "tertiary": "#ddb7ff",
        "tertiary-container": "#b76dff",
        "on-tertiary": "#490080",
        "error": "#ffb4ab",
        "error-container": "#93000a"
      },
      fontFamily: {
        "display": ["Plus Jakarta Sans", "sans-serif"],
        "body": ["Inter", "sans-serif"],
        "mono": ["JetBrains Mono", "monospace"]
      }
    }
  },
  plugins: [],
}
