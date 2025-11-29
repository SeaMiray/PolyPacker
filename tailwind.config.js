/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0a0806',      // Very dark brown-black
        surface: '#1a1512',          // Dark brown
        'surface-light': '#2a2118',  // Lighter brown
        primary: '#d4a574',          // Warm gold/tan
        secondary: '#b8956a',        // Muted gold
        accent: '#e8b887',           // Light tan
        success: '#8b9c6f',          // Olive green
        warning: '#d4a047',          // Amber/mustard
        danger: '#c97c5d',           // Terracotta
        'sepia': '#b89968',          // Sepia tone
        'vintage-brown': '#8b7355',  // Vintage brown
        'cream': '#e8dcc4',          // Cream/beige
      }
    },
  },
  plugins: [],
}
