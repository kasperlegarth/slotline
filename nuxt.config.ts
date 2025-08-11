import tailwindcss from "@tailwindcss/vite";

// nuxt.config.ts
export default defineNuxtConfig({
  compatibilityDate: '2025-08-11',
  css: ['~/assets/css/main.css'],
  vite: {
    plugins: [
      tailwindcss(),
    ],
  },
  postcss: {
    plugins: {
      autoprefixer: {}
    }
  },
  // Dark mode via class-strategi (vi toggler 'dark' på <html>)
  app: {
    head: {
      htmlAttrs: { class: '' }
    }
  }
})
