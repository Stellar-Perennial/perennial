import { defineConfig } from "vitepress";

export default defineConfig({
  lang: "en-US",
  title: "Perennial",
  description:
    "Keep your Soroban contract state alive: monitor TTLs, extend and restore entries, alert before expiry.",
  base: "/perennial/",
  srcDir: ".",
  srcExclude: ["**/node_modules/**", ".vitepress/cache/**", ".vitepress/dist/**", "package.json"],
  ignoreDeadLinks: false,
  head: [["link", { rel: "icon", type: "image/svg+xml", href: "/perennial/logo.svg" }]],
  themeConfig: {
    logo: "/logo.svg",
    nav: [
      { text: "Guide", link: "/guide/introduction", activeMatch: "/guide/" },
      { text: "Developers", link: "/developers/architecture", activeMatch: "/developers/" },
      { text: "Roadmap", link: "/roadmap" },
      { text: "Security", link: "/security" },
      {
        text: "GitHub",
        link: "https://github.com/stellar-Perennial/perennial",
      },
    ],
    sidebar: {
      "/guide/": [
        {
          text: "Guide",
          items: [
            { text: "Introduction", link: "/guide/introduction" },
            { text: "Concepts", link: "/guide/concepts" },
            { text: "Getting started", link: "/guide/getting-started" },
            { text: "Configuration", link: "/guide/configuration" },
            { text: "CLI", link: "/guide/cli" },
            { text: "Alerts", link: "/guide/alerts" },
            { text: "GitHub Action", link: "/guide/github-action" },
            { text: "Safety", link: "/guide/safety" },
            { text: "Troubleshooting", link: "/guide/troubleshooting" },
          ],
        },
      ],
      "/developers/": [
        {
          text: "Developers",
          items: [
            { text: "Architecture", link: "/developers/architecture" },
            { text: "Local setup", link: "/developers/local-setup" },
            { text: "Testing", link: "/developers/testing" },
            { text: "Contributing", link: "/developers/contributing" },
          ],
        },
      ],
    },
    aside: false,
    socialLinks: [
      { icon: "github", link: "https://github.com/stellar-Perennial/perennial" },
    ],
    editLink: {
      pattern:
        "https://github.com/stellar-Perennial/perennial/edit/main/docs-site/:path",
      text: "Edit this page on GitHub",
    },
    search: {
      provider: "local",
      options: {
        translations: {
          button: { buttonText: "Search docs", buttonAriaLabel: "Search docs" },
        },
      },
    },
    outline: { level: [2, 3], label: "On this page" },
    footer: {
      message:
        "Perennial is an independent community project. It is not an official Stellar Development Foundation product.",
      copyright: "MIT licensed",
    },
  },
  vite: {
    css: {
      preprocessorOptions: {
        scss: { silenceDeprecations: ["legacy-js-api", "import"] },
      },
    },
  },
});
