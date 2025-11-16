/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        primary: '#7FCE00',
        light: '#FFFCD9',
        accent: '#BC4C4C',
        dark: '#383725',
        textbase: '#1F1F1F',
      },
    },
  },
  plugins: [],
}
