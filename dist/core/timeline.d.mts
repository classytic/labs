import { Easing } from "./easing.mjs";

//#region src/core/timeline.d.ts
interface TweenOptions {
  from?: number;
  to: number;
  durationMs?: number;
  ease?: Easing;
  autoplay?: boolean;
  loop?: boolean | 'pingpong';
}
interface TweenState {
  value: number;
  progress: number;
  playing: boolean;
  play: () => void;
  pause: () => void;
  reset: () => void;
}
declare function useTween(opts: TweenOptions): TweenState;
interface Keyframe {
  /** Normalized time 0..1. */
  at: number;
  value: number;
  ease?: Easing;
}
/**
 * Pure multi-stage interpolation: build a `(t in [0,1]) => number` from
 * keyframes. The manim-style way to express richer programmatic animation
 * without a scheduler, drive `t` from `useTween`/`useFrameLoop`.
 */
declare function keyframes(frames: Keyframe[]): (t: number) => number;
//#endregion
export { Keyframe, TweenOptions, TweenState, keyframes, useTween };