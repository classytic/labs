'use client';

import { Button } from '@/components/ui/button';

/**
 * CentralDogmaLab, the whole central dogma in one flow: DNA → (transcription) →
 * mRNA → (translation) → protein. The learner does BOTH steps on one starting
 * strand: first pair the DNA template into mRNA (T→U), then read each 3-base codon
 * to its amino acid. Translation unlocks only once the mRNA is correct, so the
 * dependency (you can't translate what isn't transcribed) is felt. Reuses the
 * sequence core (TRANSCRIBE + CODON_TABLE), no new pairing logic.
 */

import { useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { RotateCcw } from 'lucide-react';
import { Chip, IconButton, StatusPill } from '../../kit/controls.js';
import { Activity } from '../../kit/activity.js';
import { ChallengeCard, useChallenge, useCheckpoint, type ChallengeQuestion } from '../../kit/pedagogy.js';
import { TRANSCRIBE, CODON_TABLE, BASE_COLOR, RNA_BASES } from './core.js';

export interface CentralDogmaProps {
  dna?: string[]; // DNA template strand; length a multiple of 3
  title?: string;
  prompt?: string;
  objectives?: string[];
}

const hash = (s: string): number => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h >>> 0;
};
const AA_POOL = ['Met', 'Leu', 'Gly', 'Phe', 'Ser', 'Val', 'Stop', 'Tyr'];
const TRANSFER: ChallengeQuestion[] = [
  {
    id: 'information-flow',
    prompt: 'Which molecule is read directly by the ribosome during translation?',
    choices: [
      { value: 'mrna', label: 'mRNA codons' },
      { value: 'dna', label: 'the DNA template inside the nucleus' },
      { value: 'protein', label: 'the finished protein' },
    ],
    answer: 'mrna',
    explain:
      'DNA is first transcribed. The ribosome then reads mRNA codons to assemble the amino-acid sequence.',
  },
];

