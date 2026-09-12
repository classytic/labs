/**
 * Next-token prediction, small enough to check by hand.
 *
 * In March 2025 Netflix replaced hundreds of specialised recommenders with a single foundation
 * model that treats a viewing history as a sentence: every play, pause and rewatch is a token,
 * and the model predicts the next one. That is the same shape as a language model, so this one
 * mechanism explains both, and a learner who can count these tables knows what the big version
 * is doing differently (scale and a learned representation) rather than believing it is magic.
 *
 * The model here is an n-gram counter, which is what language models were before neural ones.
 * It is honest about being simple, and every number on screen can be recomputed from the corpus
 * with a pencil. Backoff to a shorter context is included because it is the real technique that
 * stops an unseen context returning nothing.
 */

export interface NgramModel {
  /** How many previous tokens the model looks at. 1 is a bigram model. */
  order: number;
  /** context key -> next token -> count. The key is the context joined by a separator. */
  counts: Map<string, Map<string, number>>;
  vocab: string[];
}

export interface Prediction {
  token: string;
  /** Probability after temperature is applied. Sums to 1 across the returned list. */
  p: number;
  /** Raw count behind it, so the arithmetic stays checkable. */
  count: number;
  /** How many context tokens actually matched. Lower means the model had to back off. */
  matched: number;
}

const KEY = '';
const keyOf = (context: readonly string[]): string => context.join(KEY);

/** Count every (context, next) pair at every order up to `order`, which is what makes backoff possible. */
export function buildModel(corpus: readonly (readonly string[])[], order = 1): NgramModel {
  const width = Math.max(1, Math.floor(order));
  const counts = new Map<string, Map<string, number>>();
  const vocab = new Set<string>();

  for (const sequence of corpus) {
    for (const token of sequence) vocab.add(token);
    for (let index = 0; index < sequence.length; index++) {
      const next = sequence[index]!;
      // Record this token against every context length, including the empty one.
      for (let back = 0; back <= width; back++) {
        if (index - back < 0) break;
        const context = sequence.slice(index - back, index);
        if (context.length !== back) break;
        const key = keyOf(context);
        const row = counts.get(key) ?? new Map<string, number>();
        row.set(next, (row.get(next) ?? 0) + 1);
        counts.set(key, row);
      }
    }
  }
  return { order: width, counts, vocab: [...vocab].sort() };
}

/**
 * Temperature reshapes a distribution without changing which token is most likely.
 *
 * Below 1 it sharpens toward the favourite, above 1 it flattens toward uniform. This is the knob
 * behind a model sounding either predictable or inventive, so it is worth meeting as arithmetic
 * rather than as a personality setting.
 */
export function applyTemperature(probabilities: readonly number[], temperature: number): number[] {
  const t = Math.max(0.05, temperature);
  const raised = probabilities.map((p) => Math.pow(Math.max(p, 0), 1 / t));
  const total = raised.reduce((sum, value) => sum + value, 0);
  return total === 0
    ? probabilities.map(() => 1 / probabilities.length)
    : raised.map((value) => value / total);
}

/**
 * The distribution over the next token, backing off to a shorter context when the full one was
 * never seen. Returns highest probability first.
 */
export function distribution(model: NgramModel, context: readonly string[], temperature = 1): Prediction[] {
  let row: Map<string, number> | undefined;
  let matched = Math.min(model.order, context.length);
  for (; matched >= 0; matched--) {
    row = model.counts.get(keyOf(context.slice(context.length - matched)));
    if (row && row.size) break;
  }
  if (!row || !row.size) return [];

  const entries = [...row.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const total = entries.reduce((sum, [, count]) => sum + count, 0);
  const shaped = applyTemperature(
    entries.map(([, count]) => count / total),
    temperature,
  );
  return entries
    .map(([token, count], index) => ({ token, count, p: shaped[index]!, matched: Math.max(matched, 0) }))
    .sort((a, b) => b.p - a.p || a.token.localeCompare(b.token));
}

/** Integer-only PRNG, so a generated sequence is identical on the server and in the browser. */
function rng(seed: number): () => number {
  let state = seed | 0 || 1;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return ((state >>> 0) % 100000) / 100000;
  };
}

/** Extend a sequence by sampling from the model. Temperature 0 makes it deterministic. */
export function generate(
  model: NgramModel,
  seedContext: readonly string[],
  steps: number,
  temperature = 1,
  seed = 7,
): string[] {
  const next = rng(seed);
  const out = [...seedContext];
  for (let step = 0; step < Math.max(0, steps); step++) {
    const options = distribution(model, out, temperature);
    if (!options.length) break;
    if (temperature <= 0.05) {
      out.push(options[0]!.token);
      continue;
    }
    let roll = next();
    let picked = options[options.length - 1]!.token;
    for (const option of options) {
      roll -= option.p;
      if (roll <= 0) {
        picked = option.token;
        break;
      }
    }
    out.push(picked);
  }
  return out;
}

/**
 * A viewing history is a sentence. Six short ones, with enough repetition that the counts are
 * meaningful and enough variety that a longer context genuinely predicts better.
 */
export const DEFAULT_CORPUS: string[][] = [
  ['heist', 'heist', 'thriller', 'thriller', 'documentary'],
  ['romance', 'comedy', 'romance', 'comedy', 'romance'],
  ['heist', 'thriller', 'heist', 'thriller', 'heist'],
  ['documentary', 'documentary', 'history', 'documentary'],
  ['comedy', 'comedy', 'comedy', 'romance'],
  ['thriller', 'heist', 'thriller', 'documentary'],
];
