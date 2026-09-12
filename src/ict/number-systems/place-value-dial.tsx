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
import { Minus, Plus } from 'lucide-react';
import { Activity } from '../../kit/activity.js';
import { IconButton, Segmented } from '../../kit/controls.js';
import { Field } from '../../kit/frame.js';
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

export function PlaceValueDialLab({
  base: base0 = 2,
  width = 4,
  start = 0,
  target,
  bases = [2, 8, 10, 16],
  showWeights = true,
  title = 'Place-value dial',
  prompt = 'Press +1 and watch the carry ripple left.',
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
  const terms = digits
    .map((d, i) => ({
      d,
      place: width - 1 - i,
      weight: Math.pow(base, width - 1 - i),
    }))
    .filter((t) => t.d !== 0);
  const sumTex = terms.length
    ? terms.map((t) => `${digitChar(t.d)} \\cdot ${t.weight}`).join(' + ') + ` = ${v}`
    : `0 = ${v}`;

  const figure = (
    <>
      <div className="ict-number-scene">
        <div className="ict-wheel-centered">
          <WheelRow
            value={v}
            base={base}
            width={width}
            cells={cells}
            showWeights={showWeights}
            onTapDigit={cycleDigit}
          />
        </div>
        {/* running sum */}
        {showWeights && (
          <p className="ict-number-equation">
            <Tex tex={sumTex} />
          </p>
        )}
      </div>
      <Activity.LiveRegion>{`${v} in base ${base} is ${digits.map(digitChar).join('')}`}</Activity.LiveRegion>
    </>
  );

  const controls = (
    <div className="lab-activity-inspector-section">
      <Field label="base">
        <Segmented
          ariaLabel="base"
          value={String(base)}
          onChange={(v) => setBase(Number(v))}
          options={bases.map((b) => ({ value: String(b), label: b }))}
        />
      </Field>
    </div>
  );

  const representation = (
    <>
      <span>
        {digits.map(digitChar).join('')}
        <sub>{base}</sub>
      </span>
      <span>decimal {v}</span>
    </>
  );

  return (
    <Activity.Root className="ict-number-activity">
      <Activity.Header>
        <Activity.Heading eyebrow="Number systems" title={title} description={prompt} />
        <Activity.FocusButton />
      </Activity.Header>
      <Activity.Status>
        <strong>Place value</strong>
        {representation}
      </Activity.Status>
      <Activity.Workspace>
        <Activity.Canvas label="Interactive place-value dial">{figure}</Activity.Canvas>
        <Activity.Inspector label="Base and representation">{controls}</Activity.Inspector>
      </Activity.Workspace>
      {target != null && (
        <Activity.Feedback>
          <span>{solved ? 'Complete' : 'Goal'}</span>
          <p>{solved ? `Reached ${target}.` : `Spin the dials to ${target}.`}</p>
        </Activity.Feedback>
      )}
      <Activity.Transport>
        <IconButton label="Decrease count" onClick={() => bump(-1)} disabled={v <= 0}>
          <Minus aria-hidden="true" />
        </IconButton>
        <div className="ict-transport-state" aria-live="polite">
          <strong>{v}</strong>
          <span>
            {digits.map(digitChar).join('')}
            <sub>{base}</sub>
          </span>
        </div>
        <IconButton label="Increase count" onClick={() => bump(1)} disabled={v >= cap}>
          <Plus aria-hidden="true" />
        </IconButton>
      </Activity.Transport>
    </Activity.Root>
  );
}
