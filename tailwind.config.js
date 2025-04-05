/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./*.{html,js}"],
    theme: {
      extend: {
        colors: {
          primary: '#B18FCF',
          secondary: '#FF6F61',
          accent: '#A3D9B1',
          textColor: '#2C3E50',
          backgroundColor: '#E8F1F5',
          headerBackground: '#D9E4E9',
        },
        maxWidth: {
          'content': '1200px',
        },
      },
    },
    plugins: [],
  }