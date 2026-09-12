'use client';

/**
 * Lines in space: vectors, lines, and the third dimension a flat page hides.
 *
 * Every vector a learner has drawn so far lived on paper, and on paper two lines that are not
 * parallel always meet. In space they usually do not. The trouble is that a drawing of skew lines
 * crosses exactly like a drawing of meeting lines, so the page itself teaches the wrong lesson.
 *
 * This lab draws the scene in three dimensions and lets the learner turn it. Where two lines cross
 * on screen, the nearer one is drawn over the further one with a gap, the way a knot diagram shows
 * a strand passing under another. Turn the view and a real meeting point stays a single point from
 * every angle; a false one comes apart. Four modes cover the syllabus: two vectors and the angle
 * between them, one line as r = a + t b, two lines that meet or miss, and the perpendicular from a
 * point to a line. The arithmetic is in ./core.ts.
 */

import { useRef, useState, type PointerEvent, type ReactNode } from 'react';
import { Tex } from '../../core/tex.js';
import { Segmented, Slider } from '../../kit/controls.js';
import { Field, LiveRegion, Readout } from '../../kit/frame.js';
import { useCheckpoint } from '../../kit/pedagogy.js';
import { Activity } from '../../kit/activity.js';
import { Arrow, Ball, FigText, Figure, HUE, STROKE, Track, tint } from '../../kit/figure/index.js';
import {
  add,
  angleBetween,
  clipToSphere,
  dot,
  fmt,
  fmtVec,
  footOfPerpendicular,
  lineProblems,
  norm,
  pointAt,
  project,
  relate,
  scale,
  screenCrossing,
  sub,
  unit,
  type Line3,
  type Relation,
  type V3,
} from './core.js';

export type LinesMode = 'vectors' | 'line' | 'two-lines' | 'perpendicular';

export interface LinesInSpaceProps {
  /** Which part of the topic the lab shows. */
  mode?: LinesMode;
  /** vectors: the first vector. line, two-lines, perpendicular: a point on the (first) line. */
  a?: V3;
  /** vectors: the second vector, which the learner can edit. Otherwise the (first) direction. */
  b?: V3;
  /** two-lines: a point on the second line. */
  c?: V3;
  /** two-lines: the direction of the second line. */
  d?: V3;
  /** perpendicular: the point off the line. */
  p?: V3;
  /** vectors: make the checkpoint "make a · b zero" instead of "explore". */
  goal?: 'perpendicular';
  /** two-lines: ask for a verdict before revealing the closest approach. */
  predict?: boolean;
  /** Starting view, in degrees: turn about the vertical, and tilt above the ground. */
  yaw?: number;
  pitch?: number;
  /** Radius of the drawn region around the origin. */
  range?: number;
  title?: string;
  prompt?: string;
  activity?: string;
}

/**
 * Two lines that look as if they cross and do not. Seen from above they meet at (2, 2); in fact
 * one runs at height 1 and the other at height 3, so they pass 2 apart. That is the whole idea of
 * skew lines in a pair a learner can check by eye.
 */
const DEFAULTS: Record<LinesMode, { a: V3; b: V3; c?: V3; d?: V3; p?: V3 }> = {
  vectors: { a: [3, 1, 2], b: [1, -2, 2] },
  line: { a: [1, 2, 0], b: [2, -1, 2] },
  'two-lines': { a: [0, 0, 1], b: [1, 1, 0], c: [0, 4, 3], d: [1, -1, 0] },
  perpendicular: { a: [1, 1, 0], b: [2, -1, 2], p: [6, 1, 4] },
};

const TITLES: Record<LinesMode, string> = {
  vectors: 'Two vectors and the angle between them',
  line: 'A line is a point and a direction',
  'two-lines': 'Do these two lines meet?',
  perpendicular: 'The shortest way from a point to a line',
};

