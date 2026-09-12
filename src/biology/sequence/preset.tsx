'use client';

import { Button } from '@/components/ui/button';

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

import { useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { RotateCcw } from 'lucide-react';
import { Chip, IconButton, StatusPill } from '../../kit/controls.js';
import { Activity } from '../../kit/activity.js';
import { ChallengeCard, useChallenge, useCheckpoint, type ChallengeQuestion } from '../../kit/pedagogy.js';
import { buildSequenceModel, BASE_COLOR, type SequenceKind } from './core.js';

export interface SequenceLabProps {
  kind?: SequenceKind;
  template?: string[];
  title?: string;
  prompt?: string;
  objectives?: string[];
}

const hash = (s: string): number => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h >>> 0;
};

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

export function SequenceLab({
  kind = 'replication',
  template,
  title,
  prompt,
  objectives,
}: SequenceLabProps): ReactNode {
  const units =
    template ??
    (kind === 'translation' ? ['AUG', 'UUU', 'GGA', 'UAC', 'UAA'] : ['T', 'A', 'C', 'G', 'G', 'A', 'T', 'C']);
  const model = useMemo(() => buildSequenceModel(kind, units), [kind, units.join(',')]);
  const palette = useMemo(() => [...model.options].sort((a, b) => hash(a) - hash(b)), [model]);

  const [filled, setFilled] = useState<(string | null)[]>(() => units.map(() => null));
  const [sel, setSel] = useState<string | null>(null);

  const transfer: ChallengeQuestion[] =
    kind === 'replication'
      ? [
          {
            id: 'transfer',
            prompt: 'Why is DNA replication called semiconservative?',
            choices: [
              { value: 'half', label: 'each daughter DNA keeps one old strand and builds one new strand' },
              { value: 'all', label: 'both daughter strands are entirely old' },
            ],
            answer: 'half',
            explain:
              'Each daughter double helix conserves one parental strand and pairs it with one newly synthesized strand.',
          },
        ]
      : kind === 'transcription'
        ? [
            {
              id: 'transfer',
              prompt: 'A DNA template base is A. Which base is placed in the mRNA?',
              choices: [
                { value: 'u', label: 'U' },
                { value: 't', label: 'T' },
                { value: 'a', label: 'A' },
              ],
              answer: 'u',
              explain: 'RNA uses uracil, so template A pairs with U during transcription.',
            },
          ]
        : [
            {
              id: 'transfer',
              prompt: 'A mutation changes an mRNA codon. What determines whether the protein changes?',
              choices: [
                { value: 'code', label: 'whether the new codon specifies a different amino acid or stop' },
                { value: 'dna', label: 'whether the codon contains the letter T' },
              ],
              answer: 'code',
              explain:
                'Translation reads the genetic code. Some changed codons are synonymous, while others change an amino acid or create a stop.',
            },
          ];
  const challenge = useChallenge(transfer);

  const correctAt = (i: number): boolean => filled[i] === model.partnerOf(units[i]!);
  const solvedCount = units.filter((_, i) => correctAt(i)).length;
  const solved = solvedCount === units.length;
  useCheckpoint({ solved: solved && challenge.allCorrect, activity: `sequence-${kind}` });
  const reset = (): void => {
    setFilled(units.map(() => null));
    setSel(null);
    challenge.reset();
  };

  const place = (i: number): void => {
    if (correctAt(i)) {
      setFilled((f) => f.map((v, j) => (j === i ? null : v)));
      return;
    } // tap a locked one to free it
    if (!sel) return;
    setFilled((f) => f.map((v, j) => (j === i ? sel : v)));
    setSel(null);
  };

  const colorOf = (b: string): string => BASE_COLOR[b] ?? 'var(--stage-accent)';
  const NEUTRAL = 'color-mix(in oklab, var(--stage-fg) 26%, var(--stage-bg))';

  const figure = (
    <div
      className="biology-model-surface biology-sequence-scene"
      data-wide={kind === 'translation' || undefined}
    >
      {/* template row */}
      <div className="biology-molecule-row biology-template-row">
        <span className="biology-molecule-label">{model.topLabel}</span>
        {units.map((u, i) => (
          <div
            key={i}
            className="biology-base-tile"
            style={
              {
                '--biology-base-color': u.length > 1 ? NEUTRAL : colorOf(u),
              } as CSSProperties
            }
          >
            {u}
          </div>
        ))}
      </div>
      {/* rungs */}
      <div className="biology-molecule-row biology-rung-row" aria-hidden="true">
        <span className="biology-molecule-label" />
        {units.map((_, i) => (
          <div key={i} className="biology-rung">
            {kind === 'translation' ? '↓' : '┊'}
          </div>
        ))}
      </div>
      {/* partner slot row */}
      <div className="biology-molecule-row biology-partner-row">
        <span className="biology-molecule-label">{model.bottomLabel}</span>
        {units.map((u, i) => {
          const v = filled[i];
          const ok = v != null && correctAt(i);
          const bad = v != null && !ok;
          return (
            <Button
              key={i}
              type="button"
              variant="ghost"
              className="biology-sequence-slot"
              data-filled={v != null || undefined}
              data-correct={ok || undefined}
              data-incorrect={bad || undefined}
              onClick={() => place(i)}
              aria-label={v ? `${v}${ok ? ' correct' : ' wrong'}` : `empty slot under ${u}`}
              style={
                {
                  '--biology-base-color': ok && model.partnerIsBase ? colorOf(v!) : undefined,
                } as CSSProperties
              }
            >
              {v ?? '?'}
            </Button>
          );
        })}
      </div>
    </div>
  );

  const controls = (
    <div className="biology-sequence-controls">
      <span className="lab-field-label">Choose {model.partnerIsBase ? 'a base' : 'an amino acid'}</span>
      <div
        className="lab-field-row"
        role="group"
        aria-label={model.partnerIsBase ? 'Base palette' : 'Amino-acid palette'}
      >
        {palette.map((o) => (
          <Chip key={o} selected={sel === o} onClick={() => setSel((s) => (s === o ? null : o))}>
            <span
              className="biology-base-choice"
              style={
                { '--biology-base-color': model.partnerIsBase ? colorOf(o) : 'inherit' } as CSSProperties
              }
            >
              {o}
            </span>
          </Chip>
        ))}
      </div>
      <StatusPill ok={solved}>
        {solvedCount}/{units.length} paired
      </StatusPill>
      <p className="biology-sequence-guidance">
        Choose one option, then place it in the matching slot. A correct match locks in place.
      </p>
    </div>
  );

  const feedback = solved ? (
    kind === 'replication' ? (
      <>
        Each daughter DNA keeps one <b>old</b> strand and one <b>new</b> strand: semiconservative replication.
      </>
    ) : kind === 'translation' ? (
      <>
        Polypeptide: <b>{units.map((u) => model.partnerOf(u)).join(' – ')}</b>
      </>
    ) : (
      <>The mRNA strand is complete; notice that RNA uses U where DNA pairing would use T.</>
    )
  ) : (
    <>
      Pair each{' '}
      {kind === 'translation'
        ? 'codon with the amino acid specified by the genetic code'
        : 'template unit using the complementary-base rule'}
      .
    </>
  );

  return (
    <Activity.Root className="biology-sequence-activity" focusLayout="immersive">
      <Activity.Header>
        <Activity.Heading
          eyebrow="Molecular genetics"
          title={title ?? DEFAULT_TITLE[kind]}
          description={prompt ?? DEFAULT_PROMPT[kind]}
        />
        <Activity.FocusButton />
      </Activity.Header>
      <Activity.Status>
        <strong>{kind}</strong>
        <span>
          {solvedCount} of {units.length} paired
        </span>
        <span>{solved ? 'sequence complete' : sel ? `${sel} selected` : 'choose a unit'}</span>
      </Activity.Status>
      <Activity.Workspace>
        <Activity.Canvas label={`${kind} sequence construction`}>{figure}</Activity.Canvas>
        <Activity.Inspector label="Sequence palette and construction evidence">{controls}</Activity.Inspector>
      </Activity.Workspace>
      <Activity.Feedback>
        <span>Observe</span>
        <div>{feedback}</div>
      </Activity.Feedback>
      <section className="lab-authored-task" aria-label="Transfer the sequence rule">
        <ChallengeCard questions={transfer} state={challenge} title="Transfer the sequence rule" />
      </section>
      <Activity.LiveRegion>
        {solved ? `${model.bottomLabel} complete.` : `${solvedCount} of ${units.length} paired.`}
      </Activity.LiveRegion>
      <Activity.Transport>
        <IconButton label="Reset sequence construction" onClick={reset}>
          <RotateCcw aria-hidden="true" />
        </IconButton>
        <div className="lab-transport-state" aria-live="polite">
          <strong>{solved ? 'Construction complete' : 'Build the partner sequence'}</strong>
          <span>
            {solvedCount} / {units.length} correct
          </span>
        </div>
      </Activity.Transport>
    </Activity.Root>
  );
}
