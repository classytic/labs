/**
 * CI drift + integrity guard for the lab manifests. Fails (exit 1) when:
 *   - the generated registry (manifests.ts) or render map (render-map.ts) is stale,
 *   - a runtime/shared file still imports through a domain barrel (should be a leaf import),
 *   - two labs collide on a tag (folder names already guarantee unique ids),
 *   - a manifest folder is missing its runtime (runtime.tsx or runtime/index.tsx),
 *   - a folder name doesn't equal its manifest id.
 *
 *   npm run labs:check
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { readManifests } from './gen-render-map.mjs';

const node = process.execPath;
const script = (name) => fileURLToPath(new URL(name, import.meta.url));
let failed = 0;

// Heavy engines (3D / ML / LLM) must be OPTIONAL peer deps imported ONLY inside a lab's own
// runtime/core chunk — never in a manifest, authoring editor, shared module, or barrel — so the
// heavy code downloads only when that one lab renders. Add engines here as they're adopted.
const HEAVY_PACKAGES = [
  'three',
  '@react-three/fiber',
  '@react-three/drei',
  '@react-three/postprocessing',
  '@tensorflow/tfjs',
  '@xenova/transformers',
  '@huggingface/transformers',
  'onnxruntime-web',
  'pixi.js',
];
// A lab's own engine files: src/domains/<domain>/<id>/{runtime,core}(.tsx|.ts|/…),
// or the explicit opt-in renderer subpath. Regular entries are independently
// checked to ensure they never pull the renderer tier back into default bundles.
const HEAVY_OK = /[/\\](?:domains[/\\][^/\\]+[/\\][^/\\]+[/\\](?:runtime|core)(?:\.tsx?$|[/\\])|three[/\\])/;

function walkSrc(dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = new URL(`${dir.pathname}${e.name}${e.isDirectory() ? '/' : ''}`, dir);
    if (e.isDirectory()) walkSrc(p, out);
    else if (/\.(tsx?|mts)$/.test(e.name)) out.push(p);
  }
  return out;
}

/**
 * Words of long-string prose one source file may carry.
 *
 * Set above the largest legitimate default (exam-question's, at 80 words) and far below the
 * regression it exists to stop, so it passes today and fails the moment a lab starts teaching.
 */
const PROSE_BUDGET = 120;

/**
 * Words inside the LONG string literals of a snippet.
 *
 * The literals are found by walking the text, not by regex. A pattern like /'[^']{60,}'/ looks
 * right and is not: it happily matches from one literal's CLOSING quote to the next literal's
 * OPENING quote, so it measures the code between two short strings and reports it as prose. That
 * is how a panel of five 30-character captions was billed as 145 words.
 */
function longStringWords(text, minChars = 60) {
  const literals = [];
  let quote = null;
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quote) {
      if (c === '\\') i++;
      else if (c === quote) {
        literals.push(text.slice(start, i));
        quote = null;
      }
    } else if (c === "'" || c === '"' || c === '`') {
      quote = c;
      start = i + 1;
    }
  }
  return literals
    .filter((s) => s.length >= minChars)
    .join(' ')
    .split(/\s+/)
    .filter(Boolean).length;
}

/**
 * The source text of every `const DEFAULT_… = …` initialiser in a file.
 *
 * Brackets are matched rather than regexed, because a default is usually a nested array of objects
 * and a non-greedy match to the first `]` would stop inside the first entry. Strings are skipped
 * while matching so a bracket inside a LaTeX literal cannot unbalance the scan.
 */
function defaultSpans(source) {
  const spans = [];
  const decl = /\bconst DEFAULT_[A-Z0-9_]+[^=]*=/g;
  for (let m = decl.exec(source); m; m = decl.exec(source)) {
    let depth = 0;
    let quote = null;
    let i = m.index + m[0].length;
    const from = i;
    for (; i < source.length; i++) {
      const c = source[i];
      if (quote) {
        if (c === '\\') i++;
        else if (c === quote) quote = null;
        continue;
      }
      if (c === "'" || c === '"' || c === '`') quote = c;
      else if (c === '[' || c === '{' || c === '(') depth++;
      else if (c === ']' || c === '}' || c === ')') depth--;
      else if (c === ';' && depth <= 0) break;
      if (depth < 0) break;
    }
    spans.push(source.slice(from, i));
  }
  return spans;
}

