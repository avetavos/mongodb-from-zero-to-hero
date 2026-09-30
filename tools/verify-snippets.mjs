#!/usr/bin/env node
// Snippet-verification harness for the bilingual MongoDB course (EN lessons are the source of truth).
// Runs collected fences against a REAL pinned MongoDB (shared container, single-node replica set) with
// real `mongosh` (shell fences) and the real Node driver (app fences). Convention + usage: tools/README.md.
//
//   node tools/verify-snippets.mjs [module/lesson] [--all] [--strict] [--refresh] [--keep-going] [--verbose]
//   node tools/verify-snippets.mjs --stop        remove the shared container
//   node tools/verify-snippets.mjs --self-test   harness self-check (no container needed)
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, rmSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const TOOLS = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.dirname(TOOLS);
const PROBE = path.join(TOOLS, 'probe');
const LESSONS_DIR = path.join(PROBE, 'lessons');
const DOCS = path.join(ROOT, 'src/content/docs/en');
const V = JSON.parse(readFileSync(path.join(PROBE, 'versions.json'), 'utf8'));
const URI = `mongodb://localhost:${V.port}/?replicaSet=${V.replSet}`;
const LESSON_TIMEOUT_MS = 90_000;

// ---------------------------------------------------------------- string scanning (quiz arrays / SpotTheBug are NOT fences)
function parseStringAt(text, i) {
  const q = text[i];
  let j = i + 1;
  while (j < text.length) {
    if (text[j] === '\\') { j += 2; continue; }
    if (text[j] === q) { j++; break; }
    j++;
  }
  return { end: j };
}
function scanBalanced(text, start, open, close) {
  let depth = 1, i = start;
  while (i < text.length && depth > 0) {
    const c = text[i];
    if (c === '"' || c === "'" || c === '`') { i = parseStringAt(text, i).end; continue; }
    if (c === open) depth++; else if (c === close) depth--;
    i++;
  }
  return i;
}
function findExcludedRanges(src) {
  const ranges = [];
  let m, re = /export\s+const\s+\w+\s*=\s*\[/g;
  while ((m = re.exec(src))) { const end = scanBalanced(src, re.lastIndex, '[', ']'); ranges.push([m.index, end]); re.lastIndex = end; }
  re = /<SpotTheBug\s+code=\{\s*`/g;
  while ((m = re.exec(src))) { const { end } = parseStringAt(src, m.index + m[0].length - 1); ranges.push([m.index, end]); re.lastIndex = end; }
  return ranges;
}
function stripExcluded(src, ranges) {
  ranges.sort((a, b) => a[0] - b[0]);
  let out = '', cur = 0;
  for (const [s, e] of ranges) { if (s < cur) continue; out += src.slice(cur, s) + src.slice(s, e).replace(/[^\n]/g, ''); cur = e; }
  return out + src.slice(cur);
}
const nlBefore = (s, upto) => { let n = 0; for (let i = 0; i < upto; i++) if (s.charCodeAt(i) === 10) n++; return n; };

// ---------------------------------------------------------------- fence collection
// Path comment on line 1 (the convention):
//   // mongosh/<name>.js    shell fence   -> mongosh, one session per lesson, document order
//   // app/<name>.mjs|.js|.ts   driver fence -> Node driver (prelude injects `client`, `db`, ObjectId, ...)
//   # scripts/<name>.sh     bash          -> bash -n (syntax only, never executed)
//   # <name>.yml|.yaml      compose yaml  -> `docker compose config -q`
// `@expect-error` in line 1 -> deliberate failure demo, counted, never run.  `@skip-verify <why>` -> illustrative
// (needs sharded cluster / auth / TLS / Atlas / blocking watch()), counted, never run.  --all: also classify path-less fences by Starlight <TabItem> label.
const SHELL_RE = /^\/\/\s*(mongosh\/[\w./-]+\.js)\s*$/;
const APP_RE = /^\/\/\s*(app\/[\w./-]+\.(?:mjs|js|ts))\s*$/;
const BASH_RE = /^#\s*(scripts\/[\w./-]+\.sh)\s*$/;
const YAML_RE = /^#\s*([\w./-]+\.ya?ml)\s*$/;

export function collectFences(rawSrc, { all = false } = {}) {
  const src = stripExcluded(rawSrc, findExcludedRanges(rawSrc));
  const tabRe = /<TabItem\s+label="([^"]+)"|<\/TabItem>/g;
  const tabs = [];
  let t;
  while ((t = tabRe.exec(src))) tabs.push({ at: t.index, label: t[1] ?? null });
  const tabAt = (pos) => { let cur = null; for (const x of tabs) { if (x.at > pos) break; cur = x.label; } return cur; };

  const fenceRe = /^([ \t]*)```(\w*)[^\n]*\n([\s\S]*?)^[ \t]*```/gm;
  const out = [];
  let n = 0, m;
  while ((m = fenceRe.exec(src))) {
    n++;
    const lang = m[2];
    const body = m[3].split('\n').map((l) => l.startsWith(m[1]) ? l.slice(m[1].length) : l.trimStart()).join('\n');
    const line = nlBefore(src, m.index) + 1;
    const first = body.split('\n')[0].trim();
    const tab = tabAt(m.index);
    const base = { fenceNum: n, lang, line, tab };
    if (first.includes('@expect-error')) { out.push({ ...base, category: 'expect-error' }); continue; }
    if (first.includes('@skip-verify')) { out.push({ ...base, category: 'skip-verify' }); continue; }
    const isJs = ['js', 'javascript', 'mjs'].includes(lang), isTs = ['ts', 'typescript'].includes(lang);
    let pm;
    if (isJs && (pm = SHELL_RE.exec(first))) out.push({ ...base, category: 'collected', kind: 'shell', path: pm[1], body });
    else if ((isJs || isTs) && (pm = APP_RE.exec(first))) out.push({ ...base, category: 'collected', kind: 'app', path: pm[1], body });
    else if (lang === 'bash' && (pm = BASH_RE.exec(first))) out.push({ ...base, category: 'collected', kind: 'bash', path: pm[1], body });
    else if (lang === 'yaml' && (pm = YAML_RE.exec(first))) out.push({ ...base, category: 'collected', kind: 'yaml', path: pm[1], body });
    else if (all && (isJs || isTs)) {
      const kind = tab === 'Node.js' ? 'app' : (tab === null || tab === 'mongosh' ? 'shell' : null);
      if (kind) out.push({ ...base, category: 'collected', kind, path: `${kind === 'app' ? 'app' : 'mongosh'}/fence-${n}.${kind === 'app' ? (isTs ? 'ts' : 'mjs') : 'js'}`, body, synthetic: true });
      else out.push({ ...base, category: 'skipped-other-driver' });
    } else if (all && lang === 'yaml') out.push({ ...base, category: 'collected', kind: 'yaml', path: `fence-${n}.yml`, body, synthetic: true });
    else if (all && lang === 'bash') out.push({ ...base, category: 'collected', kind: 'bash', path: `scripts/fence-${n}.sh`, body, synthetic: true });
    else out.push({ ...base, category: 'skipped-no-path' });
  }
  return out;
}

// ---------------------------------------------------------------- shell helpers
const sh = (cmd, args, opts = {}) => spawnSync(cmd, args, { encoding: 'utf8', timeout: opts.timeout ?? 120_000, maxBuffer: 64 << 20, ...opts });
const mongosh = (args, opts) => sh('docker', ['exec', '-i', V.container, 'mongosh', '--quiet', '--port', String(V.port), ...args], opts);

function ensureContainer(refresh) {
  const st = sh('docker', ['inspect', '-f', '{{.State.Running}}', V.container]);
  const exists = st.status === 0;
  if (exists && refresh) { sh('docker', ['rm', '-f', V.container]); }
  if (!exists || refresh) {
    mkdirSync(LESSONS_DIR, { recursive: true });
    const r = sh('docker', ['run', '-d', '--name', V.container, '-p', `${V.port}:${V.port}`,
      '-v', `${LESSONS_DIR}:/lessons:ro`, V.mongoImage, 'mongod', '--port', String(V.port), '--replSet', V.replSet, '--bind_ip_all']);
    if (r.status !== 0) throw new Error(`docker run failed: ${r.stderr}`);
  } else if (st.stdout.trim() !== 'true') {
    sh('docker', ['start', V.container]);
  }
  const init = `try{rs.status()}catch(e){rs.initiate({_id:"${V.replSet}",members:[{_id:0,host:"localhost:${V.port}"}]})}`;
  for (let i = 0; i < 60; i++) {
    const r = mongosh(['--eval', `${init}; print(db.hello().isWritablePrimary)`]);
    if (r.status === 0 && r.stdout.trim().endsWith('true')) return;
    sh('sleep', ['1']);
  }
  throw new Error('mongod did not become primary in 60s');
}

// ---------------------------------------------------------------- lessons
function walk(dir, acc = []) {
  for (const f of readdirSync(dir)) { const p = path.join(dir, f); statSync(p).isDirectory() ? walk(p, acc) : p.endsWith('.mdx') && acc.push(p); }
  return acc;
}
const dbName = (ns, suffix = '') => `l_${createHash('sha1').update(ns).digest('hex').slice(0, 6)}_${ns.replace(/[^a-z0-9]+/gi, '_').slice(-38)}${suffix}`;

const PRELUDE = (db) => `import { MongoClient, ObjectId, Decimal128, Long, Int32, Double, UUID, Binary, Timestamp, MongoServerError } from 'mongodb';
const client = new MongoClient(${JSON.stringify(URI)}); await client.connect();
const db = client.db(${JSON.stringify(db)});
try { await (async () => {
`;
const POSTLUDE = `
})(); } finally { await client.close(); }
`;

function runShell(ns, fences) {
  const db = dbName(ns), dir = path.join(LESSONS_DIR, ns, 'mongosh');
  mkdirSync(dir, { recursive: true });
  const calls = [];
  fences.forEach((f, i) => {
    // `use foo` is shell syntax that load() rejects: pin it to the per-lesson database instead.
    const body = f.body.replace(/^use\s+\w+\s*$/gm, `db = db.getSiblingDB(${JSON.stringify(db)})`);
    writeFileSync(path.join(dir, `${i}.js`), body);
    calls.push(`print("@@FENCE ${i}");try{load("/lessons/${ns}/mongosh/${i}.js")}catch(e){print("@@ERR ${i} "+String(e&&e.message||e).split("\\n")[0])}`);
  });
  writeFileSync(path.join(LESSONS_DIR, ns, 'run.js'),
    `db = db.getSiblingDB(${JSON.stringify(db)}); db.dropDatabase();\n${calls.join('\n')}\ndb.getSiblingDB(${JSON.stringify(db)}).dropDatabase();\n`);
  const r = mongosh([`/lessons/${ns}/run.js`], { timeout: LESSON_TIMEOUT_MS });
  const res = fences.map((f) => ({ f, ok: true, msg: '' }));
  if (r.error || r.status === null) {
    const last = [...(r.stdout ?? '').matchAll(/@@FENCE (\d+)/g)].pop();
    const i = last ? Number(last[1]) : 0;
    res[i] = { f: fences[i], ok: false, msg: `timeout/killed after ${LESSON_TIMEOUT_MS / 1000}s (blocking call, e.g. watch()?)` };
    return res;
  }
  for (const [, i, msg] of (r.stdout ?? '').matchAll(/@@ERR (\d+) (.*)/g)) res[+i] = { f: fences[+i], ok: false, msg };
  if (r.status !== 0 && !res.some((x) => !x.ok)) res[0] = { ...res[0], ok: false, msg: `mongosh exit ${r.status}: ${(r.stderr || r.stdout).split('\n')[0]}` };
  return res;
}

function runApp(ns, fences) {
  const db = dbName(ns, '_app'), dir = path.join(LESSONS_DIR, ns, 'app');
  mkdirSync(dir, { recursive: true });
  sh('docker', ['exec', V.container, 'mongosh', '--quiet', '--port', String(V.port), '--eval', `db.getSiblingDB(${JSON.stringify(db)}).dropDatabase()`]);
  const tsFiles = [];
  const res = fences.map((f, i) => {
    const ext = f.path.endsWith('.ts') ? 'ts' : 'mjs';
    const file = path.join(dir, `${i}.${ext}`);
    const own = /\b(?:const|let|var)\s+(?:client|db)\b/.test(f.body) || /new MongoClient/.test(f.body);
    // bare fragments get the prelude; self-contained scripts (declare their own client) run as written
    writeFileSync(file, own ? f.body : PRELUDE(db) + f.body + POSTLUDE);
    if (ext === 'ts') tsFiles.push(file);
    return { f, file, ok: true, msg: '' };
  });
  if (tsFiles.length) {
    writeFileSync(path.join(dir, 'tsconfig.json'), JSON.stringify({ compilerOptions: { target: 'ES2023', module: 'NodeNext', moduleResolution: 'NodeNext', strict: true, noEmit: true, skipLibCheck: true, allowImportingTsExtensions: true, types: ['node'], typeRoots: [path.join(PROBE, 'node_modules/@types')] }, files: tsFiles.map((t) => path.basename(t)) }));
    const tsc = sh(path.join(PROBE, 'node_modules/.bin/tsc'), ['-p', path.join(dir, 'tsconfig.json')]);
    for (const [, file, msg] of (tsc.stdout ?? '').matchAll(/^(\S+)\(\d+,\d+\): error (.*)$/gm)) {
      const r = res.find((x) => path.basename(x.file) === path.basename(file));
      if (r && r.ok) { r.ok = false; r.msg = `tsc: ${msg}`; }
    }
  }
  for (const r of res) {
    if (!r.ok) continue;
    const p = sh(process.execPath, [r.file], { cwd: PROBE, timeout: 30_000 });
    if (p.status !== 0) {
      r.ok = false;
      r.msg = p.error ? `timeout/killed after 30s (${p.error.code ?? p.error.message})`
        : ((p.stderr || '').split('\n').reverse().find((l) => /^\w*(Error|Exception)\b|^\w*Error:/.test(l.trim())) ?? (p.stderr || 'exit ' + p.status).trim().split('\n')[0]).trim().slice(0, 300);
    }
  }
  return res;
}

function runBashYaml(ns, fences) {
  return fences.map((f, i) => {
    const dir = path.join(LESSONS_DIR, ns, 'misc'); mkdirSync(dir, { recursive: true });
    const file = path.join(dir, `${i}-${path.basename(f.path)}`);
    writeFileSync(file, f.body);
    // yaml: only compose files are validated (docker compose config -q); mongod.conf etc. are not checked (no YAML parser dependency)
    if (f.kind === 'yaml' && !/^services:/m.test(f.body)) return { f, ok: true, msg: '', unchecked: true };
    const r = f.kind === 'bash' ? sh('bash', ['-n', file]) : sh('docker', ['compose', '-f', file, 'config', '-q']);
    return { f, ok: r.status === 0, msg: r.status === 0 ? '' : (r.stderr || '').split('\n').find(Boolean) ?? 'failed' };
  });
}

// ---------------------------------------------------------------- self-test
function selfTest() {
  const assert = (c, m) => { if (!c) { console.error('SELF-TEST FAIL:', m); process.exit(1); } };
  const md = [
    'export const quizX = [ { q: "```js\\nfoo\\n```", options: ["a"], answer: 0 } ]',
    '<SpotTheBug lang="js" code={`', 'nope', '`}>x</SpotTheBug>',
    '<Tabs>', '  <TabItem label="mongosh">', '    ```js', '    db.a.insertOne({x:1})', '    ```', '  </TabItem>',
    '  <TabItem label="Node.js">', '    ```js', '    await db.collection("a").insertOne({x:1});', '    ```', '  </TabItem>',
    '  <TabItem label="Python">', '    ```python', '    x = 1', '    ```', '  </TabItem>', '</Tabs>',
    '```js', '// mongosh/a.js', 'db.a.find()', '```',
    '```js', '// app/a.mjs', 'await db.collection("a").find().toArray()', '```',
    '```js', '// mongosh/s.js @skip-verify needs mongos', 'sh.status()', '```',
    '```js', '// mongosh/b.js @expect-error', 'db.a.insertOne({_id:1}); db.a.insertOne({_id:1})', '```',
    '```bash', '# scripts/x.sh', 'echo hi', '```', '```json', '{}', '```',
  ].join('\n');
  const strict = collectFences(md);
  assert(strict.filter((f) => f.category === 'collected').map((f) => f.kind).join() === 'shell,app,bash', 'strict collects path-commented only: ' + JSON.stringify(strict.map((f) => f.category)));
  assert(strict.some((f) => f.category === 'expect-error') && strict.some((f) => f.category === 'skip-verify'), 'expect-error + skip-verify counted');
  assert(!strict.some((f) => f.body?.includes('nope') || f.body?.includes('foo')), 'quiz / SpotTheBug fences excluded');
  const all = collectFences(md, { all: true });
  const coll = all.filter((f) => f.category === 'collected');
  assert(coll.map((f) => f.kind).join() === 'shell,app,shell,app,bash', 'all: tab-label classification ' + coll.map((f) => f.kind));
  assert(all.some((f) => f.category === 'skipped-other-driver') === false, 'python fence is lang python, ignored as no-path');
  assert(coll[0].body.startsWith('db.a.insertOne') && !coll[0].body.startsWith(' '), 'indent stripped');
  assert(dbName('a/b').length <= 63 && dbName('transactions-and-consistency/multi-document-transactions', '_app').length <= 63, 'db name length');
  console.log('self-test OK');
}

// ---------------------------------------------------------------- main
async function main() {
  const args = process.argv.slice(2);
  const flag = (f) => args.includes(f);
  if (flag('--self-test')) return selfTest();
  if (flag('--stop')) { sh('docker', ['rm', '-f', V.container], { stdio: 'inherit' }); return; }
  const filter = args.find((a) => !a.startsWith('--')) ?? '';
  const all = flag('--all');
  const files = walk(DOCS).sort()
    .filter((p) => path.relative(DOCS, p).includes(filter));
  mkdirSync(LESSONS_DIR, { recursive: true });
  for (const c of readdirSync(LESSONS_DIR)) rmSync(path.join(LESSONS_DIR, c), { recursive: true, force: true }); // keep the dir itself: it is bind-mounted
  const plan = files.map((p) => ({ ns: path.relative(DOCS, p).replace(/\.mdx$/, '').replace(/\//g, '__'), rel: path.relative(DOCS, p), fences: collectFences(readFileSync(p, 'utf8'), { all }) }))
    .filter((l) => l.fences.length);
  const need = plan.some((l) => l.fences.some((f) => f.kind === 'shell' || f.kind === 'app' || f.kind === 'yaml'));
  if (need) ensureContainer(flag('--refresh'));

  let collected = 0, failed = 0, expectErr = 0, skipped = 0, skipVerify = 0;
  const failLines = [];
  for (const l of plan) {
    const by = (k) => l.fences.filter((f) => f.category === 'collected' && f.kind === k);
    expectErr += l.fences.filter((f) => f.category === 'expect-error').length;
    skipVerify += l.fences.filter((f) => f.category === 'skip-verify').length;
    skipped += l.fences.filter((f) => f.category.startsWith('skipped')).length;
    const results = [];
    if (by('shell').length) results.push(...runShell(l.ns, by('shell')));
    if (by('app').length) results.push(...runApp(l.ns, by('app')));
    const misc = [...by('bash'), ...by('yaml')];
    if (misc.length) results.push(...runBashYaml(l.ns, misc));
    collected += results.length;
    const bad = results.filter((r) => !r.ok);
    failed += bad.length;
    if (results.length) console.log(`${bad.length ? 'FAIL' : ' ok '}  ${l.rel}  (${results.length - bad.length}/${results.length})`);
    for (const r of bad) failLines.push(`  ${l.rel}:${r.f.line} [${r.f.kind} fence #${r.f.fenceNum}${r.f.synthetic ? ', no path comment' : ''}] ${r.msg}`);
  }
  if (failLines.length) console.log('\n' + failLines.join('\n'));
  console.log(`\nmongo ${V.mongod} / mongosh ${V.mongosh} / driver ${V.nodeDriver}${all ? ' [--all baseline]' : ''}`);
  console.log(`collected ${collected}  failed ${failed}  expect-error ${expectErr}  skip-verify ${skipVerify}  skipped ${skipped}`);
  process.exit(failed ? 1 : 0);
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
