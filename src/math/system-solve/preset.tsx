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
import { LabFrame, Callout } from '../../kit/frame.js';
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
    return ['Line the clues up, scale one so a column matches, then subtract to cancel an unknown and back-substitute.'];
  }
  const [c0, c1] = clues as [Clue, Clue];
  const t0 = clueTotal(c0, unknowns), t1 = clueTotal(c1, unknowns);
  // find a column with equal coefficients → subtract directly to cancel it
  const keep = c0.coeffs[0] === c1.coeffs[0] ? 1 : c0.coeffs[1] === c1.coeffs[1] ? 0 : -1;
  if (keep < 0) {
    return ['Scale one clue so a column matches the other, then subtract to cancel that unknown and back-substitute.'];
  }
  const cancel = keep === 0 ? 1 : 0;
  const kU = unknowns[keep]!, cU = unknowns[cancel]!;
  const diffCoeff = c0.coeffs[keep]! - c1.coeffs[keep]!;
  const diffTotal = t0 - t1;
  const kVal = diffTotal / diffCoeff;
  return [
    <>Both clues have the same number of {cU.sym}, so subtract them: {t0} − {t1} = {diffTotal}, and the {cU.sym} cancels.</>,
    <>That leaves {diffCoeff === 1 ? '' : diffCoeff}{kU.sym} = {diffTotal}, so <strong>{kU.sym} = {kVal}</strong>.</>,
    <>Put {kU.sym} = {kVal} back into a clue to get <strong>{cU.sym} = {cU.answer}</strong>.</>,
  ];
}

export function SystemSolveLab(props: SystemSolveProps = {}): ReactNode {
  const {
    unknowns = DEFAULT_UNKNOWNS, clues = DEFAULT_CLUES, scene = 'receipt',
    currency, unit, store, distractors = [],
    title = 'Two clues, two unknowns',
    prompt = 'Each clue gives a total. Use both to find the value of each item.',
    activity = 'system-solve',
  } = props;

  const slots: FillSlot[] = unknowns.map((u, i) => ({ id: `u${i}`, answer: u.answer, label: <UnknownChip u={u} size={22} /> }));

  // tiles: the answers + plausible near-miss tiles + any totals (a classic wrong pick)
  const pool = new Set<number>(distractors);
  unknowns.forEach((u) => { pool.add(u.answer); pool.add(u.answer + 1); pool.add(Math.max(0, u.answer - 1)); pool.add(u.answer + 2); });
  clues.forEach((c) => pool.add(clueTotal(c, unknowns)));
  const tiles = [...pool].filter((v) => v >= 0).sort((a, b) => a - b);

  const [revealed, setRevealed] = useState(false);
  const fill = useSlotFill(slots, tiles, activity, () => setRevealed(true));

  const figure = (
    <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', alignItems: 'center' }}>
      {clues.map((clue, i) => (
        <div key={i} style={{ display: 'grid', gap: 4, justifyItems: 'center' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--stage-muted)' }}>Clue {i + 1}</span>
          <ClueScene kind={scene} clue={clue} unknowns={unknowns} currency={currency} unit={unit} store={store} />
        </div>
      ))}
    </div>
  );

  const steps = eliminationSteps(unknowns, clues);

  const footer = (
    <div style={{ display: 'grid', gap: 14, justifyItems: 'center', marginTop: 4 }}>
      <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', justifyContent: 'center', fontSize: 17, fontWeight: 700 }}>
        {unknowns.map((u, i) => (
          <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <UnknownChip u={u} size={26} /> = <Blank fill={fill} id={`u${i}`} />
          </span>
        ))}
      </div>
      <SlotTray fill={fill} />
      {fill.solved
        ? <p role="status" style={{ margin: 0, color: 'var(--stage-good)', fontWeight: 700 }}>✓ Both clues check out.</p>
        : <RevealSolution
            buttonLabel="How do I solve it?"
            note="A worked method, try the elimination yourself first."
            solution={<ol style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 6, fontSize: 14 }}>{steps.map((s, i) => <li key={i}>{s}</li>)}</ol>}
          />}
      {revealed && (
        <Callout tone="result">
          <span style={{ fontSize: 13 }}>Solved: {unknowns.map((u, i) => <span key={i}>{i > 0 ? ', ' : ''}{u.sym} = <strong>{u.answer}</strong></span>)}.</span>
        </Callout>
      )}
    </div>
  );

  return <LabFrame title={title} prompt={prompt} footer={footer}>{figure}</LabFrame>;
}
