export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'oxford-green': '#0A231F',
        'signal-orange': '#D65A31',
        'bone': '#F4F3EF',
        'light-gray': '#F9F9F9',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'], // Assuming Inter as per common modern stacks, or user request regarding "modern typography"
      },
    },
  },
  plugins: [],
}

