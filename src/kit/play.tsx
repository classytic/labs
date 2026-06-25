'use client';

/**
 * Play-gate for hand-driven sim labs (those running their own useFrameLoop rather
 * than going through <Scene>, which already has this). It does two things:
 *   • off-screen pause — the loop only runs while the figure is visible, so a page
 *     of labs doesn't pin the CPU;
 *   • press-to-start — an ambient animation shouldn't auto-run; show a ▶ Play
 *     overlay until the learner starts it.
 *
 * Usage:
 *   const gate = usePlayGate();
 *   useFrameLoop(tick, { running: gate.running });   // && any other condition
 *   …  <PlayWrap gate={gate}>{figureSvg}</PlayWrap>
 *
 * For a USER-TRIGGERED lab (a Run/Drop button already decides when to animate),
 * skip the overlay — just gate the existing condition on visibility with `useInView`.
 */

import { useState, type ReactNode, type RefObject } from 'react';
import { useInView } from '@classytic/stage';

export interface PlayGate {
  ref: RefObject<HTMLDivElement | null>;
  inView: boolean;
  playing: boolean;
  setPlaying: (p: boolean) => void;
  /** playing && inView — pass to useFrameLoop's `running`. */
  running: boolean;
}

export function usePlayGate(autoPlay = false): PlayGate {
  const { ref, inView } = useInView<HTMLDivElement>();
  const [playing, setPlaying] = useState(autoPlay);
  return { ref, inView, playing, setPlaying, running: playing && inView };
}

export function PlayWrap({ gate, children }: { gate: PlayGate; children: ReactNode }): ReactNode {
  // One small play/pause toggle pinned top-right — never covers the figure, and you
  // can pause to observe. (Was a big centre overlay that blocked the view.)
  return (
    <div ref={gate.ref} className="lab-playwrap">
      {children}
      <button
        type="button"
        className="lab-play-toggle"
        data-playing={gate.playing}
        aria-label={gate.playing ? 'Pause' : 'Play'}
        aria-pressed={gate.playing}
        onClick={() => gate.setPlaying(!gate.playing)}
      >
        {gate.playing ? '⏸' : '▶ Play'}
      </button>
    </div>
  );
}
