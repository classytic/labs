/**
 * The counting RULEBOOK, as data. Each rule is a {@link RuleDef} an author drops
 * into a lab/lesson (formula + analogy + a live calculator that shows its working
 * + a derivation/proof + tricks). The calculators COMPUTE through the
 * combinatorics kernel (single source of truth) and NARRATE the working in LaTeX,
 * so a lab teaches HOW the rule computes, not just the answer.
 */

import { createElement } from 'react';
import { calc, texNum, type Worked } from '../kit/calc.js';
import type { RuleDef } from '../kit/rule.js';
import {
  factorial,
  nPr,
  nCr,
  permutationsWithRepetition,
  ruleOfProduct,
  ruleOfSum,
} from './core/combinatorics.js';
import {
  CombinationSetFigure,
  OrderedSlotsFigure,
  ProductGridFigure,
  RepeatedSlotsFigure,
  SumGroupsFigure,
} from './rule-figures.js';

// ── explained calculators: value + worked LaTeX steps ──────────────────────────

export function explainFactorial(n: number): Worked {
  const v = factorial(n);
  const chain = n <= 1 ? '1' : Array.from({ length: n }, (_, i) => n - i).join(' \\times ');
  return calc()
    .step(`${n}! = ${chain}`, 'multiply every whole number down to 1')
    .step(`= ${texNum(v)}`)
    .done(v);
}

export function explainNPr(n: number, r: number): Worked {
  const v = nPr(n, r);
  const chain = r <= 0 ? '1' : Array.from({ length: r }, (_, i) => n - i).join(' \\times ');
  return calc()
    .step(`P(${n},${r}) = \\frac{${n}!}{(${n}-${r})!} = \\frac{${n}!}{${n - r}!}`, 'cancel the unused tail')
    .step(`= ${chain}`, `${r} falling factor${r === 1 ? '' : 's'}`)
    .step(`= ${texNum(v)}`)
    .done(v);
}

export function explainNCr(n: number, r: number): Worked {
  const v = nCr(n, r);
  const p = nPr(n, r),
    kf = factorial(r);
  return calc()
    .step(
      `C(${n},${r}) = \\frac{P(${n},${r})}{${r}!} = \\frac{${n}!}{${r}!\\,(${n}-${r})!}`,
      'order ignored: divide out the r! re-orderings',
    )
    .step(`= \\frac{${texNum(p)}}{${texNum(kf)}}`, `P(${n},${r})=${texNum(p)},\\; ${r}!=${texNum(kf)}`)
    .step(`= ${texNum(v)}`)
    .done(v);
}

export function explainProduct(stages: number[]): Worked {
  const v = ruleOfProduct(...stages);
  return calc()
    .step(stages.map(texNum).join(' \\times '), 'multiply the choices at each independent stage (AND)')
    .step(`= ${texNum(v)}`)
    .done(v);
}

export function explainSum(cases: number[]): Worked {
  const v = ruleOfSum(...cases);
  return calc()
    .step(cases.map(texNum).join(' + '), 'add the mutually-exclusive cases (OR)')
    .step(`= ${texNum(v)}`)
    .done(v);
}

export function explainPermWithRep(n: number, r: number): Worked {
  const v = permutationsWithRepetition(n, r);
  const chain = Array.from({ length: Math.max(1, r) }, () => texNum(n)).join(' \\times ');
  return calc()
    .step(`${n}^{${r}} = ${chain}`, `each of ${r} positions has all ${n} options`)
    .step(`= ${texNum(v)}`)
    .done(v);
}

// ── the rules as authorable data ───────────────────────────────────────────────

