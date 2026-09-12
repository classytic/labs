'use client';

/**
 * SystemSolveLab, two unknowns, two clues, solved by ELIMINATION, not just "drag to the
 * crossing point". The existing linear-system lab only shows the graph; this teaches the
 * method: line the clues up, cancel the matching column, read one unknown, back-substitute.
 *
 * The point the brief asked for: it's CONCRETE and SWAPPABLE. The maths is data (each clue
 * is coefficients over the unknowns), and the scene that renders a clue is pluggable, a
 * shop receipt, a bucket balance, or bare tiles, all from one config. A creator sets the
 * unknowns (with their hidden values), the clue coefficients, and picks a scene, no code; the
 * totals are computed so the puzzle is always consistent, and the worked method is generated.
 */

import { useState, type ReactNode } from 'react';
import { Activity } from '../../kit/activity.js';
import { useSlotFill, Blank, SlotTray, type FillSlot } from '../../kit/slot-fill.js';
import { RevealSolution } from '../../kit/pedagogy.js';
import { ClueScene, UnknownChip, clueTotal, type Unknown, type Clue } from '../../kit/clue-scene.js';

export interface SystemSolveProps {
  unknowns?: Unknown[];
  clues?: Clue[];
  /** Clue representation (registry name): 'receipt' | 'balance' | 'tiles' | 'bar' | 'coins' | … */
  scene?: string;
  currency?: string;
  unit?: string;
  store?: string;
  /** Extra wrong tiles for the answer tray. */
  distractors?: number[];
  title?: string;
  prompt?: string;
  activity?: string;
}

const DEFAULT_UNKNOWNS: Unknown[] = [
  { sym: '🍍', label: 'Pineapple', color: 'var(--stage-warn)', answer: 5 },
  { sym: '🥭', label: 'Mango', color: 'var(--stage-good)', answer: 2 },
];
const DEFAULT_CLUES: Clue[] = [{ coeffs: [2, 1] }, { coeffs: [1, 1] }];

/** Generate a concrete elimination walkthrough for the 2×2 case (else a generic hint). */
function eliminationSteps(unknowns: Unknown[], clues: Clue[]): ReactNode[] {
  if (unknowns.length !== 2 || clues.length !== 2) {
    return [
      'Line the clues up, scale one so a column matches, then subtract to cancel an unknown and back-substitute.',
    ];
  }
  const [c0, c1] = clues as [Clue, Clue];
  const t0 = clueTotal(c0, unknowns),
    t1 = clueTotal(c1, unknowns);
  // find a column with equal coefficients → subtract directly to cancel it
  const keep = c0.coeffs[0] === c1.coeffs[0] ? 1 : c0.coeffs[1] === c1.coeffs[1] ? 0 : -1;
  if (keep < 0) {
    return [
      'Scale one clue so a column matches the other, then subtract to cancel that unknown and back-substitute.',
    ];
  }
  const cancel = keep === 0 ? 1 : 0;
  const kU = unknowns[keep]!,
    cU = unknowns[cancel]!;
  const diffCoeff = c0.coeffs[keep]! - c1.coeffs[keep]!;
  const diffTotal = t0 - t1;
  const kVal = diffTotal / diffCoeff;
  return [
    <>
      Both clues have the same number of {cU.sym}, so subtract them: {t0} − {t1} = {diffTotal}, and the{' '}
      {cU.sym} cancels.
    </>,
    <>
      That leaves {diffCoeff === 1 ? '' : diffCoeff}
      {kU.sym} = {diffTotal}, so{' '}
      <strong>
        {kU.sym} = {kVal}
      </strong>
      .
    </>,
    <>
      Put {kU.sym} = {kVal} back into a clue to get{' '}
      <strong>
        {cU.sym} = {cU.answer}
      </strong>
      .
    </>,
  ];
}

