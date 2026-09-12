import { describe, expect, it } from 'vitest';
import {
  DEFAULT_CORPUS,
  applyTemperature,
  buildModel,
  distribution,
  generate,
} from '../src/domains/ml/next-token/model.js';

const model1 = buildModel(DEFAULT_CORPUS, 1);
const model2 = buildModel(DEFAULT_CORPUS, 2);
const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);

describe('counting the corpus', () => {
  it('collects every token into the vocabulary, sorted', () => {
    expect(model1.vocab).toEqual(['comedy', 'documentary', 'heist', 'history', 'romance', 'thriller']);
  });

  it('produces a distribution that sums to one', () => {
    for (const context of [['heist'], ['comedy'], ['thriller'], []]) {
      expect(sum(distribution(model1, context).map((p) => p.p))).toBeCloseTo(1);
    }
  });

  it('reports counts a learner can verify by hand', () => {
    // Reading the corpus for every token that follows "comedy":
    //   sequence 2 gives romance twice, sequence 5 gives comedy, comedy, romance.
    // So romance 3, comedy 2, five in total. This test was written from a miscount first, and
    // the code was right, which is the point of a corpus small enough to check.
    const after = distribution(model1, ['comedy']);
    const byToken = Object.fromEntries(after.map((p) => [p.token, p.count]));
    expect(byToken.romance).toBe(3);
    expect(byToken.comedy).toBe(2);
    expect(sum(after.map((p) => p.count))).toBe(5);
    expect(after[0]!.token).toBe('romance');
  });

  it('gives an empty result only when the corpus is empty', () => {
    expect(distribution(buildModel([], 1), ['anything'])).toEqual([]);
    expect(distribution(model1, ['nonsense']).length).toBeGreaterThan(0);
  });
});

describe('backoff', () => {
  it('uses the full context when it has seen it', () => {
    const seen = distribution(model2, ['heist', 'heist']);
    expect(seen[0]!.matched).toBe(2);
  });

  it('falls back to a shorter context rather than returning nothing', () => {
    // "history" never follows "romance" in the corpus, so this pair was never seen.
    const unseen = distribution(model2, ['romance', 'history']);
    expect(unseen.length).toBeGreaterThan(0);
    expect(unseen[0]!.matched).toBeLessThan(2);
  });

  it('backs off all the way to overall frequency for a completely unknown context', () => {
    const cold = distribution(model2, ['zzz', 'qqq']);
    expect(cold[0]!.matched).toBe(0);
    expect(sum(cold.map((p) => p.p))).toBeCloseTo(1);
  });

  it('predicts better with more context, which is the argument for a longer window', () => {
    // After "heist heist" the corpus only ever continues with "thriller", so a 2-token context is
    // certain where a 1-token context is not.
    const short = distribution(model1, ['heist', 'heist'])[0]!;
    const long = distribution(model2, ['heist', 'heist'])[0]!;
    expect(long.p).toBeGreaterThan(short.p);
    expect(long.p).toBeCloseTo(1);
  });
});

describe('temperature', () => {
  it('leaves a distribution alone at 1', () => {
    const plain = applyTemperature([0.5, 0.3, 0.2], 1);
    expect(plain[0]).toBeCloseTo(0.5);
    expect(plain[2]).toBeCloseTo(0.2);
  });

  it('sharpens toward the favourite below 1', () => {
    const sharp = applyTemperature([0.5, 0.3, 0.2], 0.3);
    expect(sharp[0]).toBeGreaterThan(0.5);
    expect(sharp[2]).toBeLessThan(0.2);
  });

  it('flattens toward uniform above 1', () => {
    const flat = applyTemperature([0.5, 0.3, 0.2], 5);
    expect(flat[0]).toBeLessThan(0.5);
    expect(flat[2]).toBeGreaterThan(0.2);
    expect(Math.max(...flat) - Math.min(...flat)).toBeLessThan(0.3);
  });

  it('never changes which token is most likely, only how strongly', () => {
    const context = ['comedy'];
    for (const t of [0.2, 0.5, 1, 2, 5]) {
      expect(distribution(model1, context, t)[0]!.token).toBe(distribution(model1, context, 1)[0]!.token);
    }
  });

  it('always returns a valid distribution, whatever the temperature', () => {
    for (const t of [0, 0.05, 0.5, 1, 10]) {
      expect(sum(distribution(model1, ['heist'], t).map((p) => p.p))).toBeCloseTo(1);
    }
  });
});

describe('generating a sequence', () => {
  it('is deterministic for a given seed, so a lesson shows the same thing every time', () => {
    const a = generate(model2, ['heist'], 6, 1, 42);
    const b = generate(model2, ['heist'], 6, 1, 42);
    expect(a).toEqual(b);
  });

  it('takes the most likely token every time at temperature 0', () => {
    const greedy = generate(model2, ['comedy'], 4, 0);
    expect(greedy[1]).toBe(distribution(model2, ['comedy'], 1)[0]!.token);
  });

  it('keeps the seed context at the front and adds the requested number of tokens', () => {
    const out = generate(model2, ['heist', 'thriller'], 5, 1, 3);
    expect(out.slice(0, 2)).toEqual(['heist', 'thriller']);
    expect(out).toHaveLength(7);
  });

  it('only ever emits tokens from the vocabulary', () => {
    for (const token of generate(model2, ['romance'], 12, 2, 9)) {
      expect(model2.vocab).toContain(token);
    }
  });

  it('produces different text at different seeds, which is why sampling is not a bug', () => {
    const seeds = new Set([1, 2, 3, 4, 5].map((s) => generate(model2, ['heist'], 8, 1.5, s).join(' ')));
    expect(seeds.size).toBeGreaterThan(1);
  });
});
