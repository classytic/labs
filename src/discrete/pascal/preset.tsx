'use client';

/**
 * PascalTriangleLab — where counting, the binomial theorem, and a fractal meet. The
 * triangle is built live by the one rule that defines it — each cell is the SUM of
 * the two above — and every cell is also C(n,k): the number of ways to choose k of
 * n (so the counting labs and this are the same numbers). Click a cell to see the
 * two parents add into it AND its three identities (combination · path count ·
 * binomial coefficient). Pick the binomial view and a whole ROW becomes the
 * expansion (a+b)ⁿ. Flip "odd/even" and the triangle blooms into the Sierpiński
 * triangle — the wow that shows structure hides in plain arithmetic.
 *
 * Values come from nCr (kernel), but the recurrence is what's shown — the formula
 * is derived by the picture, not stated.
 */

import { useMemo, useState, type ReactNode } from 'react';
import { nCr } from '../core/combinatorics.js';
import { Tex } from '../../core/tex.js';
import { Chip, Slider } from '../../kit/controls.js';
import { LabFrame, ControlBar, Field, Callout } from '../../kit/frame.js';
import { useHints, HintLadder } from '../../kit/pedagogy.js';
import { useControlSurface } from '@classytic/stage';

export type PascalView = 'build' | 'binomial' | 'parity';
export interface PascalProps {
  rows?: number;
  view?: PascalView;
  title?: string;
  prompt?: string;
  objectives?: string[];
  hints?: string[];
  controlId?: string;
}

const CW = 46, RH = 42, R = 18, PAD = 22;
const ACC = 'var(--stage-accent)', GOOD = 'var(--stage-good)', WARN = 'var(--stage-warn)';

function expansionTex(n: number): string {
  const terms: string[] = [];
  for (let k = 0; k <= n; k++) {
    const c = nCr(n, k), ai = n - k, bi = k;
    let t = c === 1 ? '' : String(c);
    if (ai > 0) t += ai === 1 ? 'a' : `a^{${ai}}`;
    if (bi > 0) t += bi === 1 ? 'b' : `b^{${bi}}`;
    terms.push(t || '1');
  }
  return `(a+b)^{${n}} = ${terms.join(' + ')}`;
}

