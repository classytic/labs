'use client';

/**
 * HypergeometricLab — does it matter whether you put the ball back? Same urn (K
 * winners in N), draw n, and compare the two distributions of "how many winners":
 *   • WITH replacement  → binomial   C(n,k) pᵏ(1−p)ⁿ⁻ᵏ,  p = K/N  (draws independent)
 *   • WITHOUT            → hypergeometric  C(K,k)·C(N−K,n−k) / C(N,n)
 * Drawn as paired bars. The lesson lives in the difference: without replacement is
 * NARROWER (each draw shifts the odds — a finite-population correction (N−n)/(N−1)),
 * but as the population N grows huge the two distributions merge (taking one ball
 * barely changes the mix). Both share the same mean n·K/N.
 *
 * Card hands & quality-control are hypergeometric; coin/dice repeats are binomial.
 */

import { useMemo, useState, type ReactNode } from 'react';
import { nCr } from '../core/combinatorics.js';
import { Chip, Slider } from '../../kit/controls.js';
import { LabFrame, ControlBar, Field, Callout } from '../../kit/frame.js';
import { useHints, HintLadder } from '../../kit/pedagogy.js';
import { useControlSurface } from '@classytic/stage';
import { Tex } from '../../core/tex.js';

export interface HypergeometricProps {
  N?: number;
  K?: number;
  n?: number;
  title?: string;
  prompt?: string;
  objectives?: string[];
  hints?: string[];
  controlId?: string;
}

const W = 540, H = 300, ML = 30, MR = 14, MT = 16, MB = 34;
const PW = W - ML - MR, PH = H - MT - MB;
const BIN = 'var(--stage-accent)', HYP = 'var(--stage-warn)';
const f3 = (x: number): string => (x < 0.0005 && x > 0 ? x.toExponential(1) : x.toFixed(3));

