/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        simbara: {
          primary: '#F3AB33',
          dark: '#EAA121',
        }
      },
      fontFamily: {
        jawa: ['JawaPalsu', 'Montserrat'], 
      }
    },
  },
  plugins: [],
}