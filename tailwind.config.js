/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: 'class',
  theme: {
    container: {
      center: true,
      padding: '1rem',
    },
    extend: {
      fontFamily: {
        sans: ['Inter', 'Noto Sans JP', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        brand: {
          DEFAULT: '#ef4444',
          hover: '#dc2626',
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
