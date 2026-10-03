/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0E0F13',
        surface: '#16181F',
        surface2: '#1E2029',
        border: '#2A2D3A',
        accent: '#F5A623',
        accent2: '#3ECFB2',
        muted: '#6B7080',
        danger: '#E05C5C',
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        display: ['Syne', 'sans-serif'],
      },
    },
  },
  plugins: [],
}