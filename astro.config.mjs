// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

import preact from '@astrojs/preact';

// https://astro.build/config
export default defineConfig({
  // GitHub Pages project site. Update `site` to your GitHub username and `base`
  // to your repo name if they differ.
  site: 'https://avetavos.github.io',
  base: '/mongodb-from-zero-to-hero',
  output: 'static',
  integrations: [starlight({
      title: 'MongoDB — From Zero to Hero',
      defaultLocale: 'en',
      locales: {
        en: { label: 'English', lang: 'en' },
        th: { label: 'ไทย', lang: 'th' },
      },
      customCss: ['./src/styles/custom.css'],
      head: [
        { tag: 'script', attrs: { type: 'module', src: '/mongodb-from-zero-to-hero/enhance.js' } },
        { tag: 'link', attrs: { rel: 'manifest', href: '/mongodb-from-zero-to-hero/manifest.webmanifest' } },
        { tag: 'link', attrs: { rel: 'apple-touch-icon', href: '/mongodb-from-zero-to-hero/apple-touch-icon.png' } },
        { tag: 'link', attrs: { rel: 'icon', type: 'image/png', sizes: '192x192', href: '/mongodb-from-zero-to-hero/icon-192.png' } },
        { tag: 'meta', attrs: { name: 'theme-color', content: '#00ED64' } },
        { tag: 'meta', attrs: { name: 'mobile-web-app-capable', content: 'yes' } },
        { tag: 'meta', attrs: { name: 'apple-mobile-web-app-capable', content: 'yes' } },
        { tag: 'meta', attrs: { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' } },
        { tag: 'meta', attrs: { name: 'apple-mobile-web-app-title', content: "MongoDB" } },
        { tag: 'script', content: "if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/mongodb-from-zero-to-hero/sw.js',{scope:'/mongodb-from-zero-to-hero/'}).catch(function(){})})}" },
      ],
      social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/avetavos/mongodb-from-zero-to-hero' }],
      sidebar: [
        { label: 'Intro & Documents', collapsed: true, items: [{ autogenerate: { directory: 'intro-and-documents' } }] },
        { label: 'CRUD', collapsed: true, items: [{ autogenerate: { directory: 'crud' } }] },
        { label: 'Querying', collapsed: true, items: [{ autogenerate: { directory: 'querying' } }] },
        { label: 'Indexes', collapsed: true, items: [{ autogenerate: { directory: 'indexes' } }] },
        { label: 'Aggregation', collapsed: true, items: [{ autogenerate: { directory: 'aggregation' } }] },
        { label: 'Data Modeling', collapsed: true, items: [{ autogenerate: { directory: 'data-modeling' } }] },
        { label: 'Transactions & Consistency', collapsed: true, items: [{ autogenerate: { directory: 'transactions-and-consistency' } }] },
        { label: 'Operations & Scaling', collapsed: true, items: [{ autogenerate: { directory: 'operations-and-scaling' } }] },
      ],
      }), preact()],
});