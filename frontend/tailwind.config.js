/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: {
          light: '#F4F6FF',
          dark: '#14183A',
        },
        ink: {
          DEFAULT: '#1B2150',
          muted: '#5F6788',
          subtle: '#8C94B2',
          dark: '#F1F5F9',
          darkMuted: '#94A3B8',
        },
        card: {
          light: '#F8F9FE',
          dark: '#1A204C',
          darkSubtle: '#22295E',
        },
        brand: {
          orange: '#FF6A2B',
          orangeHover: '#E8591C',
          violet: '#5B4BFF',
          violetHover: '#4A3AE0',
          lightViolet: '#EEECFF',
          lightOrange: '#FFF0EA',
        },
        status: {
          green: '#12B76A',
          greenLight: '#E8FDF2',
          amber: '#F79009',
          amberLight: '#FEF6E7',
          red: '#F04438',
          redLight: '#FEE4E2',
          sky: '#2E90FA',
          skyLight: '#EFF8FF',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', '-apple-system', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Fira Code', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(27, 33, 80, 0.06)',
        'soft-lg': '0 12px 32px -4px rgba(27, 33, 80, 0.1)',
        'glow-orange': '0 0 20px -2px rgba(255, 106, 43, 0.4)',
        'glow-violet': '0 0 20px -2px rgba(91, 75, 255, 0.4)',
      },
      borderRadius: {
        'card': '20px',
        'element': '12px',
      },
      animation: {
        'subtle-pulse': 'subtlePulse 3s ease-in-out infinite',
        'fade-in': 'fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        subtlePulse: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.88', transform: 'scale(1.015)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
