/**
 * Labs must not import a stage export that consumers do not have yet.
 *
 * The labs package is installed beside whatever @classytic/stage the host app resolves, which lags
 * this repo's dev-synced copy. A missing PROP degrades quietly (the stage ignores it), but an
 * `import { somethingNew } from '@classytic/stage'` is a hard module error at load, and it takes the
 * whole app down, not just the lab. So a stage feature added here is used through a prop, and
 * anything labs needs by name is declared in `src/kit` until the stage release carrying it is out.
 *
 * When a stage release ships, drop the name from this list.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/** Stage exports that exist in this repo's stage but not in the release consumers install. */
const UNRELEASED_STAGE_EXPORTS = ['clearOfLabel', 'ClearZone'];

const sourceFiles = (dir: string, out: string[] = []): string[] => {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) sourceFiles(path, out);
    else if (/\.tsx?$/.test(entry)) out.push(path);
  }
  return out;
};

describe('stage API compatibility', () => {
  it('imports no unreleased stage export by name', () => {
    const offenders: string[] = [];
    for (const file of sourceFiles(join(import.meta.dirname, '..', 'src'))) {
      const text = readFileSync(file, 'utf8');
      for (const match of text.matchAll(/import\s+(type\s+)?\{([^}]*)\}\s+from\s+'@classytic\/stage'/g)) {
        const names = match[2]!.split(',').map((n) => n.replace(/^\s*type\s+/, '').trim());
        for (const name of names) {
          if (UNRELEASED_STAGE_EXPORTS.includes(name)) offenders.push(`${file}: ${name}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
