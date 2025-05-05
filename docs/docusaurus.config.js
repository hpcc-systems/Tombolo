// @ts-check
import { themes as prismThemes } from "prism-react-renderer";

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: "Tombolo Documentation",
  tagline: "Easy Interaction with HPCC Clusters",
  favicon: "img/favicon.ico",
  url: "https://hpcc-systems.github.io",
  baseUrl: "/Tombolo/",
  organizationName: "hpcc-systems",
  projectName: "Tombolo",
  trailingSlash: false,
  deploymentBranch: "gh-pages",

  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",

  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },

  markdown: {
    parseFrontMatter: async (params) => {
      const result = await params.defaultParseFrontMatter(params);
      result.frontMatter.pagination_prev = null;
      result.frontMatter.pagination_next = null;
      return result;
    },
  },

  presets: [
    [
      "classic",
      {
        docs: {
          sidebarPath: "./sidebars.js",
        },
        blog: {
          showReadingTime: true,
        },
        theme: {
          customCss: "./src/css/custom.css",
        },
      },
    ],
  ],

  themeConfig: {
    image: "img/docusaurus-social-card.jpg",
    navbar: {
      logo: {
        alt: "My Site Logo",
        src: "/img/logo.png",
        srcDark: "/img/logo.png",
      },
      items: [
        {
          to: "/docs/category/installation--configuration",
          label: "Installation & Configuration",
        },
        {
          to: "/docs/category/user-guides",
          label: "User Guides",
        },
        {
          to: "/docs/category/developer-resources",
          label: "Developer Resources",
        },
        {
          to: "/release-notes",
          label: "Release Notes",
        },
        {
          to: "/faq",
          label: "FAQ",
        },
        {
          href: "https://github.com/hpcc-systems/Tombolo",
          label: "GitHub",
          position: "right",
        },
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
              to: "/docs/category/installation--configuration",
              label: "Installation & Configuration",
            },
            {
              to: "/docs/category/user-guides",
              label: "User Guides",
            },
            {
              to: "/docs/category/developer-resources",
              label: "Developer Resources",
            },
            {
              to: "/release-notes",
              label: "Release Notes",
            },
            {
              to: "/faq",
              label: "FAQ",
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
  },
};

export default config;
