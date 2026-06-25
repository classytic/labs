/**
 * @classytic/labs/language — shared deck model + helpers.
 *
 * The ONE authorable model for language labs: a creator (or an agent) declares
 * a `Deck` of items; every vocab lab plays it. Grammar labs take their own
 * small data shapes but reuse `Pos` + the audio resolver here. No content is
 * generated — audio is creator-supplied (uploaded / external URL) or the
 * browser's built-in `speechSynthesis`, nothing else.
 */

import type { IconValue } from './icon.js';

/** Part of speech — drives the Montessori-style colour coding across grammar
 *  labs so a learner builds one consistent visual intuition. */
export type Pos =
  | 'noun' | 'verb' | 'article' | 'adjective' | 'preposition'
  | 'pronoun' | 'conjunction' | 'adverb' | 'other';

export const POS_LABEL: Record<Pos, string> = {
  noun: 'noun', verb: 'verb', article: 'article', adjective: 'adjective',
  preposition: 'preposition', pronoun: 'pronoun', conjunction: 'conjunction',
  adverb: 'adverb', other: 'word',
};

export interface DeckItem {
  /** Target-language word/phrase being taught. */
  term: string;
  /** Its meaning in the learner's language. */
  translation: string;
  /** Optional romanisation / pronunciation aid (e.g. Arabic → "kitāb"). */
  transliteration?: string;
  /** Optional audio: an uploaded media URL OR an external URL. Never generated. */
  audioUrl?: string;
  /** Optional picture for kids/visual decks — an emoji string, or an `IconRef`
   *  ({ kind:'emoji'|'svg'|'image', … }) for a registered SVG / uploaded image. */
  icon?: IconValue;
  /** Optional usage example (target language). */
  example?: string;
  tags?: string[];
}

export interface Deck {
  title?: string;
  /** BCP-47 of the term side, e.g. 'en-US', 'ar', 'fr-FR', 'bn-BD'. Used for
   *  browser-TTS voice lookup + text direction. */
  termLang: string;
  /** BCP-47 of the translation side. */
  transLang: string;
  items: DeckItem[];
}

export type TextDir = 'ltr' | 'rtl';

/** Text direction for a BCP-47 language tag (RTL scripts → 'rtl'). */
export function dirFor(lang: string): TextDir {
  return /^(ar|fa|ur|he|ps|sd)\b/i.test(lang) ? 'rtl' : 'ltr';
}

// ── audio resolution (browser-TTS default, no generation) ──────────────────
//   1. item.audioUrl → <audio>   2. speechSynthesis (if a voice exists)   3. none

export function hasVoiceFor(lang: string): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
  const base = lang.toLowerCase().split('-')[0] ?? lang.toLowerCase();
  return window.speechSynthesis.getVoices().some((v) => v.lang.toLowerCase().startsWith(base));
}

/** Can this item be voiced at all (own audio, or a matching browser voice)? */
export function canSpeak(item: DeckItem, lang: string): boolean {
  return Boolean(item.audioUrl) || hasVoiceFor(lang);
}

/** Play an item's audio. Returns false if nothing was playable. */
export function speak(item: DeckItem, lang: string): boolean {
  if (typeof window === 'undefined') return false;
  if (item.audioUrl) {
    void new Audio(item.audioUrl).play().catch(() => {});
    return true;
  }
  if ('speechSynthesis' in window && hasVoiceFor(lang)) {
    const u = new SpeechSynthesisUtterance(item.term);
    u.lang = lang;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
    return true;
  }
  return false;
}

/** Deterministic shuffle (seeded LCG) — same input+seed → same order, so SSR
 *  and client agree. Never uses Math.random at module scope. */
export function seededShuffle<T>(arr: readonly T[], seed = 1): T[] {
  const a = arr.slice();
  let s = (Math.abs(Math.trunc(seed)) * 1103515245 + 12345) & 0x7fffffff;
  const rnd = (): number => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    const t = a[i]!; a[i] = a[j]!; a[j] = t;
  }
  return a;
}
