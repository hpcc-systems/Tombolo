import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/ping_pong/blog',
    component: ComponentCreator('/ping_pong/blog', 'ae8'),
    exact: true
  },
  {
    path: '/ping_pong/blog/archive',
    component: ComponentCreator('/ping_pong/blog/archive', '207'),
    exact: true
  },
  {
    path: '/ping_pong/blog/authors',
    component: ComponentCreator('/ping_pong/blog/authors', '575'),
    exact: true
  },
  {
    path: '/ping_pong/blog/authors/all-sebastien-lorber-articles',
    component: ComponentCreator('/ping_pong/blog/authors/all-sebastien-lorber-articles', '96e'),
    exact: true
  },
  {
    path: '/ping_pong/blog/authors/yangshun',
    component: ComponentCreator('/ping_pong/blog/authors/yangshun', '79b'),
    exact: true
  },
  {
    path: '/ping_pong/blog/first-blog-post',
    component: ComponentCreator('/ping_pong/blog/first-blog-post', '5df'),
    exact: true
  },
  {
    path: '/ping_pong/blog/long-blog-post',
    component: ComponentCreator('/ping_pong/blog/long-blog-post', '86d'),
    exact: true
  },
  {
    path: '/ping_pong/blog/mdx-blog-post',
    component: ComponentCreator('/ping_pong/blog/mdx-blog-post', 'df4'),
    exact: true
  },
  {
    path: '/ping_pong/blog/tags',
    component: ComponentCreator('/ping_pong/blog/tags', '372'),
    exact: true
  },
  {
    path: '/ping_pong/blog/tags/docusaurus',
    component: ComponentCreator('/ping_pong/blog/tags/docusaurus', '42d'),
    exact: true
  },
  {
    path: '/ping_pong/blog/tags/facebook',
    component: ComponentCreator('/ping_pong/blog/tags/facebook', 'b3d'),
    exact: true
  },
  {
    path: '/ping_pong/blog/tags/hello',
    component: ComponentCreator('/ping_pong/blog/tags/hello', '993'),
    exact: true
  },
  {
    path: '/ping_pong/blog/tags/hola',
    component: ComponentCreator('/ping_pong/blog/tags/hola', '72c'),
    exact: true
  },
  {
    path: '/ping_pong/blog/welcome',
    component: ComponentCreator('/ping_pong/blog/welcome', '4c8'),
    exact: true
  },
  {
    path: '/ping_pong/faq',
    component: ComponentCreator('/ping_pong/faq', '792'),
    exact: true
  },
  {
    path: '/ping_pong/markdown-page',
    component: ComponentCreator('/ping_pong/markdown-page', '8d0'),
    exact: true
  },
  {
    path: '/ping_pong/release-notes',
    component: ComponentCreator('/ping_pong/release-notes', '310'),
    exact: true
  },
  {
    path: '/ping_pong/docs',
    component: ComponentCreator('/ping_pong/docs', '4b0'),
    routes: [
      {
        path: '/ping_pong/docs',
        component: ComponentCreator('/ping_pong/docs', '96b'),
        routes: [
          {
            path: '/ping_pong/docs',
            component: ComponentCreator('/ping_pong/docs', '0fc'),
            routes: [
              {
                path: '/ping_pong/docs/category/developer-resources',
                component: ComponentCreator('/ping_pong/docs/category/developer-resources', 'dfb'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/ping_pong/docs/category/installation--configuration',
                component: ComponentCreator('/ping_pong/docs/category/installation--configuration', 'e6d'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/ping_pong/docs/category/monitoring',
                component: ComponentCreator('/ping_pong/docs/category/monitoring', '183'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/ping_pong/docs/category/user-guides',
                component: ComponentCreator('/ping_pong/docs/category/user-guides', '374'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/ping_pong/docs/Developer/Integrations',
                component: ComponentCreator('/ping_pong/docs/Developer/Integrations', '28d'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/ping_pong/docs/Developer/Testing',
                component: ComponentCreator('/ping_pong/docs/Developer/Testing', '58a'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/ping_pong/docs/Install/Configurations',
                component: ComponentCreator('/ping_pong/docs/Install/Configurations', '3d8'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/ping_pong/docs/Install/Docker',
                component: ComponentCreator('/ping_pong/docs/Install/Docker', '94f'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/ping_pong/docs/Install/Local',
                component: ComponentCreator('/ping_pong/docs/Install/Local', '91e'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/ping_pong/docs/Install/Uninstall',
                component: ComponentCreator('/ping_pong/docs/Install/Uninstall', '176'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/ping_pong/docs/User-Guides/application',
                component: ComponentCreator('/ping_pong/docs/User-Guides/application', 'b32'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/ping_pong/docs/User-Guides/assets',
                component: ComponentCreator('/ping_pong/docs/User-Guides/assets', '313'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/ping_pong/docs/User-Guides/cluster',
                component: ComponentCreator('/ping_pong/docs/User-Guides/cluster', '7be'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/ping_pong/docs/User-Guides/dashboards',
                component: ComponentCreator('/ping_pong/docs/User-Guides/dashboards', '11e'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/ping_pong/docs/User-Guides/github',
                component: ComponentCreator('/ping_pong/docs/User-Guides/github', '956'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/ping_pong/docs/User-Guides/monitoring/ClusterMonitoring',
                component: ComponentCreator('/ping_pong/docs/User-Guides/monitoring/ClusterMonitoring', 'f9e'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/ping_pong/docs/User-Guides/monitoring/DirectoryMonitoring',
                component: ComponentCreator('/ping_pong/docs/User-Guides/monitoring/DirectoryMonitoring', '066'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/ping_pong/docs/User-Guides/monitoring/jobMonitoring',
                component: ComponentCreator('/ping_pong/docs/User-Guides/monitoring/jobMonitoring', '771'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/ping_pong/docs/User-Guides/monitoring/SuperFilesMonitoring',
                component: ComponentCreator('/ping_pong/docs/User-Guides/monitoring/SuperFilesMonitoring', '6a9'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/ping_pong/docs/User-Guides/teams-webhook',
                component: ComponentCreator('/ping_pong/docs/User-Guides/teams-webhook', 'bce'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/ping_pong/docs/User-Guides/user-interface',
                component: ComponentCreator('/ping_pong/docs/User-Guides/user-interface', '38b'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/ping_pong/docs/User-Guides/users',
                component: ComponentCreator('/ping_pong/docs/User-Guides/users', '7b7'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/ping_pong/docs/User-Guides/Wildcards',
                component: ComponentCreator('/ping_pong/docs/User-Guides/Wildcards', 'aa4'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/ping_pong/docs/User-Guides/workflows',
                component: ComponentCreator('/ping_pong/docs/User-Guides/workflows', '350'),
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
    path: '/ping_pong/',
    component: ComponentCreator('/ping_pong/', '540'),
    exact: true
  },
  {
    path: '*',
    component: ComponentCreator('*'),
  },
];
