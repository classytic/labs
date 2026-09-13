'use client';

/**
 * Solids seen flat, because the faces that matter are the hidden ones.
 *
 * A cuboid drawn in perspective hides three of its six faces, which are exactly
 * the ones a learner forgets when adding up a surface area. Every view here is a
 * flat elevation or an opened-out net, so nothing is behind anything else and the
 * count is something you do rather than something you trust.
 */

import { useState, type ReactNode } from 'react';
import { Activity } from '../../kit/activity.js';
import { ActivitySelect, Slider } from '../../kit/controls.js';
import { Field, LiveRegion, Readout } from '../../kit/frame.js';
import { ChallengeCard, useChallenge, useCheckpoint, type ChallengeQuestion } from '../../kit/pedagogy.js';
import { FigText, Figure, HUE, STROKE, tint } from '../../kit/figure/index.js';
import { DEFAULTS, readout, solidPieces, type Dims, type SolidMode } from './core.js';

export interface SolidNetProps {
  mode?: SolidMode;
  length?: number;
  width?: number;
  height?: number;
  topHeight?: number;
  radius?: number;
  title?: string;
  prompt?: string;
  activity?: string;
}

const W = 460;
const H = 250;
const PAD = 18;
const CAPTION = 16;

const MODES: { value: SolidMode; label: string }[] = [
  { value: 'layers', label: 'Layers' },
  { value: 'net', label: 'Net' },
  { value: 'sphere', label: 'Sphere' },
  { value: 'compound', label: 'Joined' },
];

const CAPTIONS: Record<SolidMode, string> = {
  layers: 'one layer, stacked',
  net: 'opened out, every face visible',
  sphere: 'one radius decides both',
  compound: 'the join is counted twice, then removed',
};

const QUESTIONS: Record<SolidMode, ChallengeQuestion> = {
  layers: {
    id: 'layers',
    prompt: 'Why is a volume measured in cubic centimetres rather than square ones?',
    choices: [
      { value: 'a', label: 'Because the shape is a cube' },
      { value: 'right', label: 'Because three lengths were multiplied' },
      { value: 'b', label: 'Because it is larger than an area' },
    ],
    answer: 'right',
    explain: 'Three lengths multiply, so the unit is multiplied three times too. The shape need not be a cube.',
  },
  net: {
    id: 'net',
    prompt: 'A cuboid is opened into its net. How many DIFFERENT rectangles must you work out?',
    choices: [
      { value: 'a', label: 'Six, one per face' },
      { value: 'right', label: 'Three, because opposite faces match' },
      { value: 'b', label: 'One, and multiply by six' },
    ],
    answer: 'right',
    explain: 'Opposite faces are always equal, so three areas doubled gives all six.',
  },
  sphere: {
    id: 'sphere',
    prompt: 'A sphere’s radius doubles. Its SURFACE area becomes:',
    choices: [
      { value: 'a', label: 'Twice as big' },
      { value: 'right', label: 'Four times as big' },
      { value: 'b', label: 'Eight times as big' },
    ],
    answer: 'right',
    explain: 'Surface goes with r squared, so doubling r multiplies it by four. The volume, with r cubed, goes up eight times.',
  },
  compound: {
    id: 'compound',
    prompt: 'Two blocks are glued together. Compared with the two separate blocks, the total SURFACE area is:',
    choices: [
      { value: 'a', label: 'The same' },
      { value: 'right', label: 'Smaller, by two joined faces' },
      { value: 'b', label: 'Larger, because the shape is bigger' },
    ],
    answer: 'right',
    explain: 'Both faces at the join are still there, but neither is on the outside now, so each is removed. The volume simply adds.',
  },
};

