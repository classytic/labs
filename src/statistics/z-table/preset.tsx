'use client';

/**
 * ZTableLab — read a z-table like the exam expects, and see what each lookup MEANS.
 * Standardize a raw value (x → z = (x−μ)/σ), then the classic Φ(z) table lights up
 * the row/column and cell for that z, while a mini standard-normal curve shades the
 * matching tail and shows the probability. Click any cell to jump there (and the
 * raw value x updates to stay consistent). Negative z is handled by the symmetry
 * Φ(−z) = 1 − Φ(z), spelled out rather than hidden.
 *
 * Φ comes from the normal kernel (`normalCdf`); the table is just that function laid
 * out as the familiar grid — one source of truth, no transcribed magic numbers.
 */

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { normalCdf, normalPdf, zScore } from '../core/normal.js';
import { Tex } from '../../core/tex.js';
import { Chip } from '../../kit/controls.js';
import { useHints, HintLadder } from '../../kit/pedagogy.js';
import { LabFrame, ControlBar } from '../../kit/frame.js';
import { useControlSurface } from '@classytic/stage';

export type ZTail = 'left' | 'right';
export interface ZTableProps {
  x?: number;
  mu?: number;
  sigma?: number;
  tail?: ZTail;
  title?: string;
  prompt?: string;
  objectives?: string[];
  hints?: string[];
  controlId?: string;
}

const CW = 230, CH = 116, CPAD = 6;
const ROWS = Array.from({ length: 35 }, (_, i) => i / 10);     // 0.0 … 3.4
const COLS = Array.from({ length: 10 }, (_, j) => j / 100);    // .00 … .09
const f2 = (x: number): string => x.toFixed(2);
const f4 = (x: number): string => x.toFixed(4);

