/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#1a472a',
        'primary-dark': '#0e2a1a',
        secondary: '#c5a028',
        'secondary-light': '#d4b44a',
        dark: '#1e1e1e',
        light: '#f8f9fa',
        gray: '#6c757d',
      },
    },
  },
  plugins: [],
};