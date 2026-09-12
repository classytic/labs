'use client';

import { useCallback, useState, type ReactNode, type RefObject } from 'react';
import { useInView } from '@classytic/stage';
import { RunTransport } from '../../../kit/activity.js';
import { Slider } from '../../../kit/controls.js';
import { useFrameTick, useReducedMotionDeferred } from '../../../kit/anim.js';

export interface ExperimentTimeline {
  progress: number;
  playing: boolean;
  ref: RefObject<HTMLDivElement | null>;
  playPause: () => void;
  reset: () => void;
  step: () => void;
  seek: (progress: number) => void;
}

export interface ExperimentTimelineOptions {
  durationMs?: number;
  stops?: readonly number[];
  initialProgress?: number;
}

export function clampProgress(value: number): number {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
}

export function nextTimelineStop(progress: number, stops: readonly number[]): number {
  const current = clampProgress(progress);
  return (
    stops
      .map(clampProgress)
      .sort((a, b) => a - b)
      .find((stop) => stop > current + 1e-6) ?? 1
  );
}

/** One deterministic timeline shared by animation, scrubber, transcript, and evidence. */
export function useExperimentTimeline({
  durationMs = 4000,
  stops = [0, 1],
  initialProgress = 0,
}: ExperimentTimelineOptions = {}): ExperimentTimeline {
  const [progress, setProgress] = useState(clampProgress(initialProgress));
  const [playing, setPlaying] = useState(false);
  const { ref, inView } = useInView<HTMLDivElement>();
  const reducedMotion = useReducedMotionDeferred();
  useFrameTick(playing && inView && !reducedMotion, ({ dtMs }) => {
    setProgress((current) => {
      const next = clampProgress(current + dtMs / Math.max(250, durationMs));
      if (next >= 1) setPlaying(false);
      return next;
    });
  });
  const step = useCallback(() => {
    setPlaying(false);
    setProgress((current) => nextTimelineStop(current, stops));
  }, [stops]);
  const playPause = useCallback(() => {
    if (reducedMotion) {
      step();
      return;
    }
    setProgress((current) => (current >= 1 ? 0 : current));
    setPlaying((current) => !current);
  }, [reducedMotion, step]);
  const reset = useCallback(() => {
    setPlaying(false);
    setProgress(clampProgress(initialProgress));
  }, [initialProgress]);
  const seek = useCallback((value: number) => {
    setPlaying(false);
    setProgress(clampProgress(value));
  }, []);
  return { progress, playing, ref, playPause, reset, step, seek };
}

export function ExperimentTransport({
  timeline,
  label = 'experiment',
  detail,
  scrubAriaLabel,
}: {
  timeline: ExperimentTimeline;
  label?: string;
  detail?: ReactNode;
  scrubAriaLabel?: string;
}): ReactNode {
  return (
    <div ref={timeline.ref} className="modern-experiment-transport">
      <RunTransport
        running={timeline.playing}
        onReset={timeline.reset}
        onStep={timeline.step}
        onToggle={timeline.playPause}
        state={timeline.playing ? 'Running' : timeline.progress >= 1 ? 'Complete' : 'Paused'}
        detail={detail}
        runLabel={`Run ${label}`}
      />
      {/* The shared Slider, not a raw range input: it carries the host's control styling and the
          commit/change split every other lab uses. */}
      <Slider
        value={timeline.progress}
        min={0}
        max={1}
        step={0.001}
        onChange={timeline.seek}
        ariaLabel={scrubAriaLabel ?? `Scrub ${label}`}
      />
    </div>
  );
}
