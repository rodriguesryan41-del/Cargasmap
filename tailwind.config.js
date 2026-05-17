/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        surface: '#f7f9fb',
        'on-surface': '#191c1e',
        'on-surface-variant': '#45464d',
        outline: '#76777d',
        'outline-variant': '#c6c6cd',
        'primary-container': '#131b2e',
        'secondary-container': '#d0e1fb',
        'on-secondary-container': '#54647a',
        'tertiary-container': '#002113',
        'on-tertiary-container': '#009668',
        'error-container': '#ffdad6',
        'on-error-container': '#93000a',
      },
    },
  },
  plugins: [],
}
