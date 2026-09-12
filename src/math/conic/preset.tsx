'use client';

/**
 * ConicLab, the non-circle conics on the coordinate plane, dragged into shape:
 *
 *   parabola     y² = 4a·x  , drag the FOCUS along the axis; the focus (a, 0)
 *                and directrix x = −a move together (every point stays equidistant
 *                from them, the defining property).
 *   hyperbola    x²/a² − y²/b² = 1, drag the vertex (sets a) and the conjugate
 *                handle (sets b); the asymptotes y = ±(b/a)x are drawn.
 *   rectangular  x·y = c, the reciprocal graph; drag a point on a branch to set c.
 *
 * Built on the same CoordPlane + Plot.Parametric the rest of the geometry labs
 * use (parametric so the vertical-tangent vertex and the two branches draw
 * cleanly). Authorable via props + an optional checked answer.
 */

import { useState, type ReactNode } from 'react';
import { Plot, Line, Ellipse, Dot, MovableDot, Label, type Vec2 } from '@classytic/stage';
import { StatList, Stat } from '../../kit/frame.js';
import { Activity } from '../../kit/activity.js';
import { LabAsk, type LabAskSpec } from '../../kit/ask.js';
import { CoordPlane, dotZone, clearOfLabel, snapTo, num, type ClearZone } from '../../kit/coords.js';

export type ConicKind = 'parabola' | 'ellipse' | 'hyperbola' | 'rectangular';

export interface ConicProps {
  kind?: ConicKind;
  /** parabola: y² = 4a·x. ellipse/hyperbola: a, b are the semi-axes. */
  a?: number;
  b?: number;
  /** rectangular: x·y = c. */
  c?: number;
  showFocusDirectrix?: boolean;
  showAsymptotes?: boolean;
  view?: { xMin: number; xMax: number; yMin: number; yMax: number };
  height?: number;
  snap?: number;
  title?: string;
  prompt?: string;
  ask?: LabAskSpec;
  activity?: string;
}

const C_CURVE = 'var(--stage-accent)';
const C_AUX = 'var(--stage-accent-2)';
const DEFAULT_VIEW = { xMin: -8, xMax: 8, yMin: -6, yMax: 6 };

const PROMPTS: Record<ConicKind, string> = {
  parabola:
    'Drag the focus along the axis. The directrix mirrors it: every point on the curve is the same distance from both. y² = 4a·x.',
  ellipse:
    'Drag the two axis handles to set the semi-axes a and b. The foci sit on the longer axis. x²/a² + y²/b² = 1.',
  hyperbola:
    'Drag the vertex (sets a) and the conjugate handle (sets b). The curve hugs the asymptotes y = ±(b/a)x.',
  rectangular: 'Drag the point on the branch. x·y stays constant, that constant is c.',
};

