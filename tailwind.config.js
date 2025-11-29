/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#050403',      // Almost black brown
        surface: '#0d0b09',          // Very dark brown
        'surface-light': '#1a1512',  // Dark brown
        primary: '#b8956a',          // Muted gold/tan
        secondary: '#8b7355',        // Darker muted gold
        accent: '#d4a574',           // Light tan (for highlights)
        success: '#6b7c52',          // Dark olive green
        warning: '#b8904f',          // Dark amber
        danger: '#a8634a',           // Dark terracotta
        'sepia': '#9a7d56',          // Dark sepia
        'vintage-brown': '#6b5d4f',  // Very vintage brown
        'cream': '#c9b896',          // Muted cream/beige
      }
    },
  },
  plugins: [],
}
