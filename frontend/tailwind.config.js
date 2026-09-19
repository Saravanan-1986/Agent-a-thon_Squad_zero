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
        // Deep obsidian navy surfaces (GitHub/Linear-grade dark theme)
        obsidian: {
          700: '#243048',
          750: '#1b263b',
          800: '#151f32',
          850: '#0e1626',
          900: '#090e1a',
          950: '#050811',
          980: '#020409',
        },
        // Precision academic cyan/blue accent
        cyber: {
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
        },
        // Primary brand blue
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        navy: {
          50:  '#f0f4ff',
          100: '#e0e7ff',
          700: '#1c2333',
          800: '#141a29',
          850: '#0e1422',
          900: '#090d18',
          950: '#050810',
        },
        slate: {
          750: '#1a2333',
          850: '#0f172a',
          950: '#0b1120',
        },
        success: {
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        display: ['Outfit', 'Inter', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      boxShadow: {
        '2xs': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'xs': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
        'panel': '0 8px 32px 0 rgba(0, 0, 0, 0.36)',
        'glow-sm': '0 0 14px -2px rgba(14, 165, 233, 0.25)',
        'glow': '0 0 24px -4px rgba(14, 165, 233, 0.35)',
        'glow-emerald': '0 0 24px -4px rgba(16, 185, 129, 0.35)',
        'glow-rose': '0 0 24px -4px rgba(244, 63, 94, 0.35)',
        'glow-amber': '0 0 24px -4px rgba(245, 158, 11, 0.35)',
        'glass-inner': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.08)',
      },
      animation: {
        'subtle-pulse': 'subtlePulse 3s ease-in-out infinite',
        'radar-sweep': 'radarSweep 4s linear infinite',
        'float': 'float 5s ease-in-out infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        subtlePulse: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.88', transform: 'scale(1.015)' },
        },
        radarSweep: {
          'from': { transform: 'rotate(0deg)' },
          'to': { transform: 'rotate(360deg)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
