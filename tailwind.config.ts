import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        surface: { DEFAULT: '#1e1e2e', light: '#2a2a3c', dark: '#181825' },
        accent: { DEFAULT: '#89b4fa', green: '#a6e3a1', red: '#f38ba8', yellow: '#f9e2af' }
      }
    }
  },
  plugins: []
} satisfies Config
