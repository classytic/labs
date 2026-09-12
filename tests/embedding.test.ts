import { describe, expect, it } from 'vitest';
import {
  DEFAULT_EMBEDDING_ITEMS as ITEMS,
  analogyTarget,
  cosine,
  euclidean,
  rankBy,
} from '../src/domains/ml/embedding-space/embedding.js';

const at = (label: string) => ITEMS.find((item) => item.label === label)!;

describe('the two measurements', () => {
  it('scores an identical direction as 1 and an opposite one as -1', () => {
    expect(cosine({ label: 'a', x: 2, y: 1 }, { label: 'b', x: 4, y: 2 })).toBeCloseTo(1);
    expect(cosine({ label: 'a', x: 2, y: 1 }, { label: 'b', x: -2, y: -1 })).toBeCloseTo(-1);
  });

  it('ignores length, which is the whole reason production ranks by it', () => {
    const short = { label: 'q', x: 1, y: 1 };
    const long = { label: 'doc', x: 50, y: 50 };
    expect(cosine(short, long)).toBeCloseTo(1);
    // Distance would call these far apart for a reason unrelated to meaning.
    expect(euclidean(short, long)).toBeGreaterThan(60);
  });

  it('measures distance as ordinary geometry', () => {
    expect(euclidean({ label: 'a', x: 0, y: 0 }, { label: 'b', x: 3, y: 4 })).toBe(5);
  });

  it('treats a zero vector as similar to nothing rather than dividing by zero', () => {
    expect(cosine({ label: 'o', x: 0, y: 0 }, at('cat'))).toBe(0);
  });
});

describe('the shipped vocabulary means what the lab claims', () => {
  it('puts each cluster nearest its own members', () => {
    for (const [label, expected] of [
      ['cat', 'animals'],
      ['bus', 'vehicles'],
      ['queen', 'people'],
      ['rice', 'food'],
    ] as const) {
      const nearest = rankBy(ITEMS, at(label), 'cosine', [label])[0]!;
      expect(nearest.item.group).toBe(expected);
    }
  });

  it('agrees between the two metrics about the nearest word, on this vocabulary', () => {
    // The lab shows both numbers and claims they usually agree. If a future edit to the
    // vocabulary breaks that, the claim in the prose becomes false.
    for (const item of ITEMS) {
      const byCos = rankBy(ITEMS, item, 'cosine', [item.label])[0]!.item.group;
      const byDist = rankBy(ITEMS, item, 'euclidean', [item.label])[0]!.item.group;
      expect(byCos).toBe(byDist);
    }
  });
});

describe('the analogy', () => {
  it('lands king − man + woman exactly on queen', () => {
    const result = analogyTarget(ITEMS, 'king', 'man', 'woman')!;
    expect(result.target.x).toBeCloseTo(at('queen').x);
    expect(result.target.y).toBeCloseTo(at('queen').y);
  });

  it('resolves to queen under BOTH metrics', () => {
    const { target, exclude } = analogyTarget(ITEMS, 'king', 'man', 'woman')!;
    expect(rankBy(ITEMS, target, 'cosine', exclude)[0]!.item.label).toBe('queen');
    expect(rankBy(ITEMS, target, 'euclidean', exclude)[0]!.item.label).toBe('queen');
  });

  it('excludes its own three inputs, which is what makes the answer meaningful', () => {
    const { target, exclude } = analogyTarget(ITEMS, 'king', 'man', 'woman')!;
    expect(exclude).toEqual(['king', 'man', 'woman']);
    // Without the exclusion, cosine ranks "man" above "woman" here, so the answer would be noise.
    const unfiltered = rankBy(ITEMS, target, 'cosine').map((r) => r.item.label);
    expect(unfiltered).toContain('man');
    expect(rankBy(ITEMS, target, 'cosine', exclude).map((r) => r.item.label)).not.toContain('man');
  });

  it('runs the other way too, so the direction is a real axis and not one lucky pair', () => {
    const { target, exclude } = analogyTarget(ITEMS, 'queen', 'woman', 'man')!;
    expect(rankBy(ITEMS, target, 'euclidean', exclude)[0]!.item.label).toBe('king');
  });

  it('returns null for a word that is not in the vocabulary', () => {
    expect(analogyTarget(ITEMS, 'king', 'man', 'wizard')).toBeNull();
  });
});
