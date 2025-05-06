import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/tombolo/blog',
    component: ComponentCreator('/tombolo/blog', 'a37'),
    exact: true
  },
  {
    path: '/tombolo/blog/archive',
    component: ComponentCreator('/tombolo/blog/archive', '183'),
    exact: true
  },
  {
    path: '/tombolo/blog/authors',
    component: ComponentCreator('/tombolo/blog/authors', '194'),
    exact: true
  },
  {
    path: '/tombolo/blog/authors/all-sebastien-lorber-articles',
    component: ComponentCreator('/tombolo/blog/authors/all-sebastien-lorber-articles', '697'),
    exact: true
  },
  {
    path: '/tombolo/blog/authors/yangshun',
    component: ComponentCreator('/tombolo/blog/authors/yangshun', 'c57'),
    exact: true
  },
  {
    path: '/tombolo/blog/first-blog-post',
    component: ComponentCreator('/tombolo/blog/first-blog-post', '630'),
    exact: true
  },
  {
    path: '/tombolo/blog/long-blog-post',
    component: ComponentCreator('/tombolo/blog/long-blog-post', '256'),
    exact: true
  },
  {
    path: '/tombolo/blog/mdx-blog-post',
    component: ComponentCreator('/tombolo/blog/mdx-blog-post', '6c6'),
    exact: true
  },
  {
    path: '/tombolo/blog/tags',
    component: ComponentCreator('/tombolo/blog/tags', '485'),
    exact: true
  },
  {
    path: '/tombolo/blog/tags/docusaurus',
    component: ComponentCreator('/tombolo/blog/tags/docusaurus', 'af9'),
    exact: true
  },
  {
    path: '/tombolo/blog/tags/facebook',
    component: ComponentCreator('/tombolo/blog/tags/facebook', 'ed5'),
    exact: true
  },
  {
    path: '/tombolo/blog/tags/hello',
    component: ComponentCreator('/tombolo/blog/tags/hello', '1da'),
    exact: true
  },
  {
    path: '/tombolo/blog/tags/hola',
    component: ComponentCreator('/tombolo/blog/tags/hola', '6e3'),
    exact: true
  },
  {
    path: '/tombolo/blog/welcome',
    component: ComponentCreator('/tombolo/blog/welcome', '3d2'),
    exact: true
  },
  {
    path: '/tombolo/faq',
    component: ComponentCreator('/tombolo/faq', 'b72'),
    exact: true
  },
  {
    path: '/tombolo/markdown-page',
    component: ComponentCreator('/tombolo/markdown-page', '25e'),
    exact: true
  },
  {
    path: '/tombolo/release-notes',
    component: ComponentCreator('/tombolo/release-notes', '07b'),
    exact: true
  },
  {
    path: '/tombolo/docs',
    component: ComponentCreator('/tombolo/docs', '046'),
    routes: [
      {
        path: '/tombolo/docs',
        component: ComponentCreator('/tombolo/docs', '9a7'),
        routes: [
          {
            path: '/tombolo/docs',
            component: ComponentCreator('/tombolo/docs', '98a'),
            routes: [
              {
                path: '/tombolo/docs/category/developer-resources',
                component: ComponentCreator('/tombolo/docs/category/developer-resources', '3d2'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/tombolo/docs/category/installation--configuration',
                component: ComponentCreator('/tombolo/docs/category/installation--configuration', 'd80'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/tombolo/docs/category/monitoring',
                component: ComponentCreator('/tombolo/docs/category/monitoring', 'dd0'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/tombolo/docs/category/user-guides',
                component: ComponentCreator('/tombolo/docs/category/user-guides', '939'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/tombolo/docs/Developer/Integrations',
                component: ComponentCreator('/tombolo/docs/Developer/Integrations', 'a6e'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/tombolo/docs/Developer/Testing',
                component: ComponentCreator('/tombolo/docs/Developer/Testing', '4fd'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/tombolo/docs/Install/Configurations',
                component: ComponentCreator('/tombolo/docs/Install/Configurations', 'c9b'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/tombolo/docs/Install/Docker',
                component: ComponentCreator('/tombolo/docs/Install/Docker', '94f'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/tombolo/docs/Install/Local',
                component: ComponentCreator('/tombolo/docs/Install/Local', 'dcb'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/tombolo/docs/Install/Uninstall',
                component: ComponentCreator('/tombolo/docs/Install/Uninstall', '7ce'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/tombolo/docs/User-Guides/application',
                component: ComponentCreator('/tombolo/docs/User-Guides/application', 'd3d'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/tombolo/docs/User-Guides/assets',
                component: ComponentCreator('/tombolo/docs/User-Guides/assets', '3bd'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/tombolo/docs/User-Guides/cluster',
                component: ComponentCreator('/tombolo/docs/User-Guides/cluster', '114'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/tombolo/docs/User-Guides/dashboards',
                component: ComponentCreator('/tombolo/docs/User-Guides/dashboards', '2f4'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/tombolo/docs/User-Guides/github',
                component: ComponentCreator('/tombolo/docs/User-Guides/github', 'ead'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/tombolo/docs/User-Guides/monitoring/ClusterMonitoring',
                component: ComponentCreator('/tombolo/docs/User-Guides/monitoring/ClusterMonitoring', '7d6'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/tombolo/docs/User-Guides/monitoring/DirectoryMonitoring',
                component: ComponentCreator('/tombolo/docs/User-Guides/monitoring/DirectoryMonitoring', '7ee'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/tombolo/docs/User-Guides/monitoring/jobMonitoring',
                component: ComponentCreator('/tombolo/docs/User-Guides/monitoring/jobMonitoring', '457'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/tombolo/docs/User-Guides/monitoring/SuperFilesMonitoring',
                component: ComponentCreator('/tombolo/docs/User-Guides/monitoring/SuperFilesMonitoring', '9e2'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/tombolo/docs/User-Guides/teams-webhook',
                component: ComponentCreator('/tombolo/docs/User-Guides/teams-webhook', '700'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/tombolo/docs/User-Guides/user-interface',
                component: ComponentCreator('/tombolo/docs/User-Guides/user-interface', '5cc'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/tombolo/docs/User-Guides/users',
                component: ComponentCreator('/tombolo/docs/User-Guides/users', '1eb'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/tombolo/docs/User-Guides/Wildcards',
                component: ComponentCreator('/tombolo/docs/User-Guides/Wildcards', '230'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/tombolo/docs/User-Guides/workflows',
                component: ComponentCreator('/tombolo/docs/User-Guides/workflows', '8aa'),
                exact: true,
                sidebar: "tutorialSidebar"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    path: '/tombolo/',
    component: ComponentCreator('/tombolo/', '70f'),
    exact: true
  },
  {
    path: '*',
    component: ComponentCreator('*'),
  },
];
