'use client';

/**
 * MirrorImagingLab — curved-mirror images by ray tracing, on the same optics kernel
 * as the lens (`thinOptic`, 1/f = 1/u + 1/v; concave f > 0, convex f < 0). Light hits
 * the mirror and reflects BACK to the object's side, so a real image forms in front of
 * the mirror; a virtual image sits behind it. A concave mirror walks the image from
 * real-inverted-tiny (object beyond C) to virtual-upright-magnified (object inside F —
 * a shaving/make-up mirror); a convex mirror always gives a small virtual upright image
 * (car wing-mirror, shop security).
 *
 * Three rays: (1) parallel in → reflects through F, (2) through F → reflects parallel,
 * (3) to the pole → reflects symmetrically about the axis. Authorable focal length /
 * object distance / mirror type for any "describe the image" question.
 */

import { useState, type ReactNode } from 'react';
import type { AuthoredActivity } from '../../kit/activity-authoring.js';
import { thinOptic } from './core.js';
import { Slider, Segmented } from '../../kit/controls.js';
import { Field } from '../../kit/frame.js';
import { ImagingActivity } from './imaging-activity.js';
import { useChallenge, ChallengeCard, useCheckpoint, type ChallengeQuestion } from '../../kit/pedagogy.js';

export type MirrorType = 'concave' | 'convex';
export interface MirrorImagingProps {
  focalLength?: number;
  objectDistance?: number;
  mirror?: MirrorType;
  objectHeight?: number;
  title?: string;
  prompt?: string;
  objectives?: string[];
  height?: number;
  activity?: string | AuthoredActivity;
}

const W = 580,
  HT = 380;
const WXL = 40,
  WXR = 12,
  WY = 12; // world extents: left (front), right (behind), vertical
const AX = HT / 2,
  PX0 = W * 0.7; // pole at 70% width, room on the left
const SC = (PX0 - 20) / WXL;
const X = (x: number): number => PX0 + x * SC;
const Y = (y: number): number => AX - (y / WY) * (AX - 22);
const OBJ = 'var(--stage-accent, #3b82f6)';
const IMG = 'var(--stage-good, #16a34a)';
const MIR = 'var(--stage-metal, #8b98a5)';
const R1 = 'var(--stage-warn, #e0a020)';
const R2 = 'rgb(150,110,200)';
const R3 = 'rgb(20,160,170)';

const CHALLENGE: ChallengeQuestion[] = [
  {
    id: 'concave-far',
    prompt: 'A distant object in a concave mirror (beyond C) gives an image that is…',
    choices: [
      { value: 'real', label: 'real, inverted and smaller' },
      { value: 'virtual', label: 'virtual and upright' },
      { value: 'same', label: 'exactly the same size' },
    ],
    answer: 'real',
    explain:
      'Beyond the centre of curvature the reflected rays converge to a real, inverted, diminished image between F and C — how a reflecting telescope gathers light.',
  },
  {
    id: 'convex',
    prompt: 'A convex (bulging) mirror always gives an image that is…',
    choices: [
      { value: 'vsu', label: 'virtual, upright and diminished' },
      { value: 'real', label: 'real and inverted' },
      { value: 'big', label: 'magnified' },
    ],
    answer: 'vsu',
    explain:
      'A convex mirror diverges the rays, so you only ever get a small virtual upright image behind it — a wide field of view, which is why cars and shops use them.',
  },
];

const f2 = (n: number): string => (Math.abs(n) === Infinity ? '∞' : n.toFixed(1));

