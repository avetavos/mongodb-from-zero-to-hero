# Microservices Design Patterns — From Zero to Hero

A bilingual (EN/TH), standalone, beginner→advanced course on the **microservices pattern language**. When microservices help (and when they hurt), how to decompose a system, keep data consistent across services that each own their database, communicate reliably, observe a distributed system, and run it in production. Each pattern is presented as **Context → Problem → Solution** with an architecture/sequence/state diagram, an example, and the benefits and drawbacks it brings. Diagrams are **Mermaid**, and there's a **read-mode** toggle.

All content is original: original explanations of the public, well-known microservices patterns, original code/config examples, and original diagrams.

## Tech Stack

| Layer | Technology |
| ----- | ---------- |
| Site framework | [Astro 6](https://astro.build) + [Starlight 0.40](https://starlight.astro.build) |
| UI islands | [Preact](https://preactjs.com) (via `@astrojs/preact`) |
| Examples | Starlight built-in `<Tabs syncKey="lang">` + `<TabItem>` — for logic patterns (Saga, Circuit Breaker, Idempotent Consumer, …) a fenced block per language (TypeScript, Python, Go, Rust); for infrastructure patterns (API Gateway, Service Mesh, deployment, chassis) a single fenced YAML/Dockerfile/config block. Expressive-code copy buttons. |
| Diagrams | Client-side, theme-aware **Mermaid** (`<Mermaid>` + `public/enhance.js`) — flowchart, sequenceDiagram, stateDiagram-v2 |
| Reading | **Read-mode** toggle (hides sidebar/TOC, widens content) via `public/enhance.js` |
| Unit tests | [Vitest](https://vitest.dev) + `@testing-library/preact` |
| i18n | Starlight built-in, `defaultLocale: 'en'`, locales: `en` + `th` |

## Commands

```bash
npm install        # Install dependencies
npm run dev        # Start dev server at http://localhost:4321
npm run build      # Build production site to ./dist/
npm run preview    # Preview the production build locally
npm test           # Run Vitest unit tests
```

## Content Structure

```
src/content/docs/
  en/                              # English — served at /en/...
    intro-and-principles/          # monolith vs microservices, benefits/drawbacks, when to use, the pattern language
    decomposition/                 # by business capability, by subdomain (DDD), self-contained service, service per team
    data-management/               # Database per Service, Saga, API Composition, CQRS, Event Sourcing
    transactional-messaging/       # Transactional Outbox, log tailing, polling publisher, idempotent consumer
    communication/                 # RPI (REST/gRPC), messaging, API Gateway, BFF, service discovery
    reliability/                   # Circuit Breaker, retry + timeout, bulkhead, rate limiting
    observability/                 # Health Check API, log aggregation, distributed tracing, metrics, audit logging
    deployment-and-cross-cutting/  # Service per Container, serverless, service mesh, microservice chassis, externalized config
    index.mdx                      # EN landing (splash)
  th/                              # Thai — served at /th/...
    (same module directories)
    index.mdx
```

## Components & Lesson Template

- **`Mermaid.astro`** `{ code, title }` — hoist the diagram as `export const ...Diagram = \`flowchart ...\`` and render `<Mermaid code={...Diagram} title="..."/>`.
- **`Callout.astro`** `{ title }`, **`Quiz.tsx`** `{ id, questions }` (0-based `answer`, field `q`), **`ProgressTracker.tsx`** `{ id }`.
- Multi-language code uses Starlight's **`{ Tabs, TabItem }`** from `@astrojs/starlight/components` — no custom component.

Per-pattern lesson order (Alexandrian pattern format): frontmatter → imports → **Context** → **Problem** → **Solution** → `<Mermaid>` → **Example** (`<Tabs>` for logic, fenced config for infra) → **Resulting context** (benefits/drawbacks) → **Related patterns** → `<Callout>` → `<Quiz>` → `<ProgressTracker>` (last). IDs follow `<module>/<slug>`.

> **⚠️ Authoring notes:**
> - **Diagrams are Mermaid** (`flowchart` / `sequenceDiagram` / `stateDiagram-v2`), hoisted in `export const`. **No ASCII diagrams** (no box-drawing characters — use plain `-->` arrows in any text illustration).
> - **Code/config lives in fenced blocks** (literal — no `${`/backtick escaping). Logic patterns → 4-language `<Tabs syncKey="lang">` (TypeScript, Python, Go, Rust); infra patterns → a single fenced YAML/Dockerfile/text block.
> - **Never a bare `{...}`/`${...}` in prose** — keep code/JSON in fenced blocks / Tabs; Mermaid source in `export const`. Each lesson **ends on its `<ProgressTracker .../>`** — no stray trailing tags.
> - **Internal links include the base path** and the matching locale (`/microservices-design-from-zero-to-hero/en/...` on EN, `/th/...` on TH).

## Deployment

Fully static → `dist/`. Base path in `astro.config.mjs`: `site: 'https://avetavos.github.io'`, `base: '/microservices-design-from-zero-to-hero'`.

Deployed to GitHub Pages via **branch-source** (`gh-pages`): build `dist/`, add `.nojekyll`, push to `gh-pages`, set **Settings → Pages → Source: Deploy from a branch → `gh-pages` / `/`**, then **request a Pages build** (`gh api -X POST repos/<owner>/<repo>/pages/builds`) — flipping the source alone does not trigger one. If you change `base`, update the base-prefixed links in `src/content/docs/{en,th}/index.mdx`.
