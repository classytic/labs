/**
 * @classytic/labs/core — the small shared toolkit the labs build on, ON TOP of
 * the @classytic/stage engine.
 *
 * Stage owns the engine (coordinate system, SVG/Canvas primitives, resolver,
 * command/undo, clock, control surface, learner seam). This module is just the
 * domain-neutral helpers stage does NOT provide: lazy-KaTeX <Tex>, numerical
 * calculus, easing/keyframe animation, a tiny reactive value, and number utils.
 *
 * The legacy canvas engine that used to live here (useHiDpiCanvas, scene draw
 * primitives, canvas coords/dragging, the old control/learner/clock duplicates,
 * the expr shim, the canvas primitive registry) has been retired — every lab now
 * renders on stage. Import clock/control/learner/expr/coords from
 * `@classytic/stage`.
 */

export { cn, num, clamp, lerp, remap, toRad, toDeg, approxEq } from './util.js';

export { type RealFn, derivativeAt, secantSlope, sampleFunction, riemannSum, integrate, estimateOneSidedLimit } from './numeric.js';

export { mulberry32, randInt, shuffle, sample, gaussian, type Rng } from './rng.js';

export { Tex } from './tex.js';

// Inline sub/superscript text — HTML <sub>/<sup> for readouts (stage's SVG
// <Label> covers diagrams). Both share stage's `parseRichText` grammar.
export { RichText } from '../kit/rich.js';
export { parseRichText, type RichSpan } from '@classytic/stage';

export {
  type Easing,
  linear, smooth, easeInCubic, easeOutCubic, easeInOut,
  rushInto, rushFrom, thereAndBack, elastic, cubicBezier, squish, EASINGS,
} from './easing.js';

export { type SciValue, value, derive, useValue, useSciValue } from './reactive.js';

export { type TweenOptions, type TweenState, type Keyframe, useTween, keyframes } from './timeline.js';
