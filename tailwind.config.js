/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Primary purple (slightly warmer / richer ramp)
        primary: {
          DEFAULT: '#6A0DAD',
          50: '#F6EEFF',
          100: '#EADCFF',
          200: '#D1B8FF',
          300: '#B68BFF',
          400: '#9457F3',
          500: '#6A0DAD',
          600: '#56008F',
          700: '#43006F',
          800: '#32004F',
          900: '#210033',
        },
        // Neutral slate/grey that's a bit cooler and pairs well with purple
        neutral: {
          DEFAULT: '#6B7280',
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F1724',
        },
        // Keep a subtle secondary grey but lean into neutral for UI
        secondary: {
          DEFAULT: '#B0B0B0',
          50: '#FBFBFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
        },
        // Complementary accent: teal for highlights/buttons
        teal: {
          DEFAULT: '#14B8A6',
          50: '#ECFDF8',
          100: '#C6FBEE',
          200: '#99F6E4',
          300: '#5EEAD4',
          400: '#2DD4BF',
          500: '#14B8A6',
          600: '#0EA5A0',
          700: '#0B9488',
          800: '#087F78',
          900: '#065F52',
        },
        // Accent: rose for subtle contrasts (badges, alerts)
        rose: {
          DEFAULT: '#EC4899',
          50: '#FFF1F7',
          100: '#FFE4F2',
          200: '#FFCCE8',
          300: '#FFA6D0',
          400: '#FF7FB8',
          500: '#EC4899',
          600: '#E11D6B',
          700: '#C21556',
          800: '#9A1240',
          900: '#6F0A2B',
        },
      },
      backgroundImage: {
        // header: purple -> teal for a fresh, modern gradient
        'gradient-primary': 'linear-gradient(90deg, #6A0DAD 0%, #14B8A6 100%)',
        // buttons: purple -> slightly lighter purple to keep focus, with teal available via utility classes
        'gradient-button': 'linear-gradient(135deg, #6A0DAD 0%, #8A2BE2 100%)',
      },
      fontFamily: {
        sans: ['Inter', 'Poppins', 'system-ui', 'sans-serif'],
      },
      // small utility: button shadow tint matching primary
      boxShadow: {
        'button-primary': '0 8px 20px rgba(106,13,173,0.12)',
      },
    },
  },
  plugins: [],
};
