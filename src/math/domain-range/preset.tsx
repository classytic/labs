'use client';

/**
 * DomainRangeLab, domain & range as SHADOWS. The big idea students miss is that
 * domain/range aren't formulas to memorise; they're what you SEE when you let the
 * curve cast two shadows:
 *
 *   • shine a light from ABOVE → the curve's shadow on the x-axis is the DOMAIN
 *     (every input the function actually accepts), and
 *   • shine a light from the SIDE → the shadow on the y-axis is the RANGE
 *     (every output it can produce).
 *
 * On top of that, a "feed the machine" game: drag the input probe along the
 * x-axis, it turns GREEN when the machine accepts the input (in the domain) and
 * RED "undefined" when it doesn't (a pole like 1/(x−2), a √ of a negative, or an
 * author-set restriction). So the SAME lab teaches every domain TYPE just by
 * changing the expression: x² (range ≥ 0), √x (x ≥ 0), 1/x (x ≠ 0), √(9−x²)
 * (the semicircle: domain [−3,3], range [0,3]), or a restricted interval.
 *
 * Built on the shared CoordPlane + the stage expr engine; authorable via props
 * (equation, an optional domain restriction, a checked question).
 */

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Plot, Segment, Dot, MovableDot, Label, compileExpr } from '@classytic/stage';
import { LabFrame, Callout } from '../../kit/frame.js';
import { LabAsk, type LabAskSpec } from '../../kit/ask.js';
import { useCheckpoint } from '../../kit/pedagogy.js';
import { CoordPlane, num } from '../../kit/coords.js';
import { clamp } from '../../core/util.js';

export interface DomainRangeProps {
  /** The function f(x): e.g. 'x^2', 'sqrt(x)', '1/(x-2)', 'sqrt(9 - x^2)', 'log(x)'. */
  equation?: string;
  xRange?: [number, number];
  yRange?: [number, number] | 'auto';
  /** Optional author-set domain restriction [a, b], inputs outside are "undefined". */
  restrict?: [number, number];
  /** Initial probe position on the input axis. */
  probe?: number;
  title?: string;
  prompt?: string;
  ask?: LabAskSpec;
  height?: number;
  activity?: string;
}

const C_DOMAIN = 'var(--stage-accent)';
const C_RANGE = 'var(--stage-accent-2)';
const C_OK = 'var(--stage-good)';
const C_BAD = 'var(--stage-danger)';
const N = 1200;

/** Contiguous covered intervals of a sorted value set (split where the gap exceeds `gap`). */
function coveredIntervals(values: number[], gap: number): [number, number][] {
  const v = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!v.length) return [];
  const out: [number, number][] = [];
  let lo = v[0]!, prev = v[0]!;
  for (let i = 1; i < v.length; i++) {
    const x = v[i]!;
    if (x - prev > gap) { out.push([lo, prev]); lo = x; }
    prev = x;
  }
  out.push([lo, prev]);
  return out;
}

/** Sort + merge overlapping/adjacent intervals. */
function mergeIntervals(iv: ([number, number] | null)[]): [number, number][] {
  const v = iv.filter((x): x is [number, number] => x != null).sort((a, b) => a[0] - b[0]);
  const out: [number, number][] = [];
  for (const [a, b] of v) {
    const last = out[out.length - 1];
    if (last && a <= last[1] + 1e-6) last[1] = Math.max(last[1], b);
    else out.push([a, b]);
  }
  return out;
}

const fmtIntervals = (rs: [number, number][], eps: number): string =>
  rs.length ? rs.map(([a, b]) => (b - a < eps ? `{${num(a)}}` : `[${num(a)}, ${num(b)}]`)).join(' ∪ ') : ', ';

