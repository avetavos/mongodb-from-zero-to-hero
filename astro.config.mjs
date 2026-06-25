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
      ],
      social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/avetavos/mongodb-from-zero-to-hero' }],
      sidebar: [
        { label: 'Intro & Documents', items: [{ autogenerate: { directory: 'intro-and-documents' } }] },
        { label: 'CRUD', items: [{ autogenerate: { directory: 'crud' } }] },
        { label: 'Querying', items: [{ autogenerate: { directory: 'querying' } }] },
        { label: 'Indexes', items: [{ autogenerate: { directory: 'indexes' } }] },
        { label: 'Aggregation', items: [{ autogenerate: { directory: 'aggregation' } }] },
        { label: 'Data Modeling', items: [{ autogenerate: { directory: 'data-modeling' } }] },
        { label: 'Transactions & Consistency', items: [{ autogenerate: { directory: 'transactions-and-consistency' } }] },
        { label: 'Operations & Scaling', items: [{ autogenerate: { directory: 'operations-and-scaling' } }] },
      ],
      }), preact()],
});