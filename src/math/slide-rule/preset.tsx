'use client';

/**
 * The slide rule: why a logarithm turns multiplication into addition.
 *
 * A static derivation can show that log(ab) = log a + log b. It cannot show the
 * ADDITION happening, which is the step a learner actually needs. Here the two
 * lengths are physical: slide the top scale so its 1 sits over 2, look under its
 * 3, and 6 is waiting, because the length for 2 and the length for 3 were laid
 * end to end. The learner predicts the landing point BEFORE sliding, so the
 * "surely it is 5" instinct gets tested rather than skipped.
 */

import { useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react';
import { Activity } from '../../kit/activity.js';
import { Slider } from '../../kit/controls.js';
import { Field, LiveRegion, Readout } from '../../kit/frame.js';
import { ChallengeCard, useChallenge, useCheckpoint, type ChallengeQuestion } from '../../kit/pedagogy.js';
import { FigText, Figure, HUE, STROKE } from '../../kit/figure/index.js';
import {
  alignFor,
  clampValue,
  isAligned,
  logOffset,
  majorTicks,
  minorTicks,
  productOf,
  readingAt,
  snapOffset,
} from './core.js';

export interface SlideRuleProps {
  /** The value the sliding scale's 1 should be set over. */
  a?: number;
  /** The value read on the sliding scale once it is set. */
  b?: number;
  /** Start with the rule already lined up, for a lesson that only wants the picture. */
  aligned?: boolean;
  title?: string;
  prompt?: string;
  activity?: string;
}

// Figure geometry. The viewBox is deliberately narrow and short: scale numerals
// must clear the 12 px on-screen floor in a phone-width column (a 720-wide
// viewBox shrinks a 16-unit numeral to under 9 px there), and the drawing has to
// fill its frame rather than float in a dead band.
const W = 440;
const H = 206;
const X0 = 35;
const SPAN = 260;

const C_TOP = 24;
const C_BOT = 68;
const D_TOP = 74;
const D_BOT = 118;
const BAR_Y = 168;

/** Numbered ticks. 7 and 9 stay unnumbered: at this width their numerals would
 *  touch their neighbours, which is exactly what a pocket slide rule does too. */
const NUMBERED = [1, 2, 3, 4, 5, 6, 8, 10];

const fmt = (v: number): string =>
  Math.abs(v - Math.round(v)) < 0.05 ? String(Math.round(v)) : v.toFixed(2);

export function SlideRuleLab({
  a: aProp = 2,
  b: bProp = 3,
  aligned: startAligned = false,
  title,
  prompt,
  activity = 'slide-rule',
}: SlideRuleProps): ReactNode {
  const a = clampValue(aProp);
  const b = clampValue(bProp);
  const [slide, setSlide] = useState(() => (startAligned ? alignFor(a, SPAN) : 0));
  const drag = useRef<number | null>(null);

  const lined = isAligned(slide, a, SPAN);
  const reading = readingAt(slide, b, SPAN);
  const { product, offScale, mantissa } = productOf(a, b);

  // The two wrong answers are the two real misconceptions: adding the values
  // instead of the lengths, and repeating one length instead of laying down two.
  const wrongs = [
    {
      value: 'sum',
      n: a + b,
      feedback: `That is ${fmt(a)} + ${fmt(b)}. The two LENGTHS add, but each length stands for a logarithm, so the values they mark multiply.`,
    },
    {
      value: 'power',
      n: a ** b,
      feedback: `That is ${fmt(a)} multiplied by itself ${fmt(b)} times. The rule lays two different lengths end to end, it does not repeat one of them.`,
    },
    {
      value: 'near',
      n: product + 1,
      feedback: 'The rule is exact. The answer sits wherever the second length ends, not near it.',
    },
  ].filter((c) => Math.abs(c.n - product) > 0.001);

  const questions: ChallengeQuestion[] = [
    {
      id: 'landing',
      prompt: `Set the sliding scale's 1 over ${fmt(a)}, then look under its ${fmt(b)}. What will be underneath?`,
      choices: [
        { value: wrongs[0]!.value, label: fmt(wrongs[0]!.n), feedback: wrongs[0]!.feedback },
        { value: 'product', label: fmt(product) },
        { value: wrongs[1]!.value, label: fmt(wrongs[1]!.n), feedback: wrongs[1]!.feedback },
      ],
      answer: 'product',
      explain: `${fmt(product)}. The length for ${fmt(a)} plus the length for ${fmt(b)} is the length for ${fmt(product)}, because log ${fmt(a)} + log ${fmt(b)} = log ${fmt(product)}.`,
    },
  ];
  const challenge = useChallenge(questions);

  useCheckpoint({ solved: challenge.allCorrect && lined, activity, response: challenge.picks.landing });

  // ── sliding ────────────────────────────────────────────────────────────────
  const clampSlide = (v: number): number => Math.min(SPAN, Math.max(0, v));

  const onDown = (event: PointerEvent<HTMLDivElement>): void => {
    drag.current = event.clientX;
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const onMove = (event: PointerEvent<HTMLDivElement>): void => {
    if (drag.current === null) return;
    const box = event.currentTarget.getBoundingClientRect();
    // Convert screen travel into viewBox units, so the drag tracks the pointer at
    // any rendered width.
    const dx = ((event.clientX - drag.current) * W) / (box.width || W);
    drag.current = event.clientX;
    setSlide((v) => clampSlide(v + dx));
  };
  const onUp = (): void => {
    if (drag.current === null) return;
    drag.current = null;
    setSlide((v) => clampSlide(snapOffset(v, SPAN)));
  };

  const onKey = (event: KeyboardEvent<SVGRectElement>): void => {
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    setSlide((v) => clampSlide(v + step * 6));
  };

  // ── scale furniture, drawn in layers so numerals sit above the cursor ───────
  const ticks = (shift: number, pointsDown: boolean, key: string): ReactNode[] => {
    const edge = pointsDown ? C_BOT : D_TOP;
    const dir = pointsDown ? -1 : 1;
    const out: ReactNode[] = [];
    for (const v of minorTicks()) {
      const x = X0 + shift + logOffset(v, SPAN);
      out.push(
        <line
          key={`${key}-m-${v}`}
          x1={x}
          y1={edge}
          x2={x}
          y2={edge + dir * 5}
          stroke={HUE.soft}
          strokeWidth={STROKE.hair}
        />,
      );
    }
    for (const v of majorTicks()) {
      const x = X0 + shift + logOffset(v, SPAN);
      out.push(
        <line
          key={`${key}-t-${v}`}
          x1={x}
          y1={edge}
          x2={x}
          y2={edge + dir * 11}
          stroke={HUE.ink}
          strokeWidth={STROKE.line}
        />,
      );
    }
    return out;
  };

  const numerals = (shift: number, y: number, key: string): ReactNode[] =>
    NUMBERED.map((v) => (
      <FigText
        key={`${key}-n-${v}`}
        x={X0 + shift + logOffset(v, SPAN)}
        y={y}
        anchor="middle"
        baseline="middle"
        tone={v === 1 || v === b || v === a ? 'ink' : 'soft'}
        size="label"
        halo={false}
      >
        {v}
      </FigText>
    ));

  const readingX = X0 + slide + logOffset(b, SPAN);
  const aX = X0 + logOffset(a, SPAN);
  const endX = aX + logOffset(b, SPAN);

  const figure = (
    <Figure
      viewBox={[W, H]}
      domain="math"
      label={`A slide rule. The sliding scale is offset by ${Math.round(slide)} units, so its ${fmt(b)} stands over ${fmt(reading)} on the fixed scale.`}
    >
      {/* tracks the ruler it names, so the word does not drift away as it slides */}
      <FigText x={X0 + slide} y={14} anchor="start" tone="soft" size="label">
        slides
      </FigText>

      {/* bodies first, so the cursor can be drawn over them but under the numerals */}
      <rect
        x={X0 + slide - 16}
        y={C_TOP}
        width={SPAN + 32}
        height={C_BOT - C_TOP}
        rx={6}
        fill="var(--fig-surface-strong)"
        stroke={HUE[1]}
        strokeWidth={STROKE.line}
        role="slider"
        tabIndex={0}
        aria-label="Upper scale position"
        // The position itself is the value, so every arrow press is audible.
        // Reporting the rounded reading instead hid small moves entirely.
        aria-valuemin={0}
        aria-valuemax={SPAN}
        aria-valuenow={Math.round(slide)}
        aria-valuetext={`sliding 1 over ${fmt(readingAt(slide, 1, SPAN))}`}
        onKeyDown={onKey}
        className="math-slide-rule-body"
      />
      <rect
        x={X0 - 16}
        y={D_TOP}
        width={SPAN + 32}
        height={D_BOT - D_TOP}
        rx={6}
        fill="var(--fig-surface)"
        stroke={HUE.soft}
        strokeWidth={STROKE.line}
      />

      {/* the cursor, running down to the bar so the reading and the two lengths
          line up visibly at the same x once the rule is set */}
      <line
        x1={readingX}
        y1={C_TOP - 4}
        x2={readingX}
        y2={BAR_Y + 8}
        stroke={HUE.warn}
        strokeWidth={STROKE.line}
      />

      {ticks(slide, true, 'c')}
      {numerals(slide, 48, 'c')}
      {ticks(0, false, 'd')}
      {numerals(0, 104, 'd')}

      <FigText x={X0} y={136} anchor="start" tone="soft" size="label">
        fixed
      </FigText>

      {/* the addition, drawn as two lengths laid end to end */}
      <line
        x1={X0}
        y1={BAR_Y}
        x2={aX}
        y2={BAR_Y}
        stroke={HUE[1]}
        strokeWidth={STROKE.bold}
        strokeLinecap="round"
      />
      <line
        x1={aX}
        y1={BAR_Y}
        x2={endX}
        y2={BAR_Y}
        stroke={HUE[2]}
        strokeWidth={STROKE.bold}
        strokeLinecap="round"
      />
      <FigText x={(X0 + aX) / 2} y={BAR_Y - 14} anchor="middle" tone="hue-1" size="label">
        log {fmt(a)}
      </FigText>
      <FigText x={(aX + endX) / 2} y={BAR_Y - 14} anchor="middle" tone="hue-2" size="label">
        log {fmt(b)}
      </FigText>
      <FigText x={endX} y={BAR_Y + 22} anchor="middle" tone="ink" size="label">
        = log {fmt(product)}
      </FigText>
      <FigText x={X0} y={BAR_Y + 22} anchor="start" tone="soft" size="label">
        end to end
      </FigText>
    </Figure>
  );

  const narration = lined
    ? `The sliding 1 is over ${fmt(a)}, so its ${fmt(b)} stands over ${fmt(reading)}.`
    : `Slide the upper scale until its 1 sits over ${fmt(a)}.`;

  return (
    <Activity.Root className="math-slide-rule">
      <Activity.Header>
        <Activity.Heading
          eyebrow="Logarithms"
          title={title ?? 'Multiply by adding lengths'}
          description={
            prompt ??
            'A slide rule has no gears. Each number sits at a distance equal to its logarithm, so sliding one scale along the other adds two lengths and multiplies two values.'
          }
        />
        <Activity.FocusButton />
      </Activity.Header>

      <Activity.Status>
        <span>slide {Math.round(slide)} units</span>
        <span>sliding 1 over {fmt(readingAt(slide, 1, SPAN))}</span>
      </Activity.Status>

      <Activity.Workspace>
        <Activity.Canvas label="Slide rule">
          <div
            className="math-slide-rule-surface"
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
          >
            {figure}
          </div>
        </Activity.Canvas>
        <Activity.Dock>
          <Readout
            label="the rule reads"
            value={fmt(reading)}
            sub={lined ? `the sliding ${fmt(b)} sits over it` : 'line up the sliding 1 first'}
          />
          <Field label="slide" value={`${Math.round(slide)}`}>
            <Slider
              value={Math.round(slide)}
              min={0}
              max={SPAN}
              step={1}
              onChange={(v) => setSlide(v)}
              onCommit={(v) => setSlide(snapOffset(v, SPAN))}
              ariaLabel="slide the upper scale"
              valueText={`${Math.round(slide)} units`}
            />
          </Field>
        </Activity.Dock>
      </Activity.Workspace>

      <ChallengeCard questions={questions} state={challenge} />

      <Activity.Feedback>
        <span>What to notice</span>
        <div>
          {offScale
            ? `The answer ran past the end of the scale, so the rule shows ${fmt(mantissa)} and you supply the decade: ${fmt(product)}. That split is a logarithm's whole part and fractional part, which is why log tables print only the fraction.`
            : 'Neither scale moved its numbers. Only the distance between them changed, and distance on these scales is logarithm.'}
        </div>
      </Activity.Feedback>

      <LiveRegion>{narration}</LiveRegion>
    </Activity.Root>
  );
}