export function ZTableLab({ x = 650, mu = 500, sigma = 100, tail = 'left', title = 'The z-table', prompt, objectives, hints: hintList, controlId }: ZTableProps): ReactNode {
  const [xv, setXv] = useState(x);
  const [m, setM] = useState(mu);
  const [sg, setSg] = useState(sigma);
  const [t, setT] = useState<ZTail>(tail);
  const hints = useHints(hintList);

  const z = zScore(xv, m, sg);
  const phi = normalCdf(z);                       // Φ(z) = P(Z ≤ z)
  const prob = t === 'left' ? phi : 1 - phi;
  const zAbs = Math.min(3.49, Math.abs(z));
  const zLook = Math.round(zAbs * 100) / 100;     // table is for |z|; symmetry handles the sign

  // mini standard-normal curve
  const xMinC = -3.5, xMaxC = 3.5, yMaxC = normalPdf(0) * 1.1;
  const cx = (v: number): number => CPAD + ((v - xMinC) / (xMaxC - xMinC)) * (CW - 2 * CPAD);
  const cy = (v: number): number => CH - 16 - (v / yMaxC) * (CH - 26);
  const curve = useMemo(() => Array.from({ length: 121 }, (_, i) => { const v = xMinC + (i / 120) * (xMaxC - xMinC); return `${cx(v).toFixed(1)},${cy(normalPdf(v)).toFixed(1)}`; }).join(' '), []);
  const shade = useMemo(() => {
    const loX = t === 'left' ? xMinC : z, hiX = t === 'left' ? z : xMaxC;
    const a0 = Math.max(xMinC, Math.min(loX, hiX)), a1 = Math.min(xMaxC, Math.max(loX, hiX));
    const pts = [`${cx(a0).toFixed(1)},${cy(0).toFixed(1)}`];
    for (let i = 0; i <= 60; i++) { const v = a0 + (i / 60) * (a1 - a0); pts.push(`${cx(v).toFixed(1)},${cy(normalPdf(v)).toFixed(1)}`); }
    pts.push(`${cx(a1).toFixed(1)},${cy(0).toFixed(1)}`);
    return `M${pts.join(' L')} Z`;
  }, [z, t]);

  const pickCell = (rz: number, cz: number): void => { const zz = (z < 0 ? -1 : 1) * (rz + cz); setXv(Math.round((m + zz * sg) * 100) / 100); };

  // keep the highlighted row scrolled into view INSIDE the table box (no page jump)
  const scrollBox = useRef<HTMLDivElement>(null);
  const selRow = useRef<HTMLTableRowElement>(null);
  useEffect(() => {
    const box = scrollBox.current, row = selRow.current;
    if (!box || !row) return;
    const br = box.getBoundingClientRect(), rr = row.getBoundingClientRect();
    box.scrollTop += (rr.top - br.top) - box.clientHeight / 2 + rr.height / 2;
  }, [zLook]);

  useControlSurface(controlId, {
    x: { type: 'number', label: 'raw value x', min: -10000, max: 10000, step: 1, get: () => xv, set: setXv },
    mu: { type: 'number', label: 'mean μ', min: -10000, max: 10000, step: 1, get: () => m, set: setM },
    sigma: { type: 'number', label: 'std dev σ', min: 0.1, max: 10000, step: 1, get: () => sg, set: setSg },
    tail: { type: 'enum', label: 'tail', options: ['left', 'right'], get: () => t, set: (v) => setT(v as ZTail) },
  });

  const numIn = (val: number, set: (n: number) => void, w = 64): ReactNode => (
    <input type="number" value={Number.isInteger(val) ? val : Number(val.toFixed(2))} onChange={(e) => set(Number(e.target.value))}
      style={{ width: w, padding: '3px 6px', borderRadius: 6, border: '1px solid var(--stage-grid)', background: 'var(--stage-bg)', color: 'var(--stage-fg)', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }} />
  );

  const figure = (
    <>
      {/* standardize → curve */}
      <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', alignItems: 'center', margin: '6px 0' }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', fontSize: 14 }}>
          <span>x = {numIn(xv, setXv)}</span>
          <span style={{ color: 'var(--stage-muted)' }}>from N(<Tex tex="\\mu" />={numIn(m, setM, 56)}, <Tex tex="\\sigma" />={numIn(sg, setSg, 52)})</span>
          <span style={{ fontWeight: 800 }}><Tex tex="\\to z =" /> <span style={{ color: 'var(--stage-accent)' }}>{f2(z)}</span></span>
        </div>
        <div style={{ flex: 1, minWidth: 230, display: 'flex', alignItems: 'center', gap: 12 }}>
          <svg viewBox={`0 0 ${CW} ${CH}`} style={{ width: 230, height: 'auto' }} role="img" aria-label={`standard normal, ${t} tail at z ${f2(z)}, area ${f4(prob)}`}>
            <path d={shade} fill="color-mix(in oklab, var(--stage-accent) 36%, transparent)" />
            <line x1={CPAD} y1={cy(0)} x2={CW - CPAD} y2={cy(0)} stroke="var(--stage-fg)" strokeWidth={1.2} />
            <polyline points={curve} fill="none" stroke="var(--stage-fg)" strokeWidth={2} />
            <line x1={cx(z)} y1={cy(0)} x2={cx(z)} y2={16} stroke="var(--stage-accent)" strokeWidth={1.5} strokeDasharray="4 3" />
            <text x={cx(Math.max(xMinC + 0.4, Math.min(xMaxC - 0.4, z)))} y={CH - 3} textAnchor="middle" fontSize={10} fill="var(--stage-accent)" fontWeight={700}>z={f2(z)}</text>
          </svg>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--stage-good)' }}>{(prob * 100).toFixed(2)}%</div>
            <div style={{ fontSize: 12, color: 'var(--stage-muted)' }}><Tex tex={`P(Z ${t === 'left' ? '\\le' : '\\ge'} ${f2(z)})`} /></div>
          </div>
        </div>
      </div>

      {z < 0 && <p className="lab-prompt" style={{ marginTop: 6 }}>z is negative — the table lists |z|; use symmetry <b><Tex tex={`\\Phi(${f2(z)}) = 1 - \\Phi(${f2(-z)}) = ${f4(phi)}`} /></b>.</p>}

      {/* the z-table */}
      <div ref={scrollBox} style={{ overflow: 'auto', maxHeight: 300, borderRadius: 10, border: '1px solid var(--stage-grid)', marginTop: 8 }}>
        <table style={{ borderCollapse: 'collapse', fontVariantNumeric: 'tabular-nums', fontSize: 11 }}>
          <thead>
            <tr>
              <th style={{ position: 'sticky', top: 0, left: 0, zIndex: 2, background: 'var(--stage-bg)', padding: '4px 6px', borderBottom: '2px solid var(--stage-grid)', color: 'var(--stage-accent)' }}>z</th>
              {COLS.map((c) => <th key={c} style={{ position: 'sticky', top: 0, background: Math.abs((zLook * 100) % 10 / 100 - c) < 0.005 ? 'color-mix(in oklab, var(--stage-accent) 18%, var(--stage-bg))' : 'var(--stage-bg)', padding: '4px 6px', borderBottom: '2px solid var(--stage-grid)', color: 'var(--stage-muted)' }}>.{(c * 100).toFixed(0).padStart(2, '0')}</th>)}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => {
              const rowSel = Math.abs(Math.floor(zLook * 10) / 10 - r) < 0.005;
              return (
                <tr key={r} ref={rowSel ? selRow : undefined}>
                  <td style={{ position: 'sticky', left: 0, background: rowSel ? 'color-mix(in oklab, var(--stage-accent) 18%, var(--stage-bg))' : 'var(--stage-bg)', padding: '3px 6px', fontWeight: 700, color: 'var(--stage-accent)', borderRight: '1px solid var(--stage-grid)' }}>{r.toFixed(1)}</td>
                  {COLS.map((c) => {
                    const cellZ = r + c;
                    const sel = Math.abs(cellZ - zLook) < 0.005;
                    return (
                      <td key={c} onClick={() => pickCell(r, c)}
                        style={{ padding: '3px 6px', textAlign: 'right', cursor: 'pointer', borderBottom: '1px solid color-mix(in oklab, var(--stage-grid) 50%, transparent)',
                          background: sel ? 'var(--stage-good)' : rowSel ? 'color-mix(in oklab, var(--stage-accent) 7%, transparent)' : undefined,
                          color: sel ? 'white' : 'var(--stage-fg)', fontWeight: sel ? 800 : 400 }}>
                        {f4(normalCdf(cellZ))}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );

  const controls = (
    <ControlBar>
      <Chip selected={t === 'left'} onClick={() => setT('left')}>left tail Φ(z)</Chip>
      <Chip selected={t === 'right'} onClick={() => setT('right')}>right tail 1−Φ(z)</Chip>
    </ControlBar>
  );

  const footer = (
    <>
      <p style={{ fontSize: 12, color: 'var(--stage-muted)', marginTop: 6 }}>The table gives <Tex tex="\\Phi(z) = P(Z \\le z)" />. Row = z to one decimal, column = the hundredths digit. Click a cell to jump there.</p>
      <HintLadder hints={hints} />
    </>
  );

  return <LabFrame title={title} prompt={prompt} objectives={objectives} controls={controls} footer={footer}>{figure}</LabFrame>;
}
