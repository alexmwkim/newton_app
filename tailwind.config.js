module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        'note-bg': '#F8F6F3',
        'text-gray': '#A6A29D',
        'text-inactive': '#D4CCC2',
        'primary-orange': '#EB754B'
      },
      fontFamily: {
        'sf-pro': ['SF Pro Display', 'system'],
        'avenir': ['Avenir Next', 'system']
      },
      spacing: {
        '70': '280px',
        '80': '320px'
      },
      fontSize: {
        '15': '15px',
        '17': '17px',
        '19': '19px'
      },
      letterSpacing: {
        'tight': '-0.02em'
      }
    },
  },
  plugins: [],
}