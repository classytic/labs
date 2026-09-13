'use client';

/**
 * Cut and rearrange: the motion IS the proof.
 *
 * Every area formula in the mensuration chapter is a rearrangement, and a static
 * diagram can only show the before and the after. Here the learner drags the cut
 * open and watches a shape they already understand appear, with nothing added and
 * nothing thrown away. They commit to a prediction first, because "a triangle is
 * half its box" is believed far more readily after you have guessed wrong once.
 */

import { useState, type ReactNode } from 'react';
import { Activity } from '../../kit/activity.js';
import { ActivitySelect, Slider } from '../../kit/controls.js';
import { Field, LiveRegion, Readout } from '../../kit/frame.js';
import { ChallengeCard, useChallenge, useCheckpoint, type ChallengeQuestion } from '../../kit/pedagogy.js';
import { FigText, Figure, HUE, STROKE, tint } from '../../kit/figure/index.js';
import { DEFAULTS, areaOf, rearrange, type Pt, type RearrangeMode, type RearrangeOpts } from './core.js';

export interface AreaRearrangeProps {
  mode?: RearrangeMode;
  base?: number;
  height?: number;
  lean?: number;
  top?: number;
  sectors?: number;
  title?: string;
  prompt?: string;
  activity?: string;
}

const W = 460;
const H = 250;
// Tight, because the figure is the hero: a generous pad left a third of the frame
// empty and shrank the shape for no reason. 16 units still clears the caption.
const PAD = 16;
const CAPTION = 16;

const MODES: { value: RearrangeMode; label: string }[] = [
  { value: 'triangle', label: 'Triangle' },
  { value: 'parallelogram', label: 'Parallelogram' },
  { value: 'trapezium', label: 'Trapezium' },
  { value: 'circle', label: 'Circle' },
];

const BECOMES: Record<RearrangeMode, string> = {
  triangle: 'half the rectangle',
  parallelogram: 'a rectangle',
  trapezium: 'a parallelogram',
  circle: 'a rectangle',
};

const QUESTION: Record<
  RearrangeMode,
  { prompt: string; right: string; wrong: [string, string]; why: string }
> = {
  triangle: {
    prompt: 'A triangle sits inside the smallest rectangle that holds it. How much of the rectangle is it?',
    right: 'Exactly half',
    wrong: ['It depends where the apex is', 'A third'],
    why: 'Exactly half, wherever the apex sits. The two leftover corners turn a half circle and fill the triangle.',
  },
  parallelogram: {
    prompt: 'A parallelogram leans further over, but its base and height do not change. Its area:',
    right: 'Stays the same',
    wrong: ['Gets smaller as it leans', 'Gets larger as it leans'],
    why: 'Unchanged. Leaning only moves the same triangle from one end to the other, so base times height still holds.',
  },
  trapezium: {
    prompt: 'Two identical trapezia are fitted together. What shape do they make?',
    right: 'A parallelogram',
    wrong: ['A rectangle', 'A larger trapezium'],
    why: 'A parallelogram of base a + b and height h, so one trapezium is half of that.',
  },
  circle: {
    prompt: 'A circle is cut into many sectors and laid in a row. The row is closest to:',
    right: 'A rectangle, height r and width πr',
    wrong: ['A rectangle, height r and width 2πr', 'A triangle of height r'],
    why: 'Height r because every sector keeps its radius, and width πr because half the arcs lie along each side.',
  },
};

/** Fit every piece, at the start AND the end of the motion, inside the drawing
 *  area. Fitting only the starting shape let a rearranged piece run off frame. */
