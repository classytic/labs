import { describe, expect, it } from 'vitest';
import { inductionComplete, inductionDiagnosis, inductionReach } from '../src/discrete/induction/core.js';
import { chooseProofNode, initialProofState, type ProofGraph } from '../src/discrete/proof/core.js';
import { minForOccupancy } from '../src/discrete/core/pigeonhole.js';

describe('discrete reasoning engines', () => {
  it('requires both induction obligations before the range is reachable', () => {
    expect(inductionReach({ first: 1, last: 5, baseEstablished: true, bridgeEstablished: false })).toEqual([
      1,
    ]);
    expect(
      inductionDiagnosis({ first: 1, last: 5, baseEstablished: true, bridgeEstablished: false }),
    ).toContain('bridge');
    expect(inductionComplete({ first: 1, last: 5, baseEstablished: true, bridgeEstablished: true })).toBe(
      true,
    );
  });

  it('does not permit a proof node before its dependencies', () => {
    const graph: ProofGraph = {
      premises: ['p'],
      target: 'r',
      conclusion: 'r',
      nodes: [
        { id: 'q', statement: 'q', justification: 'p implies q' },
        { id: 'r', statement: 'r', justification: 'q implies r', requires: ['q'] },
      ],
    };
    const rejected = chooseProofNode(graph, initialProofState(), 'r');
    expect(rejected.chosen).toEqual([]);
    const accepted = chooseProofNode(graph, chooseProofNode(graph, initialProofState(), 'q'), 'r');
    expect(accepted.complete).toBe(true);
  });

  it('pins the adversarial occupancy threshold', () => {
    expect(minForOccupancy(4, 2)).toBe(5);
    expect(minForOccupancy(4, 3)).toBe(9);
  });
});
