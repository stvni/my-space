/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#060606',
        surface: '#0f0f0f',
        surface2: '#1a1a1a',
        border: '#2a2a2a',
        chrome: '#c0c0c0',
        'chrome-dim': '#888888',
        'chrome-bright': '#e8e8e8',
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