function fitAll(mode: RearrangeMode, o: RearrangeOpts): { s: number; dx: number; dy: number } {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const t of [0, 0.25, 0.5, 0.75, 1]) {
    for (const piece of rearrange(mode, t, o)) {
      for (const [x, y] of piece.points) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  const w = Math.max(0.001, maxX - minX);
  const h = Math.max(0.001, maxY - minY);
  const s = Math.min((W - PAD * 2) / w, (H - PAD * 2 - CAPTION) / h);
  return {
    s,
    dx: PAD + (W - PAD * 2 - w * s) / 2 - minX * s,
    dy: PAD + (H - PAD * 2 - CAPTION - h * s) / 2 - minY * s,
  };
}

const path = (pts: Pt[], s: number, dx: number, dy: number): string =>
  pts.map(([x, y], i) => `${i ? 'L' : 'M'}${(x * s + dx).toFixed(2)} ${(y * s + dy).toFixed(2)}`).join(' ') +
  ' Z';

export function AreaRearrangeLab({
  mode: modeProp = 'triangle',
  base = DEFAULTS.base,
  height = DEFAULTS.height,
  lean = DEFAULTS.lean,
  top = DEFAULTS.top,
  sectors = DEFAULTS.sectors,
  title,
  prompt,
  activity = 'area-rearrange',
}: AreaRearrangeProps): ReactNode {
  const [mode, setMode] = useState<RearrangeMode>(modeProp);
  const [t, setT] = useState(0);
  const opts: RearrangeOpts = { base, height, lean, top, sectors };

  const q = QUESTION[mode];
  const questions: ChallengeQuestion[] = [
    {
      id: `predict-${mode}`,
      prompt: q.prompt,
      choices: [
        { value: 'a', label: q.wrong[0] },
        { value: 'right', label: q.right },
        { value: 'b', label: q.wrong[1] },
      ],
      answer: 'right',
      explain: q.why,
    },
  ];
  const challenge = useChallenge(questions);
  useCheckpoint({
    solved: challenge.allCorrect && t > 0.98,
    activity: `${activity}-${mode}`,
    attemptKey: mode,
  });

  const { s, dx, dy } = fitAll(mode, opts);
  const pieces = rearrange(mode, t, opts);
  const { value, formula } = areaOf(mode, opts);

  const figure = (
    <Figure
      viewBox={[W, H]}
      domain="math"
      label={`${mode} rearrangement, ${Math.round(t * 100)} per cent of the way to ${BECOMES[mode]}.`}
    >
      {pieces.map((piece, i) => (
        <path
          key={i}
          d={path(piece.points, s, dx, dy)}
          // tint mixes toward paper, so a receding fill stays right in BOTH themes.
          // alpha takes a PERCENTAGE here, and 0.45 meant 0.45% colour: invisible.
          fill={piece.tone === 'moved' ? tint(HUE[1], 28) : tint(HUE[1], 14)}
          stroke={HUE[1]}
          strokeWidth={piece.tone === 'moved' ? STROKE.line : STROKE.hair}
          strokeLinejoin="round"
        />
      ))}
      <FigText x={W / 2} y={H - 10} anchor="middle" tone="soft" size="label">
        {t < 0.02 ? 'drag the slider to cut and move the pieces' : `nothing added, nothing removed`}
      </FigText>
    </Figure>
  );

  return (
    <Activity.Root className="math-area-rearrange">
      <Activity.Header>
        <Activity.Heading
          eyebrow="Area"
          title={title ?? 'Cut it up and move the pieces'}
          description={
            prompt ??
            'Every area formula here is a rearrangement. Move the pieces and a shape you already know appears, with nothing added and nothing thrown away.'
          }
        />
        <Activity.FocusButton />
      </Activity.Header>

      <Activity.Status>
        <span>{Math.round(t * 100)}% rearranged</span>
        <span>becomes {BECOMES[mode]}</span>
      </Activity.Status>

      <Activity.Workspace>
        <Activity.Canvas label="Rearrangement">{figure}</Activity.Canvas>
        <Activity.Dock>
          <Readout label="area" value={value.toFixed(1)} sub={formula} />
          <Field label="shape">
            <ActivitySelect<RearrangeMode>
              value={mode}
              options={MODES}
              onChange={(v) => {
                setMode(v);
                setT(0);
              }}
              ariaLabel="choose the shape"
            />
          </Field>
          <Field label="move" value={`${Math.round(t * 100)}%`}>
            <Slider
              value={Math.round(t * 100)}
              min={0}
              max={100}
              step={1}
              onChange={(v) => setT(v / 100)}
              ariaLabel="rearrange the pieces"
              valueText={`${Math.round(t * 100)} per cent`}
            />
          </Field>
        </Activity.Dock>
      </Activity.Workspace>

      <ChallengeCard questions={questions} state={challenge} />

      <Activity.Feedback>
        <span>What to notice</span>
        <div>
          Every piece keeps its size and shape the whole way across. Only their positions change, so the area
          cannot change either, and that is the whole argument behind the formula.
        </div>
      </Activity.Feedback>

      <LiveRegion>
        {mode} rearrangement, {Math.round(t * 100)} per cent of the way to {BECOMES[mode]}.
      </LiveRegion>
    </Activity.Root>
  );
}
