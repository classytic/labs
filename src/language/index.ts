// @classytic/labs/language — interactive language-learning labs.
//
// Data-driven: a creator (or agent) declares a `Deck` (vocab) or a small spec
// (grammar); the labs play it. A new language pair = new data, not new code.
// DOM-based (not SVG Stage scenes) — vocab/grammar are card/tile recall, not
// spatial manipulation — but ride the stage `useLearner` seam for progress.

export * from './deck.js';
export { Icon, normalizeIcon, registerLabIcon, type IconRef, type IconValue } from './icon.js';
export { Speaker, Tile, useVoicesReady } from './ui.js';
export { SentenceBuilderLab, type SentenceBuilderProps, type SentenceTile } from './sentence-builder/index.js';
export { WordMatchLab, type WordMatchProps } from './word-match/index.js';
export { ArticleLensLab, type ArticleLensProps, type ArticleItem, type Article } from './article-lens/index.js';
export { AgreementLab, type AgreementProps, type AgreementItem } from './agreement/index.js';
export { TransformLab, type TransformProps, type TransformTile } from './transform/index.js';
export { PrepositionSceneLab, type PrepositionProps, type PrepItem, type Relation } from './preposition-scene/index.js';
