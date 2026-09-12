'use client';

import { Button } from '@/components/ui/button';

/**
 * CrossGrid, the shared Punnett-grid UI (single source of truth for every cross
 * lab: monohybrid, dihybrid, sex-linked). It is PRESENTATIONAL: the parent labs
 * compute the gametes + the combine rule and hand them in; this draws the gametes
 * on the edges, fills the N×N grid, runs predict-before-reveal, and reads off the
 * genotype + phenotype tally bars. No genetics logic lives here.
 */

import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { ActionButton, StatusPill } from '../../kit/controls.js';
import { Activity } from '../../kit/activity.js';
import { ChallengeCard, useChallenge, useCheckpoint, type ChallengeQuestion } from '../../kit/pedagogy.js';

export interface CrossCell {
  genotype: string;
  phenotype: { label: string; color: string };
  note?: string;
}

export interface CrossGridProps {
  gametes1: string[][]; // P1 gametes (each = one allele per locus)
  gametes2: string[][];
  gameteLabel: (g: string[]) => string; // how to render a gamete on the edge
  combine: (g1: string[], g2: string[]) => CrossCell;
  traitLabel: string; // "phenotype" / "blood type" / "trait & sex"
  resetKey: string; // changes → re-hide (predict-first)
  predictFirst: boolean;
  header: ReactNode; // parent pickers (lab-specific)
  legend?: ReactNode;
  title: string;
  prompt: string;
  objectives?: string[];
  showGenotypeTally?: boolean;
  activity?: string;
  onReveal?: () => void;
}

