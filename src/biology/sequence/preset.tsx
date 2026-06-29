'use client';

/**
 * SequenceLab, ONE base-pairing tool for DNA replication, transcription and
 * translation. The template strand is given; the learner BUILDS the partner strand
 * by pairing each unit (base or codon), that manipulation is the whole point, so
 * it clears the "interactive only when it teaches" bar. Pick a base/amino acid from
 * the palette, tap the slot under its template unit; correct locks green, wrong
 * flags red. Replication shows the semiconservative idea: the old strand stays, you
 * build the new one.
 *
 * HTML tiles (flex + horizontal scroll on phones), tokenized, no deps.
 */

import { useMemo, useState, type ReactNode } from 'react';
import { Chip, StatusPill } from '../../kit/controls.js';
import { LabFrame, ControlBar, LiveRegion } from '../../kit/frame.js';
import { useCheckpoint } from '../../kit/pedagogy.js';
import { buildSequenceModel, BASE_COLOR, type SequenceKind } from './core.js';

export interface SequenceLabProps {
  kind?: SequenceKind;
  template?: string[];
  title?: string;
  prompt?: string;
  objectives?: string[];
}

const hash = (s: string): number => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h >>> 0; };

const DEFAULT_TITLE: Record<SequenceKind, string> = {
  replication: 'DNA replication, build the new strand',
  transcription: 'Transcription, read DNA into mRNA',
  translation: 'Translation, read codons into protein',
};
const DEFAULT_PROMPT: Record<SequenceKind, string> = {
  replication: 'Each base pairs A–T and G–C. The old strand stays; you build its complement.',
  transcription: 'mRNA copies the template, but T is replaced by U (A–U, G–C).',
  translation: 'Each 3-base codon codes for one amino acid. Read the chain off the genetic code.',
};

export function SequenceLab({ kind = 'replication', template, title, prompt, objectives }: SequenceLabProps): ReactNode {
  const units = template ?? (kind === 'translation' ? ['AUG', 'UUU', 'GGA', 'UAC', 'UAA'] : ['T', 'A', 'C', 'G', 'G', 'A', 'T', 'C']);
  const model = useMemo(() => buildSequenceModel(kind, units), [kind, units.join(',')]);
  const palette = useMemo(() => [...model.options].sort((a, b) => hash(a) - hash(b)), [model]);

  const [filled, setFilled] = useState<(string | null)[]>(() => units.map(() => null));
  const [sel, setSel] = useState<string | null>(null);

  const correctAt = (i: number): boolean => filled[i] === model.partnerOf(units[i]!);
  const solvedCount = units.filter((_, i) => correctAt(i)).length;
  const solved = solvedCount === units.length;
  useCheckpoint({ solved, activity: `sequence-${kind}` });

  const place = (i: number): void => {
    if (correctAt(i)) { setFilled((f) => f.map((v, j) => (j === i ? null : v))); return; } // tap a locked one to free it
    if (!sel) return;
    setFilled((f) => f.map((v, j) => (j === i ? sel : v)));
    setSel(null);
  };

  const tileW = kind === 'translation' ? 52 : 38;
  const tileStyle = (color: string): React.CSSProperties => ({
    minWidth: tileW, height: 38, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 800, fontSize: kind === 'translation' ? 13 : 16, background: color, color: 'var(--stage-bg)', padding: '0 6px',
  });
  const colorOf = (b: string): string => BASE_COLOR[b] ?? 'var(--stage-accent)';
  const NEUTRAL = 'color-mix(in oklab, var(--stage-fg) 26%, var(--stage-bg))';

  const figure = (
    <div style={{ borderRadius: 14, background: 'var(--stage-bg)', border: '1px solid var(--stage-grid)', padding: 14, overflowX: 'auto' }}>
        {/* template row */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4 }}>
          <span style={{ minWidth: 96, fontSize: 11, fontWeight: 700, color: 'var(--stage-muted)' }}>{model.topLabel}</span>
          {units.map((u, i) => <div key={i} style={tileStyle(u.length > 1 ? NEUTRAL : colorOf(u))}>{u}</div>)}
        </div>
        {/* rungs */}
        <div style={{ display: 'flex', gap: 6 }}>
          <span style={{ minWidth: 96 }} />
          {units.map((_, i) => <div key={i} style={{ minWidth: tileW, textAlign: 'center', color: 'var(--stage-grid)', fontSize: 12, lineHeight: '12px' }}>{kind === 'translation' ? '↓' : '┊'}</div>)}
        </div>
        {/* partner slot row */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 4 }}>
          <span style={{ minWidth: 96, fontSize: 11, fontWeight: 700, color: 'var(--stage-muted)' }}>{model.bottomLabel}</span>
          {units.map((u, i) => {
            const v = filled[i];
            const ok = v != null && correctAt(i);
            const bad = v != null && !ok;
            const bg = ok ? (model.partnerIsBase ? colorOf(v!) : 'var(--stage-good)') : 'var(--stage-bg)';
            return (
              <button key={i} type="button" onClick={() => place(i)} aria-label={v ? `${v}${ok ? ' correct' : ' wrong'}` : `empty slot under ${u}`}
                style={{ minWidth: tileW, height: 38, borderRadius: 8, padding: '0 6px', fontWeight: 800, fontSize: kind === 'translation' ? 13 : 16, cursor: 'pointer',
                  border: `2px ${v ? 'solid' : 'dashed'} ${ok ? 'var(--stage-good)' : bad ? 'var(--stage-danger)' : 'var(--stage-grid)'}`,
                  background: bg, color: ok ? 'var(--stage-bg)' : bad ? 'var(--stage-danger)' : 'var(--stage-muted)' }}>
                {v ?? '?'}
              </button>
            );
          })}
        </div>
    </div>
  );

  const controls = (
    <ControlBar>
      {palette.map((o) => (
        <Chip key={o} selected={sel === o} onClick={() => setSel((s) => (s === o ? null : o))}>
          <span style={{ color: model.partnerIsBase ? colorOf(o) : 'inherit', fontWeight: 800 }}>{o}</span>
        </Chip>
      ))}
      <StatusPill ok={solved}>{solvedCount}/{units.length} paired</StatusPill>
    </ControlBar>
  );

  const footer = (
    <>
      {kind === 'replication' && (
        <p style={{ fontSize: 12, color: 'var(--stage-muted)', margin: '8px 0 0' }}>Each daughter DNA keeps one <b>old</b> strand + one <b>new</b> strand, that’s <b>semiconservative</b> replication.</p>
      )}
      {solved && kind === 'translation' && (
        <p style={{ fontSize: 13, color: 'var(--stage-good)', fontWeight: 700, margin: '8px 0 0' }}>Polypeptide: {units.map((u) => model.partnerOf(u)).join(' – ')}</p>
      )}

      <LiveRegion>
        {solved ? `${model.bottomLabel} complete.` : `${solvedCount} of ${units.length} paired.`}
      </LiveRegion>
    </>
  );

  return <LabFrame title={title ?? DEFAULT_TITLE[kind]} prompt={prompt ?? DEFAULT_PROMPT[kind]} objectives={objectives} controls={controls} footer={footer}>{figure}</LabFrame>;
}
