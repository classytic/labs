'use client';

/**
 * BaseOdometer, the same quantity, ticking in every base at once.
 *
 * Stacked odometer rows (one per base) all driven by ONE shared integer:
 * increment it and binary/octal/decimal/hex roll in lockstep, the binary row
 * rolls fastest (the rightmost-bit frequency cascade), hex barely moves, so
 * "base is a costume, not a different number" is something you watch, not read.
 * A race toggle auto-counts via the frame loop so the cascade plays as motion.
 * Composes the shared WheelRow (DRY: the wheel + carry animation live in one place).
 */

import { useRef, useState, type ReactNode } from 'react';
import { useInView } from '@classytic/stage';
import { Minus, Pause, Play, Plus } from 'lucide-react';
import { Activity } from '../../kit/activity.js';
import { ActionButton, IconButton } from '../../kit/controls.js';
import { useFrameTick } from '../../kit/anim.js';
import { useCheckpoint } from '../../kit/pedagogy.js';
import { WheelRow, digitChar, toDigits } from './wheel.js';

export interface BaseOdometerProps {
  bases?: number[];
  /** digit count per row; 'auto' sizes each base to hold `max`. */
  width?: number | 'auto';
  start?: number;
  max?: number;
  race?: boolean;
  /** ticks per second while racing. */
  speed?: number;
  /** tint one base row as the focus/answer. */
  highlightBase?: number;
  target?: number;
  title?: string;
  prompt?: string;
  objectives?: string[];
}

const LABELS: Record<number, string> = {
  2: 'BIN',
  8: 'OCT',
  10: 'DEC',
  16: 'HEX',
};

export function BaseOdometerLab({
  bases = [2, 8, 10, 16],
  width = 'auto',
  start = 0,
  max = 255,
  race = false,
  speed = 2,
  highlightBase,
  target,
  title = 'Base odometer',
  prompt = 'One quantity, every base at once: +1 and watch them all roll.',
}: BaseOdometerProps): ReactNode {
  const [value, setValue] = useState(Math.max(0, Math.min(max, Math.floor(start))));
  const [racing, setRacing] = useState(race);
  const acc = useRef(0);
  const { ref: viewRef, inView } = useInView<HTMLDivElement>();

  const widthFor = (b: number): number =>
    width === 'auto' ? Math.max(1, Math.ceil(Math.log(max + 1) / Math.log(b) - 1e-9)) : width;
  const bump = (delta: number): void => setValue((x) => Math.max(0, Math.min(max, x + delta)));

  // race: advance the shared integer `speed` times/sec, looping at max.
  useFrameTick(racing && inView, (f) => {
    acc.current += Math.min(0.1, f.dtMs / 1000) * speed;
    if (acc.current >= 1) {
      const steps = Math.floor(acc.current);
      acc.current -= steps;
      setValue((x) => (x + steps) % (max + 1));
    }
  });

  const solved = target != null && value === target;
  useCheckpoint({ solved, activity: 'base-odometer' });

  const figure = (
    <>
      <div ref={viewRef} className="ict-odometer-scene">
        {bases.map((b) => {
          const hot = b === highlightBase;
          return (
            <div key={b} className="ict-odometer-row" data-highlighted={hot || undefined}>
              <span className="ict-base-label">{LABELS[b] ?? `b${b}`}</span>
              <WheelRow value={value} base={b} width={widthFor(b)} ariaPrefix={`base ${b} `} />
              <span className="ict-base-value">
                {toDigits(value, b, widthFor(b)).map(digitChar).join('')}
                <sub>{b}</sub>
              </span>
            </div>
          );
        })}
      </div>
      <Activity.LiveRegion>{`value ${value}`}</Activity.LiveRegion>
    </>
  );

  return (
    <Activity.Root className="ict-number-activity">
      <Activity.Header>
        <Activity.Heading eyebrow="Number systems" title={title} description={prompt} />
        <Activity.FocusButton />
      </Activity.Header>
      <Activity.Status>
        <strong>{racing ? 'Counting' : 'Paused'}</strong>
        <span>value {value}</span>
        <span>{speed} ticks/s</span>
      </Activity.Status>
      <Activity.Workspace>
        <Activity.Canvas label="Synchronized number-base odometers">{figure}</Activity.Canvas>
      </Activity.Workspace>
      {target != null && (
        <Activity.Feedback>
          <span>{solved ? 'Complete' : 'Goal'}</span>
          <p>{solved ? `Reached ${target}.` : `Count to ${target}.`}</p>
        </Activity.Feedback>
      )}
      <Activity.Transport>
        <div className="ict-transport-actions">
          <IconButton label="Decrease count" onClick={() => bump(-1)} disabled={value <= 0}>
            <Minus aria-hidden="true" />
          </IconButton>
          <IconButton label="Increase count" onClick={() => bump(1)} disabled={value >= max}>
            <Plus aria-hidden="true" />
          </IconButton>
        </div>
        <div className="ict-transport-state" aria-live="polite">
          <strong>{value}</strong>
          <span>same quantity in every base</span>
        </div>
        <ActionButton
          className="ict-race-action"
          onClick={() => setRacing((current) => !current)}
          pressed={racing}
        >
          {racing ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
          <span>{racing ? 'Pause' : 'Race'}</span>
        </ActionButton>
      </Activity.Transport>
    </Activity.Root>
  );
}
