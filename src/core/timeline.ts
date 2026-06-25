'use client';

/**
 * Declarative animation over the injectable clock. `useTween` animates one
 * number from `from`→`to` with an easing; it derives progress from the clock's
 * `timeMs` (not an accumulated counter), so under a fixed driver (e.g. Remotion)
 * it's deterministic and scrubbable. Widgets that prefer to drive frames
 * imperatively use `useFrameLoop` (from `@classytic/stage`) directly.
 */

import { useRef, useState } from 'react';
import { useFrameLoop } from '@classytic/stage';
import { smooth, type Easing } from './easing.js';
import { clamp, lerp } from './util.js';

export interface TweenOptions {
  from?: number;
  to: number;
  durationMs?: number;
  ease?: Easing;
  autoplay?: boolean;
  loop?: boolean | 'pingpong';
}

export interface TweenState {
  value: number;
  progress: number;
  playing: boolean;
  play: () => void;
  pause: () => void;
  reset: () => void;
}

export function useTween(opts: TweenOptions): TweenState {
  const { from = 0, to, durationMs = 800, ease = smooth, autoplay = false, loop = false } = opts;
  const [playing, setPlaying] = useState(autoplay);
  const [progress, setProgress] = useState(autoplay ? 0 : 0);
  const startRef = useRef<number | null>(null);

  useFrameLoop(
    (f) => {
      if (startRef.current === null) startRef.current = f.timeMs;
      let p = (f.timeMs - startRef.current) / durationMs;
      if (p >= 1) {
        if (loop === true) {
          startRef.current = f.timeMs;
          p = 0;
        } else if (loop === 'pingpong') {
          // fold into [0,1] triangle wave
          const cycle = ((f.timeMs - startRef.current) / durationMs) % 2;
          p = cycle <= 1 ? cycle : 2 - cycle;
        } else {
          p = 1;
          setPlaying(false);
        }
      }
      setProgress(p);
    },
    { running: playing },
  );

  const eased = ease(clamp(progress, 0, 1));
  return {
    value: lerp(from, to, eased),
    progress,
    playing,
    play: () => {
      startRef.current = null;
      setPlaying(true);
    },
    pause: () => setPlaying(false),
    reset: () => {
      startRef.current = null;
      setProgress(0);
      setPlaying(false);
    },
  };
}

export interface Keyframe {
  /** Normalized time 0..1. */
  at: number;
  value: number;
  ease?: Easing;
}

/**
 * Pure multi-stage interpolation: build a `(t in [0,1]) => number` from
 * keyframes. The manim-style way to express richer programmatic animation
 * without a scheduler — drive `t` from `useTween`/`useFrameLoop`.
 */
export function keyframes(frames: Keyframe[]): (t: number) => number {
  const ks = [...frames].sort((a, b) => a.at - b.at);
  return (t) => {
    if (ks.length === 0) return 0;
    if (t <= ks[0]!.at) return ks[0]!.value;
    if (t >= ks[ks.length - 1]!.at) return ks[ks.length - 1]!.value;
    for (let i = 0; i < ks.length - 1; i++) {
      const a = ks[i]!;
      const b = ks[i + 1]!;
      if (t >= a.at && t <= b.at) {
        const local = (t - a.at) / (b.at - a.at || 1);
        const e = (b.ease ?? smooth)(local);
        return lerp(a.value, b.value, e);
      }
    }
    return ks[ks.length - 1]!.value;
  };
}
