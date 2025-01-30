const { createGlobPatternsForDependencies } = require('@nx/react/tailwind');
const { join } = require('path');
const colors = require('tailwindcss/colors')

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    join(
      __dirname,
      '{src,pages,components,app}/**/*!(*.stories|*.spec).{ts,tsx,html}'
    ),
    ...createGlobPatternsForDependencies(__dirname),
  ],
  theme: {
    extend: {
      colors: {
        // Add your custom colors here
        primary: colors.orange[500],   // Example: changing primary color to Tailwind's blue-500
        secondary: colors.green[500], // Example: changing secondary color to Tailwind's green-500
        // Add more custom colors as needed
      },
    },
  },
  plugins: [require('daisyui')],
  // Customize daisyUI config
  daisyui: {
    themes: [
      {
        mytheme: {
          "primary": colors.orange[500],
          "secondary": colors.green[500],
          "accent": colors.cyan[500],
          "neutral": colors.gray[500],
          "base-100": colors.black,
          // Add more color overrides as needed
        },
      },
    ],
  },
};