'use client';

/**
 * PlaceValueDial, count in any base and watch the carry ripple.
 *
 * A row of odometer wheels in base-N. +1 ticks the ones wheel; when it passes
 * N−1 it snaps to 0 and KICKS the next wheel up, the carry ripples left while
 * the power-of-N place values light up and sum to the live value. Re-base the
 * SAME count with the base chips to see "10 in any base means you ticked over
 * the base exactly once". In base-2 the wheels become ON/OFF cells, the
 * "lightbulbs worth 1-2-4-8-16" picture. (Anti-pattern guard: weights stay on
 * screen, the carry is shown not hidden, and it works in both directions.)
 */

import { useState, type ReactNode } from 'react';
import { Chip, StatusPill } from '../../kit/controls.js';
import { LabFrame, ControlBar, Field, LiveRegion } from '../../kit/frame.js';
import { useCheckpoint } from '../../kit/pedagogy.js';
import { WheelRow, digitChar, toDigits, maxValue } from './wheel.js';
import { Tex } from '../../core/tex.js';

export interface PlaceValueDialProps {
  base?: number;
  width?: number;
  start?: number;
  /** Pose "spin the dials to N", reports via the learner seam when matched. */
  target?: number;
  /** Base chips the learner can switch between (re-bases the same value). */
  bases?: number[];
  showWeights?: boolean;
  title?: string;
  prompt?: string;
  objectives?: string[];
}

const ROLL_DUR = 0.32; // seconds for a wheel to settle after a change

export function PlaceValueDialLab({
  base: base0 = 2, width = 4, start = 0, target, bases = [2, 8, 10, 16],
  showWeights = true,
  title = 'Place-value dial', prompt = 'Press +1 and watch the carry ripple left.',
  objectives,
}: PlaceValueDialProps): ReactNode {
  const [base, setBase] = useState(base0);
  const [value, setValue] = useState(Math.max(0, Math.floor(start)));
  const cap = maxValue(base, width);
  const v = Math.min(value, cap);

  const digits = toDigits(v, base, width);

  const solved = target != null && v === target;
  useCheckpoint({ solved, activity: 'place-value-dial' });

  const bump = (delta: number): void => setValue((x) => Math.max(0, Math.min(cap, x + delta)));
  const cycleDigit = (i: number): void => {
    // tap a wheel → cycle that one place 0→…→N−1→0, keeping the others
    const place = width - 1 - i;
    const weight = Math.pow(base, place);
    const cur = digits[i] ?? 0;
    const next = (cur + 1) % base;
    setValue((x) => Math.max(0, Math.min(cap, x + (next - cur) * weight)));
  };

  const cells = base === 2;
  const terms = digits.map((d, i) => ({ d, place: width - 1 - i, weight: Math.pow(base, width - 1 - i) })).filter((t) => t.d !== 0);
  const sumTex = terms.length
    ? terms.map((t) => `${digitChar(t.d)} \\cdot ${t.weight}`).join(' + ') + ` = ${v}`
    : `0 = ${v}`;

  const figure = (
    <>
      <div style={{ borderRadius: 14, background: 'var(--stage-bg)', border: '1px solid var(--stage-grid)', padding: '18px 14px' }}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <WheelRow value={v} base={base} width={width} cells={cells} showWeights={showWeights} onTapDigit={cycleDigit} />
        </div>
        {/* running sum */}
        {showWeights && (
          <p style={{ textAlign: 'center', marginTop: 14, fontSize: 14, fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: 'var(--stage-fg)' }}><Tex tex={sumTex} /></p>
        )}
      </div>
      <LiveRegion>
        {`${v} in base ${base} is ${digits.map(digitChar).join('')}`}
      </LiveRegion>
    </>
  );

  const controls = (
    <ControlBar>
      <Field label="count" value={<span style={{ fontVariantNumeric: 'tabular-nums' }}>{v} = {digits.map(digitChar).join('')}<sub>{base}</sub></span>}>
        <span style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button type="button" className="lang-speak" onClick={() => bump(-1)} aria-label="minus one" style={{ fontWeight: 800, minWidth: 44 }}>−1</button>
          <button type="button" className="lang-speak" onClick={() => bump(1)} aria-label="plus one" style={{ fontWeight: 800, minWidth: 44 }}>+1</button>
        </span>
      </Field>
      <Field label="base">
        <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
          {bases.map((b) => <Chip key={b} selected={b === base} onClick={() => setBase(b)}>{b}</Chip>)}
        </span>
      </Field>
    </ControlBar>
  );

  const footer = target != null ? (
    <StatusPill ok={solved}>{solved ? `✓ Reached ${target}` : `Spin the dials to ${target}`}</StatusPill>
  ) : undefined;

  return <LabFrame title={title} prompt={prompt} objectives={objectives} controls={controls} footer={footer}>{figure}</LabFrame>;
}