export function CrossGrid({
  gametes1,
  gametes2,
  gameteLabel,
  combine,
  traitLabel,
  resetKey,
  predictFirst,
  header,
  legend,
  title,
  prompt,
  objectives,
  showGenotypeTally = true,
  activity = 'genetic-cross',
  onReveal,
}: CrossGridProps): ReactNode {
  const [revealed, setRevealed] = useState(!predictFirst);
  const [highlight, setHighlight] = useState<string | null>(null);
  useEffect(() => {
    setRevealed(!predictFirst);
    setHighlight(null);
  }, [resetKey, predictFirst]);

  const cells = gametes1.map((g1) => gametes2.map((g2) => combine(g1, g2)));
  const flat = cells.flat();
  const n = Math.max(gametes1.length, gametes2.length);
  const cellSize = n <= 2 ? 54 : n === 3 ? 46 : 40;
  const fontSize = n <= 2 ? 17 : 13;

  const genoCount = (g: string): number => flat.filter((c) => c.genotype === g).length;
  const genotypes = [...new Set(flat.map((c) => c.genotype))];

  const phenoTally = (() => {
    const m = new Map<string, { n: number; color: string }>();
    for (const c of flat) {
      const e = m.get(c.phenotype.label) ?? { n: 0, color: c.phenotype.color };
      e.n += 1;
      m.set(c.phenotype.label, e);
    }
    return [...m.entries()].map(([label, v]) => ({ label, ...v }));
  })();
  const ratio = phenoTally.map((part) => part.n).join(':');
  const ratioChoices = [...new Set([ratio, '1:1', '3:1', '1:2:1', '9:3:3:1', '1:1:1:1'])].slice(0, 4);
  const prediction: ChallengeQuestion[] = [
    {
      id: 'offspring-ratio',
      prompt: `Before revealing the grid, predict the ${traitLabel} ratio.`,
      choices: ratioChoices.map((value) => ({ value, label: value })),
      answer: ratio,
      explain:
        'The ratio follows from counting each equally likely gamete pairing in the grid. Reveal it now and connect every count to its cells.',
    },
  ];
  const challenge = useChallenge(prediction);
  useCheckpoint({ solved: revealed && (!predictFirst || challenge.allCorrect), activity });
  useEffect(() => {
    challenge.reset();
    // A different parent cross begins a fresh prediction attempt.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey, predictFirst]);
  const genoColor = (g: string): string => flat.find((c) => c.genotype === g)!.phenotype.color;

  const reveal = (): void => {
    setRevealed(true);
    onReveal?.();
  };

  const Bar = ({
    label,
    parts,
  }: {
    label: string;
    parts: { n: number; color: string; tag: string }[];
  }): ReactNode => {
    const total = parts.reduce((s, p) => s + p.n, 0) || 1;
    return (
      <div className="genetic-tally">
        <div className="genetic-tally-label">
          {label}:{' '}
          {parts
            .filter((p) => p.n)
            .map((p) => `${p.n} ${p.tag}`)
            .join(' : ')}
        </div>
        <div className="genetic-tally-bar">
          {parts
            .filter((p) => p.n)
            .map((p, i) => (
              <div
                key={i}
                className="genetic-tally-segment"
                style={
                  {
                    '--genetic-share': p.n / total,
                    '--genetic-color': p.color,
                  } as CSSProperties
                }
              >
                {p.n}
              </div>
            ))}
        </div>
      </div>
    );
  };

  const cellBg = (c: CrossCell): string =>
    highlight === c.genotype
      ? `color-mix(in oklab, ${c.phenotype.color} 34%, var(--stage-bg))`
      : `color-mix(in oklab, ${c.phenotype.color} 13%, var(--stage-bg))`;

  // Per-cell screen-reader label, e.g. "Aa, tall" (genotype + phenotype). Before
  // reveal the cells are a hidden quiz, so they announce as unrevealed.
  const cellAria = (c: CrossCell, r: number, ci: number): string =>
    revealed
      ? `${gameteLabel(gametes1[r]!)} × ${gameteLabel(gametes2[ci]!)} → ${c.genotype}, ${c.phenotype.label}`
      : `${gameteLabel(gametes1[r]!)} × ${gameteLabel(gametes2[ci]!)}, hidden until revealed`;
  // Whole-grid summary for assistive tech (announces the cross + ratio once revealed).
  const gridAria = revealed
    ? `Punnett grid, ${gametes1.length} by ${gametes2.length}. ${traitLabel} ratio ${phenoTally
        .map((p) => `${p.n} ${p.label}`)
        .join(', ')}.`
    : `Punnett grid, ${gametes1.length} by ${gametes2.length}, offspring hidden until you reveal the cross.`;

  const figure = (
    <>
      {legend}

      <div className="biology-model-surface genetic-cross-scene">
        <div
          role="table"
          className="genetic-cross-grid"
          aria-label={gridAria}
          style={
            {
              '--genetic-cell-size': `${cellSize}px`,
              '--genetic-columns': gametes2.length,
              '--genetic-font-size': `${fontSize}px`,
            } as CSSProperties
          }
        >
          <div role="row" className="genetic-cross-row">
            <div role="columnheader" aria-hidden className="genetic-cross-corner" />
            {gametes2.map((g, i) => (
              <div key={i} role="columnheader" className="genetic-cross-column-header">
                {gameteLabel(g)}
              </div>
            ))}
          </div>
          {cells.map((row, r) => (
            <div role="row" key={r} className="genetic-cross-row">
              <div role="rowheader" className="genetic-cross-row-header">
                {gameteLabel(gametes1[r]!)}
              </div>
              {row.map((c, ci) => (
                <Button
                  key={ci}
                  type="button"
                  variant="ghost"
                  role="cell"
                  className="genetic-cross-cell"
                  data-revealed={revealed || undefined}
                  aria-label={cellAria(c, r, ci)}
                  onClick={() => revealed && setHighlight((h) => (h === c.genotype ? null : c.genotype))}
                  title={revealed ? `${c.genotype} → ${c.phenotype.label}` : undefined}
                  style={
                    {
                      '--genetic-cell-bg': revealed ? cellBg(c) : 'var(--stage-bg)',
                    } as CSSProperties
                  }
                >
                  {revealed ? c.genotype : '?'}
                </Button>
              ))}
            </div>
          ))}
        </div>

        {revealed &&
          highlight &&
          (() => {
            const c = flat.find((x) => x.genotype === highlight)!;
            return (
              <p className="genetic-cross-note">
                {highlight}: {genoCount(highlight)} of {flat.length} (
                {((genoCount(highlight) / flat.length) * 100).toFixed(0)}%) →{' '}
                <b
                  className="genetic-phenotype"
                  style={{ '--genetic-color': c.phenotype.color } as CSSProperties}
                >
                  {c.phenotype.label}
                </b>
                {c.note ?? ''}
              </p>
            );
          })()}
      </div>
    </>
  );

  const inspector = (
    <div className="genetic-cross-inspector">
      {header}
      {revealed ? (
        <div className="genetic-tally-stack">
          {showGenotypeTally && (
            <Bar
              label="Genotype"
              parts={genotypes.map((g) => ({ n: genoCount(g), color: genoColor(g), tag: g }))}
            />
          )}
          <Bar label={traitLabel} parts={phenoTally.map((p) => ({ n: p.n, color: p.color, tag: p.label }))} />
          <StatusPill ok>
            {phenoTally.map((p) => p.n).join(':')} {phenoTally.map((p) => p.label).join(' : ')}
          </StatusPill>
        </div>
      ) : (
        <p className="genetic-control-hint">
          Choose the parent alleles, commit a ratio prediction, then reveal every equally likely pairing.
        </p>
      )}
    </div>
  );

  return (
    <Activity.Root className="biology-genetic-cross-activity" focusLayout="immersive">
      <Activity.Header>
        <Activity.Heading eyebrow="Inheritance" title={title} description={prompt} />
        <Activity.FocusButton />
      </Activity.Header>
      <Activity.Status>
        <strong>{revealed ? `${traitLabel} revealed` : 'predict first'}</strong>
        <span>
          {gametes1.length} × {gametes2.length} pairings
        </span>
        <span>
          {revealed ? `ratio ${ratio}` : challenge.answeredAll ? 'prediction committed' : 'offspring hidden'}
        </span>
      </Activity.Status>
      <Activity.Workspace>
        <Activity.Canvas label="Punnett grid and parent gametes">{figure}</Activity.Canvas>
        <Activity.Inspector label="Parent alleles and offspring evidence">{inspector}</Activity.Inspector>
      </Activity.Workspace>
      <Activity.Feedback>
        <span>Observe</span>
        <div>
          {revealed
            ? `Each box represents one possible offspring outcome. Counting the ${traitLabel} outcomes gives ${ratio}.`
            : 'The offspring stay hidden until you predict, so the grid tests the segregation model instead of merely displaying an answer.'}
        </div>
      </Activity.Feedback>
      {predictFirst ? (
        <section className="lab-authored-task" aria-label="Predict the offspring ratio">
          <ChallengeCard questions={prediction} state={challenge} title="Predict the offspring ratio" />
        </section>
      ) : null}
      <Activity.LiveRegion>
        {revealed
          ? `${traitLabel} ratio ${phenoTally.map((p) => `${p.n} ${p.label}`).join(', ')}.`
          : challenge.answeredAll
            ? 'Prediction committed; reveal the cross to test it.'
            : 'Predict the ratio, then reveal.'}
      </Activity.LiveRegion>
      <Activity.Transport>
        <div className="lab-transport-state" aria-live="polite">
          <strong>
            {revealed ? 'Cross revealed' : challenge.answeredAll ? 'Prediction ready' : 'Predict the ratio'}
          </strong>
          <span>
            {revealed ? `${flat.length} offspring outcomes` : `${gametes1.length} × ${gametes2.length} grid`}
          </span>
        </div>
        {!revealed ? (
          <ActionButton
            className="lab-primary-action"
            onClick={reveal}
            disabled={predictFirst && !challenge.answeredAll}
          >
            Reveal the cross
          </ActionButton>
        ) : null}
      </Activity.Transport>
    </Activity.Root>
  );
}
