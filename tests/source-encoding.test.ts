import { readFileSync, readdirSync } from 'node:fs';
import { extname, join } from 'node:path';
import { describe, expect, it } from 'vitest';

const SOURCE_ROOTS = ['src', 'styles', 'scripts', 'docs'];
const TEXT_EXTENSIONS = new Set(['.css', '.md', '.mjs', '.ts', '.tsx']);

// These sequences are characteristic of UTF-8 text decoded as Windows-1252
// and then saved again. Keep this deliberately narrow: mathematical Unicode
// such as π, θ, −, ×, superscripts, and accented prose are valid source.
const MOJIBAKE = /(?:Ã[-¿]|Â[-¿]|â€|â†|âˆ|ðŸ|ï¿½|�)/u;

function textFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return textFiles(path);
    return TEXT_EXTENSIONS.has(extname(entry.name)) ? [path] : [];
  });
}

describe('published source text', () => {
  // Reads every published source file; see the note in architecture-convergence about timeouts.
  it('contains no common mojibake or replacement characters', { timeout: 60_000 }, () => {
    const corrupted = SOURCE_ROOTS.flatMap(textFiles).filter((file) =>
      MOJIBAKE.test(readFileSync(file, 'utf8')),
    );

    expect(corrupted).toEqual([]);
  });
});
