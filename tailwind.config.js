/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        teal: { 500: '#0D7377', 600: '#0B6163' },
        gold: { 500: '#C9A84C' },
        cream: { 50: '#FAF8F2' },
        ink: { 900: '#1A1A2E' },
      },
    },
  },
  plugins: [],
};
