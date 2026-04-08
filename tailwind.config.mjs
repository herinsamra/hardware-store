/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1a472a',
          dark: '#0e2a1a',
        },
        secondary: {
          DEFAULT: '#c5a028',
          light: '#d4b44a',
        },
        dark: '#1e1e1e',
        light: '#f8f9fa',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