export function ConicLab(props: ConicProps = {}): ReactNode {
  const kind = props.kind ?? 'parabola';
  const {
    view = DEFAULT_VIEW,
    height = 400,
    snap = 1,
    showFocusDirectrix = true,
    showAsymptotes = true,
    title = kind === 'parabola'
      ? 'The parabola'
      : kind === 'ellipse'
        ? 'The ellipse'
        : kind === 'hyperbola'
          ? 'The hyperbola'
          : 'The reciprocal graph',
    prompt = PROMPTS[kind],
    ask,
    activity = `conic-${kind}`,
  } = props;

  const [a, setA] = useState(
    Math.max(0.3, props.a ?? (kind === 'ellipse' ? 4 : kind === 'hyperbola' ? 2 : 1)),
  );
  const [b, setB] = useState(Math.max(0.3, props.b ?? (kind === 'ellipse' ? 2.5 : 1.5)));
  const [cc, setCc] = useState(props.c ?? 6);
  const sp = (v: number): number => snapTo(v, snap);

  let scene: ReactNode;
  // Everything drawn that can sit on an axis (every handle here does), so the numbers step aside.
  let clear: ClearZone[] = [];
  const readouts: { label: string; value: string }[] = [];

  if (kind === 'parabola') {
    const T = Math.sqrt(Math.max(0.1, view.xMax) / a);
    clear = [
      dotZone({ x: a, y: 0 }),
      ...(showFocusDirectrix
        ? [
            clearOfLabel(-a, view.yMin, `directrix x = ${num(-a)}`, { size: 11, dy: -6 }),
            clearOfLabel(a, 0, 'focus', { size: 11, dy: -10 }),
          ]
        : []),
    ];
    scene = (
      <>
        {showFocusDirectrix && (
          <>
            <Line from={{ x: -a, y: 0 }} to={{ x: -a, y: 1 }} color={C_AUX} weight={2} dashed />
            <Label x={-a} y={view.yMin} text={`directrix x = ${num(-a)}`} color={C_AUX} size={11} dy={-6} />
            <Dot x={a} y={0} r={4} color={C_AUX} />
            <Label x={a} y={0} text="focus" color={C_AUX} size={11} dy={-10} />
          </>
        )}
        <Plot.Parametric xy={(t) => [a * t * t, 2 * a * t]} domain={[-T, T]} color={C_CURVE} weight={3} />
        <MovableDot
          value={{ x: a, y: 0 }}
          onMove={(p) => setA(Math.max(0.3, sp(p.x)))}
          snap={snap}
          constrain="horizontal"
          color={C_CURVE}
          ariaLabel="focus, drag along the axis to set a"
        />
      </>
    );
    readouts.push(
      { label: 'a', value: num(a) },
      { label: 'equation', value: `y² = ${num(4 * a)}x` },
      { label: 'focus / directrix', value: `(${num(a)}, 0) / x = ${num(-a)}` },
    );
  } else if (kind === 'ellipse') {
    const cFoc = Math.sqrt(Math.abs(a * a - b * b));
    const foci: Vec2[] =
      a >= b
        ? [
            { x: cFoc, y: 0 },
            { x: -cFoc, y: 0 },
          ]
        : [
            { x: 0, y: cFoc },
            { x: 0, y: -cFoc },
          ];
    clear = [
      dotZone({ x: a, y: 0 }),
      dotZone({ x: 0, y: b }),
      ...(cFoc > 0.05
        ? [
            ...foci.map((f) => dotZone(f, 8)),
            clearOfLabel(foci[0]!.x, foci[0]!.y, 'focus', { size: 11, dy: -10 }),
          ]
        : []),
    ];
    scene = (
      <>
        <Ellipse
          center={{ x: 0, y: 0 }}
          rx={a}
          ry={b}
          color={C_CURVE}
          fill={C_CURVE}
          fillOpacity={0.06}
          weight={3}
        />
        {cFoc > 0.05 && foci.map((f, i) => <Dot key={i} x={f.x} y={f.y} r={4} color={C_AUX} />)}
        {cFoc > 0.05 && <Label x={foci[0]!.x} y={foci[0]!.y} text="focus" color={C_AUX} size={11} dy={-10} />}
        <MovableDot
          value={{ x: a, y: 0 }}
          onMove={(p) => setA(Math.max(0.3, sp(p.x)))}
          snap={snap}
          constrain="horizontal"
          color={C_CURVE}
          ariaLabel="semi-axis a, drag along the x-axis"
        />
        <MovableDot
          value={{ x: 0, y: b }}
          onMove={(p) => setB(Math.max(0.3, sp(p.y)))}
          color={C_AUX}
          ariaLabel="semi-axis b, drag along the y-axis"
        />
      </>
    );
    readouts.push(
      { label: 'a, b', value: `${num(a)}, ${num(b)}` },
      { label: 'equation', value: `x²/${num(a * a)} + y²/${num(b * b)} = 1` },
    );
    if (cFoc > 0.05)
      readouts.push({ label: 'foci', value: a >= b ? `(±${num(cFoc)}, 0)` : `(0, ±${num(cFoc)})` });
  } else if (kind === 'hyperbola') {
    const Tt = Math.asinh((Math.abs(view.yMax) + 2) / b);
    const slope = b / a;
    clear = [dotZone({ x: a, y: 0 }), dotZone({ x: 0, y: b })];
    scene = (
      <>
        {showAsymptotes && (
          <>
            <Line from={{ x: 0, y: 0 }} to={{ x: 1, y: slope }} color={C_AUX} weight={1.5} dashed />
            <Line from={{ x: 0, y: 0 }} to={{ x: 1, y: -slope }} color={C_AUX} weight={1.5} dashed />
          </>
        )}
        <Plot.Parametric
          xy={(t) => [a * Math.cosh(t), b * Math.sinh(t)]}
          domain={[-Tt, Tt]}
          color={C_CURVE}
          weight={3}
        />
        <Plot.Parametric
          xy={(t) => [-a * Math.cosh(t), b * Math.sinh(t)]}
          domain={[-Tt, Tt]}
          color={C_CURVE}
          weight={3}
        />
        <MovableDot
          value={{ x: a, y: 0 }}
          onMove={(p) => setA(Math.max(0.3, sp(p.x)))}
          color={C_CURVE}
          ariaLabel="vertex, drag to set a"
        />
        <MovableDot
          value={{ x: 0, y: b }}
          onMove={(p) => setB(Math.max(0.3, sp(p.y)))}
          color={C_AUX}
          ariaLabel="conjugate handle, drag to set b"
        />
      </>
    );
    readouts.push(
      { label: 'a, b', value: `${num(a)}, ${num(b)}` },
      { label: 'equation', value: `x²/${num(a * a)} − y²/${num(b * b)} = 1` },
      { label: 'asymptotes', value: `y = ±${num(slope)}x` },
    );
  } else {
    // rectangular xy = c → y = c/x, two branches; drag a point on one branch
    const x0 = 2;
    const handle: Vec2 = { x: x0, y: cc / x0 };
    const xm = Math.max(Math.abs(view.xMin), view.xMax);
    clear = [dotZone(handle)];
    scene = (
      <>
        <Plot.Parametric xy={(t) => [t, cc / t]} domain={[0.001, xm]} color={C_CURVE} weight={3} />
        <Plot.Parametric xy={(t) => [t, cc / t]} domain={[-xm, -0.001]} color={C_CURVE} weight={3} />
        <MovableDot
          value={handle}
          onMove={(p) => {
            const x = Math.abs(p.x) < 0.4 ? 0.4 : p.x;
            setCc(sp(x * p.y) || 1);
          }}
          color={C_CURVE}
          ariaLabel="point on the curve, drag to set c"
        />
      </>
    );
    readouts.push(
      { label: 'c', value: num(cc) },
      { label: 'equation', value: `x·y = ${num(cc)}` },
      { label: 'as a function', value: `y = ${num(cc)}/x` },
    );
  }

  const figure = (
    <CoordPlane
      view={view}
      height={height}
      keepClear={clear}
      ariaLabel={`${title}: ${readouts[1]?.value ?? ''}`}
    >
      {scene}
    </CoordPlane>
  );

  const aside = (
    <StatList>
      {readouts.map((r, i) => (
        <Stat key={i} label={r.label} value={r.value} />
      ))}
    </StatList>
  );

  const footer = ask ? <LabAsk ask={ask} activity={activity} /> : undefined;

  const currentEquation =
    readouts.find((item) => item.label === 'equation')?.value ?? readouts[0]?.value ?? '';

  return (
    <Activity.Root>
      <Activity.Header>
        <Activity.Heading eyebrow="Coordinate geometry" title={title} description={prompt} />
        <Activity.FocusButton />
      </Activity.Header>
      <Activity.Status>
        <strong>{kind}</strong>
        <span>{currentEquation}</span>
      </Activity.Status>
      <Activity.Workspace>
        <Activity.Canvas label="Interactive conic graph">{figure}</Activity.Canvas>
        <Activity.Inspector label="Conic measurements">{aside}</Activity.Inspector>
      </Activity.Workspace>
      <Activity.Feedback>
        <span>Observe</span>
        <div>Drag the highlighted handles and compare the curve with its defining measurements.</div>
      </Activity.Feedback>
      {footer ? (
        <section className="lab-authored-task" aria-label="Conic question">
          {footer}
        </section>
      ) : null}
      <Activity.LiveRegion>
        {title}: {currentEquation}.
      </Activity.LiveRegion>
      <Activity.Transport>
        <div className="lab-transport-state">
          <strong>Explore the {kind}</strong>
          <span>{currentEquation}</span>
        </div>
      </Activity.Transport>
    </Activity.Root>
  );
}
