# MongoDB — From Zero to Hero

A bilingual (EN/TH), standalone, beginner→advanced course on **MongoDB**. From the document model and CRUD through querying, indexing, the aggregation pipeline, data modeling, transactions, and production scaling. Every operation is shown across **mongosh, Node.js, Python, Go, and Rust**, with **MongoDB Compass** GUI tours, a **Docker** setup, result documents shown as JSON, and **Mermaid** architecture diagrams. There's a **read-mode** toggle.

All content is original: original explanations of MongoDB (a public technology), original code/query examples and result documents, and original diagrams.

> **Note:** MongoDB is a server, so it can't run inside the browser — the examples are **illustrative** (real `mongosh`/driver code with the documents they return), not executed in-page. The Docker setup lesson shows how to run MongoDB locally and connect.

## Tech Stack

| Layer | Technology |
| ----- | ---------- |
| Site framework | [Astro 6](https://astro.build) + [Starlight 0.40](https://starlight.astro.build) |
| UI islands | [Preact](https://preactjs.com) (via `@astrojs/preact`) |
| Examples | Starlight built-in `<Tabs syncKey="lang">` + `<TabItem>` — five tabs per operation: **mongosh**, **Node.js** (`mongodb` driver), **Python** (PyMongo), **Go** (mongo-go-driver), **Rust** (`mongodb` crate). Reads show result documents as fenced JSON. Expressive-code copy buttons. |
| GUI / setup | **MongoDB Compass** covered in prose ("In Compass:" notes + a tour); **Docker** setup lesson (`docker run` + `docker-compose.yml`). |
| Diagrams | Client-side, theme-aware **Mermaid** (`<Mermaid>` + `public/enhance.js`) — pipelines, replica sets, sharding, the ESR rule, query plans |
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
    intro-and-documents/           # document model, Docker setup, mongosh + Compass, BSON, vs relational
    crud/                          # insert, find, update operators, delete, upsert & bulkWrite
    querying/                      # comparison/logical operators, arrays, nested docs, projection/sort/pagination
    indexes/                       # single & compound, the ESR rule, explain() & plans, index types
    aggregation/                   # $match/$project, $group, $lookup, $unwind, $facet/$bucket
    data-modeling/                 # embedding vs referencing, relationships, schema patterns, validation, anti-patterns
    transactions-and-consistency/  # single-doc atomicity, multi-doc transactions, read/write concerns, change streams
    operations-and-scaling/        # replica sets, sharding, performance & profiling, security & Atlas
    index.mdx                      # EN landing (splash)
  th/                              # Thai — served at /th/...
    (same module directories)
    index.mdx
```

## Components & Lesson Template

- **`Mermaid.astro`** `{ code, title }` — hoist the diagram as `export const ...Diagram = \`flowchart ...\`` and render `<Mermaid code={...Diagram} title="..."/>`.
- **`Callout.astro`** `{ title }`, **`Quiz.tsx`** `{ id, questions }` (0-based `answer`, field `q`), **`ProgressTracker.tsx`** `{ id }`.
- Multi-language code uses Starlight's **`{ Tabs, TabItem }`** from `@astrojs/starlight/components` — no custom component.

Per-lesson order (tutorial): frontmatter → imports → concept intro → sections (prose + a 5-tab `<Tabs>` example + a fenced ```json result + an optional "In Compass:" note) → Tips/gotchas → `<Callout>` → `<Quiz>` → `<ProgressTracker>` (last). IDs follow `<module>/<slug>`.

> **⚠️ Authoring notes:**
> - **Five driver tabs, in order:** mongosh (` ```js `), Node.js (` ```js `), Python (` ```python `), Go (` ```go `), Rust (` ```rust ` — `mongodb` crate, `bson::doc!`, `.await?`). After a read, show the result as ` ```json `.
> - **Code/documents live in fenced blocks** (literal — no `${`/backtick escaping). **Never a bare `{...}` in prose** — Mongo query objects/documents go in fenced ` ```js `/` ```json ` or `<Tabs>`, never inline in a sentence.
> - **Diagrams are Mermaid**, hoisted in `export const`. **No ASCII diagrams** (no box-drawing chars). **Never a `;` inside a Mermaid sequence message** (statement separator → the diagram silently fails to render); prefer `flowchart`.
> - Each lesson **ends on its `<ProgressTracker .../>`** — no stray trailing tags. **Internal links include the base path** and matching locale (`/mongodb-from-zero-to-hero/en/...` on EN, `/th/...` on TH).

## Deployment

Fully static → `dist/`. Base path in `astro.config.mjs`: `site: 'https://avetavos.github.io'`, `base: '/mongodb-from-zero-to-hero'`.

Deployed to GitHub Pages via **branch-source** (`gh-pages`): build `dist/`, add `.nojekyll`, push to `gh-pages`, set **Settings → Pages → Source: Deploy from a branch → `gh-pages` / `/`**, then **request a Pages build** (`gh api -X POST repos/<owner>/<repo>/pages/builds`) — flipping the source alone does not trigger one. If you change `base`, update the base-prefixed links in `src/content/docs/{en,th}/index.mdx`.