const PROMPTS: Record<LinesMode, string> = {
  vectors: 'Change b and watch the scalar product and the angle together. Drag the picture to turn it.',
  line: 'Slide t to walk along the line. a puts you on it, and t says how many copies of b to take.',
  'two-lines': 'On paper they seem to cross. Turn the picture, look closely at the crossing, then decide.',
  perpendicular: 'Slide Q along the line and find where P is closest. Watch PQ · b as you go.',
};

const W = 600;
const H = 380;
const CX = W / 2;

/**
 * How far the drawing reaches, per mode, when the author does not say. Two vectors of length 3
 * drawn in a region of radius 6 are stubs in the corner of an empty frame, so the reach follows
 * what each mode actually draws.
 */
const RANGES: Record<LinesMode, number> = { vectors: 4.5, line: 6, 'two-lines': 6, perpendicular: 7.5 };

/**
 * The two-lines pair is only convincing from above, where its pictures cross; the learner then
 * tilts down to find the gap. Every other mode reads best from a low, three-quarter view.
 */
const PITCHES: Record<LinesMode, number> = { vectors: 22, line: 22, 'two-lines': 62, perpendicular: 22 };

const texVec = (v: V3): string => `\\begin{pmatrix}${v.map((c) => fmt(c)).join('\\\\')}\\end{pmatrix}`;

/** What the learner guesses in two-lines mode. 'none' is the state before any guess. */
type Guess = 'intersect' | 'skew' | 'parallel' | 'none';
const asGuess = (r: Relation): Guess => (r === 'same' ? 'parallel' : r);

