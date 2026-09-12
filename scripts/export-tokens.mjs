/**
 * Export the lab design tokens as a W3C Design Tokens (DTCG 2025.10) file.
 *
 * `styles/core.css` is the source of truth: it declares every `--lab-*` token with its value and,
 * for the semantic colours, the host shadcn variable it binds to. This reads that block and writes
 * `design-tokens.json`, so Figma, Tokens Studio, Style Dictionary and the like can read the same
 * decisions the CSS ships. The CSS is never generated from the JSON; the JSON is a view of the CSS.
 *
 *   node scripts/export-tokens.mjs           write design-tokens.json
 *   node scripts/export-tokens.mjs --check   exit 1 if the file is stale (labs:check runs this)
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const CHECK = process.argv.includes('--check');
const css = readFileSync(new URL('../styles/core.css', import.meta.url), 'utf8');
const target = new URL('../design-tokens.json', import.meta.url);

const start = css.indexOf(':root {');
const end = css.indexOf('/* Legacy canvas tokens', start);
const block = css.slice(start, end);

/** Group and DTCG $type by token prefix; anything else is recorded as a plain string. */
const GROUPS = [
  ['sp', 'space', 'dimension'],
  ['r', 'radius', 'dimension'],
  ['t', 'type.size', 'dimension'],
  ['w', 'type.weight', 'fontWeight'],
  ['lh', 'type.leading', 'number'],
  ['ls', 'type.tracking', 'dimension'],
  ['dur', 'motion.duration', 'duration'],
  ['ease', 'motion.easing', 'cubicBezier'],
  ['z', 'layer', 'number'],
  ['shadow', 'elevation', 'shadow'],
  ['target', 'target', 'dimension'],
  ['focus', 'focus', 'string'],
];

const dimension = (raw) => {
  const m = /^(-?[0-9.]+)(px|rem|em)$/.exec(raw);
  return m ? { value: +m[1], unit: m[2] } : raw;
};
const duration = (raw) => {
  const m = /^([0-9.]+)(m?s)$/.exec(raw);
  return m ? { value: +m[1], unit: m[2] } : raw;
};
const bezier = (raw) => {
  const m = /cubic-bezier\(([^)]+)\)/.exec(raw);
  return m ? m[1].split(',').map((n) => +n.trim()) : raw;
};

const set = (tree, path, leaf) => {
  const parts = path.split('.');
  let node = tree;
  for (const part of parts.slice(0, -1)) node = node[part] ??= {};
  node[parts.at(-1)] = leaf;
};

const tokens = {
  $schema: 'https://www.designtokens.org/schemas/2025.10/format.json',
  $description:
    '@classytic/labs design tokens, exported from styles/core.css. Colours are semantic and resolve to the host theme (shadcn) at runtime; the fallback here is the calm default.',
};

const decl = /--lab-([a-z0-9-]+):\s*([^;]+);(?:\s*\/\*\s*([^*]*?)\s*\*\/)?/gs;
for (const [, name, rawValue, comment] of block.matchAll(decl)) {
  const value = rawValue.replace(/\s+/g, ' ').trim();
  const description = comment?.trim();
  const [prefix, ...rest] = name.split('-');
  const group = GROUPS.find(([p]) => p === prefix);
  if (!group) {
    // Semantic colour: `var(--host, fallback)`. Record the host binding as an alias-like extension.
    const host = /^var\((--[a-z0-9-]+),\s*(.+)\)$/s.exec(value);
    set(tokens, `color.${name}`, {
      $type: 'color',
      $value: host ? host[2].trim() : value,
      ...(description ? { $description: description } : {}),
      ...(host ? { $extensions: { 'com.classytic.labs': { hostVariable: host[1] } } } : {}),
    });
    continue;
  }
  const [, path, type] = group;
  const key = rest.join('-') || 'default';
  let $value = value;
  if (type === 'dimension') $value = dimension(value);
  if (type === 'duration') $value = duration(value);
  if (type === 'cubicBezier') $value = bezier(value);
  if (type === 'number' || type === 'fontWeight') $value = Number.isFinite(+value) ? +value : value;
  set(tokens, `${path}.${key}`, {
    $type: type,
    $value,
    ...(description ? { $description: description } : {}),
  });
}

const json = JSON.stringify(tokens, null, 2) + '\n';
if (CHECK) {
  const current = existsSync(target) ? readFileSync(target, 'utf8') : '';
  if (current !== json) {
    console.error('✗ design-tokens.json is stale: run `node scripts/export-tokens.mjs`');
    process.exit(1);
  }
  console.log('✓ design-tokens.json matches styles/core.css');
} else {
  writeFileSync(target, json);
  console.log(`wrote design-tokens.json (${Object.keys(tokens).length - 2} groups)`);
}
