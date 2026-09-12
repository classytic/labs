import { describe, expect, it } from 'vitest';
import { loadLabBlocks } from '../src/blocks/domains.js';

describe('domain-scoped authoring blocks', () => {
  // Loads two whole domain registries, so it is bounded by module loading rather than by what it
  // asserts: in a full run it hit the default 10s and failed as a timeout while passing in 1.9s on
  // its own. Third of its kind; see the note in tests/architecture-convergence.test.ts.
  it('loads disjoint real-schema registries on demand', { timeout: 120_000 }, async () => {
    const [math, circuits] = await Promise.all([loadLabBlocks('math'), loadLabBlocks('circuits')]);
    expect(math.some((block) => block.key === 'newton-method')).toBe(true);
    expect(math.some((block) => block.key === 'circuit-builder')).toBe(false);
    expect(circuits.some((block) => block.key === 'circuit-builder')).toBe(true);
    const schema = math.find((block) => block.key === 'newton-method')?.schema;
    expect(schema?.safeParse({}).success).toBe(true);
  });
});