export function HypergeometricLab({ N: N0 = 10, K: K0 = 4, n: n0 = 3, title = 'With vs without replacement', prompt, objectives, hints: hintList, controlId }: HypergeometricProps): ReactNode {
  const [N, setN] = useState(N0);
  const [K, setK] = useState(K0);
  const [n, setN_] = useState(n0);
  const [sel, setSel] = useState<number | null>(null);
  const hints = useHints(hintList);

  const Kc = Math.min(K, N), nc = Math.min(n, N);
  const p = Kc / N;
  const bin = useMemo(() => Array.from({ length: nc + 1 }, (_, k) => nCr(nc, k) * p ** k * (1 - p) ** (nc - k)), [nc, p]);
  const hyp = useMemo(() => Array.from({ length: nc + 1 }, (_, k) => (k <= Kc && nc - k <= N - Kc ? nCr(Kc, k) * nCr(N - Kc, nc - k) / nCr(N, nc) : 0)), [N, Kc, nc]);
  const mean = nc * p;
  const varBin = nc * p * (1 - p), varHyp = varBin * (N - nc) / (N - 1 || 1);
  const yMax = Math.max(...bin, ...hyp) * 1.1 || 1;

  const colW = PW / (nc + 1);
  const xOf = (k: number): number => ML + (k + 0.5) * colW;
  const yOf = (v: number): number => MT + PH - (v / yMax) * PH;
  const bw = Math.min(20, colW * 0.36);

  useControlSurface(controlId, {
    N: { type: 'number', label: 'population N', min: 2, max: 60, step: 1, get: () => N, set: (v) => setN(Math.round(v)) },
    K: { type: 'number', label: 'winners K', min: 0, max: N, step: 1, get: () => K, set: (v) => setK(Math.round(v)) },
    n: { type: 'number', label: 'draw n', min: 1, max: N, step: 1, get: () => n, set: (v) => setN_(Math.round(v)) },
    inspect: { type: 'number', label: 'inspect k', min: -1, max: nc, step: 1, get: () => sel ?? -1, set: (v) => setSel(v < 0 ? null : Math.round(v)) },
  });

  const figure = (
    <div style={{ borderRadius: 14, background: 'var(--stage-bg)', border: '1px solid var(--stage-grid)', padding: 8 }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: W, height: 'auto', display: 'block' }} role="img" aria-label={`binomial vs hypergeometric, N${N} K${Kc} n${nc}`}>
        {bin.map((_, k) => (
          <g key={k} onClick={() => setSel(sel === k ? null : k)} style={{ cursor: 'pointer' }}>
            <rect x={xOf(k) - colW / 2} y={MT} width={colW} height={PH} fill={sel === k ? 'color-mix(in oklab, var(--stage-fg) 6%, transparent)' : 'transparent'} />
            <rect x={xOf(k) - bw - 1} y={yOf(bin[k]!)} width={bw} height={Math.max(0, MT + PH - yOf(bin[k]!))} rx={2} fill={BIN} opacity={0.85} />
            <rect x={xOf(k) + 1} y={yOf(hyp[k]!)} width={bw} height={Math.max(0, MT + PH - yOf(hyp[k]!))} rx={2} fill={HYP} opacity={0.9} />
          </g>
        ))}
        <line x1={ML} y1={MT + PH} x2={W - MR} y2={MT + PH} stroke="var(--stage-fg)" strokeWidth={1.5} />
        {bin.map((_, k) => <text key={k} x={xOf(k)} y={MT + PH + 14} textAnchor="middle" fontSize={10} fill="var(--stage-muted)">{k}</text>)}
        <line x1={xOf(mean)} y1={MT} x2={xOf(mean)} y2={MT + PH} stroke="var(--stage-good)" strokeWidth={1.5} strokeDasharray="4 3" />
        <text x={xOf(mean)} y={MT + 9} textAnchor="middle" fontSize={10} fontWeight={700} fill="var(--stage-good)">μ={mean.toFixed(1)}</text>
        {/* legend */}
        <rect x={W - 150} y={MT + 2} width={10} height={10} fill={BIN} /><text x={W - 136} y={MT + 11} fontSize={10} fill="var(--stage-fg)">with (binomial)</text>
        <rect x={W - 150} y={MT + 16} width={10} height={10} fill={HYP} /><text x={W - 136} y={MT + 25} fontSize={10} fill="var(--stage-fg)">without (hyper)</text>
      </svg>
    </div>
  );

  const aside = (
    <>
      <Callout tone="result">
        <span style={{ fontSize: 12, color: 'var(--stage-muted)', fontWeight: 600 }}>spread (variance)</span>
        <span style={{ fontSize: 15, fontWeight: 800 }}><span style={{ color: BIN }}>{varBin.toFixed(2)}</span> vs <span style={{ color: HYP }}>{varHyp.toFixed(2)}</span></span>
        <span style={{ fontSize: 12, color: 'var(--stage-muted)' }}>same <Tex tex={`\\mu = n \\cdot K / N = ${mean.toFixed(2)}`} /></span>
      </Callout>
      {sel != null ? (
        <div style={{ fontSize: 13, padding: '8px 10px', borderRadius: 9, background: 'color-mix(in oklab, var(--stage-fg) 5%, transparent)', display: 'grid', gap: 4 }}>
          <b>P(exactly {sel} winners)</b>
          <span style={{ color: BIN }}>with: <Tex tex={`C(${nc},${sel}) \\cdot ${p.toFixed(2)}^{${sel}} \\cdot ${(1 - p).toFixed(2)}^{${nc - sel}} = ${f3(bin[sel]!)}`} /></span>
          <span style={{ color: HYP }}>without: <Tex tex={`C(${Kc},${sel}) \\cdot C(${N - Kc},${nc - sel}) / C(${N},${nc}) = ${f3(hyp[sel]!)}`} /></span>
        </div>
      ) : <p className="lab-prompt" style={{ fontSize: 13 }}>Click a bar to compare the two probabilities. The blue (with replacement) is always a touch wider than the orange (without).</p>}
    </>
  );

  const controls = (
    <ControlBar>
      <Field label="population N" value={N}><Slider value={N} min={2} max={60} step={1} onChange={(v) => { setN(v); if (K > v) setK(v); if (n > v) setN_(v); }} ariaLabel="population" /></Field>
      <Field label="winners K" value={Kc}><Slider value={Kc} min={0} max={N} step={1} onChange={setK} ariaLabel="winners" /></Field>
      <Field label="draw n" value={nc}><Slider value={nc} min={1} max={N} step={1} onChange={setN_} ariaLabel="draw size" /></Field>
    </ControlBar>
  );

  const footer = (
    <>
      <p className="lab-prompt" style={{ fontSize: 12.5, color: 'var(--stage-muted)' }}>
        Without replacement is narrower by the factor (N−n)/(N−1) = {((N - nc) / (N - 1 || 1)).toFixed(2)}. Push N up (with K/N fixed) and the bars converge — for a huge population, taking one out barely changes the odds.
      </p>
      <HintLadder hints={hints} />
    </>
  );

  return <LabFrame title={title} prompt={prompt} objectives={objectives} aside={aside} controls={controls} footer={footer}>{figure}</LabFrame>;
}
