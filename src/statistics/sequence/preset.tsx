'use client';

/**
 * SequenceLab — arithmetic & geometric sequences you can watch grow. Each term is
 * a bar (the pattern: a steady ladder for arithmetic, an explosion or a fading
 * tail for geometric); a line traces the RUNNING TOTAL across them. The magic
 * moment is geometric convergence: when |r|<1 the running-total line flattens onto
 * a dashed S∞ guide — an infinite sum with a finite answer, seen, not just stated.
 *
 * Closed forms come from the sequences kernel and are shown (KaTeX) beside the
 * brute running total, so formula and picture are provably the same thing.
 */

import { useMemo, useState, type ReactNode } from 'react';
import { type SeqKind, type SeqSpec, nthTerm, terms, partialSum, partialSums, infiniteSum } from '../core/sequences.js';
import { Tex } from '../../core/tex.js';
import { Chip, Slider } from '../../kit/controls.js';
import { useHints, HintLadder } from '../../kit/pedagogy.js';
import { LabFrame, ControlBar, Field } from '../../kit/frame.js';
import { useControlSurface } from '@classytic/stage';

export interface SequenceProps {
  kind?: SeqKind;
  first?: number;
  step?: number;
  count?: number;
  title?: string;
  prompt?: string;
  objectives?: string[];
  hints?: string[];
  controlId?: string;
}

const W = 540, H = 250, ML = 36, MR = 16, MT = 20, MB = 30;
const PW = W - ML - MR, PH = H - MT - MB;
const r2 = (x: number): number => Math.round(x * 100) / 100;
const fnum = (x: number): string => (Number.isInteger(x) ? String(x) : r2(x).toString());

