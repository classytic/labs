import { IconValue } from "./icon.mjs";

//#region src/language/deck.d.ts
/** Part of speech, drives the Montessori-style colour coding across grammar
 *  labs so a learner builds one consistent visual intuition. */
type Pos = 'noun' | 'verb' | 'article' | 'adjective' | 'preposition' | 'pronoun' | 'conjunction' | 'adverb' | 'other';
declare const POS_LABEL: Record<Pos, string>;
interface DeckItem {
  /** Target-language word/phrase being taught. */
  term: string;
  /** Its meaning in the learner's language. */
  translation: string;
  /** Optional romanisation / pronunciation aid (e.g. Arabic → "kitāb"). */
  transliteration?: string;
  /** Optional audio: an uploaded media URL OR an external URL. Never generated. */
  audioUrl?: string;
  /** Optional picture for kids/visual decks, an emoji string, or an `IconRef`
   *  ({ kind:'emoji'|'svg'|'image', … }) for a registered SVG / uploaded image. */
  icon?: IconValue;
  /** Optional usage example (target language). */
  example?: string;
  tags?: string[];
}
interface Deck {
  title?: string;
  /** BCP-47 of the term side, e.g. 'en-US', 'ar', 'fr-FR', 'bn-BD'. Used for
   *  browser-TTS voice lookup + text direction. */
  termLang: string;
  /** BCP-47 of the translation side. */
  transLang: string;
  items: DeckItem[];
}
type TextDir = 'ltr' | 'rtl';
/** Text direction for a BCP-47 language tag (RTL scripts → 'rtl'). */
declare function dirFor(lang: string): TextDir;
declare function hasVoiceFor(lang: string): boolean;
/** Can this item be voiced at all (own audio, or a matching browser voice)? */
declare function canSpeak(item: DeckItem, lang: string): boolean;
/** Play an item's audio. Returns false if nothing was playable. */
declare function speak(item: DeckItem, lang: string): boolean;
/** Deterministic shuffle (seeded LCG), same input+seed → same order, so SSR
 *  and client agree. Never uses Math.random at module scope. */
declare function seededShuffle<T>(arr: readonly T[], seed?: number): T[];
//#endregion
export { Deck, DeckItem, POS_LABEL, Pos, TextDir, canSpeak, dirFor, hasVoiceFor, seededShuffle, speak };