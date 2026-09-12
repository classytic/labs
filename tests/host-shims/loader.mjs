/**
 * Node module-resolution hook that maps the HOST alias `@/components/ui/<name>` (which the
 * Next host resolves via `transpilePackages`) onto the harness shims in ./ui, so plain
 * `node` scripts (the PNG rasterizer) can import the built dist without a Next host.
 *
 *   import { register } from 'node:module';
 *   register('../host-shims/loader.mjs', import.meta.url);
 *
 * Vitest gets the same mapping through `resolve.alias` in vitest.config.ts.
 */
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const HOST_UI = /^@\/components\/ui\/([\w-]+)$/;

export async function resolve(specifier, context, nextResolve) {
  const match = HOST_UI.exec(specifier);
  if (match) {
    const url = new URL(`./ui/${match[1]}.mjs`, import.meta.url);
    if (!existsSync(fileURLToPath(url))) {
      throw new Error(
        `[host-shims] no shim for ${specifier} — add tests/host-shims/ui/${match[1]}.mjs (see button.mjs)`,
      );
    }
    return { url: url.href, shortCircuit: true };
  }
  return nextResolve(specifier, context);
}
