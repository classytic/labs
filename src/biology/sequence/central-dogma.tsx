'use client';

/**
 * CentralDogmaLab, the whole central dogma in one flow: DNA → (transcription) →
 * mRNA → (translation) → protein. The learner does BOTH steps on one starting
 * strand: first pair the DNA template into mRNA (T→U), then read each 3-base codon
 * to its amino acid. Translation unlocks only once the mRNA is correct, so the
 * dependency (you can't translate what isn't transcribed) is felt. Reuses the
 * sequence core (TRANSCRIBE + CODON_TABLE), no new pairing logic.
 */

import { useMemo, useState, type ReactNode } from 'react';
import { Chip, StatusPill } from '../../kit/controls.js';
import { LabFrame, ControlBar, LiveRegion } from '../../kit/frame.js';
import { useCheckpoint } from '../../kit/pedagogy.js';
import { TRANSCRIBE, CODON_TABLE, BASE_COLOR, RNA_BASES } from './core.js';

export interface CentralDogmaProps {
  dna?: string[];   // DNA template strand; length a multiple of 3
  title?: string;
  prompt?: string;
  objectives?: string[];
}

const hash = (s: string): number => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h >>> 0; };
const AA_POOL = ['Met', 'Leu', 'Gly', 'Phe', 'Ser', 'Val', 'Stop', 'Tyr'];

