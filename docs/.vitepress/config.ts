import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "WebGPU-Fiddle",
  description: "A tool for creating WGSL shaders in the browser.",
  markdown: {
    theme: {
      light: "catppuccin-latte",
      dark: "catppuccin-mocha",
    },
  },
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'Reference', link: '/reference/api' },
    ],
    sidebar: [
      {
        text: 'Guide',
        items: [
          { text: 'Getting Started', link: '/guide/getting-started' },
          { text: 'Templates', link: '/guide/templates' },
          { text: 'Shader System', link: '/guide/shader-system' },
        ],
      },
      {
        text: 'Reference',
        items: [
          { text: 'API Reference', link: '/reference/api' },
        ],
      },
    ],
  },
})