const heavyAlt = HEAVY_PACKAGES.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
// matches `from 'pkg'`, `import 'pkg'`, `import('pkg')`, `require('pkg')` (+ subpaths).
const heavyRe = new RegExp(`\\b(?:from|import|require)\\b[\\s(]*['"](?:${heavyAlt})(?:/[^'"]*)?['"]`);
for (const file of walkSrc(new URL('../src/', import.meta.url))) {
  const path = fileURLToPath(file);
  const source = readFileSync(file, 'utf8');
  if (heavyRe.test(source) && !HEAVY_OK.test(path)) {
    console.error(
      `✗ heavy engine imported outside a lab runtime/core: ${path.replace(/^.*[/\\]src[/\\]/, 'src/')}`,
    );
    failed++;
  }

  // Objectives are catalog/MDX metadata. Repeating them inside an interactive runtime
  // creates a second lesson outline and bloats every lab with static prose.
  const hasStaticLessonChrome =
    source.includes('label="Learning goals"') ||
    source.includes("label='Learning goals'") ||
    source.includes('className="lab-goals"') ||
    // Multiline-tolerant: prettier breaks long JSX props across lines.
    /support=\{[\s\S]{0,600}?objectives(?:\?|\.)/.test(source);
  if (hasStaticLessonChrome) {
    console.error(
      `✗ static lesson objectives rendered inside runtime chrome: ${path.replace(/^.*[/\\]src[/\\]/, 'src/')}`,
    );
    failed++;
  }

  // A lab's default exists so the component renders in the gallery and in the editor's picker
  // before an author has configured it. It is not a place to teach from. This line used to be a
  // claim in the success message and nothing more, and under it an identity-proof default grew to
  // 426 words of explanation: three lessons' worth of prose in the wrong repository, where none of
  // the curriculum's checks (sentence length, the idiom blocklist, the prose budget, the LaTeX
  // scan) can reach it. Counting only LONG string literals keeps labels, ids and LaTeX out of it.
  // Counted INSIDE each DEFAULT_* declaration, not across the file.
  //
  // Two narrowings, each forced by a false positive. Counting long strings anywhere flagged 571
  // files, because a stepped lab narrates itself at runtime and that narration is generated per
  // state rather than authored once. Gating on "the file declares a DEFAULT_" still flagged 39,
  // because a lab may have a two-line `DEFAULT_VALUES = [1, 3, 5]` and hundreds of words of that
  // same runtime narration elsewhere in the file. Only the default's own span is the author's
  // baked-in content, so only that span is measured.
  const proseWords = defaultSpans(source).reduce((n, span) => n + longStringWords(span), 0);
  if (proseWords > PROSE_BUDGET) {
    console.error(
      `✗ ${proseWords} words of authored prose in ${path.replace(/^.*[/\\]src[/\\]/, 'src/')} ` +
        `(budget ${PROSE_BUDGET}) — teaching content belongs in the curriculum MDX, not in a lab default`,
    );
    failed++;
  }
}

// 1. generated-output drift (each script self-reports + exits non-zero on mismatch).
for (const s of [
  'gen-manifests.mjs',
  'gen-render-map.mjs',
  'gen-activity-map.mjs',
  'gen-catalog.mjs',
  'gen-domain-blocks.mjs',
  'debarrel-runtimes.mjs',
]) {
  try {
    execFileSync(node, [script(s), '--check'], { stdio: 'inherit' });
  } catch {
    failed++;
  }
}

// 2. integrity: readManifests throws on folder!=id; here we add tag-collision + runtime existence.
let rows;
try {
  rows = readManifests();
} catch (e) {
  console.error('✗ ' + e.message);
  process.exit(1);
}

const tagOwner = new Map();
for (const r of rows) {
  if (tagOwner.has(r.tag)) {
    console.error(`✗ duplicate tag '${r.tag}': ${tagOwner.get(r.tag)} and ${r.domain}/${r.id}`);
    failed++;
  } else tagOwner.set(r.tag, `${r.domain}/${r.id}`);

  const base = new URL(`../src/domains/${r.domain}/${r.id}/`, import.meta.url);
  const hasRuntime =
    existsSync(new URL('runtime.tsx', base)) ||
    existsSync(new URL('runtime.ts', base)) ||
    existsSync(new URL('runtime/index.tsx', base)) ||
    existsSync(new URL('runtime/index.ts', base));
  if (!hasRuntime) {
    console.error(`✗ ${r.domain}/${r.id} has no runtime (runtime.tsx or runtime/index.tsx)`);
    failed++;
  }
}

if (failed) {
  console.error(`\n✗ labs:check failed (${failed} issue${failed > 1 ? 's' : ''})`);
  process.exit(1);
}
console.log(
  `✓ labs:check passed — ${rows.length} labs, no drift, no tag collisions, every runtime present, heavy engines runtime-only, lesson prose stays in MDX`,
);
