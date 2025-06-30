// postcss.config.js
// This file is part of the Tailwind CSS configuration for the Vocabulary Learning App.
// It sets up PostCSS with Tailwind CSS and Autoprefixer to process CSS files.
// The configuration ensures that Tailwind CSS styles are applied correctly and that vendor prefixes are added for better browser compatibility.
// The PostCSS configuration is essential for building the application's styles and ensuring a consistent look across different browsers.
// It is used in conjunction with Tailwind CSS to create a responsive and modern user interface. 

module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}