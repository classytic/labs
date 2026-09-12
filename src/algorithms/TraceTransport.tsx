'use client';

import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { ChevronLeft, ChevronRight, Gauge, Pause, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Activity } from '../kit/activity.js';
import { useReducedMotion } from '../kit/anim.js';

export interface TraceTransportProps {
  step: number;
  count: number;
  message: string;
  setStep: Dispatch<SetStateAction<number>>;
  canAdvance?: boolean;
}

const SPEEDS = [1, 1.5, 2] as const;

export function TraceTransport({ step, count, message, setStep, canAdvance = true }: TraceTransportProps) {
  const [playing, setPlaying] = useState(false);
  const [speedIndex, setSpeedIndex] = useState(0);
  const reduceMotion = useReducedMotion();
  const speed = SPEEDS[speedIndex]!;

  useEffect(() => {
    if (!playing || !canAdvance || reduceMotion) return;
    if (step >= count - 1) {
      setPlaying(false);
      return;
    }
    const timer = window.setTimeout(() => setStep((value) => Math.min(count - 1, value + 1)), 900 / speed);
    return () => window.clearTimeout(timer);
  }, [canAdvance, count, playing, reduceMotion, setStep, speed, step]);

  const togglePlayback = () => {
    if (step >= count - 1) setStep(0);
    setPlaying((value) => !value);
  };

  // Keyboard: arrows step, space plays/pauses, up/down change speed. Scoped to THIS
  // lab (only when focus is inside its .lab-activity) so several labs on one page never
  // fight over the same keys, and the range slider keeps its native arrow behaviour.
  const anchor = useRef<HTMLDivElement>(null);
  const latest = useRef({ step, count, canAdvance, reduceMotion });
  latest.current = { step, count, canAdvance, reduceMotion };
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const activity = anchor.current?.closest('.lab-activity');
      if (!activity || !activity.contains(document.activeElement)) return;
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable))
        return;
      const state = latest.current;
      switch (event.key) {
        case 'ArrowRight':
          if (!state.canAdvance || state.step >= state.count - 1) return;
          event.preventDefault();
          setPlaying(false);
          setStep((value) => Math.min(state.count - 1, value + 1));
          break;
        case 'ArrowLeft':
          if (state.step <= 0) return;
          event.preventDefault();
          setPlaying(false);
          setStep((value) => Math.max(0, value - 1));
          break;
        case ' ':
        case 'k':
          if (!state.canAdvance || state.reduceMotion) return;
          event.preventDefault();
          if (state.step >= state.count - 1) setStep(0);
          setPlaying((value) => !value);
          break;
        case 'ArrowUp':
        case '+':
        case '=':
          event.preventDefault();
          setSpeedIndex((value) => Math.min(SPEEDS.length - 1, value + 1));
          break;
        case 'ArrowDown':
        case '-':
        case '_':
          event.preventDefault();
          setSpeedIndex((value) => Math.max(0, value - 1));
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setStep]);

  return (
    <Activity.Transport>
      <Button
        variant="outline"
        size="icon-sm"
        className="lab-icon-button"
        type="button"
        title="Previous step (←)"
        aria-label="Previous step"
        aria-keyshortcuts="ArrowLeft"
        onClick={() => {
          setPlaying(false);
          setStep((value) => Math.max(0, value - 1));
        }}
        disabled={step === 0}
      >
        <ChevronLeft aria-hidden="true" />
      </Button>
      <Activity.Progress
        value={step + 1}
        max={count}
        onChange={
          canAdvance
            ? (value) => {
                setPlaying(false);
                setStep(value - 1);
              }
            : undefined
        }
        label={
          <>
            <span className="algorithm-step-count">
              {step + 1}/{count}
            </span>
            <span className="algorithm-transport-message" aria-live="polite">
              {message}
            </span>
          </>
        }
      />
      <div className="algorithm-playback" ref={anchor}>
        <Button
          variant="outline"
          size="icon-sm"
          className="lab-icon-button"
          type="button"
          title={playing ? 'Pause (space)' : step >= count - 1 ? 'Replay (space)' : 'Play (space)'}
          aria-label={playing ? 'Pause trace' : step >= count - 1 ? 'Replay trace' : 'Play trace'}
          aria-keyshortcuts="Space"
          aria-pressed={playing}
          onClick={togglePlayback}
          disabled={!canAdvance || reduceMotion}
        >
          {playing ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="lab-icon-button algorithm-speed"
          type="button"
          title={`Playback speed ${speed}× (↑ / ↓)`}
          aria-label={`Playback speed ${speed} times; activate to change`}
          aria-keyshortcuts="ArrowUp ArrowDown"
          onClick={() => setSpeedIndex((value) => (value + 1) % SPEEDS.length)}
        >
          <Gauge aria-hidden="true" />
          <span>{speed}×</span>
        </Button>
        <Button
          className="lab-btn algorithm-next"
          type="button"
          title="Next step (→)"
          aria-label="Next step"
          aria-keyshortcuts="ArrowRight"
          onClick={() => {
            setPlaying(false);
            setStep((value) => Math.min(count - 1, value + 1));
          }}
          disabled={step === count - 1 || !canAdvance}
        >
          <span>Next step</span>
          <ChevronRight aria-hidden="true" />
        </Button>
      </div>
    </Activity.Transport>
  );
}