export function CentralDogmaLab({
  dna = ['T', 'A', 'C', 'G', 'A', 'A', 'C', 'C', 'T', 'A', 'T', 'T'],
  title = 'The central dogma: DNA → mRNA → protein',
  prompt = 'Transcribe the DNA into mRNA (T→U), then translate each codon into an amino acid.',
  objectives,
}: CentralDogmaProps): ReactNode {
  const nCodons = Math.floor(dna.length / 3);

  const [mrna, setMrna] = useState<(string | null)[]>(() => dna.map(() => null));
  const [protein, setProtein] = useState<(string | null)[]>(() => Array.from({ length: nCodons }, () => null));
  const [selBase, setSelBase] = useState<string | null>(null);
  const [selAA, setSelAA] = useState<string | null>(null);

  const mrnaOK = (i: number): boolean => mrna[i] === TRANSCRIBE[dna[i]!];
  const transcribed = dna.every((_, i) => mrnaOK(i));
  const codonStr = (c: number): string => transcribed ? [0, 1, 2].map((k) => mrna[c * 3 + k]).join('') : '';
  const proteinOK = (c: number): boolean => transcribed && protein[c] === CODON_TABLE[codonStr(c)];
  const translated = transcribed && Array.from({ length: nCodons }).every((_, c) => proteinOK(c));
  const done = transcribed && translated;
  useCheckpoint({ solved: done, activity: 'central-dogma' });

  const aaOptions = useMemo(() => {
    const correct = Array.from({ length: nCodons }, (_, c) => CODON_TABLE[[0, 1, 2].map((k) => TRANSCRIBE[dna[c * 3 + k]!]).join('')] ?? '???');
    return [...new Set([...correct, ...AA_POOL])].slice(0, Math.max(4, new Set(correct).size + 2)).sort((a, b) => hash(a) - hash(b));
  }, [dna, nCodons]);

  const placeBase = (i: number): void => {
    if (mrnaOK(i)) { setMrna((m) => m.map((v, j) => (j === i ? null : v))); return; }
    if (!selBase) return;
    setMrna((m) => m.map((v, j) => (j === i ? selBase : v))); setSelBase(null);
  };
  const placeAA = (c: number): void => {
    if (!transcribed) return;
    if (proteinOK(c)) { setProtein((p) => p.map((v, j) => (j === c ? null : v))); return; }
    if (!selAA) return;
    setProtein((p) => p.map((v, j) => (j === c ? selAA : v))); setSelAA(null);
  };

  const colorOf = (b: string): string => BASE_COLOR[b] ?? 'var(--stage-accent)';
  const TILE = 34;
  const tile = (bg: string): React.CSSProperties => ({ minWidth: TILE, height: 34, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 15, background: bg, color: 'var(--stage-bg)' });
  const arrow = (label: string): ReactNode => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '6px 0', color: 'var(--stage-muted)', fontSize: 12, fontWeight: 700 }}>
      <span style={{ fontSize: 16 }}>↓</span> {label}
    </div>
  );

  const mrnaCount = dna.filter((_, i) => mrnaOK(i)).length;
  const protCount = Array.from({ length: nCodons }).filter((_, c) => proteinOK(c)).length;

  const figure = (
    <div style={{ borderRadius: 14, background: 'var(--stage-bg)', border: '1px solid var(--stage-grid)', padding: 14, overflowX: 'auto' }}>
        {/* DNA template */}
        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
          <span style={{ minWidth: 92, fontSize: 11, fontWeight: 700, color: 'var(--stage-muted)' }}>DNA template</span>
          {dna.map((b, i) => <div key={i} style={tile(colorOf(b))}>{b}</div>)}
        </div>

        {arrow('transcription, copy the template, T → U')}

        {/* mRNA slots */}
        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
          <span style={{ minWidth: 92, fontSize: 11, fontWeight: 700, color: 'var(--stage-muted)' }}>mRNA</span>
          {dna.map((b, i) => {
            const v = mrna[i]; const ok = v != null && mrnaOK(i); const bad = v != null && !ok;
            const sep = i > 0 && i % 3 === 0;
            return (
              <button key={i} type="button" onClick={() => placeBase(i)} aria-label={v ? `${v}${ok ? ' correct' : ' wrong'}` : `mRNA slot ${i + 1}`}
                style={{ minWidth: TILE, height: 34, marginLeft: sep ? 8 : 0, borderRadius: 7, fontWeight: 800, fontSize: 15, cursor: 'pointer',
                  border: `2px ${v ? 'solid' : 'dashed'} ${ok ? 'var(--stage-good)' : bad ? 'var(--stage-danger)' : 'var(--stage-grid)'}`,
                  background: ok ? colorOf(v!) : 'var(--stage-bg)', color: ok ? 'var(--stage-bg)' : bad ? 'var(--stage-danger)' : 'var(--stage-muted)' }}>{v ?? '?'}</button>
            );
          })}
        </div>

        {arrow(transcribed ? 'translation, read each codon off the genetic code' : 'translation, locked until the mRNA is complete')}

        {/* protein slots (one per codon) */}
        <div style={{ display: 'flex', gap: 5, alignItems: 'center', opacity: transcribed ? 1 : 0.45 }}>
          <span style={{ minWidth: 92, fontSize: 11, fontWeight: 700, color: 'var(--stage-muted)' }}>protein</span>
          {Array.from({ length: nCodons }, (_, c) => {
            const v = protein[c]; const ok = proteinOK(c); const bad = v != null && !ok;
            return (
              <button key={c} type="button" onClick={() => placeAA(c)} disabled={!transcribed} aria-label={transcribed ? `codon ${codonStr(c)}` : 'locked'}
                style={{ minWidth: 96, height: 34, marginRight: 8, borderRadius: 7, fontWeight: 800, fontSize: 13, cursor: transcribed ? 'pointer' : 'not-allowed',
                  border: `2px ${v ? 'solid' : 'dashed'} ${ok ? 'var(--stage-good)' : bad ? 'var(--stage-danger)' : 'var(--stage-grid)'}`,
                  background: ok ? 'var(--stage-good)' : 'var(--stage-bg)', color: ok ? 'var(--stage-bg)' : bad ? 'var(--stage-danger)' : 'var(--stage-muted)' }}>
                {transcribed ? <span style={{ fontSize: 10, opacity: 0.85 }}>{codonStr(c)} </span> : ''}{v ?? '·'}
              </button>
            );
          })}
        </div>
    </div>
  );

  const controls = (
    <ControlBar>
      <div className="lab-bar" style={{ flexWrap: 'wrap', gap: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--stage-muted)' }}>bases</span>
        {[...RNA_BASES].map((b) => <Chip key={b} selected={selBase === b} onClick={() => { setSelBase((s) => (s === b ? null : b)); setSelAA(null); }}><span style={{ color: colorOf(b), fontWeight: 800 }}>{b}</span></Chip>)}
        <StatusPill ok={transcribed}>{mrnaCount}/{dna.length} mRNA</StatusPill>
      </div>
      <div className="lab-bar" style={{ flexWrap: 'wrap', gap: 8, opacity: transcribed ? 1 : 0.5 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--stage-muted)' }}>amino acids</span>
        {aaOptions.map((a) => <Chip key={a} selected={selAA === a} onClick={() => { if (!transcribed) return; setSelAA((s) => (s === a ? null : a)); setSelBase(null); }}>{a}</Chip>)}
        <StatusPill ok={translated}>{protCount}/{nCodons} codons</StatusPill>
      </div>
    </ControlBar>
  );

  const footer = (
    <>
      {done && <p style={{ fontSize: 13, color: 'var(--stage-good)', fontWeight: 700, margin: '8px 0 0' }}>Polypeptide: {Array.from({ length: nCodons }, (_, c) => CODON_TABLE[codonStr(c)]).join(' – ')}</p>}

      <LiveRegion>
        {done ? 'Central dogma complete: DNA transcribed and translated.' : transcribed ? `mRNA complete; ${protCount} of ${nCodons} codons translated.` : `${mrnaCount} of ${dna.length} mRNA bases paired.`}
      </LiveRegion>
    </>
  );

  return <LabFrame title={title} prompt={prompt} objectives={objectives} controls={controls} footer={footer}>{figure}</LabFrame>;
}
