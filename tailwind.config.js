/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        heading: ['Barlow Condensed', 'sans-serif'],
        sans: ['Overpass', 'sans-serif'],
      },
      screens: {
        '3xl': '1800px',
      },
    },
  },
  plugins: [],
};