export function SystemSolveLab(props: SystemSolveProps = {}): ReactNode {
  const {
    unknowns = DEFAULT_UNKNOWNS,
    clues = DEFAULT_CLUES,
    scene = 'receipt',
    currency,
    unit,
    store,
    distractors = [],
    title = 'Two clues, two unknowns',
    prompt = 'Each clue gives a total. Use both to find the value of each item.',
    activity = 'system-solve',
  } = props;

  const slots: FillSlot[] = unknowns.map((u, i) => ({
    id: `u${i}`,
    answer: u.answer,
    label: <UnknownChip u={u} size={22} />,
  }));

  // tiles: the answers + plausible near-miss tiles + any totals (a classic wrong pick)
  const pool = new Set<number>(distractors);
  unknowns.forEach((u) => {
    pool.add(u.answer);
    pool.add(u.answer + 1);
    pool.add(Math.max(0, u.answer - 1));
    pool.add(u.answer + 2);
  });
  clues.forEach((c) => pool.add(clueTotal(c, unknowns)));
  const tiles = [...pool].filter((v) => v >= 0).sort((a, b) => a - b);

  const [revealed, setRevealed] = useState(false);
  const fill = useSlotFill(slots, tiles, activity, () => setRevealed(true));

  const figure = (
    <div className="lab-scene-row">
      {clues.map((clue, i) => (
        <div key={i} className="lab-clue-scene">
          <span>Clue {i + 1}</span>
          <ClueScene
            kind={scene}
            clue={clue}
            unknowns={unknowns}
            currency={currency}
            unit={unit}
            store={store}
          />
        </div>
      ))}
    </div>
  );

  const steps = eliminationSteps(unknowns, clues);

  const footer = (
    <div className="lab-result-stack">
      <div className="lab-answer-row">
        {unknowns.map((u, i) => (
          <span key={i} className="lab-inline-answer">
            <UnknownChip u={u} size={26} /> = <Blank fill={fill} id={`u${i}`} />
          </span>
        ))}
      </div>
      <SlotTray fill={fill} />
      {fill.solved ? (
        <p role="status" className="lab-solved-message">
          ✓ Both clues check out.
        </p>
      ) : (
        <RevealSolution
          buttonLabel="How do I solve it?"
          note="A worked method, try the elimination yourself first."
          solution={
            <ol className="lab-worked-list">
              {steps.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ol>
          }
        />
      )}
      {revealed && (
        <p role="status" className="lab-result-copy">
          Solved:{' '}
          {unknowns.map((u, i) => (
            <span key={i}>
              {i > 0 ? ', ' : ''}
              {u.sym} = <strong>{u.answer}</strong>
            </span>
          ))}
          .
        </p>
      )}
    </div>
  );

  return (
    <Activity.Root className="math-system-solve-activity">
      <Activity.Header>
        <Activity.Heading eyebrow="Elimination" title={title} description={prompt} />
        <Activity.FocusButton />
      </Activity.Header>
      <Activity.Status>
        <strong>{fill.solved ? 'Both values found' : 'Compare the clues'}</strong>
        <span>{unknowns.length} unknowns</span>
        <span>{clues.length} clues</span>
      </Activity.Status>
      <Activity.Workspace>
        <Activity.Canvas label="Paired equation clues">{figure}</Activity.Canvas>
        <Activity.Inspector label="Answers and elimination guidance">{footer}</Activity.Inspector>
      </Activity.Workspace>
      <Activity.Feedback>
        <span>Observe</span>
        <div>
          Subtract matching quantities to eliminate one unknown, then substitute the value back into either
          clue.
        </div>
      </Activity.Feedback>
      <Activity.LiveRegion>
        {fill.solved
          ? 'Both unknown values are correct.'
          : 'Fill each unknown value so both clues remain true.'}
      </Activity.LiveRegion>
      <Activity.Transport>
        <div className="lab-transport-state">
          <strong>{fill.solved ? 'System solved' : 'Eliminate one unknown'}</strong>
          <span>{fill.solved ? 'Both clues check out' : 'Use the shared quantity'}</span>
        </div>
      </Activity.Transport>
    </Activity.Root>
  );
}
