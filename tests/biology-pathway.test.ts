import { describe, expect, it } from 'vitest';
import { cellSystemsPathway, pathwayToMdx } from '../src/pathways/index.js';
describe('cell systems pathway', () => {
  it('orders prerequisites before integrated systems', () => {
    expect(cellSystemsPathway.steps.map((step) => step.id)).toEqual([
      'membrane-transport',
      'respiration',
      'cell-energy',
      'central-dogma',
      'cell-system',
      'mitosis-explorer',
      'meiosis-explorer',
    ]);
  });
  it('stays portable as MDX', () => {
    const mdx = pathwayToMdx(cellSystemsPathway);
    expect(mdx).toContain('<MembraneTransportLab');
    expect(mdx).toContain('<MeiosisExplorerLab');
  });
});