export function SolidNetLab({
  mode: modeProp = 'layers',
  length = DEFAULTS.length,
  width = DEFAULTS.width,
  height = DEFAULTS.height,
  topHeight = DEFAULTS.topHeight,
  radius = DEFAULTS.radius,
  title,
  prompt,
  activity = 'solid-net',
}: SolidNetProps): ReactNode {
  const [mode, setMode] = useState<SolidMode>(modeProp);
  const [h, setH] = useState(height);
  const dims: Dims = { length, width, height: h, topHeight, radius };

  const questions = [QUESTIONS[mode]];
  const challenge = useChallenge(questions);
  useCheckpoint({ solved: challenge.allCorrect, activity: `${activity}-${mode}`, attemptKey: mode });

  const pieces = solidPieces(mode, dims);
  const { volume, surface, note } = readout(mode, dims);

  // Fit whatever this mode draws, so no mode is cropped and none floats small.
  const extent = pieces.length
    ? pieces.reduce(
        (acc, b) => ({
          maxX: Math.max(acc.maxX, b.x + b.w),
          maxY: Math.max(acc.maxY, b.y + b.h),
        }),
        { maxX: 0, maxY: 0 },
      )
    : { maxX: radius * 2, maxY: radius * 2 };
  const s = Math.min((W - PAD * 2) / extent.maxX, (H - PAD * 2 - CAPTION) / extent.maxY);
  const ox = PAD + (W - PAD * 2 - extent.maxX * s) / 2;
  const oy = PAD + (H - PAD * 2 - CAPTION - extent.maxY * s) / 2;

  const figure = (
    <Figure viewBox={[W, H]} domain="math" label={`${mode}: ${note}. Volume ${volume.toFixed(1)}.`}>
      {mode === 'sphere' ? (
        <g>
          <circle
            cx={W / 2}
            cy={(H - CAPTION) / 2}
            r={radius * s}
            fill={tint(HUE[1], 18)}
            stroke={HUE[1]}
            strokeWidth={STROKE.edge}
          />
          <line
            x1={W / 2}
            y1={(H - CAPTION) / 2}
            x2={W / 2 + radius * s}
            y2={(H - CAPTION) / 2}
            stroke={HUE[2]}
            strokeWidth={STROKE.line}
          />
          <FigText x={W / 2 + (radius * s) / 2} y={(H - CAPTION) / 2 - 8} anchor="middle" tone="hue-2" size="label">
            r
          </FigText>
        </g>
      ) : (
        pieces.map((b, i) => (
          <g key={i}>
            <rect
              x={ox + b.x * s}
              y={oy + b.y * s}
              width={b.w * s}
              height={b.h * s}
              fill={b.tone === 'lost' ? HUE.warn : tint(HUE[1], b.tone === 'face' ? 16 : 24)}
              stroke={b.tone === 'lost' ? HUE.warn : HUE[1]}
              strokeWidth={b.tone === 'body' ? STROKE.line : STROKE.hair}
            />
            {b.label && b.w * s > 34 && b.h * s > 16 ? (
              <FigText
                x={ox + (b.x + b.w / 2) * s}
                y={oy + (b.y + b.h / 2) * s}
                anchor="middle"
                baseline="middle"
                tone="soft"
                size="label"
              >
                {b.label}
              </FigText>
            ) : null}
          </g>
        ))
      )}
      <FigText x={W / 2} y={H - 6} anchor="middle" tone="soft" size="label">
        {CAPTIONS[mode]}
      </FigText>
    </Figure>
  );

  return (
    <Activity.Root className="math-solid-net">
      <Activity.Header>
        <Activity.Heading
          eyebrow="Solids"
          title={title ?? 'Seen flat, so nothing hides'}
          description={
            prompt ??
            'A box drawn in perspective hides three of its six faces, and those are the ones people forget. Every view here is flat, so each face can be counted.'
          }
        />
        <Activity.FocusButton />
      </Activity.Header>

      <Activity.Status>
        <span>{note}</span>
      </Activity.Status>

      <Activity.Workspace>
        <Activity.Canvas label="Solid">{figure}</Activity.Canvas>
        <Activity.Dock>
          <Readout label="volume" value={volume.toFixed(1)} sub={`surface ${surface.toFixed(1)}`} />
          <Field label="view">
            <ActivitySelect<SolidMode>
              value={mode}
              options={MODES}
              onChange={setMode}
              ariaLabel="choose the view"
            />
          </Field>
          {mode === 'layers' ? (
            <Field label="layers" value={String(Math.round(h))}>
              <Slider
                value={Math.round(h)}
                min={1}
                max={8}
                step={1}
                onChange={setH}
                ariaLabel="how many layers"
                valueText={`${Math.round(h)} layers`}
              />
            </Field>
          ) : null}
        </Activity.Dock>
      </Activity.Workspace>

      <ChallengeCard questions={questions} state={challenge} />

      <Activity.Feedback>
        <span>What to notice</span>
        <div>
          Nothing here is drawn in perspective, so no face is behind another. Every surface you must add is on
          the screen, and every length you multiply is one you can see.
        </div>
      </Activity.Feedback>

      <LiveRegion>
        {mode}: {note}. Volume {volume.toFixed(1)}, surface {surface.toFixed(1)}.
      </LiveRegion>
    </Activity.Root>
  );
}
