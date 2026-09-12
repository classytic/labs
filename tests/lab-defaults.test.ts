/**
 * Every lab must accept a BLANK insert. When a creator inserts a lab from the
 * gallery / slash menu it starts with no attributes, so its editing panel runs
 * `schema.safeParse({})` (see blocks/lab-config.tsx). If a lab's schema has a
 * required field with no `.default()`, the creator sees a validation error the
 * instant they insert it — a bad first impression the author almost never intends.
 *
 * This pins the "every default configuration parses" invariant: a required field
 * must either be `.optional()` or carry a `.default(...)`. It also guards the
 * schema-aware validation added to LabConfig from firing spuriously on fresh inserts.
 *
 * Imports the BUILT dist (what ships); run `npm run build` first.
 */
import { describe, it, expect } from 'vitest';
import { labManifests } from '../dist/domains/manifests.mjs';

describe('lab blank-insert defaults', () => {
  it('every lab exposes a zod schema', () => {
    for (const b of labManifests) {
      expect(
        typeof (b as { schema?: { safeParse?: unknown } }).schema?.safeParse,
        `${b.id} has a schema`,
      ).toBe('function');
    }
  });

  it('every lab schema parses an empty attribute object (blank insert)', () => {
    const failures: string[] = [];
    for (const b of labManifests) {
      const schema = (
        b as {
          schema: {
            safeParse: (v: unknown) => {
              success: boolean;
              error?: { issues: { path: (string | number)[]; message: string }[] };
            };
          };
        }
      ).schema;
      const r = schema.safeParse({});
      if (!r.success) {
        const detail = (r.error?.issues ?? [])
          .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
          .join(' | ');
        failures.push(`${b.id} → ${detail}`);
      }
    }
    // A non-empty list means a lab has a required field with no default; give it
    // an `.optional()` or a `.default(...)` so a fresh insert renders cleanly.
    expect(failures, `labs failing blank insert:\n${failures.join('\n')}`).toEqual([]);
  });
});