export function PascalTriangleLab({ rows = 7, view: view0 = 'build', title = "Pascal's triangle", prompt, objectives, hints: hintList, controlId }: PascalProps): ReactNode {
  const [N, setN] = useState(rows);                 // last row index
  const [view, setView] = useState<PascalView>(view0);
  const [sel, setSel] = useState<{ n: number; k: number } | null>({ n: 4, k: 2 });
  const hints = useHints(hintList);

  const vbW = N * CW + 2 * R + 40, vbH = PAD + (N + 1) * RH + 10;
  const cx = (n: number, k: number): number => vbW / 2 + (k - n / 2) * CW;
  const cy = (n: number): number => PAD + R + n * RH;

  const selRow = sel?.n ?? -1;
  const parents = useMemo(() => {
    if (!sel || sel.n === 0) return null;
    const l = sel.k - 1 >= 0 && sel.k - 1 <= sel.n - 1 ? { n: sel.n - 1, k: sel.k - 1 } : null;
    const r = sel.k <= sel.n - 1 ? { n: sel.n - 1, k: sel.k } : null;
    return { l, r };
  }, [sel]);

  useControlSurface(controlId, {
    rows: { type: 'number', label: 'rows', min: 3, max: 14, step: 1, get: () => N, set: (v) => setN(Math.round(v)) },
    view: { type: 'enum', label: 'view', options: ['build', 'binomial', 'parity'], get: () => view, set: (v) => setView(v as PascalView) },
  });

  const cells: ReactNode[] = [];
  for (let n = 0; n <= N; n++) for (let k = 0; k <= n; k++) {
    const v = nCr(n, k);
    const odd = v % 2 === 1;
    const isSel = sel?.n === n && sel?.k === k;
    const isParent = parents && ((parents.l?.n === n && parents.l?.k === k) || (parents.r?.n === n && parents.r?.k === k));
    const inRow = view === 'binomial' && n === selRow;
    let fill = 'var(--stage-bg)', stroke = 'var(--stage-grid)', txt = 'var(--stage-fg)';
    if (view === 'parity') { fill = odd ? ACC : 'transparent'; stroke = odd ? ACC : 'color-mix(in oklab, var(--stage-grid) 50%, transparent)'; txt = odd ? 'white' : 'var(--stage-muted)'; }
    if (isParent) { fill = `color-mix(in oklab, ${WARN} 22%, var(--stage-bg))`; stroke = WARN; }
    if (inRow) { fill = `color-mix(in oklab, ${ACC} 14%, var(--stage-bg))`; stroke = ACC; }
    if (isSel) { fill = GOOD; stroke = GOOD; txt = 'white'; }
    const digits = String(v).length;
    cells.push(
      <g key={`${n}-${k}`} onClick={() => setSel({ n, k })} style={{ cursor: 'pointer' }}>
        <circle cx={cx(n, k)} cy={cy(n)} r={R} fill={fill} stroke={stroke} strokeWidth={isSel || isParent ? 2.5 : 1.3} />
        {(view !== 'parity' || odd) && <text x={cx(n, k)} y={cy(n)} textAnchor="middle" dominantBaseline="central" fontSize={Math.max(9, 15 - (digits - 1) * 2)} fontWeight={isSel ? 800 : 600} fill={txt} style={{ pointerEvents: 'none' }}>{v}</text>}
      </g>,
    );
  }
  // parent → child "+" arrows for the selected cell
  const arrows: ReactNode[] = [];
  if (parents && sel) {
    for (const p of [parents.l, parents.r]) if (p) arrows.push(
      <line key={`a${p.k}`} x1={cx(p.n, p.k)} y1={cy(p.n) + R} x2={cx(sel.n, sel.k)} y2={cy(sel.n) - R} stroke={WARN} strokeWidth={2} markerEnd="url(#stage-arrow)" />,
    );
  }

  const figure = (
    <div style={{ borderRadius: 14, background: 'var(--stage-bg)', border: '1px solid var(--stage-grid)', padding: 8 }}>
      <svg viewBox={`0 0 ${vbW} ${vbH}`} style={{ width: '100%', maxWidth: vbW, height: 'auto', display: 'block' }} role="img" aria-label={`Pascal's triangle, ${N + 1} rows`}>
        <defs><marker id="stage-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill={WARN} /></marker></defs>
        {arrows}
        {cells}
      </svg>
    </div>
  );

  const aside = sel ? (
    <>
      <Callout tone="result">
        <span style={{ fontSize: 12, color: 'var(--stage-muted)', fontWeight: 600 }}>cell (row {sel.n}, position {sel.k})</span>
        <span className="lab-callout-big">{nCr(sel.n, sel.k)}</span>
        <span style={{ fontSize: 12, color: 'var(--stage-muted)' }}>C({sel.n},{sel.k})</span>
      </Callout>
      <div style={{ display: 'grid', gap: 6, fontSize: 13.5 }}>
        {parents && (parents.l || parents.r)
          ? <p style={{ margin: 0 }}>📐 sum of the two above: <b>{parents.l ? nCr(parents.l.n, parents.l.k) : 0} + {parents.r ? nCr(parents.r.n, parents.r.k) : 0} = {nCr(sel.n, sel.k)}</b></p>
          : <p style={{ margin: 0 }}>📐 an edge — always <b>1</b> (one way).</p>}
        <p style={{ margin: 0 }}>🎯 = ways to <b>choose {sel.k} of {sel.n}</b> (C({sel.n},{sel.k}))</p>
        <p style={{ margin: 0 }}>➕ = coefficient of <Tex tex={`a^{${sel.n - sel.k}}b^{${sel.k}}`} /> in (a+b)<sup>{sel.n}</sup></p>
        <p style={{ margin: 0, color: 'var(--stage-muted)' }}>row {sel.n} sums to 2<sup>{sel.n}</sup> = {2 ** sel.n}</p>
      </div>
    </>
  ) : <Callout>Click any cell.</Callout>;

  const footer = (
    <>
      {view === 'binomial' && selRow >= 0 && (
        <div style={{ padding: '8px 12px', borderRadius: 10, background: 'color-mix(in oklab, var(--stage-accent) 8%, transparent)', overflowX: 'auto' }}>
          <Tex tex={expansionTex(selRow)} /> <span style={{ color: 'var(--stage-muted)', fontSize: 12 }}>← row {selRow} of the triangle is the coefficients</span>
        </div>
      )}
      {view === 'parity' && <p className="lab-prompt">Colour only the <b>odd</b> numbers → the <b>Sierpiński triangle</b> appears. Structure hiding inside plain addition.</p>}
      <HintLadder hints={hints} />
    </>
  );

  const controls = (
    <ControlBar>
      <Field label="view"><span style={{ display: 'flex', gap: 6 }}>
        <Chip selected={view === 'build'} onClick={() => setView('build')}>build (sum above)</Chip>
        <Chip selected={view === 'binomial'} onClick={() => setView('binomial')}>(a+b)ⁿ</Chip>
        <Chip selected={view === 'parity'} onClick={() => setView('parity')}>odd/even</Chip>
      </span></Field>
      <Field label="rows" value={N}><Slider value={N} min={3} max={14} step={1} onChange={setN} ariaLabel="rows" /></Field>
    </ControlBar>
  );

  return <LabFrame title={title} prompt={prompt} objectives={objectives} aside={aside} controls={controls} footer={footer}>{figure}</LabFrame>;
}
