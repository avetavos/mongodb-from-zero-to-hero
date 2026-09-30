# tools/

- `check-parity.mjs` (`npm run check`) - EN/TH parity (headings, fences, quiz counts).
- `verify-snippets.mjs` (`npm run verify`) - runs the EN lessons' code fences against a real, pinned MongoDB.

## verify-snippets

Needs Docker + Node 24. First run installs nothing on the host; `tools/probe/` (own `package.json`, gitignored `node_modules/`) holds the pinned Node driver + tsc: `cd tools/probe && npm ci`.

```
npm run verify                    # only fences that carry a path comment (the convention below)
npm run verify:all                # BASELINE: also classify path-less fences by their <TabItem label> (mongosh / Node.js); other drivers skipped
node tools/verify-snippets.mjs querying/querying-arrays    # one lesson (substring filter)
node tools/verify-snippets.mjs --self-test                 # harness self-check, no Docker
node tools/verify-snippets.mjs --stop                      # remove the shared container
node tools/verify-snippets.mjs --refresh                   # recreate the container
```

Runtime pins: `tools/probe/versions.json` (mongo `8.3.11` = what `mongo:8` resolved to on 2026-09-30, mongosh 2.11.1, Node driver 7.7.0, tsc 5.9.3). The harness starts ONE shared container `mongodb-from-zero-to-hero-verify` on host port `27117` (single-node replica set `rs0`, no auth, so transactions and change streams work) and leaves it running; stop it with `--stop`. Sharding, auth, TLS and multi-node failover need their own stack and are marked `@skip-verify`.

### Fence convention (first line of the fence)

| Fence | First line | Run as |
|---|---|---|
| `js` mongosh | `// mongosh/<name>.js` | `mongosh` in the container; all shell fences of a lesson share ONE session in document order (variables persist), each in its own `load()` so one failure does not stop the rest |
| `js`/`ts` Node | `// app/<name>.mjs` (or `.ts`) | Node driver, one process per fence, document order. Fragments get a prelude (`client`, `db`, `MongoClient`, `ObjectId`, `Decimal128`, `Long`, ...) and are wrapped in an async block. A fence that declares its own `client`/`db` or `new MongoClient` runs as written. `.ts` is type-checked with `tsc --strict` first |
| `bash` | `# scripts/<name>.sh` | `bash -n` (syntax only, never executed) |
| `yaml` | `# docker-compose.yml` | `docker compose config -q` (only bodies starting with `services:`; `mongod.conf` is not validated) |

Special markers on line 1: `@expect-error` = deliberate failure demo (counted, never run); `@skip-verify <reason>` = illustrative only (counted, never run).

### Isolation

Each lesson gets its own database (`l_<hash>_<lesson>` for shell, `..._app` for Node) dropped before the run, so lessons never depend on one another - **every lesson must seed its own data**. `use <db>` in a shell fence is rewritten to that lesson's database (mongosh `load()` rejects `use`). Quiz arrays and `<SpotTheBug code={...}>` strings are excluded from fence collection.

### Limits (be honest in lessons)

A pass means "no exception". Assertions on returned data are the lesson author's job (print + `assert`), and the shell and Node passes use separate databases, so a Node fence cannot rely on data a shell fence created. A blocking `watch()`/`hasNext()` loop hits the 90 s lesson timeout - use `tryNext()` or `@skip-verify`.