export const PRODUCT_RULE: RuleDef = {
  id: 'rule-of-product',
  name: 'Rule of product (AND → multiply)',
  formula: '\\#(A \\text{ then } B) = \\#A \\times \\#B',
  analogy: 'An outfit = pick a shirt AND pick trousers: 4 shirts × 3 trousers = 12 outfits.',
  figure: (v) =>
    createElement(ProductGridFigure, {
      a: v.a ?? 1,
      b: v.b ?? 1,
      c: v.c ?? 1,
    }),
  inputs: [
    { key: 'a', label: 'stage 1', default: 4, min: 1, max: 20 },
    { key: 'b', label: 'stage 2', default: 3, min: 1, max: 20 },
    { key: 'c', label: 'stage 3', default: 2, min: 1, max: 20 },
  ],
  compute: (v) => explainProduct([v.a ?? 1, v.b ?? 1, v.c ?? 1]),
  challenge: [
    {
      id: 'product-and',
      prompt: 'Four shirts can each pair with three trousers. How many outfits?',
      choices: [
        {
          value: '7',
          label: '7',
          feedback: 'Adding counts alternatives; here every shirt pairs with every trouser.',
        },
        { value: '12', label: '12' },
        {
          value: '24',
          label: '24',
          feedback: 'There are only two choice stages in this outfit.',
        },
      ],
      answer: '12',
      explain: 'Each of 4 shirts opens 3 trouser choices, creating a 4 × 3 grid of 12 outfits.',
    },
  ],
  derivation: [
    { tex: '\\text{Each of the } \\#A \\text{ first choices}' },
    {
      tex: '\\text{pairs with all } \\#B \\text{ second choices}',
      note: 'independent',
    },
    {
      tex: '\\Rightarrow \\#A \\times \\#B \\text{ outcomes}',
      note: 'an A × B grid',
    },
  ],
  tricks: [
    'Use it when steps happen in SEQUENCE ("and then"), independently.',
    'Repetition allowed ⇒ same count each stage ⇒ nʳ.',
    'No repetition ⇒ the pool shrinks (n, n−1, …) ⇒ P(n,r).',
  ],
};

export const SUM_RULE: RuleDef = {
  id: 'rule-of-sum',
  name: 'Rule of sum (OR → add)',
  formula: '\\#(A \\text{ or } B) = \\#A + \\#B \\quad (A \\cap B = \\varnothing)',
  analogy: 'A drink = a tea OR a coffee: 3 teas + 5 coffees = 8 choices.',
  figure: (v) => createElement(SumGroupsFigure, { a: v.a ?? 0, b: v.b ?? 0 }),
  inputs: [
    { key: 'a', label: 'case A', default: 3, min: 0, max: 50 },
    { key: 'b', label: 'case B', default: 5, min: 0, max: 50 },
  ],
  compute: (v) => explainSum([v.a ?? 0, v.b ?? 0]),
  challenge: [
    {
      id: 'sum-or',
      prompt: 'A café offers three teas or five coffees. How many drink choices?',
      choices: [
        { value: '8', label: '8' },
        {
          value: '15',
          label: '15',
          feedback: 'Multiplication would mean choosing a tea and a coffee together.',
        },
        {
          value: '2',
          label: '2',
          feedback: 'The categories contain several choices each.',
        },
      ],
      answer: '8',
      explain: 'The cases are mutually exclusive alternatives, so 3 + 5 = 8.',
    },
  ],
  tricks: [
    'Use it for a choice BETWEEN exclusive cases ("either … or").',
    'If the cases OVERLAP, subtract the double-count: |A∪B| = |A|+|B|−|A∩B|.',
    'The exam trap in one line: "and" → ×, "or" → +.',
  ],
};

export const FACTORIAL_RULE: RuleDef = {
  id: 'factorial',
  name: 'Factorial: n!',
  formula: 'n! = n \\times (n-1) \\times \\cdots \\times 2 \\times 1',
  analogy: 'The ways to line up n distinct books on a shelf.',
  figure: (v) =>
    createElement(OrderedSlotsFigure, {
      n: v.n ?? 0,
      label: 'arrange every object',
    }),
  inputs: [{ key: 'n', label: 'n', default: 5, min: 0, max: 12 }],
  compute: (v) => explainFactorial(v.n ?? 0),
  derivation: [
    { tex: '\\text{Slot 1: } n \\text{ choices}', note: 'any book first' },
    { tex: '\\text{Slot 2: } (n-1) \\text{ choices}', note: 'one is used' },
    { tex: '\\cdots \\text{ last slot: } 1', note: 'no choice left' },
    {
      tex: 'n \\times (n-1) \\times \\cdots \\times 1 = n!',
      note: 'rule of product',
    },
  ],
  tricks: [
    '0! = 1 (one way to arrange nothing).',
    'Grows explosively: 13! > 6 billion.',
    'The engine under both P(n,r) and C(n,r).',
  ],
};

