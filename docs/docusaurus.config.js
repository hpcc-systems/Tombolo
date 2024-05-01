// @ts-check
// `@type` JSDoc annotations allow editor autocompletion and type checking
// (when paired with `@ts-check`).
// There are various equivalent ways to declare your Docusaurus config.
// See: https://docusaurus.io/docs/api/docusaurus-config

import { themes as prismThemes } from "prism-react-renderer";

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: "Tombolo Documentation",
  tagline: "Easy Interaction with HPCC Clusters",
  favicon: "img/favicon.ico",

  // Set the production url of your site here
  url: "https://your-docusaurus-site.example.com",
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: "/Tombolo/",

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: "HPCC", // Usually your GitHub org/user name.
  projectName: "Tombolo", // Usually your repo name.

  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: "en",
    locales: ["en", "fr"],
  },

  presets: [
    [
      "classic",
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: "./sidebars.js",
        },
        blog: {
          showReadingTime: true,
        },
        theme: {
          customCss: "./src/css/custom.css",
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      // Replace with your project's social card
      image: "img/docusaurus-social-card.jpg",
      navbar: {
        logo: {
          alt: "My Site Logo",
          src: "/img/logo.png",
          srcDark: "/img/logo.png",
        },
        items: [
          {
            to: "/docs/category/quick-start",
            label: "Quick Start",
          },
          {
            to: "/docs/category/user-guides",
            label: "User",
          },
          {
            to: "/docs/category/developer-guides",
            label: "Developer",
          },
          {
            href: "https://github.com/hpcc-systems/Tombolo",
            label: "GitHub",
            position: "right",
          },
          // ADD THIS IF WE NEED VERSIONING IN THE FUTURE
          // {
          //   type: "docsVersionDropdown",
          // },
        ],
      },
      footer: {
        style: "dark",
        logo: {
          alt: "My Site Logo",
          src: "/img/logo-dark.webp",
          srcDark: "/img/logo-dark.webp",
        },
        links: [
          {
            title: "Docs",
            items: [
              {
                to: "/docs/category/quick-start",
                label: "Quick Start",
              },
              {
                to: "/docs/category/user-guides",
                label: "User",
              },
              {
                to: "/docs/category/developer-guides",
                label: "Developer",
              },
            ],
          },
          {
            title: "More",
            items: [
              {
                label: "GitHub",
                href: "https://github.com/hpcc-systems/Tombolo",
              },
            ],
          },

          {
            title: "HPCC Systems",
            items: [
              {
                label: "Site",
                href: "https://hpccsystems.com/",
              },
            ],
          },
        ],
        copyright: `Tombolo is an open source project maintained by HPCC Systems.`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
      },
    }),
};

export default config;
