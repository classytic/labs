'use client';

/**
 * LensImagingLab — form an image with a thin lens by drawing the three principal
 * rays, on the shared optics kernel (`thinOptic`, 1/f = 1/u + 1/v). Slide the object
 * distance and focal length, flip converging ↔ diverging, and watch the image walk
 * from real-inverted-tiny (camera, object beyond 2F) through same-size (2F) and
 * magnified (projector, between F and 2F) to a virtual-upright-magnified image once
 * the object is inside F (a magnifying glass). Diverging lenses always give a small
 * virtual upright image.
 *
 * The three rays: (1) parallel in → through the far focus, (2) straight through the
 * centre, (3) through the near focus → parallel out. Where they cross is the image.
 * Authorable focal length / object distance / lens type, so a creator can pose any
 * "where and what is the image?" question.
 */

import { useState, type ReactNode } from 'react';
import type { AuthoredActivity } from '../../kit/activity-authoring.js';
import { thinOptic } from './core.js';
import { ActivitySelect, Slider } from '../../kit/controls.js';
import { Field } from '../../kit/frame.js';
import { ImagingActivity } from './imaging-activity.js';
import { useChallenge, ChallengeCard, useCheckpoint, type ChallengeQuestion } from '../../kit/pedagogy.js';
import { DiagramLabel } from '../../kit/annotate.js';

export type LensType = 'converging' | 'diverging';
export interface LensImagingProps {
  focalLength?: number; // magnitude, cm
  objectDistance?: number; // cm
  lens?: LensType;
  objectHeight?: number; // world units
  title?: string;
  prompt?: string;
  objectives?: string[];
  height?: number;
  activity?: string | AuthoredActivity;
}

const W = 580,
  HT = 380;
const WX = 36,
  WY = 12; // world half-extents
const AX = HT / 2;
const X = (x: number): number => W / 2 + (x / WX) * (W / 2 - 24);
const Y = (y: number): number => AX - (y / WY) * (AX - 22);
const OBJ = 'var(--stage-accent, #3b82f6)';
const IMG = 'var(--stage-good, #16a34a)';
const R1 = 'var(--stage-warn, #e0a020)';
const R2 = 'rgb(150,110,200)';
const R3 = 'rgb(20,160,170)';

const CHALLENGE: ChallengeQuestion[] = [
  {
    id: 'inside-f',
    prompt: 'An object inside the focal length of a convex lens gives…',
    choices: [
      { value: 'virtual', label: 'a virtual, upright, magnified image (a magnifying glass)' },
      { value: 'real', label: 'a real, inverted image' },
      { value: 'none', label: 'no image at all' },
    ],
    answer: 'virtual',
    explain:
      'Inside F the refracted rays diverge, so only their backward extensions meet: a virtual, upright, enlarged image on the same side — exactly how a magnifying glass works.',
  },
  {
    id: 'beyond-2f',
    prompt: 'An object beyond 2F of a convex lens forms an image that is…',
    choices: [
      { value: 'small', label: 'real, inverted and diminished' },
      { value: 'big', label: 'real, inverted and enlarged' },
      { value: 'same', label: 'exactly the same size' },
    ],
    answer: 'small',
    explain:
      'Beyond 2F the image lands between F and 2F on the far side: real, inverted, smaller — a camera. At 2F it’s the same size; between F and 2F it’s enlarged (a projector).',
  },
];

const arrow = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  dashed = false,
  wgt = 2,
): ReactNode => {
  const a = Math.atan2(y2 - y1, x2 - x1),
    s = 7;
  return (
    <g>
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={color}
        strokeWidth={wgt}
        strokeDasharray={dashed ? '5 4' : undefined}
      />
      <path
        d={`M${x2},${y2} L${x2 - s * Math.cos(a - 0.4)},${y2 - s * Math.sin(a - 0.4)} L${x2 - s * Math.cos(a + 0.4)},${y2 - s * Math.sin(a + 0.4)} Z`}
        fill={color}
      />
    </g>
  );
};

