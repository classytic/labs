'use client';

/**
 * CrossGrid — the shared Punnett-grid UI (single source of truth for every cross
 * lab: monohybrid, dihybrid, sex-linked). It is PRESENTATIONAL: the parent labs
 * compute the gametes + the combine rule and hand them in; this draws the gametes
 * on the edges, fills the N×N grid, runs predict-before-reveal, and reads off the
 * genotype + phenotype tally bars. No genetics logic lives here.
 */

import { useEffect, useState, type ReactNode } from 'react';
import { CheckButton, StatusPill } from '../../kit/controls.js';
import { LabFrame, LiveRegion } from '../../kit/frame.js';

export interface CrossCell { genotype: string; phenotype: { label: string; color: string }; note?: string }

export interface CrossGridProps {
  gametes1: string[][];                          // P1 gametes (each = one allele per locus)
  gametes2: string[][];
  gameteLabel: (g: string[]) => string;          // how to render a gamete on the edge
  combine: (g1: string[], g2: string[]) => CrossCell;
  traitLabel: string;                            // "phenotype" / "blood type" / "trait & sex"
  resetKey: string;                              // changes → re-hide (predict-first)
  predictFirst: boolean;
  header: ReactNode;                             // parent pickers (lab-specific)
  legend?: ReactNode;
  title: string;
  prompt: string;
  objectives?: string[];
  showGenotypeTally?: boolean;
  onReveal?: () => void;
}

export function CrossGrid({
  gametes1, gametes2, gameteLabel, combine, traitLabel, resetKey, predictFirst,
  header, legend, title, prompt, objectives, showGenotypeTally = true, onReveal,
}: CrossGridProps): ReactNode {
  const [revealed, setRevealed] = useState(!predictFirst);
  const [highlight, setHighlight] = useState<string | null>(null);
  useEffect(() => { setRevealed(!predictFirst); setHighlight(null); }, [resetKey, predictFirst]);

  const cells = gametes1.map((g1) => gametes2.map((g2) => combine(g1, g2)));
  const flat = cells.flat();
  const n = Math.max(gametes1.length, gametes2.length);
  const cellSize = n <= 2 ? 54 : n === 3 ? 46 : 40;
  const fontSize = n <= 2 ? 17 : 13;

  const genoCount = (g: string): number => flat.filter((c) => c.genotype === g).length;
  const genotypes = [...new Set(flat.map((c) => c.genotype))];

  const phenoTally = (() => {
    const m = new Map<string, { n: number; color: string }>();
    for (const c of flat) { const e = m.get(c.phenotype.label) ?? { n: 0, color: c.phenotype.color }; e.n += 1; m.set(c.phenotype.label, e); }
    return [...m.entries()].map(([label, v]) => ({ label, ...v }));
  })();
  const genoColor = (g: string): string => flat.find((c) => c.genotype === g)!.phenotype.color;

  const reveal = (): void => { setRevealed(true); onReveal?.(); };

  const Bar = ({ label, parts }: { label: string; parts: { n: number; color: string; tag: string }[] }): ReactNode => {
    const total = parts.reduce((s, p) => s + p.n, 0) || 1;
    return (
      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--stage-muted)', marginBottom: 3 }}>{label}: {parts.filter((p) => p.n).map((p) => `${p.n} ${p.tag}`).join(' : ')}</div>
        <div style={{ display: 'flex', height: 16, borderRadius: 6, overflow: 'hidden', border: '1px solid var(--stage-grid)' }}>
          {parts.filter((p) => p.n).map((p, i) => <div key={i} style={{ flex: p.n / total, background: p.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: 'var(--stage-bg)' }}>{p.n}</div>)}
        </div>
      </div>
    );
  };

  const cellBg = (c: CrossCell): string => highlight === c.genotype
    ? `color-mix(in oklab, ${c.phenotype.color} 34%, var(--stage-bg))`
    : `color-mix(in oklab, ${c.phenotype.color} 13%, var(--stage-bg))`;

  const figure = (
    <>
      {legend}

      <div style={{ borderRadius: 14, background: 'var(--stage-bg)', border: '1px solid var(--stage-grid)', padding: 16, overflowX: 'auto' }}>
        {header}

        <div style={{ display: 'inline-grid', gridTemplateColumns: `${cellSize}px repeat(${gametes2.length}, ${cellSize}px)`, gap: 4 }}>
          <div />
          {gametes2.map((g, i) => <div key={i} style={{ textAlign: 'center', fontSize, fontWeight: 800, color: 'var(--stage-fg)' }}>{gameteLabel(g)}</div>)}
          {cells.map((row, r) => (
            <Frag key={r}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize, fontWeight: 800, color: 'var(--stage-fg)' }}>{gameteLabel(gametes1[r]!)}</div>
              {row.map((c, ci) => (
                <button key={ci} type="button" onClick={() => revealed && setHighlight((h) => (h === c.genotype ? null : c.genotype))}
                  title={revealed ? `${c.genotype} → ${c.phenotype.label}` : undefined}
                  style={{ width: cellSize, height: cellSize, borderRadius: 6, border: '1px solid var(--stage-grid)', background: revealed ? cellBg(c) : 'var(--stage-bg)', cursor: revealed ? 'pointer' : 'default', fontSize, fontWeight: 700, color: 'var(--stage-fg)', padding: 0 }}>
                  {revealed ? c.genotype : '?'}
                </button>
              ))}
            </Frag>
          ))}
        </div>

        {!revealed ? (
          <div className="lab-bar" style={{ marginTop: 12 }}>
            <span style={{ fontWeight: 600 }}>Predict the {traitLabel} ratio, then…</span>
            <CheckButton onClick={reveal}>Reveal the cross</CheckButton>
          </div>
        ) : (
          <div className="lab-bar" style={{ marginTop: 14, gap: 16, flexWrap: 'wrap' }}>
            {showGenotypeTally && <Bar label="Genotype" parts={genotypes.map((g) => ({ n: genoCount(g), color: genoColor(g), tag: g }))} />}
            <Bar label={traitLabel} parts={phenoTally.map((p) => ({ n: p.n, color: p.color, tag: p.label }))} />
            <StatusPill ok>{phenoTally.map((p) => p.n).join(':')} {phenoTally.map((p) => p.label).join(' : ')}</StatusPill>
          </div>
        )}
        {revealed && highlight && (() => {
          const c = flat.find((x) => x.genotype === highlight)!;
          return <p style={{ fontSize: 12, color: 'var(--stage-muted)', margin: '8px 0 0' }}>{highlight}: {genoCount(highlight)} of {flat.length} ({((genoCount(highlight) / flat.length) * 100).toFixed(0)}%) → <b style={{ color: c.phenotype.color }}>{c.phenotype.label}</b>{c.note ?? ''}</p>;
        })()}
      </div>
    </>
  );

  const footer = (
    <LiveRegion>
      {revealed ? `${traitLabel} ratio ${phenoTally.map((p) => `${p.n} ${p.label}`).join(', ')}.` : 'Predict, then reveal.'}
    </LiveRegion>
  );

  return <LabFrame title={title} prompt={prompt} objectives={objectives} footer={footer}>{figure}</LabFrame>;
}

function Frag({ children }: { children: ReactNode }): ReactNode { return <>{children}</>; }
