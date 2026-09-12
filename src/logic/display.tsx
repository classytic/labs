'use client';

/**
 * BinaryDisplayLab — the "number LED" for digital-logic / DLD projects. A row of weighted
 * bit switches (8 4 2 1 …) drives a seven-segment display: flip bits and watch the digit
 * form, with live binary / decimal / hex readouts. A decoder sits between the bits and the
 * segments (bits → number → lit segments), so this is the payoff block where learners build
 * a number out of ones and zeros. Optional `target` turns it into a "make this digit" goal.
 */

import { useState, type CSSProperties, type ReactNode } from 'react';
import { Activity } from '../kit/activity.js';
import { useCheckpoint } from '../kit/pedagogy.js';
import { ToggleSwitch, SevenSegment } from '../kit/logic-gates/display.js';

export interface BinaryDisplayProps {
  /** number of bits (2–4 → one hex digit). */
  bits?: number;
  /** starting value. */
  start?: number;
  /** a goal digit the learner must build; met → checkpoint. */
  target?: number;
  title?: string;
  prompt?: string;
  activity?: string;
}

const FG = 'var(--stage-fg)';
const MUT = 'var(--stage-muted)';

export function BinaryDisplayLab({
  bits = 4,
  start = 0,
  target,
  title = 'Build a number from bits',
  prompt,
  activity = 'binary-display',
}: BinaryDisplayProps = {}): ReactNode {
  const n = Math.max(1, Math.min(4, bits));
  const max = (1 << n) - 1;
  const [value, setValue] = useState(() => Math.max(0, Math.min(max, start)));

  const solved = target !== undefined && value === ((target % (max + 1)) + (max + 1)) % (max + 1);
  useCheckpoint({ solved, activity });

  const toggleBit = (i: number): void => setValue((v) => v ^ (1 << i));

  // bit i (LSB = 0) has weight 2^i; lay out MSB first (left → right).
  const SW_W = 50,
    SW_H = 26,
    COL = 66,
    X0 = 40,
    ROWY = 150;
  const width = X0 * 2 + (n - 1) * COL + SW_W;
  const dispX = width / 2 - 23;

  const bitGlyphs: ReactNode[] = [];
  for (let k = 0; k < n; k++) {
    const i = n - 1 - k; // MSB first
    const on = ((value >> i) & 1) === 1;
    const x = X0 + k * COL;
    bitGlyphs.push(
      <g
        className="logic-display-bit"
        key={i}
        onClick={() => toggleBit(i)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleBit(i);
          }
        }}
        aria-label={`bit value ${1 << i}, ${on ? 'on' : 'off'}`}
      >
        <text x={x + SW_W / 2} y={ROWY - 14} fill={MUT} fontSize={11} fontWeight={700} textAnchor="middle">
          {1 << i}
        </text>
        <ToggleSwitch x={x} y={ROWY} w={SW_W} h={SW_H} on={on} />
        <text
          x={x + SW_W / 2}
          y={ROWY + SW_H + 16}
          fill={on ? 'var(--stage-live)' : MUT}
          fontSize={14}
          fontWeight={800}
          textAnchor="middle"
        >
          {on ? 1 : 0}
        </text>
      </g>,
    );
  }

  const binStr = value.toString(2).padStart(n, '0');
  const hexStr = value.toString(16).toUpperCase();

  const description =
    prompt ??
    (target !== undefined
      ? `Flip the switches so the display reads ${target.toString(16).toUpperCase()}.`
      : 'Each switch is one bit, worth the number above it. Flip them and the decoder lights the matching digit.');
  return (
    <Activity.Root className="logic-binary-display-activity">
      <Activity.Header>
        <Activity.Heading eyebrow="Digital representation" title={title} description={description} />
        <Activity.FocusButton />
      </Activity.Header>
      <Activity.Status>
        <strong>{binStr}₂</strong>
        <span>{value}₁₀</span>
        <span>{hexStr}₁₆</span>
      </Activity.Status>
      <Activity.Workspace>
        <Activity.Canvas label="Binary switches and seven-segment display">
          <svg
            className="logic-display"
            viewBox={`0 0 ${width} 240`}
            width="100%"
            style={{ '--logic-display-width': `${width}px` } as CSSProperties}
            role="img"
            aria-label={`seven-segment display showing ${hexStr}, binary ${binStr}`}
          >
            <SevenSegment x={dispX} y={26} w={46} h={80} value={value} />
            {bitGlyphs}
            <text
              className="logic-display-readout"
              x={width / 2}
              y={224}
              fill={FG}
              fontSize={13}
              fontWeight={700}
              textAnchor="middle"
            >
              {`binary ${binStr}  =  decimal ${value}  =  hex ${hexStr}`}
            </text>
            {solved && (
              <text
                x={width / 2}
                y={18}
                fill="var(--stage-good)"
                fontSize={13}
                fontWeight={800}
                textAnchor="middle"
              >
                ✓ that is {hexStr}
              </text>
            )}
          </svg>
        </Activity.Canvas>
      </Activity.Workspace>
      <Activity.Feedback>
        <span>Observe</span>
        <div>
          Each enabled bit contributes its place value; the decoder maps their sum to the matching
          seven-segment glyph.
        </div>
      </Activity.Feedback>
      <Activity.LiveRegion>
        Binary {binStr}; decimal {value}; hexadecimal {hexStr}.{solved ? ' Target reached.' : ''}
      </Activity.LiveRegion>
      <Activity.Transport>
        <div className="lab-transport-state">
          <strong>
            {solved
              ? 'Target reached'
              : target !== undefined
                ? `Build ${target.toString(16).toUpperCase()}`
                : 'Flip a bit'}
          </strong>
          <span>{n}-bit value</span>
        </div>
      </Activity.Transport>
    </Activity.Root>
  );
}
