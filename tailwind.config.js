/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#0F1B2D',
          darker: '#0B1420',
          card: '#162238',
          border: '#1E3350',
          gold: '#D4A843',
          goldBright: '#F5C542',
          goldDim: '#A08030',
          text: '#FAFAFA',
          textMuted: '#8899B0',
        },
      },
      fontFamily: {
        sans: ['Inter', 'IBM Plex Sans Arabic', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
