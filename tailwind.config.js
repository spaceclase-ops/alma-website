/** @type {import('tailwindcss').Config} */
// Same theme that used to live inline in index.html for the Tailwind Play CDN,
// now compiled at build time so pages render styled before any JS runs.
export default {
  content: [
    './index.html',
    './*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './data/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Rubik', 'sans-serif'],
      },
      colors: {
        alma: {
          dark: '#0f172a',
          primary: '#0ea5e9',
          accent: '#2dd4bf',
          light: '#f0f9ff',
        },
      },
    },
  },
  plugins: [],
};
