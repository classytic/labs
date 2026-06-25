/**
 * Schema contract tests — proves the authorable lab DATA shapes are really
 * validated (no `z.any()` escape hatch) and the IconRef union is honoured.
 * (Per-lab prop schemas live on each `defineBlock`; there's no separate registry.)
 */

import { describe, it, expect } from 'vitest';
import {
  prepItemSchema, deckSchema, agreementItemSchema, transformTileSchema,
  iconValueSchema,
} from '../dist/schemas/index.mjs';

describe('language schemas reject malformed data', () => {
  it('prepItem: bad relation is rejected, valid passes', () => {
    expect(prepItemSchema.safeParse({ before: 'The cat is', noun: 'the box.', answer: 'in', options: ['in', 'on'], scene: 'inside' }).success).toBe(false);
    expect(prepItemSchema.safeParse({ before: 'The cat is', noun: 'the box.', answer: 'in', options: ['in', 'on'], scene: 'in' }).success).toBe(true);
  });

  it('deck: an item missing the required term is rejected', () => {
    expect(deckSchema.safeParse({ termLang: 'en', transLang: 'bn', items: [{ translation: 'বই' }] }).success).toBe(false);
    expect(deckSchema.safeParse({ termLang: 'en', transLang: 'bn', items: [{ term: 'book', translation: 'বই' }] }).success).toBe(true);
  });

  it('agreement: options must be an array of strings', () => {
    expect(agreementItemSchema.safeParse({ subject: 'She', options: 'goes', correct: 'goes' }).success).toBe(false);
  });

  it('transformTile: pos must be a known part of speech', () => {
    expect(transformTileSchema.safeParse({ text: 'tea', pos: 'thingy' }).success).toBe(false);
    expect(transformTileSchema.safeParse({ text: 'tea', pos: 'noun' }).success).toBe(true);
  });
});

describe('IconValue union (back-compat + durable assets)', () => {
  it('accepts a plain emoji string', () => {
    expect(iconValueSchema.safeParse('🐦').success).toBe(true);
  });
  it('accepts a well-formed IconRef', () => {
    expect(iconValueSchema.safeParse({ kind: 'image', src: '/cat.webp', alt: 'a cat' }).success).toBe(true);
    expect(iconValueSchema.safeParse({ kind: 'svg', id: 'tree', alt: 'tree' }).success).toBe(true);
  });
  it('rejects an IconRef with an unknown kind or missing alt', () => {
    expect(iconValueSchema.safeParse({ kind: 'gif', src: '/x', alt: 'x' }).success).toBe(false);
    expect(iconValueSchema.safeParse({ kind: 'image', src: '/x' }).success).toBe(false);
  });
});
