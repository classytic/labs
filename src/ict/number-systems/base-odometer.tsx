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
import { Chip, StatusPill } from '../../kit/controls.js';
import { LabFrame, ControlBar, Field, LiveRegion } from '../../kit/frame.js';
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

const LABELS: Record<number, string> = { 2: 'BIN', 8: 'OCT', 10: 'DEC', 16: 'HEX' };

export function BaseOdometerLab({
  bases = [2, 8, 10, 16], width = 'auto', start = 0, max = 255,
  race = false, speed = 2, highlightBase, target,
  title = 'Base odometer', prompt = 'One quantity, every base at once: +1 and watch them all roll.',
  objectives,
}: BaseOdometerProps): ReactNode {
  const [value, setValue] = useState(Math.max(0, Math.min(max, Math.floor(start))));
  const [racing, setRacing] = useState(race);
  const acc = useRef(0);
  const { ref: viewRef, inView } = useInView<HTMLDivElement>();

  const widthFor = (b: number): number => width === 'auto' ? Math.max(1, Math.ceil(Math.log(max + 1) / Math.log(b) - 1e-9)) : width;
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
      <div ref={viewRef} className="lab-playwrap" style={{ borderRadius: 14, background: 'var(--stage-bg)', border: '1px solid var(--stage-grid)', padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {bases.map((b) => {
          const hot = b === highlightBase;
          return (
            <div key={b} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: hot ? '6px 8px' : 0, borderRadius: 10, background: hot ? 'color-mix(in oklab, var(--stage-good) 12%, transparent)' : 'transparent' }}>
              <span style={{ width: 42, fontWeight: 800, fontSize: 13, color: hot ? 'var(--stage-good)' : 'var(--stage-muted)' }}>{LABELS[b] ?? `b${b}`}</span>
              <WheelRow value={value} base={b} width={widthFor(b)} ariaPrefix={`base ${b} `} />
              <span style={{ marginLeft: 'auto', fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: 'var(--stage-fg)' }}>
                {toDigits(value, b, widthFor(b)).map(digitChar).join('')}<sub>{b}</sub>
              </span>
            </div>
          );
        })}
      </div>
      <LiveRegion>
        {`value ${value}`}
      </LiveRegion>
    </>
  );

  const controls = (
    <ControlBar>
      <Field label="count" value={`= ${value}`}>
        <span style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
          <button type="button" className="lang-speak" onClick={() => bump(-1)} aria-label="minus one" style={{ fontWeight: 800, minWidth: 44 }}>−1</button>
          <button type="button" className="lang-speak" onClick={() => bump(1)} aria-label="plus one" style={{ fontWeight: 800, minWidth: 44 }}>+1</button>
          <Chip selected={racing} onClick={() => setRacing((r) => !r)}>{racing ? '⏸ pause' : '▶ race'}</Chip>
        </span>
      </Field>
    </ControlBar>
  );

  const footer = target != null ? (
    <StatusPill ok={solved}>{solved ? `✓ Reached ${target}` : `Count to ${target}`}</StatusPill>
  ) : undefined;

  return <LabFrame title={title} prompt={prompt} objectives={objectives} controls={controls} footer={footer}>{figure}</LabFrame>;
}
