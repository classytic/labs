import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { defineLab } from '../src/lab-def/define-lab.js';
import { createLabQualityReport } from '../src/authoring/report.js';

const base = {
  domain: 'math' as const,
  group: 'Math',
  description: 'Test',
  schema: z.object({}),
  taxonomy: {},
  loadRuntime: async () => ({ default: () => null }),
};

describe('catalog quality report', () => {
  it('separates ready, incomplete, and undeclared contracts deterministically', () => {
    const ready = defineLab({
      ...base,
      id: 'ready',
      title: 'Ready',
      experience: {
        objectives: ['Compare'],
        phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
        responses: ['choice'],
        accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
      },
    });
    const incomplete = defineLab({
      ...base,
      id: 'incomplete',
      title: 'Incomplete',
      experience: {
        objectives: [],
        phases: ['observe'],
        responses: [],
        accessibility: { keyboard: false, textAlternative: false, reducedMotion: false },
      },
    });
    const undeclared = defineLab({ ...base, id: 'undeclared', title: 'Undeclared' });
    const report = createLabQualityReport([undeclared, ready, incomplete]);
    expect({
      total: report.total,
      ready: report.ready,
      incomplete: report.incomplete,
      undeclared: report.undeclared,
    }).toEqual({ total: 3, ready: 1, incomplete: 1, undeclared: 1 });
    expect(report.entries.map((entry) => entry.id)).toEqual(['incomplete', 'ready', 'undeclared']);
  });

  it('filters by domain for focused migration cohorts', () => {
    const math = defineLab({ ...base, id: 'math-one', title: 'Math' });
    const physics = defineLab({ ...base, domain: 'physics', id: 'physics-one', title: 'Physics' });
    expect(createLabQualityReport([physics, math], 'physics').entries.map((entry) => entry.id)).toEqual([
      'physics-one',
    ]);
  });
});
