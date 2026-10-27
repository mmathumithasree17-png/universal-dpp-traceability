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
        navy: {
          950: '#f8fafc', // clean off-white background
          900: '#ffffff', // clean white surface
          850: '#f1f5f9', // subtle light surface
          800: '#e2e8f0', // clean light border
          750: '#cbd5e1', // secondary light border
          700: '#94a3b8', // accent border
          600: '#64748b', // secondary muted text
          500: '#475569', // body text
          400: '#334155', // dark heading text
          300: '#1e293b', // primary heading text
        },
        cyan: {
          DEFAULT: '#38bdf8', // natural precision sky blue
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0284c7',
          600: '#0369a1',
        },
        gold: {
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        mono: ['"SF Mono"', 'Menlo', 'Consolas', '"Liberation Mono"', 'monospace'],
      },
      boxShadow: {
        'panel': '0 4px 16px -2px rgba(0, 0, 0, 0.25)',
      }
    },
  },
  plugins: [],
}
