/** GENERATED — real-schema language authoring blocks. */
import { manifestToBlock } from '../../lab-def/to-block.js';
import agreement from '../language/agreement/manifest.js';
import articleLens from '../language/article-lens/manifest.js';
import cloze from '../language/cloze/manifest.js';
import dictation from '../language/dictation/manifest.js';
import errorCorrect from '../language/error-correct/manifest.js';
import listening from '../language/listening/manifest.js';
import preposition from '../language/preposition/manifest.js';
import reading from '../language/reading/manifest.js';
import sentenceBuilder from '../language/sentence-builder/manifest.js';
import transform from '../language/transform/manifest.js';
import wordMatch from '../language/word-match/manifest.js';

export const blocks = [agreement, articleLens, cloze, dictation, errorCorrect, listening, preposition, reading, sentenceBuilder, transform, wordMatch].map(manifestToBlock);
