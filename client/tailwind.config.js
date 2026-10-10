/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        charcoal: {
          DEFAULT: '#10191A',
          deep: '#0a1011',
          light: '#142021',
        },
        teal: {
          DEFAULT: '#172728',
          dark: '#10191A',
          card: '#172728',
          muted: '#233839',
          border: '#344849',
          light: '#425b5c',
        },
        danger: {
          DEFAULT: '#FF5B5B',
          50: '#fff1f1',
          100: '#ffe1e1',
          400: '#ff7070',
          500: '#FF5B5B',
          600: '#e64242',
          700: '#cc2d2d',
          glow: 'rgba(255, 91, 91, 0.4)',
        },
        warning: {
          DEFAULT: '#F3BD58',
          400: '#f7cb78',
          500: '#F3BD58',
          600: '#d99f36',
          glow: 'rgba(243, 189, 88, 0.35)',
        },
        safe: {
          DEFAULT: '#70D6A1',
          400: '#8be0b4',
          500: '#70D6A1',
          600: '#52bf87',
          glow: 'rgba(112, 214, 161, 0.35)',
        },
        accent: {
          DEFAULT: '#83D8D0',
          light: '#a2e4dd',
          glow: 'rgba(131, 216, 208, 0.3)',
        },
        cream: {
          DEFAULT: '#F3F5F4',
          muted: '#c4cac8',
          subtle: '#8e9997',
        },
        brand: {
          50: '#f0fdf4',
          500: '#70D6A1',
          600: '#52bf87',
          700: '#38a36c'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        editorial: ['Georgia', 'serif'],
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
        'fade-in': 'fadeIn 0.25s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}
