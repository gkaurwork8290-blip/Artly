/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#6C3CE1',
        secondary: '#FF3D71',
        tertiary: '#00D4FF',
        success: '#00E096',
        background: '#0F0F1A',
        surface: '#1A1A2E',
        surface2: '#242440',
        'text-primary': '#FFFFFF',
        'text-secondary': '#A0A0C0',
      },
      fontFamily: {
        'space': ['Space Grotesk', 'sans-serif'],
        'inter': ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