const f2 = (n: number): string => (Math.abs(n) === Infinity ? '∞' : n.toFixed(1));

export function LensImagingLab({
  focalLength = 8,
  objectDistance = 20,
  lens: lens0 = 'converging',
  objectHeight = 4.5,
  title = 'Lens imaging: the three rays & 1/f = 1/u + 1/v',
  prompt = 'Slide the object and the focal length; the three principal rays cross at the image. Move the object inside the focus to turn the real image into a magnifying-glass one.',
  objectives = [
    'Draw the three principal rays and find where the image forms',
    'Tell a real (inverted) image from a virtual (upright) one',
    'Use 1/f = 1/u + 1/v and magnification m = v/u',
  ],
  height = HT,
  activity,
}: LensImagingProps = {}): ReactNode {
  const [lens, setLens] = useState<LensType>(lens0);
  const [u, setU] = useState(objectDistance);
  const [fm, setFm] = useState(focalLength);
  const h = objectHeight;
  const ch = useChallenge(CHALLENGE);
  useCheckpoint({ solved: ch.allCorrect, activity: 'lens-imaging' });

  const f = lens === 'converging' ? fm : -fm;
  const img = thinOptic(f, u);
  const v = img.v;
  const imgY = (img.upright ? 1 : -1) * img.m * h;
  const offscreen = img.atInfinity || Math.abs(v) > WX * 1.4 || Math.abs(imgY) > WY * 1.25;

  // px anchors
  const cx = X(0),
    ax = Y(0);
  const objTip = { x: X(-u), y: Y(h) };
  const lp1 = { x: cx, y: Y(h) }; // parallel ray hits lens at object height
  const lp2 = { x: cx, y: ax }; // central ray through centre
  const lp3 = { x: cx, y: Y(imgY) }; // focal ray crosses at image height
  const xR = X(WX);
  // refracted rays extended to the right edge
  const r1end = { x: xR, y: Y(h - (h / f) * WX) }; // slope -h/f
  const r2end = { x: xR, y: Y(-(h / u) * WX) }; // slope -h/u (through origin)
  const r3end = { x: xR, y: Y(imgY) }; // horizontal
  const imgTip = { x: X(v), y: Y(imgY) };

  const figure = (
    <div className="physics-optics-scene physics-imaging-scene">
      <svg
        viewBox={`0 0 ${W} ${height}`}
        width="100%"
        role="img"
        aria-label={`Thin ${lens} lens, object at ${u}, focal length ${f}; ${img.atInfinity ? 'image at infinity' : `image at ${f2(v)}, ${img.real ? 'real inverted' : 'virtual upright'}, magnification ${img.m.toFixed(2)}`}`}
      >
        {/* principal axis */}
        <line x1={0} y1={ax} x2={W} y2={ax} stroke="var(--stage-fg)" strokeWidth={1.2} />
        {/* F and 2F markers */}
        {[
          [fm, 'F'],
          [2 * fm, '2F'],
        ].map(([d, lab]) => (
          <g key={String(lab)}>
            {[-1, 1].map((s) => (
              <g key={s}>
                <circle cx={X(s * (d as number))} cy={ax} r={2.6} fill="var(--stage-muted)" />
                <text
                  x={X(s * (d as number))}
                  y={ax + 15}
                  textAnchor="middle"
                  fontSize={9.5}
                  fill="var(--stage-muted)"
                >
                  {lab as string}
                </text>
              </g>
            ))}
          </g>
        ))}
        {/* The LENS ITSELF, drawn as a piece of glass rather than the textbook double-headed
            arrow: converging is biconvex (sides bulge out), diverging is biconcave (sides pinch
            in). The thin-lens ray construction still refracts at the centre plane, so the glass
            is a body the learner can recognise, not a change to the optics. */}
        {(() => {
          // Tall enough to catch the highest principal ray, but not so tall that the glass reads
          // as a needle: a real lens is roughly 1:5, not 1:11.
          const half = Math.max(h * 1.25, WY * 0.52);
          const top = Y(half);
          const bot = Y(-half);
          const convex = lens === 'converging';
          // biconvex: two arcs bulging away from the axis, meeting at the rim.
          // biconcave: straight rims with the faces curving back toward the centre.
          const bulge = 24;
          const waist = 9;
          const body = convex
            ? `M${cx},${top} Q${cx + bulge},${ax} ${cx},${bot} Q${cx - bulge},${ax} ${cx},${top} Z`
            : `M${cx - waist},${top} L${cx + waist},${top} Q${cx + waist * 0.2},${ax} ${cx + waist},${bot} L${cx - waist},${bot} Q${cx - waist * 0.2},${ax} ${cx - waist},${top} Z`;
          return (
            <g>
              <path
                d={body}
                fill="color-mix(in oklab, var(--stage-accent) 12%, transparent)"
                stroke="color-mix(in oklab, var(--stage-accent) 65%, var(--stage-fg))"
                strokeWidth={2}
                strokeLinejoin="round"
              />
              {/* one sheen down the left face, the same cue the figure kit's glass uses */}
              <path
                d={
                  convex
                    ? `M${cx - bulge * 0.42},${ax - (ax - top) * 0.45} Q${cx - bulge * 0.72},${ax} ${cx - bulge * 0.42},${ax + (bot - ax) * 0.45}`
                    : `M${cx - waist * 0.55},${ax - (ax - top) * 0.5} Q${cx - waist * 0.15},${ax} ${cx - waist * 0.55},${ax + (bot - ax) * 0.5}`
                }
                fill="none"
                stroke="var(--stage-sheen, #fff)"
                strokeWidth={2}
                strokeLinecap="round"
                opacity={0.5}
              />
              {/* the centre plane where the thin-lens construction bends the rays */}
              <line
                x1={cx}
                y1={top}
                x2={cx}
                y2={bot}
                stroke="color-mix(in oklab, var(--stage-accent) 45%, transparent)"
                strokeWidth={1}
                strokeDasharray="3 3"
              />
            </g>
          );
        })()}
        {/* three principal rays: incident (obj tip → lens) then refracted (→ edge) */}
        <line x1={objTip.x} y1={objTip.y} x2={lp1.x} y2={lp1.y} stroke={R1} strokeWidth={1.5} />
        <line x1={lp1.x} y1={lp1.y} x2={r1end.x} y2={r1end.y} stroke={R1} strokeWidth={1.5} />
        <line x1={objTip.x} y1={objTip.y} x2={r2end.x} y2={r2end.y} stroke={R2} strokeWidth={1.5} />
        <line x1={objTip.x} y1={objTip.y} x2={lp3.x} y2={lp3.y} stroke={R3} strokeWidth={1.5} />
        <line x1={lp3.x} y1={lp3.y} x2={r3end.x} y2={r3end.y} stroke={R3} strokeWidth={1.5} />
        {/* virtual image: dashed backward extensions to the image tip */}
        {!img.real && !offscreen && (
          <>
            <line
              x1={lp1.x}
              y1={lp1.y}
              x2={imgTip.x}
              y2={imgTip.y}
              stroke={R1}
              strokeWidth={1}
              strokeDasharray="3 3"
              opacity={0.7}
            />
            <line
              x1={lp2.x}
              y1={lp2.y}
              x2={imgTip.x}
              y2={imgTip.y}
              stroke={R2}
              strokeWidth={1}
              strokeDasharray="3 3"
              opacity={0.7}
            />
            <line
              x1={lp3.x}
              y1={lp3.y}
              x2={imgTip.x}
              y2={imgTip.y}
              stroke={R3}
              strokeWidth={1}
              strokeDasharray="3 3"
              opacity={0.7}
            />
          </>
        )}
        {/* object (solid) + image (solid real / dashed virtual) arrows */}
        {arrow(X(-u), ax, objTip.x, objTip.y, OBJ, false, 2.5)}
        {!offscreen && arrow(imgTip.x, ax, imgTip.x, imgTip.y, IMG, !img.real, 2.5)}
        {/* Object and image are named at their ARROW TIPS, not on the axis: on the axis they
            landed on top of the F / 2F markers, so "real image" sat across a focal label. */}
        <DiagramLabel
          x={X(-u)}
          y={objTip.y + (h >= 0 ? -8 : 16)}
          text="object"
          tone="info"
          fontSize={10}
          bounds={{ left: 8, right: W - 8, top: 8, bottom: height - 8 }}
        />
        {!offscreen && (
          <DiagramLabel
            x={imgTip.x}
            y={imgTip.y + (imgY >= 0 ? -8 : 16)}
            text={img.real ? 'real image' : 'virtual image'}
            tone="warn"
            fontSize={10}
            bounds={{ left: 8, right: W - 8, top: 8, bottom: height - 8 }}
          />
        )}
        {offscreen && (
          <text x={W / 2} y={26} textAnchor="middle" fontSize={12} fontWeight={700} fill="var(--stage-muted)">
            image at infinity — object is at the focus (rays leave parallel)
          </text>
        )}
      </svg>
    </div>
  );

  const aside = (
    <>
      <div className="physics-imaging-ledger">
        <div>
          <span>Image distance</span>
          <strong>{img.atInfinity ? '∞' : `${f2(v)} cm`}</strong>
        </div>
        <div>
          <span>Magnification</span>
          <strong>{img.atInfinity ? '∞' : `${img.m.toFixed(2)}×`}</strong>
        </div>
        <div data-highlight={!img.real}>
          <span>Image type</span>
          <strong>{img.real ? 'Real · inverted' : 'Virtual · upright'}</strong>
        </div>
      </div>
      <div className="physics-probe">
        <span>Thin-lens equation</span>
        <strong>
          1/{f2(f)} = 1/{f2(u)} + 1/{img.atInfinity ? '∞' : f2(v)}
        </strong>
        <small>
          {lens === 'diverging'
            ? 'Diverging lenses form a small virtual upright image.'
            : u < fm
              ? 'Inside F · magnifying glass'
              : u < 2 * fm
                ? 'Between F and 2F · projector'
                : 'Beyond 2F · camera'}
        </small>
      </div>
    </>
  );

  const controls = (
    <>
      <Field label="lens">
        <ActivitySelect
          ariaLabel="lens"
          value={lens}
          onChange={setLens}
          options={[
            { value: 'converging', label: 'converging (convex)' },
            { value: 'diverging', label: 'diverging (concave)' },
          ]}
        />
      </Field>
      <Field label="focal length f" value={`${fm.toFixed(0)} cm`}>
        <Slider value={fm} min={3} max={16} step={1} onChange={setFm} ariaLabel="focal length" />
      </Field>
    </>
  );

  const footer = <ChallengeCard questions={CHALLENGE} state={ch} title="Predict first" />;

  const state = img.atInfinity
    ? 'Image at infinity'
    : `${img.real ? 'Real · inverted' : 'Virtual · upright'} · ${img.m < 0.98 ? 'diminished' : img.m > 1.02 ? 'magnified' : 'same size'}`;
  return (
    <ImagingActivity
      activity={activity}
      activityId="lens-imaging"
      kind="lens"
      title={title}
      prompt={prompt}
      figure={figure}
      instruments={aside}
      controls={controls}
      objectives={objectives}
      challenge={footer}
      objectDistance={u}
      setObjectDistance={setU}
      minDistance={3}
      maxDistance={34}
      state={state}
      equation={`1/${f2(f)} = 1/${f2(u)} + 1/${img.atInfinity ? '∞' : f2(v)}`}
    />
  );
}
