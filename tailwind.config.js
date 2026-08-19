/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1A3A5C',
        'primary-light': '#2C5A8C',
        'sync-green': '#2ECC71',
        'warning-amber': '#F39C12',
        'danger-crimson': '#E74C3C',
        'nudge-purple': '#8E44AD',
        'sidebar-bg': '#0F172A',
        'main-bg': '#F4F6F9',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        mono: ['"DM Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
