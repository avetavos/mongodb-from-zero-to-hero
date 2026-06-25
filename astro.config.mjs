// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

import preact from '@astrojs/preact';

// https://astro.build/config
export default defineConfig({
  // GitHub Pages project site. Update `site` to your GitHub username and `base`
  // to your repo name if they differ.
  site: 'https://avetavos.github.io',
  base: '/microservices-design-from-zero-to-hero',
  output: 'static',
  integrations: [starlight({
      title: 'Microservices Design Patterns — From Zero to Hero',
      defaultLocale: 'en',
      locales: {
        en: { label: 'English', lang: 'en' },
        th: { label: 'ไทย', lang: 'th' },
      },
      customCss: ['./src/styles/custom.css'],
      head: [
        { tag: 'script', attrs: { type: 'module', src: '/microservices-design-from-zero-to-hero/enhance.js' } },
      ],
      social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/avetavos/microservices-design-from-zero-to-hero' }],
      sidebar: [
        { label: 'Intro & Principles', items: [{ autogenerate: { directory: 'intro-and-principles' } }] },
        { label: 'Decomposition', items: [{ autogenerate: { directory: 'decomposition' } }] },
        { label: 'Data Management', items: [{ autogenerate: { directory: 'data-management' } }] },
        { label: 'Transactional Messaging', items: [{ autogenerate: { directory: 'transactional-messaging' } }] },
        { label: 'Communication', items: [{ autogenerate: { directory: 'communication' } }] },
        { label: 'Reliability', items: [{ autogenerate: { directory: 'reliability' } }] },
        { label: 'Observability', items: [{ autogenerate: { directory: 'observability' } }] },
        { label: 'Deployment & Cross-cutting', items: [{ autogenerate: { directory: 'deployment-and-cross-cutting' } }] },
      ],
      }), preact()],
});