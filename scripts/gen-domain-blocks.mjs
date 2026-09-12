/** Generate per-domain real-schema block registries plus a literal dynamic loader map. */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { readManifests } from './gen-render-map.mjs';

const CHECK = process.argv.includes('--check');
const root = new URL('../src/domains/', import.meta.url);
const outDir = new URL('block-sets/', root);
const camel = (id) => id.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
const rows = readManifests();
const domains = [...new Set(rows.map((row) => row.domain))].sort();

const outputs = new Map();
for (const domain of domains) {
  const labs = rows.filter((row) => row.domain === domain);
  const imports = labs
    .map((row) => `import ${camel(row.id)} from '../${domain}/${row.id}/manifest.js';`)
    .join('\n');
  const names = labs.map((row) => camel(row.id)).join(', ');
  outputs.set(
    new URL(`${domain}.ts`, outDir),
    `/** GENERATED — real-schema ${domain} authoring blocks. */\nimport { manifestToBlock } from '../../lab-def/to-block.js';\n${imports}\n\nexport const blocks = [${names}].map(manifestToBlock);\n`,
  );
}
const loaders = domains
  .map(
    (domain) => `  '${domain}': () => import('./block-sets/${domain}.js').then((module) => module.blocks),`,
  )
  .join('\n');
outputs.set(
  new URL('block-loaders.ts', root),
  `/** GENERATED — literal per-domain authoring block loaders. */\nimport type { CmsBlock } from '@classytic/cms-ui/contract';\nimport type { LabDomain } from '../blocks/catalog.js';\n\nexport type DomainBlockLoader = () => Promise<CmsBlock[]>;\nexport const domainBlockLoaders: Record<LabDomain, DomainBlockLoader> = {\n${loaders}\n};\n`,
);

let stale = false;
for (const [target, text] of outputs) {
  if (CHECK) {
    if (!existsSync(target) || readFileSync(target, 'utf8') !== text) stale = true;
  } else {
    mkdirSync(new URL('.', target), { recursive: true });
    writeFileSync(target, text);
  }
}
if (CHECK && stale) {
  console.error('✗ domain block sets are stale — run: node scripts/gen-domain-blocks.mjs');
  process.exit(1);
}
console.log(`${CHECK ? '✓' : 'wrote'} domain block sets:`, domains.length, 'domains');
