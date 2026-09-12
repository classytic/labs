/**
 * For each dropped prop, decide WHICH of the two fixes applies.
 *
 * The rule, settled once so it is not re-argued per lab: a schema must not offer what the
 * component cannot use. So either the component accepts the prop and the adapter should forward
 * it, or the component has nowhere to put it and the schema should stop advertising it. A field
 * the editor offers and the lab ignores is worse than no field, because an author spends real
 * effort on a learner who will never see the result.
 *
 * This reports the decision per prop by looking at the component's own props interface, so the
 * sweep is driven by evidence rather than by guessing which labs "probably" support hints.
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const { labManifests } = await import(pathToFileURL(join('dist', 'domains', 'manifests.mjs')).href);

/** Every source file under src, so a component can be found wherever it lives. */
const files = [];
(function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) walk(path);
    else if (path.endsWith('.tsx') || path.endsWith('.ts')) files.push(path);
  }
})('src');

/** The component a runtime adapter renders, found by the identifier it imports and uses in JSX. */
function componentSourceFor(runtimeSrc) {
  const used = [...runtimeSrc.matchAll(/<([A-Z][A-Za-z0-9]*)\b/g)].map((m) => m[1]);
  for (const name of used) {
    const from = runtimeSrc.match(new RegExp(`import\\s*\\{[^}]*\\b${name}\\b[^}]*\\}\\s*from\\s*'([^']+)'`));
    if (!from) continue;
    const rel = from[1].replace(/\.js$/, '');
    const hit =
      files.find((f) =>
        f.replace(/\\/g, '/').endsWith(`${rel.replace(/^.*?src\//, 'src/').replace(/^\.+\//, '')}.tsx`),
      ) ??
      files.find((f) =>
        f.replace(/\\/g, '/').includes(
          rel
            .split('/')
            .filter((p) => p !== '..' && p !== '.')
            .join('/'),
        ),
      );
    if (hit) return { name, src: readFileSync(hit, 'utf8'), path: hit };
  }
  return null;
}

const HANDLED_ABOVE = new Set([
  'activity',
  'activityId',
  'controlId',
  'objectives',
  'prompt',
  'className',
  'height',
]);

for (const manifest of labManifests) {
  const shape = manifest.schema?.shape;
  if (!shape) continue;
  const file = join('src', 'domains', manifest.domain, manifest.id, 'runtime.tsx');
  if (!existsSync(file)) continue;
  const src = readFileSync(file, 'utf8');
  if (/export\s*\{[^}]*as default[^}]*\}/.test(src)) continue;
  // Any spread of an identifier forwards everything, including a parenthesised cast such as
  // `{...(p as Props)}`, which an earlier pattern missed and reported as dropping seven props.
  if (/\.\.\.\s*\(?\s*[A-Za-z_$][\w$]*/.test(src)) continue;

  const read = new Set();
  for (const m of src.matchAll(/\b[A-Za-z_$][\w$]*\.([A-Za-z_$][\w$]*)/g)) read.add(m[1]);
  for (const m of src.matchAll(/(?:const|let|function\s*\w*\s*\()\s*\{([^}]*)\}/g))
    for (const n of m[1].split(',')) read.add(n.trim().split(/[:=]/)[0].trim());
  for (const m of src.matchAll(/['"`]([A-Za-z_$][\w$]*)['"`]/g)) read.add(m[1]);

  const dropped = Object.keys(shape).filter((k) => !read.has(k) && !HANDLED_ABOVE.has(k));
  if (!dropped.length) continue;

  const component = componentSourceFor(src);
  for (const prop of dropped) {
    const accepted = component ? new RegExp(`^\\s*${prop}\\??:`, 'm').test(component.src) : null;
    const verdict =
      accepted === null ? 'COMPONENT NOT FOUND' : accepted ? 'FORWARD in adapter' : 'REMOVE from schema';
    console.log(`${manifest.domain}/${manifest.id}  ${prop}  ->  ${verdict}`);
  }
}