export function SequenceLab({ kind = 'geometric', first = 1, step = 0.5, count = 8, title = 'Sequences & series', prompt, objectives, hints: hintList, controlId }: SequenceProps): ReactNode {
  const [k, setK] = useState<SeqKind>(kind);
  const [a1, setA1] = useState(first);
  const [d, setD] = useState(step);
  const [n, setN] = useState(count);
  const hints = useHints(hintList);

  const spec: SeqSpec = { kind: k, first: a1, step: d };
  const ts = useMemo(() => terms(spec, n), [k, a1, d, n]);
  const sums = useMemo(() => partialSums(spec, n), [k, a1, d, n]);
  const sInf = infiniteSum(spec);
  const Sn = partialSum(spec, n);

  const all = [0, ...ts, ...sums, ...(sInf != null ? [sInf] : [])];
  const yMax = Math.max(...all), yMin = Math.min(...all);
  const pad = (yMax - yMin) * 0.08 || 1;
  const yLo = yMin - pad, yHi = yMax + pad;
  const yOf = (v: number): number => MT + PH - ((v - yLo) / (yHi - yLo)) * PH;
  const colW = PW / n;
  const cx = (i: number): number => ML + colW * (i + 0.5);
  const y0 = yOf(0);

  useControlSurface(controlId, {
    kind: { type: 'enum', label: 'sequence kind', options: ['arithmetic', 'geometric'], get: () => k, set: (v: string) => setK(v as SeqKind) },
    first: { type: 'number', label: 'first term a₁', min: -5, max: 10, step: 0.5, get: () => a1, set: setA1 },
    step: { type: 'number', label: k === 'arithmetic' ? 'common difference d' : 'common ratio r', min: k === 'arithmetic' ? -5 : -2, max: k === 'arithmetic' ? 5 : 2, step: k === 'arithmetic' ? 1 : 0.1, get: () => d, set: setD },
    count: { type: 'number', label: 'how many terms', min: 2, max: 16, step: 1, get: () => n, set: setN },
  });

  const isArith = k === 'arithmetic';
  const termTex = isArith ? `a_n = ${fnum(a1)} + (n-1)\\cdot ${fnum(d)}` : `a_n = ${fnum(a1)}\\cdot (${fnum(d)})^{\\,n-1}`;
  const sumTex = isArith ? `S_n = \\tfrac{n}{2}\\,(2a_1+(n-1)d)` : `S_n = a_1\\dfrac{1-r^{\\,n}}{1-r}`;

  const figure = (
    <>
      <div className="lab-bar" style={{ gap: 8, flexWrap: 'wrap' }}>
        <Chip selected={isArith} onClick={() => setK('arithmetic')}>arithmetic (+d)</Chip>
        <Chip selected={!isArith} onClick={() => setK('geometric')}>geometric (×r)</Chip>
      </div>

      <div style={{ borderRadius: 14, background: 'var(--stage-bg)', border: '1px solid var(--stage-grid)', padding: 8 }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: W, height: 'auto', display: 'block' }} role="img" aria-label={`${k} sequence, ${n} terms, running total ${fnum(Sn)}`}>
          {/* zero axis */}
          <line x1={ML} y1={y0} x2={W - MR} y2={y0} stroke="var(--stage-muted)" strokeWidth={1} />
          {/* S∞ guide (convergent geometric) */}
          {sInf != null && (
            <>
              <line x1={ML} y1={yOf(sInf)} x2={W - MR} y2={yOf(sInf)} stroke="var(--stage-good)" strokeWidth={1.5} strokeDasharray="6 5" />
              <text x={W - MR} y={yOf(sInf) - 5} textAnchor="end" fontSize={11} fontWeight={700} fill="var(--stage-good)">S∞ = {fnum(sInf)}</text>
            </>
          )}
          {/* term bars */}
          {ts.map((t, i) => {
            const bw = Math.min(28, colW * 0.5);
            const top = Math.min(yOf(t), y0), h = Math.abs(yOf(t) - y0);
            return (
              <g key={i}>
                <rect x={cx(i) - bw / 2} y={top} width={bw} height={Math.max(0.5, h)} rx={3} fill="color-mix(in oklab, var(--stage-accent) 78%, transparent)" />
                <text x={cx(i)} y={y0 + (t >= 0 ? 14 : -6)} textAnchor="middle" fontSize={10} fill="var(--stage-muted)">{i + 1}</text>
              </g>
            );
          })}
          {/* running-total line + dots */}
          <polyline points={sums.map((s, i) => `${cx(i)},${yOf(s)}`).join(' ')} fill="none" stroke="var(--stage-good)" strokeWidth={2.5} />
          {sums.map((s, i) => <circle key={i} cx={cx(i)} cy={yOf(s)} r={3} fill="var(--stage-good)" />)}
        </svg>
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center', margin: '10px 0', fontVariantNumeric: 'tabular-nums' }}>
        <span><Tex tex={termTex} /></span>
        <span style={{ color: 'var(--stage-accent)', fontWeight: 700 }}><Tex tex={`a_{${n}} = ${fnum(nthTerm(spec, n))}`} /></span>
        <span style={{ color: 'var(--stage-good)', fontWeight: 700 }}><Tex tex={`S_{${n}} = ${fnum(Sn)}`} /></span>
        {sInf != null ? <span style={{ color: 'var(--stage-good)', fontWeight: 700 }}><Tex tex={`S_\\infty = ${fnum(sInf)}`} /></span>
          : !isArith && <span style={{ color: 'var(--stage-bad)', fontWeight: 600 }}>diverges (<Tex tex="|r| \\ge 1" />)</span>}
      </div>
    </>
  );

  const controls = (
    <ControlBar>
      <Field label="a₁" value={fnum(a1)}><Slider value={a1} min={-5} max={10} step={0.5} onChange={setA1} ariaLabel="first term" /></Field>
      <Field label={isArith ? 'd' : 'r'} value={fnum(d)}><Slider value={d} min={isArith ? -5 : -2} max={isArith ? 5 : 2} step={isArith ? 1 : 0.1} onChange={setD} ariaLabel={isArith ? 'common difference' : 'common ratio'} /></Field>
      <Field label="terms" value={n}><Slider value={n} min={2} max={16} step={1} onChange={setN} ariaLabel="number of terms" /></Field>
    </ControlBar>
  );

  const footer = (
    <>
      <p style={{ fontSize: 12.5, color: 'var(--stage-muted)', marginTop: 4 }}><Tex tex={sumTex} />{!isArith && <> — with <Tex tex="|r| < 1" /> the tail shrinks to nothing, so the total converges.</>}</p>
      <HintLadder hints={hints} />
    </>
  );

  return <LabFrame title={title} prompt={prompt} objectives={objectives} controls={controls} footer={footer}>{figure}</LabFrame>;
}
