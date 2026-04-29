/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        paper: {
          50: '#FBF6EA',
          100: '#F5EEDB',
          200: '#EBE2C9',
          300: '#D8CBA6',
        },
        ink: {
          300: '#8A9F9B',
          500: '#4A635F',
          700: '#1F3D3A',
          900: '#0E2724',
        },
        teal: {
          50: '#E9F1EE',
          100: '#C8DDD5',
          300: '#6FA396',
          500: '#0B5D53',
          600: '#094A42',
          700: '#063831',
          900: '#02201C',
        },
        gold: {
          300: '#E2C480',
          500: '#B8923F',
          700: '#8A6A26',
        },
        rose: {
          100: '#F3DFD9',
          500: '#A14444',
        },
        sage: {
          100: '#DCE7D9',
          500: '#5F8567',
        },
        // v1 aliases — keep working until migrated
        cream: { 50: '#F5EEDB' },
      },
      fontFamily: {
        latin: ['Manrope', 'sans-serif'],
        'latin-display': ['Fraunces', 'serif'],
        'arabic-ui': ['KFGQPC-Uthmani', 'serif'],
        'arabic-serif': ['Amiri', 'serif'],
        quran: ['KFGQPC-Uthmani', 'serif'],
      },
      borderRadius: {
        xs: '4px',
        sm: '8px',
        md: '14px',
        lg: '20px',
        xl: '28px',
        '2xl': '36px',
      },
      spacing: {
        '2xs': '2px',
        '4xl': '96px',
        'gutter-screen': '24px',
        'gutter-row': '16px',
        'gutter-ayah': '28px',
      },
    },
  },
  plugins: [],
};