export const PERMUTATION_RULE: RuleDef = {
  id: 'permutation',
  name: 'Permutations: P(n, r)',
  formula: 'P(n,r) = \\frac{n!}{(n-r)!}',
  analogy: 'Gold / silver / bronze to r of n runners: ORDER matters.',
  figure: (v) =>
    createElement(OrderedSlotsFigure, {
      n: v.n ?? 0,
      r: v.r ?? 0,
      label: 'ranked positions',
    }),
  inputs: [
    { key: 'n', label: 'n', default: 5, min: 0, max: 12 },
    { key: 'r', label: 'r', default: 3, min: 0, max: 12 },
  ],
  compute: (v) => explainNPr(v.n ?? 0, v.r ?? 0),
  challenge: [
    {
      id: 'permutation-order',
      prompt: 'Gold, silver and bronze are awarded from five runners. Does order matter?',
      choices: [
        { value: 'yes', label: 'Yes — use P(5,3)' },
        {
          value: 'no',
          label: 'No — use C(5,3)',
          feedback: 'The same three runners receiving different medals is a different result.',
        },
      ],
      answer: 'yes',
      explain: 'The medal positions are distinct ordered slots, so changing the order changes the outcome.',
    },
  ],
  derivation: [
    { tex: '\\text{Fill } r \\text{ ordered slots from } n' },
    {
      tex: 'n \\times (n-1) \\times \\cdots \\times (n-r+1)',
      note: 'pool shrinks each slot',
    },
    { tex: '= \\frac{n!}{(n-r)!}', note: 'the tail (n−r)! cancels' },
  ],
  tricks: [
    'Order MATTERS → permutation; AB ≠ BA.',
    'P(n,n) = n! (arrange everyone).',
    'P(n,r) = C(n,r) × r! (choose, then order).',
  ],
};

export const COMBINATION_RULE: RuleDef = {
  id: 'combination',
  name: 'Combinations: C(n, r)',
  formula: 'C(n,r) = \\binom{n}{r} = \\frac{n!}{r!\\,(n-r)!}',
  analogy: 'Picking a team of r from n: ORDER does NOT matter.',
  figure: (v) => createElement(CombinationSetFigure, { n: v.n ?? 0, r: v.r ?? 0 }),
  inputs: [
    { key: 'n', label: 'n', default: 5, min: 0, max: 20 },
    { key: 'r', label: 'r', default: 3, min: 0, max: 20 },
  ],
  compute: (v) => explainNCr(v.n ?? 0, v.r ?? 0),
  challenge: [
    {
      id: 'combination-order',
      prompt: 'Choose three students from five for an unlabeled committee. Does order matter?',
      choices: [
        {
          value: 'yes',
          label: 'Yes — use P(5,3)',
          feedback: 'A committee has no first, second or third position.',
        },
        { value: 'no', label: 'No — use C(5,3)' },
      ],
      answer: 'no',
      explain: 'Only membership matters; rearranging the same three names does not create a new committee.',
    },
  ],
  derivation: [
    {
      tex: '\\text{Order them first: } P(n,r) = \\frac{n!}{(n-r)!}',
      note: 'the ordered count',
    },
    {
      tex: '\\text{Each team was counted } r! \\text{ times}',
      note: 'its r! orderings',
    },
    {
      tex: 'C(n,r) = \\frac{P(n,r)}{r!} = \\frac{n!}{r!\\,(n-r)!}',
      note: 'divide out the over-count',
    },
  ],
  tricks: [
    'Order does NOT matter → combination; {A,B} = {B,A}.',
    'Symmetry: C(n,r) = C(n, n−r) (choose who is OUT).',
    'Row n of Pascal’s triangle IS C(n,0) … C(n,n).',
    '"Overcount by order, then divide it out": C = P ÷ r!.',
  ],
};

export const PERM_REP_RULE: RuleDef = {
  id: 'perm-with-rep',
  name: 'Permutations with repetition: nʳ',
  formula: '\\#\\text{strings} = n^{r}',
  analogy: 'A 4-digit PIN from 10 digits: each slot independently has all 10 → 10⁴.',
  figure: (v) => createElement(RepeatedSlotsFigure, { n: v.n ?? 1, r: v.r ?? 0 }),
  inputs: [
    { key: 'n', label: 'options n', default: 10, min: 1, max: 26 },
    { key: 'r', label: 'positions r', default: 4, min: 0, max: 10 },
  ],
  compute: (v) => explainPermWithRep(v.n ?? 1, v.r ?? 0),
  tricks: [
    'Repetition ALLOWED and order matters → nʳ.',
    'It is the rule of product with the SAME n each stage.',
    'Counts functions A→B, binary strings (2ⁿ), dice-roll sequences.',
  ],
};

/** The full counting rulebook, in teaching order, for a gallery / rulebook lab. */
export const COUNTING_RULES: RuleDef[] = [
  PRODUCT_RULE,
  SUM_RULE,
  FACTORIAL_RULE,
  PERMUTATION_RULE,
  COMBINATION_RULE,
  PERM_REP_RULE,
];