export function CentralDogmaLab({
  dna = ['T', 'A', 'C', 'G', 'A', 'A', 'C', 'C', 'T', 'A', 'T', 'T'],
  title = 'The central dogma: DNA → mRNA → protein',
  prompt = 'Transcribe the DNA into mRNA (T→U), then translate each codon into an amino acid.',
  objectives,
}: CentralDogmaProps): ReactNode {
  const nCodons = Math.floor(dna.length / 3);

  const [mrna, setMrna] = useState<(string | null)[]>(() => dna.map(() => null));
  const [protein, setProtein] = useState<(string | null)[]>(() =>
    Array.from({ length: nCodons }, () => null),
  );
  const [selBase, setSelBase] = useState<string | null>(null);
  const [selAA, setSelAA] = useState<string | null>(null);
  const challenge = useChallenge(TRANSFER);

  const mrnaOK = (i: number): boolean => mrna[i] === TRANSCRIBE[dna[i]!];
  const transcribed = dna.every((_, i) => mrnaOK(i));
  const codonStr = (c: number): string => (transcribed ? [0, 1, 2].map((k) => mrna[c * 3 + k]).join('') : '');
  const proteinOK = (c: number): boolean => transcribed && protein[c] === CODON_TABLE[codonStr(c)];
  const translated = transcribed && Array.from({ length: nCodons }).every((_, c) => proteinOK(c));
  const done = transcribed && translated;
  useCheckpoint({ solved: done && challenge.allCorrect, activity: 'central-dogma' });
  const reset = (): void => {
    setMrna(dna.map(() => null));
    setProtein(Array.from({ length: nCodons }, () => null));
    setSelBase(null);
    setSelAA(null);
    challenge.reset();
  };

  const aaOptions = useMemo(() => {
    const correct = Array.from(
      { length: nCodons },
      (_, c) => CODON_TABLE[[0, 1, 2].map((k) => TRANSCRIBE[dna[c * 3 + k]!]).join('')] ?? '???',
    );
    return [...new Set([...correct, ...AA_POOL])]
      .slice(0, Math.max(4, new Set(correct).size + 2))
      .sort((a, b) => hash(a) - hash(b));
  }, [dna, nCodons]);

  const placeBase = (i: number): void => {
    if (mrnaOK(i)) {
      setMrna((m) => m.map((v, j) => (j === i ? null : v)));
      return;
    }
    if (!selBase) return;
    setMrna((m) => m.map((v, j) => (j === i ? selBase : v)));
    setSelBase(null);
  };
  const placeAA = (c: number): void => {
    if (!transcribed) return;
    if (proteinOK(c)) {
      setProtein((p) => p.map((v, j) => (j === c ? null : v)));
      return;
    }
    if (!selAA) return;
    setProtein((p) => p.map((v, j) => (j === c ? selAA : v)));
    setSelAA(null);
  };

  const colorOf = (b: string): string => BASE_COLOR[b] ?? 'var(--stage-accent)';
  const arrow = (label: string): ReactNode => (
    <div className="biology-flow-arrow">
      <span className="biology-flow-arrow-icon" aria-hidden="true">
        ↓
      </span>{' '}
      {label}
    </div>
  );

  const mrnaCount = dna.filter((_, i) => mrnaOK(i)).length;
  const protCount = Array.from({ length: nCodons }).filter((_, c) => proteinOK(c)).length;

  const figure = (
    <div className="biology-model-surface biology-sequence-scene">
      {/* DNA template */}
      <div className="biology-molecule-row">
        <span className="biology-molecule-label">DNA template</span>
        {dna.map((b, i) => (
          <div
            key={i}
            className="biology-base-tile"
            style={{ '--biology-base-color': colorOf(b) } as CSSProperties}
          >
            {b}
          </div>
        ))}
      </div>

      {arrow('transcription, copy the template, T → U')}

      {/* mRNA slots */}
      <div className="biology-molecule-row">
        <span className="biology-molecule-label">mRNA</span>
        {dna.map((b, i) => {
          const v = mrna[i];
          const ok = v != null && mrnaOK(i);
          const bad = v != null && !ok;
          const sep = i > 0 && i % 3 === 0;
          return (
            <Button
              key={i}
              type="button"
              variant="ghost"
              className="biology-sequence-slot"
              data-filled={v != null || undefined}
              data-correct={ok || undefined}
              data-incorrect={bad || undefined}
              data-codon-start={sep || undefined}
              onClick={() => placeBase(i)}
              aria-label={v ? `${v}${ok ? ' correct' : ' wrong'}` : `mRNA slot ${i + 1}`}
              style={
                {
                  '--biology-base-color': v ? colorOf(v) : undefined,
                } as CSSProperties
              }
            >
              {v ?? '?'}
            </Button>
          );
        })}
      </div>

      {arrow(
        transcribed
          ? 'translation, read each codon off the genetic code'
          : 'translation, locked until the mRNA is complete',
      )}

      {/* protein slots (one per codon) */}
      <div className="biology-molecule-row biology-protein-row" data-locked={!transcribed || undefined}>
        <span className="biology-molecule-label">protein</span>
        {Array.from({ length: nCodons }, (_, c) => {
          const v = protein[c];
          const ok = proteinOK(c);
          const bad = v != null && !ok;
          return (
            <Button
              key={c}
              type="button"
              variant="ghost"
              className="biology-sequence-slot biology-protein-slot"
              data-filled={v != null || undefined}
              data-correct={ok || undefined}
              data-incorrect={bad || undefined}
              onClick={() => placeAA(c)}
              disabled={!transcribed}
              aria-label={transcribed ? `codon ${codonStr(c)}` : 'locked'}
            >
              {transcribed ? <span className="biology-codon-label">{codonStr(c)} </span> : ''}
              {v ?? '·'}
            </Button>
          );
        })}
      </div>
    </div>
  );

  const controls = (
    <div className="biology-sequence-controls">
      <div className="biology-palette-group">
        <span className="lab-field-label">bases</span>
        <div className="lab-field-row" role="group" aria-label="mRNA base palette">
          {[...RNA_BASES].map((b) => (
            <Chip
              key={b}
              selected={selBase === b}
              onClick={() => {
                setSelBase((s) => (s === b ? null : b));
                setSelAA(null);
              }}
            >
              <span
                className="biology-base-choice"
                style={{ '--biology-base-color': colorOf(b) } as CSSProperties}
              >
                {b}
              </span>
            </Chip>
          ))}
        </div>
        <StatusPill ok={transcribed}>
          {mrnaCount}/{dna.length} mRNA
        </StatusPill>
      </div>
      <div className="biology-palette-group biology-protein-controls" data-locked={!transcribed || undefined}>
        <span className="lab-field-label">amino acids</span>
        <div className="lab-field-row" role="group" aria-label="Amino-acid palette">
          {aaOptions.map((a) => (
            <Chip
              key={a}
              selected={selAA === a}
              onClick={() => {
                if (!transcribed) return;
                setSelAA((s) => (s === a ? null : a));
                setSelBase(null);
              }}
            >
              {a}
            </Chip>
          ))}
        </div>
        <StatusPill ok={translated}>
          {protCount}/{nCodons} codons
        </StatusPill>
      </div>
      <p className="biology-sequence-guidance">
        Complete transcription first. Translation unlocks only when every mRNA base is correct.
      </p>
    </div>
  );

  return (
    <Activity.Root className="biology-central-dogma-activity" focusLayout="immersive">
      <Activity.Header>
        <Activity.Heading eyebrow="Information flow" title={title} description={prompt} />
        <Activity.FocusButton />
      </Activity.Header>
      <Activity.Status>
        <strong>{done ? 'protein complete' : transcribed ? 'translation' : 'transcription'}</strong>
        <span>
          {mrnaCount}/{dna.length} mRNA bases
        </span>
        <span>
          {protCount}/{nCodons} codons
        </span>
      </Activity.Status>
      <Activity.Workspace>
        <Activity.Canvas label="DNA to mRNA to protein construction">{figure}</Activity.Canvas>
        <Activity.Inspector label="Molecule palettes and progress">{controls}</Activity.Inspector>
      </Activity.Workspace>
      <Activity.Feedback>
        <span>Observe</span>
        <div>
          {done ? (
            <>
              Information flowed from DNA through mRNA to the polypeptide{' '}
              <b>{Array.from({ length: nCodons }, (_, c) => CODON_TABLE[codonStr(c)]).join(' – ')}</b>.
            </>
          ) : transcribed ? (
            'The ribosome can now read each three-base mRNA codon and add its amino acid.'
          ) : (
            'Transcription uses complementary pairing, with U in RNA where DNA would use T.'
          )}
        </div>
      </Activity.Feedback>
      <section className="lab-authored-task" aria-label="Transfer the information flow">
        <ChallengeCard questions={TRANSFER} state={challenge} title="Transfer the information flow" />
      </section>
      <Activity.LiveRegion>
        {done
          ? 'Central dogma complete: DNA transcribed and translated.'
          : transcribed
            ? `mRNA complete; ${protCount} of ${nCodons} codons translated.`
            : `${mrnaCount} of ${dna.length} mRNA bases paired.`}
      </Activity.LiveRegion>
      <Activity.Transport>
        <IconButton label="Reset central dogma construction" onClick={reset}>
          <RotateCcw aria-hidden="true" />
        </IconButton>
        <div className="lab-transport-state" aria-live="polite">
          <strong>
            {done ? 'Information flow complete' : transcribed ? 'Translate the codons' : 'Transcribe the DNA'}
          </strong>
          <span>
            {done
              ? 'DNA → mRNA → protein'
              : transcribed
                ? `${protCount} / ${nCodons} amino acids`
                : `${mrnaCount} / ${dna.length} bases`}
          </span>
        </div>
      </Activity.Transport>
    </Activity.Root>
  );
}
