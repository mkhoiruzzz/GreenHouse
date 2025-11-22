/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // ← WAJIB ADA INI!
  theme: {
    extend: {
      colors: {
        primary: '#16a34a',
        secondary: '#ca8a04',
        accent: '#15803d',
      }
    },
  },
  plugins: [],
}