export function DomainRangeLab({
  equation = 'sqrt(9 - x^2)', xRange = [-6, 6], yRange = 'auto', restrict, probe,
  title = 'Domain and range: the two shadows',
  prompt = 'Drag the input probe: green = the machine accepts it (in the domain), red = undefined. The blue strip is every allowed input; the orange strip is every output.',
  ask, height = 400, activity = 'domain-range',
}: DomainRangeProps = {}): ReactNode {
  const [x0, x1] = xRange;
  const compiled = (() => { const c = compileExpr(equation); return c.error !== undefined ? null : c; })();
  const inRestrict = (x: number): boolean => !restrict || (x >= restrict[0] - 1e-9 && x <= restrict[1] + 1e-9);
  const f = (x: number): number => (compiled && inRestrict(x) ? compiled.fn({ x }) : NaN);

  // sample the curve → the two shadows
  const dx = (x1 - x0) / N;
  const pts: [number, number][] = [];
  for (let i = 0; i <= N; i++) {
    const x = x0 + i * dx;
    const y = f(x);
    if (Number.isFinite(y)) pts.push([x, y]);
  }

  // auto y-window, robust to poles via a 2–98% percentile clamp
  const [yMin, yMax] = (() => {
    if (yRange !== 'auto') return yRange;
    if (!pts.length) return [-6, 6] as [number, number];
    const s = pts.map((p) => p[1]).sort((a, b) => a - b);
    const lo = Math.min(0, s[Math.floor(s.length * 0.02)] ?? -1);
    const hi = Math.max(0, s[Math.floor(s.length * 0.98)] ?? 1);
    const pad = Math.max(1, (hi - lo) * 0.12);
    return [lo - pad, hi + pad] as [number, number];
  })();

  // DOMAIN: the inputs whose output doesn't blow past the window, so a pole opens a gap.
  const yCap = Math.max(Math.abs(yMin), Math.abs(yMax)) * 3.5;
  const domain = coveredIntervals(pts.filter(([, y]) => Math.abs(y) <= yCap).map(([x]) => x), dx * 2.5);

  // RANGE: a continuous domain piece covers [min, max] of its visible outputs (IVT), union the pieces.
  const range = mergeIntervals(domain.map(([a, b]): [number, number] | null => {
    let mn = Infinity, mx = -Infinity;
    for (const [x, y] of pts) if (x >= a - 1e-9 && x <= b + 1e-9 && y >= yMin && y <= yMax) { if (y < mn) mn = y; if (y > mx) mx = y; }
    return Number.isFinite(mn) ? [mn, mx] : null;
  }));

  // the probe (a candidate input)
  const px = clamp(probe ?? (x0 + x1) / 2, x0, x1);
  const [pxState, setPx] = useState(px);
  const pX = clamp(pxState, x0, x1);
  const pY = f(pX);
  const accepted = Number.isFinite(pY);

  // Completion: the learner has SWEPT the probe across a good span of the visible
  // domain (>=60% of the x-window), having visited where the function is and isn't
  // defined. Track the visited x-extent in a ref; flip solved once the span is wide enough.
  const visited = useRef({ min: pX, max: pX });
  const [swept, setSwept] = useState(false);
  useEffect(() => {
    const v = visited.current;
    if (pX < v.min) v.min = pX;
    if (pX > v.max) v.max = pX;
    if (!swept && v.max - v.min >= (x1 - x0) * 0.6) setSwept(true);
  }, [pX, swept, x0, x1]);

  useCheckpoint({ solved: swept, activity });

  const figure = (
    <CoordPlane view={{ xMin: x0, xMax: x1, yMin: yMin, yMax: yMax }} height={height} preserveAspect={false} ariaLabel={`Domain and range of ${equation}`}>
      {/* the curve */}
      {compiled && <Plot.OfX y={f} color="var(--stage-fg)" weight={2.5} />}

      {/* DOMAIN shadow, bold strip(s) on the x-axis */}
      {domain.map(([a, b], i) => <Segment key={`d${i}`} from={{ x: a, y: 0 }} to={{ x: b, y: 0 }} color={C_DOMAIN} weight={7} />)}
      {domain.length > 0 && <Label x={domain[0]![0]} y={0} text="domain" color={C_DOMAIN} size={12} dy={18} dx={2} anchor="start" />}

      {/* RANGE shadow, bold strip(s) on the y-axis */}
      {range.map(([a, b], i) => <Segment key={`r${i}`} from={{ x: 0, y: a }} to={{ x: 0, y: b }} color={C_RANGE} weight={7} />)}
      {range.length > 0 && <Label x={0} y={range[range.length - 1]![1]} text="range" color={C_RANGE} size={12} dx={10} anchor="start" />}

      {/* the probe: input → output L-path when accepted; red marker when not */}
      {accepted ? (
        <>
          <Segment from={{ x: pX, y: 0 }} to={{ x: pX, y: pY }} color={C_OK} weight={1.5} dashed />
          <Segment from={{ x: pX, y: pY }} to={{ x: 0, y: pY }} color={C_OK} weight={1.5} dashed />
          <Dot x={pX} y={pY} r={5} color={C_OK} />
          <Dot x={0} y={pY} r={5} color={C_RANGE} />
        </>
      ) : (
        <>
          <Segment from={{ x: pX, y: yMin }} to={{ x: pX, y: yMax }} color={C_BAD} weight={1.5} dashed />
          <Label x={pX} y={(yMin + yMax) / 2} text="undefined" color={C_BAD} size={12} dx={8} anchor="start" />
        </>
      )}
      <MovableDot value={{ x: pX, y: 0 }} onMove={(p) => setPx(clamp(p.x, x0, x1))} constrain="horizontal" color={accepted ? C_OK : C_BAD} ariaLabel="input probe, drag along the x-axis" />
    </CoordPlane>
  );

  const aside = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div className="lab-pill" data-state={accepted ? 'ok' : 'no'} role="status" style={{ alignSelf: 'flex-start' }}>
        {accepted ? `✓ f(${num(pX)}) = ${num(pY)}, accepted` : `✗ x = ${num(pX)} is not in the domain`}
      </div>
      <Callout tone="result">
        <div style={{ display: 'grid', gap: 6, fontVariantNumeric: 'tabular-nums', fontSize: 13 }}>
          <span>f(x) = <strong>{equation}</strong></span>
          <span style={{ color: C_DOMAIN }}>domain: <strong>{fmtIntervals(domain, dx * 3)}</strong></span>
          <span style={{ color: C_RANGE }}>range: <strong>{fmtIntervals(range, (yMax - yMin) * 0.05)}</strong></span>
          {restrict && <span style={{ color: 'var(--stage-muted)' }}>restricted to [{num(restrict[0])}, {num(restrict[1])}]</span>}
        </div>
      </Callout>
    </div>
  );

  const footer = ask ? <LabAsk ask={ask} activity={activity} /> : undefined;

  return <LabFrame title={title} prompt={prompt} aside={aside} footer={footer}>{figure}</LabFrame>;
}