export function LinesInSpaceLab({
  mode = 'two-lines',
  a,
  b,
  c,
  d,
  p,
  goal,
  predict = true,
  yaw: initialYaw = 35,
  pitch,
  range,
  title,
  prompt,
  activity = 'lines-in-space',
}: LinesInSpaceProps = {}): ReactNode {
  const base = DEFAULTS[mode];
  const A = a ?? base.a;
  const B0 = b ?? base.b;
  const Cp = c ?? base.c ?? [0, 0, 0];
  const Dd = d ?? base.d ?? [1, 0, 0];
  const P = p ?? base.p ?? [0, 0, 0];

  const [yaw, setYaw] = useState(initialYaw);
  const [tilt, setPitch] = useState(pitch ?? PITCHES[mode]);
  const [bVec, setBVec] = useState<V3>(B0);
  const [t, setT] = useState(mode === 'perpendicular' ? 0 : 1);
  const [guess, setGuess] = useState<Guess>('none');
  const [touched, setTouched] = useState(false);
  const drag = useRef<{ x: number; y: number } | null>(null);

  const R = range ?? RANGES[mode];
  const k = 170 / R;
  const line1: Line3 = { point: A, direction: mode === 'vectors' ? bVec : B0 };
  const line2: Line3 = { point: Cp, direction: Dd };
  const ends = (line: Line3): V3[] => {
    const r = clipToSphere(line, R);
    return r ? [pointAt(line, r[0]), pointAt(line, r[1])] : [];
  };
  // Centre the drawing on what is actually drawn, not on the origin. The zoom stays fixed, so
  // turning the view slides the picture a little but never makes it pulse larger and smaller.
  const content: V3[] = [
    [0, 0, R * 0.92],
    [0, 0, -R * 0.4],
    ...Array.from({ length: 16 }, (_, i): V3 => [
      R * Math.cos((i * Math.PI) / 8),
      R * Math.sin((i * Math.PI) / 8),
      0,
    ]),
    ...(mode === 'vectors'
      ? [A, bVec]
      : mode === 'two-lines'
        ? [...ends(line1), ...ends(line2)]
        : ends(line1)),
    ...(mode === 'perpendicular' ? [P] : []),
  ];
  const heights = content.map((q) => project(q, yaw, tilt).y);
  const CY = H / 2 + (k * (Math.max(...heights) + Math.min(...heights))) / 2;
  const S = (q: V3): [number, number] => {
    const pr = project(q, yaw, tilt);
    return [CX + k * pr.x, CY - k * pr.y];
  };
  const depthOf = (q: V3): number => project(q, yaw, tilt).depth;
  const drawnLines = mode === 'two-lines' ? [line1, line2] : mode === 'vectors' ? [] : [line1];
  const problems = [
    ...lineProblems(drawnLines, R),
    ...(mode === 'vectors' && norm(A) === 0 ? ['a is the zero vector'] : []),
  ];

  // ── the live state of whichever mode is showing ──────────────────────────────
  const pair = mode === 'two-lines' ? relate(line1, line2) : null;
  const foot = mode === 'perpendicular' ? footOfPerpendicular(P, line1) : null;
  const tRange = clipToSphere(line1, R) ?? [-2, 2];
  const tMin = Math.ceil(tRange[0] * 10) / 10;
  const tMax = Math.floor(tRange[1] * 10) / 10;
  const STEP = 0.1;
  const atFoot = foot !== null && Math.abs(t - foot.t) <= STEP / 2 + 1e-9;
  // At the foot, show the exact foot, not the slider's nearest tenth: the readout should say
  // PQ · b = 0 there, not 0.3.
  const Q = foot && atFoot ? foot.foot : pointAt(line1, t);
  const PQ = sub(Q, P);
  const revealed = mode === 'two-lines' && (!predict || guess !== 'none');

  const solved =
    mode === 'vectors'
      ? goal === 'perpendicular'
        ? dot(A, bVec) === 0 && norm(bVec) > 0
        : touched
      : mode === 'line'
        ? touched
        : mode === 'two-lines'
          ? pair !== null && guess === asGuess(pair.relation)
          : atFoot;
  useCheckpoint({ solved, activity, response: mode === 'two-lines' ? guess : undefined });

  // ── turning the picture ──────────────────────────────────────────────────────
  const onDown = (e: PointerEvent<HTMLDivElement>): void => {
    drag.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onMove = (e: PointerEvent<HTMLDivElement>): void => {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.x,
      dy = e.clientY - drag.current.y;
    drag.current = { x: e.clientX, y: e.clientY };
    setYaw((v) => Math.round(((((v - dx * 0.5 + 180) % 360) + 360) % 360) - 180));
    setPitch((v) => Math.round(Math.max(-5, Math.min(85, v + dy * 0.4))));
  };
  const onUp = (): void => {
    drag.current = null;
  };

  // ── the figure ───────────────────────────────────────────────────────────────
  const segment = (line: Line3): [V3, V3] | null => {
    const r = clipToSphere(line, R);
    return r ? [pointAt(line, r[0]), pointAt(line, r[1])] : null;
  };

  const ground: ReactNode[] = [];
  for (let g = -R + (R % 2); g <= R; g += 2) {
    if (g === 0 || Math.abs(g) >= R) continue;
    const half = Math.sqrt(R * R - g * g);
    for (const [p1, p2] of [
      [
        [g, -half, 0],
        [g, half, 0],
      ],
      [
        [-half, g, 0],
        [half, g, 0],
      ],
    ] as [V3, V3][]) {
      ground.push(
        <Track
          key={`${g}-${p1[0]}`}
          points={[S(p1), S(p2)]}
          color={HUE.soft}
          weight="hair"
          dashed={false}
          opacity={0.3}
        />,
      );
    }
  }

  const axisEnd = R * 0.92;
  const axes = (['x', 'y', 'z'] as const).map((name, i) => {
    const tip: V3 = [i === 0 ? axisEnd : 0, i === 1 ? axisEnd : 0, i === 2 ? axisEnd : 0];
    // The negative halves are short stubs: they place the origin without spending half the frame.
    const back = scale(tip, -0.4);
    const [tx, ty] = S(tip);
    const [ox, oy] = S([0, 0, 0]);
    const [bx, by] = S(back);
    return (
      <g key={name}>
        <Track
          points={[
            [bx, by],
            [ox, oy],
          ]}
          color={HUE.soft}
          weight="hair"
          dashed={false}
          opacity={0.45}
        />
        <Arrow x1={ox} y1={oy} x2={tx} y2={ty} color={HUE.soft} weight="hair" head={7} />
        {/* Beyond the tip, along the axis itself, so the letter never sits on a point drawn near
            the tip (the meeting point in one view landed right under a sideways-offset "z"). */}
        <FigText
          x={tx + ((tx - ox) / (Math.hypot(tx - ox, ty - oy) || 1)) * 14}
          y={ty + ((ty - oy) / (Math.hypot(tx - ox, ty - oy) || 1)) * 14}
          anchor="middle"
          baseline="middle"
          tone="soft"
          size="note"
        >
          {name}
        </FigText>
      </g>
    );
  });

  /** A dashed drop to the ground under a point, so its height can be read by eye. */
  const drop = (q: V3, key: string): ReactNode =>
    Math.abs(q[2]) > 0.05 ? (
      <Track key={key} points={[S(q), S([q[0], q[1], 0])]} color={HUE.soft} weight="hair" opacity={0.7} />
    ) : null;

  const pointLabel = (
    q: V3,
    text: string,
    tone: 'ink' | 'hue-1' | 'hue-2' = 'ink',
    dx = 9,
    dy = -9,
  ): ReactNode => {
    const [x, y] = S(q);
    return (
      <FigText x={x + dx} y={y + dy} anchor={dx >= 0 ? 'start' : 'end'} tone={tone}>
        {text}
      </FigText>
    );
  };

  /** A right-angle mark at `at`, in the plane of the two directions. */
  const rightAngle = (at: V3, u: V3, v: V3): ReactNode => {
    const s = 0.4;
    const e1 = scale(unit(u), s),
      e2 = scale(unit(v), s);
    return (
      <Track
        points={[S(add(at, e1)), S(add(add(at, e1), e2)), S(add(at, e2))]}
        color={HUE.ink}
        weight="hair"
        dashed={false}
      />
    );
  };

  /** Two lines, the nearer drawn over the further where their pictures cross. */
  const linePair = (l1: Line3, l2: Line3, meets: boolean): ReactNode => {
    const s1 = segment(l1),
      s2 = segment(l2);
    if (!s1 || !s2) return null;
    const a1 = S(s1[0]),
      a2 = S(s1[1]),
      b1 = S(s2[0]),
      b2 = S(s2[1]);
    const cross = screenCrossing(a1, a2, b1, b2);
    type Drawn = { seg: [V3, V3]; color: string; key: string };
    let first: Drawn = { seg: s1, color: HUE[1], key: 'l1' },
      second: Drawn = { seg: s2, color: HUE[2], key: 'l2' };
    let halo: ReactNode = null;
    if (cross && !meets) {
      const d1 = depthOf(add(s1[0], scale(sub(s1[1], s1[0]), cross.u)));
      const d2 = depthOf(add(s2[0], scale(sub(s2[1], s2[0]), cross.v)));
      const nearFirst = d1 < d2;
      if (nearFirst) [first, second] = [second, first];
      // Paper painted under the nearer line at the crossing: the further line appears to pass
      // behind it, which is the only honest way a flat picture can say "these do not touch".
      const near = second.seg;
      const [nx1, ny1] = S(near[0]),
        [nx2, ny2] = S(near[1]);
      const len = Math.hypot(nx2 - nx1, ny2 - ny1) || 1;
      const ux = (nx2 - nx1) / len,
        uy = (ny2 - ny1) / len,
        g = 16;
      halo = (
        <line
          x1={cross.at[0] - ux * g}
          y1={cross.at[1] - uy * g}
          x2={cross.at[0] + ux * g}
          y2={cross.at[1] + uy * g}
          stroke={HUE.paper}
          strokeWidth={STROKE.edge * 3.4}
          strokeLinecap="round"
        />
      );
    }
    return (
      <>
        <Track
          key={first.key}
          points={[S(first.seg[0]), S(first.seg[1])]}
          color={first.color}
          weight="edge"
          dashed={false}
        />
        {halo}
        <Track
          key={second.key}
          points={[S(second.seg[0]), S(second.seg[1])]}
          color={second.color}
          weight="edge"
          dashed={false}
        />
      </>
    );
  };

  let scene: ReactNode = null;
  let readout: ReactNode = null;
  let metrics: ReactNode = null;
  let observation = '';
  let claim: ReactNode = null;
  let dock: ReactNode = null;
  let narration = '';

  if (mode === 'vectors') {
    const O: V3 = [0, 0, 0];
    const [ox, oy] = S(O),
      [axx, ayy] = S(A),
      [bx, by] = S(bVec);
    const ab = dot(A, bVec);
    const theta = angleBetween(A, bVec);
    const perpendicular = ab === 0 && norm(bVec) > 0;
    const rho = Math.min(norm(A), norm(bVec)) * 0.32;
    const arc: [number, number][] = [];
    if (norm(bVec) > 0 && !perpendicular) {
      const ua = unit(A),
        ub = unit(bVec);
      for (let i = 0; i <= 24; i++) {
        const f = i / 24;
        // Interpolate between the two unit directions and push back onto the circle: a flat
        // chord would cut the corner and misplace the angle label.
        arc.push(S(scale(unit(add(scale(ua, 1 - f), scale(ub, f))), rho)));
      }
    }
    const mid = arc[12];
    scene = (
      <>
        {drop(A, 'da')}
        {drop(bVec, 'db')}
        <Arrow x1={ox} y1={oy} x2={axx} y2={ayy} color={HUE[1]} weight="edge" head={11} />
        {norm(bVec) > 0 && <Arrow x1={ox} y1={oy} x2={bx} y2={by} color={HUE[2]} weight="edge" head={11} />}
        {arc.length > 1 && <Track points={arc} color={HUE.warn} weight="line" dashed={false} />}
        {perpendicular && rightAngle(O, A, bVec)}
        {mid && (
          <FigText x={mid[0] + 6} y={mid[1] - 6} tone="ink" size="note">
            θ
          </FigText>
        )}
        {pointLabel(A, 'a', 'hue-1')}
        {norm(bVec) > 0 && pointLabel(bVec, 'b', 'hue-2')}
        <Ball cx={ox} cy={oy} r={3.5} color={HUE.ink} />
        {pointLabel(O, 'O', 'ink', -8, 16)}
      </>
    );
    readout = (
      <Readout
        value={`a · b = ${fmt(ab)}`}
        sub={norm(bVec) > 0 ? `θ = ${fmt(theta, 1)}°` : 'b is zero: no angle'}
      />
    );
    metrics = (
      <div className="lab-metric-list">
        <div>
          <span>|a|</span>
          <strong>{fmt(norm(A), 3)}</strong>
        </div>
        <div>
          <span>|b|</span>
          <strong>{fmt(norm(bVec), 3)}</strong>
        </div>
      </div>
    );
    observation = perpendicular
      ? 'a · b is zero, so cos θ is zero and the vectors are at right angles.'
      : ab < 0
        ? 'a · b is negative, so cos θ is negative and the angle is obtuse.'
        : 'a · b = |a| |b| cos θ: the scalar product carries the angle inside it.';
    claim = <Tex tex={`\\mathbf{a} = ${texVec(A)} \\qquad \\mathbf{b} = ${texVec(bVec)}`} block />;
    dock = (
      <>
        {(['x', 'y', 'z'] as const).map((axis, i) => (
          <Field key={axis} label={`b ${axis}`} value={fmt(bVec[i] ?? 0)}>
            <Slider
              value={bVec[i] ?? 0}
              // The reach follows the drawing, and never cuts off the author's own starting b.
              min={-Math.max(4, Math.floor(R), Math.abs(B0[i] ?? 0))}
              max={Math.max(4, Math.floor(R), Math.abs(B0[i] ?? 0))}
              step={1}
              onChange={(v) => {
                setTouched(true);
                setBVec((old) => old.map((c, j) => (j === i ? v : c)) as unknown as V3);
              }}
              ariaLabel={`${axis} component of b`}
            />
          </Field>
        ))}
      </>
    );
    narration = `a ${fmtVec(A)}, b ${fmtVec(bVec)}, scalar product ${fmt(ab)}, angle ${fmt(theta, 1)} degrees.`;
  } else if (mode === 'line') {
    const seg = segment(line1);
    const Rpt = pointAt(line1, t);
    const [ox, oy] = S([0, 0, 0]),
      [ax, ay] = S(A),
      [rx, ry] = S(Rpt);
    const ticks: ReactNode[] = [];
    for (let i = Math.ceil(tMin); i <= Math.floor(tMax); i++) {
      const [x, y] = S(pointAt(line1, i));
      ticks.push(<circle key={i} cx={x} cy={y} r={2.6} fill={tint(HUE[2], 55)} />);
    }
    scene = (
      <>
        {seg && (
          <Track points={[S(seg[0]), S(seg[1])]} color={tint(HUE[2], 60)} weight="line" dashed={false} />
        )}
        {ticks}
        {drop(A, 'da')}
        {drop(Rpt, 'dr')}
        <Arrow x1={ox} y1={oy} x2={rx} y2={ry} color={HUE.soft} weight="line" head={8} dashed />
        <Arrow x1={ox} y1={oy} x2={ax} y2={ay} color={HUE[1]} weight="edge" head={11} />
        {Math.abs(t) > 0.05 && (
          <Arrow x1={ax} y1={ay} x2={rx} y2={ry} color={HUE[2]} weight="edge" head={11} />
        )}
        <Ball cx={rx} cy={ry} r={6} color={HUE.warn} />
        <Ball cx={ox} cy={oy} r={3.5} color={HUE.ink} />
        {pointLabel([0, 0, 0], 'O', 'ink', -8, 16)}
        {pointLabel(A, 'A', 'hue-1', -9)}
        {pointLabel(Rpt, 'R')}
      </>
    );
    readout = <Readout value={`r = ${fmtVec(Rpt)}`} sub="the position vector of R" />;
    observation =
      Math.abs(t) < 0.05
        ? 'At t = 0 the point is A itself: a is the start, and b has not been used yet.'
        : t < 0
          ? 'A negative t walks backwards along b. The line runs both ways without end.'
          : 'Every point on the line is a plus some multiple of b, and t is that multiple.';
    claim = <Tex tex={`\\mathbf{r} = ${texVec(A)} + t\\,${texVec(B0)}`} block />;
    dock = (
      <Field label="t" value={fmt(t, 1)}>
        <Slider
          value={t}
          min={tMin}
          max={tMax}
          step={STEP}
          onChange={(v) => {
            setTouched(true);
            setT(v);
          }}
          ariaLabel="parameter t"
        />
      </Field>
    );
    narration = `At t ${fmt(t, 1)} the point is ${fmtVec(Rpt)}.`;
  } else if (mode === 'two-lines' && pair) {
    const meets = pair.relation === 'intersect';
    const s1 = segment(line1),
      s2 = segment(line2);
    const [c1x, c1y] = S(pair.closest[0]),
      [c2x, c2y] = S(pair.closest[1]);
    scene = (
      <>
        {linePair(line1, line2, meets)}
        {drop(A, 'da')}
        {drop(Cp, 'dc')}
        <Ball cx={S(A)[0]} cy={S(A)[1]} r={3.5} color={HUE[1]} />
        <Ball cx={S(Cp)[0]} cy={S(Cp)[1]} r={3.5} color={HUE[2]} />
        {/* Named short of the ends, which is where the axis letters sit. */}
        {s1 && pointLabel(add(s1[0], scale(sub(s1[1], s1[0]), 0.85)), 'l₁', 'hue-1', 10, -6)}
        {s2 && pointLabel(add(s2[0], scale(sub(s2[1], s2[0]), 0.85)), 'l₂', 'hue-2', 10, -6)}
        {revealed && meets && pair.point && (
          <>
            <Ball cx={S(pair.point)[0]} cy={S(pair.point)[1]} r={6} color={HUE.warn} />
            {pointLabel(pair.point, fmtVec(pair.point), 'ink', 10, 16)}
          </>
        )}
        {revealed && !meets && pair.relation !== 'same' && (
          <>
            <Track
              points={[
                [c1x, c1y],
                [c2x, c2y],
              ]}
              color={HUE.warn}
              weight="line"
            />
            <Ball cx={c1x} cy={c1y} r={3.5} color={HUE.warn} />
            <Ball cx={c2x} cy={c2y} r={3.5} color={HUE.warn} />
            <FigText x={(c1x + c2x) / 2 + 10} y={(c1y + c2y) / 2} baseline="middle" tone="ink" size="note">
              {fmt(pair.distance)}
            </FigText>
          </>
        )}
      </>
    );
    const verdictName: Record<Relation, string> = {
      intersect: 'They meet',
      skew: 'Skew: they never meet',
      parallel: 'Parallel',
      same: 'The same line',
    };
    readout = revealed ? (
      <Readout
        value={verdictName[pair.relation]}
        sub={
          meets && pair.point
            ? `at ${fmtVec(pair.point)}`
            : pair.relation === 'same'
              ? 'two equations for one line'
              : `${fmt(pair.distance)} apart at the closest`
        }
      />
    ) : (
      <Readout value="Meet, or miss?" sub="Turn the picture, then decide" />
    );
    metrics = revealed ? (
      <div className="lab-metric-list">
        <div>
          <span>angle between lines</span>
          <strong>{fmt(pair.angle, 1)}°</strong>
        </div>
        {meets && (
          <div>
            <span>parameters</span>
            <strong>
              s = {fmt(pair.s)}, t = {fmt(pair.t)}
            </strong>
          </div>
        )}
      </div>
    ) : null;
    observation = !revealed
      ? 'On a flat page, meeting lines and skew lines look the same. A real meeting point stays one point from every angle.'
      : meets
        ? 'The crossing is a real point: the same s and t satisfy all three component equations.'
        : pair.relation === 'skew'
          ? 'The pictures cross, but one line passes in front of the other there. No point lies on both.'
          : pair.relation === 'parallel'
            ? 'The same direction, so they never meet and never get any closer.'
            : 'Different starting points, same line: every point of one is on the other.';
    // One row, not two: stacked column vectors pushed the figure below the fold.
    claim = (
      <Tex
        tex={`l_1: \\mathbf{r} = ${texVec(A)} + s\\,${texVec(B0)} \\qquad l_2: \\mathbf{r} = ${texVec(Cp)} + t\\,${texVec(Dd)}`}
        block
      />
    );
    dock = predict ? (
      <Segmented<Guess>
        value={guess}
        onChange={setGuess}
        options={[
          { value: 'intersect', label: 'They meet' },
          { value: 'skew', label: 'Skew' },
          { value: 'parallel', label: 'Parallel' },
        ]}
        ariaLabel="your verdict"
      />
    ) : null;
    narration = revealed
      ? `${verdictName[pair.relation]}. ${meets && pair.point ? `They meet at ${fmtVec(pair.point)}.` : `Closest distance ${fmt(pair.distance)}.`}`
      : 'Two lines drawn in three dimensions. Decide whether they meet.';
  } else if (mode === 'perpendicular' && foot) {
    const seg = segment(line1);
    const [px, py] = S(P),
      [qx, qy] = S(Q);
    const pqb = dot(PQ, B0);
    scene = (
      <>
        {seg && <Track points={[S(seg[0]), S(seg[1])]} color={HUE[1]} weight="edge" dashed={false} />}
        {drop(P, 'dp')}
        {drop(Q, 'dq')}
        <Track
          points={[
            [px, py],
            [qx, qy],
          ]}
          color={HUE.warn}
          weight="line"
          dashed={!atFoot}
        />
        {atFoot && rightAngle(Q, sub(P, Q), B0)}
        <Ball cx={S(A)[0]} cy={S(A)[1]} r={3.5} color={HUE[1]} />
        <Ball cx={px} cy={py} r={6} color={HUE[2]} />
        <Ball cx={qx} cy={qy} r={5} color={HUE.warn} />
        {pointLabel(A, 'A', 'hue-1', -9)}
        {pointLabel(P, 'P', 'hue-2')}
        {pointLabel(Q, atFoot ? 'F' : 'Q', 'ink', 9, 16)}
      </>
    );
    readout = (
      <Readout
        value={`|PQ| = ${fmt(norm(PQ), 3)}`}
        sub={atFoot ? 'PQ · b = 0: the foot' : `PQ · b = ${fmt(pqb)}`}
      />
    );
    metrics = (
      <div className="lab-metric-list">
        <div>
          <span>Q</span>
          <strong>{fmtVec(Q)}</strong>
        </div>
      </div>
    );
    observation = atFoot
      ? 'PQ is perpendicular to the line here, and no other point of the line is closer to P.'
      : 'Keep sliding. |PQ| falls until PQ · b reaches zero, then rises again.';
    claim = <Tex tex={`\\mathbf{r} = ${texVec(A)} + t\\,${texVec(B0)} \\qquad P = ${fmtVec(P)}`} block />;
    dock = (
      <Field label="t" value={fmt(t, 1)}>
        <Slider
          value={t}
          min={tMin}
          max={tMax}
          step={STEP}
          onChange={setT}
          ariaLabel="where Q is on the line"
        />
      </Field>
    );
    narration = `Q at ${fmtVec(Q)}, distance from P ${fmt(norm(PQ), 3)}${atFoot ? ', the foot of the perpendicular' : ''}.`;
  }

  const figure = (
    <div
      className="math-space-surface"
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      <Figure viewBox={[W, H]} domain="math" label={`${TITLES[mode]}. ${narration}`}>
        {ground}
        {axes}
        {scene}
      </Figure>
    </div>
  );

  return (
    <Activity.Root className="math-lines-in-space">
      <Activity.Header>
        <Activity.Heading
          eyebrow="Vectors"
          title={title ?? TITLES[mode]}
          description={prompt ?? PROMPTS[mode]}
        />
        <Activity.FocusButton />
      </Activity.Header>
      <Activity.Status>
        <span>turn {yaw}°</span>
        <span>tilt {tilt}°</span>
      </Activity.Status>

      <Activity.Workspace>
        <Activity.Canvas label="Three-dimensional view">
          <div className="lab-proof-claim">{claim}</div>
          {figure}
        </Activity.Canvas>

        <Activity.Dock>
          {dock}
          <Field label="turn" value={`${yaw}°`}>
            <Slider value={yaw} min={-180} max={180} step={5} onChange={setYaw} ariaLabel="turn the view" />
          </Field>
          <Field label="tilt" value={`${tilt}°`}>
            <Slider value={tilt} min={-5} max={85} step={5} onChange={setPitch} ariaLabel="tilt the view" />
          </Field>
        </Activity.Dock>

        {problems.length ? (
          <Readout value="This set-up cannot be drawn" sub={problems.join('; ')} />
        ) : (
          readout
        )}
        {metrics}
      </Activity.Workspace>

      <Activity.Feedback>
        <span>What to notice</span>
        <div>{observation}</div>
      </Activity.Feedback>

      <LiveRegion>{narration}</LiveRegion>
    </Activity.Root>
  );
}