export function MirrorImagingLab({
  focalLength = 8,
  objectDistance = 24,
  mirror: mir0 = 'concave',
  objectHeight = 4.5,
  title = 'Mirror imaging: concave & convex (1/f = 1/u + 1/v)',
  prompt = 'Reflect the three rays to find the image. A concave mirror flips from a real inverted image to a magnifying one as the object crosses the focus; a convex mirror always gives a small upright one.',
  objectives = [
    'Reflect the three principal rays to locate the image',
    'Concave: real inverted beyond F, virtual upright inside F',
    'Convex: always a virtual, upright, diminished image behind the mirror',
  ],
  height = HT,
  activity,
}: MirrorImagingProps = {}): ReactNode {
  const [mir, setMir] = useState<MirrorType>(mir0);
  const [u, setU] = useState(objectDistance);
  const [fm, setFm] = useState(focalLength);
  const h = objectHeight;
  const ch = useChallenge(CHALLENGE);
  useCheckpoint({ solved: ch.allCorrect, activity: 'mirror-imaging' });

  const f = mir === 'concave' ? fm : -fm;
  const img = thinOptic(f, u);
  const v = img.v;
  const imgX = -v; // real (v>0) ⇒ front (left); virtual ⇒ behind (right)
  const imgY = (img.upright ? 1 : -1) * img.m * h;
  const xF = mir === 'concave' ? -fm : fm; // focal point (front for concave, behind for convex)
  const xC = 2 * xF;
  const offscreen = img.atInfinity || Math.abs(imgX) > WXL * 1.1 || Math.abs(imgY) > WY * 1.25;

  const ax = Y(0),
    pole = X(0),
    xL = X(-WXL);
  const objTip = { x: X(-u), y: Y(h) };
  const lp1 = { x: pole, y: Y(h) },
    lp2 = { x: pole, y: ax },
    lp3 = { x: pole, y: Y(imgY) };
  // reflected rays extended to the LEFT edge (they head back to the object side)
  const r1end = { x: xL, y: Y(h + (h / xF) * WXL) }; // through (0,h) & (xF,0)
  const r2end = { x: xL, y: Y((imgY * WXL) / v) }; // pole ray through image
  const r3end = { x: xL, y: Y(imgY) }; // horizontal
  const imgTip = { x: X(imgX), y: Y(imgY) };

  // concave: reflective arc opens toward the object ")"; convex bulges toward it "("
  const arcTop = Y(WY * 0.72),
    arcBot = Y(-WY * 0.72);
  const bulge = mir === 'concave' ? 16 : -16;
  const mirrorPath = `M${pole},${arcTop} Q${pole + bulge},${ax} ${pole},${arcBot}`;

  const figure = (
    <div className="physics-optics-scene physics-imaging-scene">
      <svg
        viewBox={`0 0 ${W} ${height}`}
        width="100%"
        role="img"
        aria-label={`${mir} mirror, object at ${u}, focal length ${fm}; ${img.atInfinity ? 'image at infinity' : `image ${f2(imgX)}, ${img.real ? 'real inverted' : 'virtual upright'}, magnification ${img.m.toFixed(2)}`}`}
      >
        <line x1={0} y1={ax} x2={W} y2={ax} stroke="var(--stage-fg)" strokeWidth={1.2} />
        {/* F and C markers (dashed when behind a convex mirror) */}
        {[
          [xF, 'F'],
          [xC, 'C'],
        ].map(([x, lab]) => (
          <g key={String(lab)}>
            <circle
              cx={X(x as number)}
              cy={ax}
              r={2.6}
              fill="var(--stage-muted)"
              opacity={mir === 'convex' ? 0.6 : 1}
            />
            <text x={X(x as number)} y={ax + 15} textAnchor="middle" fontSize={9.5} fill="var(--stage-muted)">
              {lab as string}
            </text>
          </g>
        ))}
        {/* the mirror */}
        {/* The MIRROR as a silvered object, not a bare arc: a thin glass body behind the
            reflective face, with hatching on the back so the reflecting side is unambiguous. */}
        <path
          d={`${mirrorPath} L${pole + (mir === 'concave' ? -7 : 7)},${arcBot} Q${pole + bulge * 0.55},${ax} ${pole + (mir === 'concave' ? -7 : 7)},${arcTop} Z`}
          fill="color-mix(in oklab, var(--stage-metal) 32%, transparent)"
          stroke="none"
        />
        <path d={mirrorPath} fill="none" stroke={MIR} strokeWidth={3.5} strokeLinecap="round" />
        {[0.18, 0.34, 0.5, 0.66, 0.82].map((t) => {
          // hatch ticks on the BACK of the mirror (the non-reflecting side)
          const yy = arcTop + (arcBot - arcTop) * t;
          const bx = pole + bulge * 4 * t * (1 - t);
          const back = mir === 'concave' ? -1 : 1;
          return (
            <line
              key={t}
              x1={bx}
              y1={yy}
              x2={bx + back * 8}
              y2={yy + 6}
              stroke={MIR}
              strokeWidth={1.2}
              opacity={0.7}
            />
          );
        })}
        {/* incident rays */}
        <line x1={objTip.x} y1={objTip.y} x2={lp1.x} y2={lp1.y} stroke={R1} strokeWidth={1.5} />
        <line x1={objTip.x} y1={objTip.y} x2={lp2.x} y2={lp2.y} stroke={R2} strokeWidth={1.5} />
        <line x1={objTip.x} y1={objTip.y} x2={lp3.x} y2={lp3.y} stroke={R3} strokeWidth={1.5} />
        {/* reflected rays (back toward the object side) */}
        <line x1={lp1.x} y1={lp1.y} x2={r1end.x} y2={r1end.y} stroke={R1} strokeWidth={1.5} />
        <line x1={lp2.x} y1={lp2.y} x2={r2end.x} y2={r2end.y} stroke={R2} strokeWidth={1.5} />
        <line x1={lp3.x} y1={lp3.y} x2={r3end.x} y2={r3end.y} stroke={R3} strokeWidth={1.5} />
        {/* virtual image: dashed extensions behind the mirror */}
        {!img.real &&
          !offscreen &&
          [
            [lp1, R1],
            [lp2, R2],
            [lp3, R3],
          ].map(([p, c], k) => {
            const pt = p as { x: number; y: number };
            return (
              <line
                key={k}
                x1={pt.x}
                y1={pt.y}
                x2={imgTip.x}
                y2={imgTip.y}
                stroke={c as string}
                strokeWidth={1}
                strokeDasharray="3 3"
                opacity={0.7}
              />
            );
          })}
        {/* object + image arrows */}
        {arrow(X(-u), ax, objTip.x, objTip.y, OBJ, false)}
        {!offscreen && arrow(imgTip.x, ax, imgTip.x, imgTip.y, IMG, !img.real)}
        {/* named at the arrow tips, clear of the F / C markers that sit on the axis */}
        <text
          x={X(-u)}
          y={objTip.y + (h >= 0 ? -8 : 16)}
          textAnchor="middle"
          fontSize={10}
          fontWeight={700}
          paintOrder="stroke"
          stroke="var(--stage-bg)"
          strokeWidth={3}
          fill={OBJ}
        >
          object
        </text>
        {!offscreen && (
          <text
            x={imgTip.x}
            y={imgTip.y + (imgY >= 0 ? -8 : 16)}
            textAnchor="middle"
            fontSize={10}
            fontWeight={700}
            paintOrder="stroke"
            stroke="var(--stage-bg)"
            strokeWidth={3}
            fill={IMG}
          >
            {img.real ? 'real image' : 'virtual image'}
          </text>
        )}
        {offscreen && (
          <text x={W / 2} y={26} textAnchor="middle" fontSize={12} fontWeight={700} fill="var(--stage-muted)">
            image at infinity — object is at the focus (rays reflect back parallel)
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
        <span>Mirror equation</span>
        <strong>
          1/{f2(f)} = 1/{f2(u)} + 1/{img.atInfinity ? '∞' : f2(v)}
        </strong>
        <small>
          {mir === 'convex'
            ? 'Convex · virtual wide view'
            : u < fm
              ? 'Inside F · shaving mirror'
              : u < 2 * fm
                ? 'Between F and C · enlarged'
                : 'Beyond C · diminished'}
        </small>
      </div>
    </>
  );

  const controls = (
    <>
      <Field label="mirror">
        <Segmented
          ariaLabel="mirror"
          value={mir}
          onChange={setMir}
          options={[
            { value: 'concave', label: 'concave' },
            { value: 'convex', label: 'convex' },
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
      activityId="mirror-imaging"
      kind="mirror"
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
      maxDistance={36}
      state={state}
      equation={`1/${f2(f)} = 1/${f2(u)} + 1/${img.atInfinity ? '∞' : f2(v)}`}
    />
  );
}

const arrow = (x1: number, y1: number, x2: number, y2: number, color: string, dashed = false): ReactNode => {
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
        strokeWidth={2.5}
        strokeDasharray={dashed ? '5 4' : undefined}
      />
      <path
        d={`M${x2},${y2} L${x2 - s * Math.cos(a - 0.4)},${y2 - s * Math.sin(a - 0.4)} L${x2 - s * Math.cos(a + 0.4)},${y2 - s * Math.sin(a + 0.4)} Z`}
        fill={color}
      />
    </g>
  );
};
