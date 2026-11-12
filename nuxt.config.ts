// StepCheck — configuração do Nuxt
// Site 100% estático (SPA) publicado no GitHub Pages em /stepcheck/
export default defineNuxtConfig({
  compatibilityDate: '2026-11-01',
  ssr: false,
  devtools: { enabled: false },
  telemetry: false,
  app: {
    baseURL: '/stepcheck/',
    buildAssetsDir: 'assets/',
    head: {
      htmlAttrs: { lang: 'pt-BR' },
      title: 'StepCheck — NOVALE',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'theme-color', content: '#0D2B5E' },
        { name: 'description', content: 'StepCheck — gestão de testes e aprovações | NOVALE' },
        { name: 'robots', content: 'noindex, nofollow' },
      ],
      link: [
        { rel: 'icon', type: 'image/png', href: '/stepcheck/favicon.png' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Montserrat:wght@600;700;800&display=swap' },
      ],
    },
  },
  router: { options: { hashMode: true } },
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    public: {
      apiUrl: 'https://xtwtadqaemupspbopxnk.supabase.co/functions/v1/api',
      supabaseUrl: 'https://xtwtadqaemupspbopxnk.supabase.co',
      // Chave PÚBLICA (publishable/anon). Nunca colocar a chave secreta aqui.
      supabaseKey: 'sb_publishable_qT68jAUaVStjrimuDYHMig_20Hn30tR',
      versao: '1.3.0',
    },
  },
  nitro: { preset: 'static' },
})
