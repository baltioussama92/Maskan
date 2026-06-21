/** @type {import('tailwindcss').Config} */
import plugin from 'tailwindcss/plugin'

export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Poppins', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: {
          50:  '#F7F1E8',
          100: '#F0E6D8',
          200: '#E0CEBD',
          300: '#D4A876',
          400: '#C97A3E',
          500: '#B8622A',
          600: '#9A5223',
          700: '#5A3A20',
          800: '#3D2010',
          900: '#2A1A0E',
        },
        emerald: {
          50:  '#F0E6D8',
          100: '#E0CEBD',
          400: '#B8622A',
          500: '#9A5223',
          600: '#5A3A20',
        },
        glass: {
          white: 'rgba(253,250,245,0.7)',
          dark:  'rgba(42,26,14,0.6)',
        },
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, #2A1A0E 0%, #3D2010 40%, #1a1008 100%)',
        'card-gradient': 'linear-gradient(to top, rgba(42,26,14,0.85) 0%, rgba(42,26,14,0.1) 60%, transparent 100%)',
        'auth-gradient': 'linear-gradient(135deg, #B8622A 0%, #9A5223 50%, #2A1A0E 100%)',
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        glass:    '0 8px 32px 0 rgba(184,98,42,0.12)',
        'glass-lg': '0 20px 60px rgba(184,98,42,0.18)',
        'card-hover': '0 25px 50px -12px rgba(184,98,42,0.3)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      keyframes: {
        shimmer: {
          '0%':   { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0'  },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-8px)' },
        },
        'admin-fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(1rem)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'admin-fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'admin-modal-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        shimmer: 'shimmer 2.5s infinite linear',
        float:   'float 4s ease-in-out infinite',
        'admin-fade-in-up': 'admin-fade-in-up 300ms ease-out forwards',
        'admin-fade-in': 'admin-fade-in 200ms ease-out forwards',
        'admin-modal-in': 'admin-modal-in 200ms ease-out forwards',
      },
      transitionDuration: {
        0: '0ms',
      },
      fontSize: {
        'body-sm': ['0.875rem', { lineHeight: '1.5' }],
        'body': ['1rem', { lineHeight: '1.6' }],
        'heading-sm': ['1.125rem', { lineHeight: '1.35' }],
        'heading': ['1.5rem', { lineHeight: '1.25' }],
        'display': ['2.25rem', { lineHeight: '1.1' }],
      },
      spacing: {
        'page-x': '1rem',
        'page-x-md': '2rem',
      },
    },
  },
  plugins: [
    plugin(({ addBase }) => {
      addBase({
        '@media (prefers-reduced-motion: reduce)': {
          '.motion-safe-only': {
            animation: 'none !important',
            transition: 'none !important',
            transform: 'none !important',
          },
        },
        '@media (max-width: 767px)': {
          '.motion-safe-only': {
            animation: 'none !important',
            transition: 'none !important',
            transform: 'none !important',
          },
        },
      })
    }),
  ],
  future: {
    hoverOnlyWhenSupported: true,
  },
}
