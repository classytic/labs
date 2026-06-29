'use client';

/**
 * StoichiometryLab, the limiting reagent, seen as a recipe. A balanced reaction is
 * a recipe (2 H₂ + O₂ → 2 H₂O = "2 hydrogens and 1 oxygen make 2 waters"); given how
 * much of each reactant you have, the one that runs out first caps how much product
 * you can make, and the rest is left over.
 *
 * Each reactant is a tray of molecule tokens: the part CONSUMED is solid, the
 * LEFTOVER fades out, so the limiting reagent is the tray that empties completely
 * (highlighted), and the excess shows as faded tokens. The product tray fills with
 * what's formed. Backed by `solveStoichiometry` (@classytic/stage/chem): extent,
 * limiting reagent, product moles/grams and leftovers. Drag the amounts, pick a
 * reaction (or author your own); interactive, no loop.
 */

import { useMemo, useState, type ReactNode } from 'react';
import { solveStoichiometry, type StoichSpecies } from '@classytic/stage/chem';
import { Slider, Chip } from '../../kit/controls.js';
import { LabFrame, ControlBar, Field, Callout } from '../../kit/frame.js';
import { useChallenge, ChallengeCard, useCheckpoint, type ChallengeQuestion } from '../../kit/pedagogy.js';

interface Spec extends StoichSpecies { color: string }
interface Reaction { reactants: Spec[]; products: Spec[]; defaults: number[] }

const PRESETS: Record<string, Reaction> = {
  water: { reactants: [{ name: 'H₂', coeff: 2, color: 'var(--stage-accent, #3b82f6)' }, { name: 'O₂', coeff: 1, color: 'var(--stage-danger, #e03131)' }], products: [{ name: 'H₂O', coeff: 2, molarMass: 18, color: 'rgb(40,160,200)' }], defaults: [4, 3] },
  ammonia: { reactants: [{ name: 'N₂', coeff: 1, color: 'rgb(70,110,210)' }, { name: 'H₂', coeff: 3, color: 'var(--stage-accent, #3b82f6)' }], products: [{ name: 'NH₃', coeff: 2, molarMass: 17, color: 'var(--stage-good, #16a34a)' }], defaults: [2, 5] },
  methane: { reactants: [{ name: 'CH₄', coeff: 1, color: 'rgb(120,130,150)' }, { name: 'O₂', coeff: 2, color: 'var(--stage-danger, #e03131)' }], products: [{ name: 'CO₂', coeff: 1, molarMass: 44, color: 'rgb(90,90,110)' }, { name: 'H₂O', coeff: 2, molarMass: 18, color: 'rgb(40,160,200)' }], defaults: [3, 5] },
  rust: { reactants: [{ name: 'Fe', coeff: 4, color: 'rgb(150,110,70)' }, { name: 'O₂', coeff: 3, color: 'var(--stage-danger, #e03131)' }], products: [{ name: 'Fe₂O₃', coeff: 2, molarMass: 160, color: 'rgb(170,80,40)' }], defaults: [8, 5] },
};
type RxKey = 'water' | 'ammonia' | 'methane' | 'rust';
const ORDER: RxKey[] = ['water', 'ammonia', 'methane', 'rust'];
const LABEL: Record<RxKey, string> = { water: 'Water', ammonia: 'Ammonia (Haber)', methane: 'Methane burning', rust: 'Rusting' };

export interface StoichiometryProps {
  reaction?: 'water' | 'ammonia' | 'methane' | 'rust';
  /** Override the reactant amounts (mol). */
  amounts?: number[];
  /** Author a custom reaction (overrides the preset). */
  reactants?: Spec[];
  products?: Spec[];
  title?: string;
  prompt?: string;
  objectives?: string[];
}

const W = 720, H = 330;
const STOICH_CHALLENGE: ChallengeQuestion[] = [
  {
    id: 'which',
    prompt: 'The limiting reagent is the reactant that…',
    choices: [
      { value: 'runsout', label: 'runs out first (smallest moles ÷ coefficient)' },
      { value: 'least', label: 'you simply have the fewest moles of' },
      { value: 'smallcoeff', label: 'has the smallest coefficient' },
    ],
    answer: 'runsout',
    explain: 'Compare moles ÷ coefficient for each reactant, the smallest is the limiting one. Raw moles or the coefficient alone can mislead.',
  },
  {
    id: 'excess',
    prompt: 'Adding MORE of the reactant that is already in excess changes the product made by…',
    choices: [
      { value: 'none', label: 'nothing: it just piles up as leftover' },
      { value: 'more', label: 'making proportionally more product' },
      { value: 'less', label: 'making less product' },
    ],
    answer: 'none',
    explain: 'Only the limiting reagent caps the yield. Excess reactant can’t react without more of the limiting one, so it’s left over.',
  },
];
const co = (n: number): string => (n === 1 ? '' : `${n} `);
const eqn = (rx: Reaction): string => `${rx.reactants.map((s) => co(s.coeff) + s.name).join(' + ')}  →  ${rx.products.map((s) => co(s.coeff) + s.name).join(' + ')}`;
const fmt = (n: number): string => (Math.abs(n - Math.round(n)) < 1e-6 ? Math.round(n).toString() : n.toFixed(2));

export function StoichiometryLab({
  reaction = 'water',
  amounts: amounts0,
  reactants: customR,
  products: customP,
  title = 'Stoichiometry: the limiting reagent',
  prompt = 'A balanced equation is a recipe. Whichever reactant runs out first limits how much product you can make, the rest is left over. Drag the amounts and watch.',
  objectives = [
    'Read a balanced equation as a mole ratio (a recipe)',
    'Find the limiting reagent: the one that runs out first (smallest moles ÷ coeff)',
    'Work out the product formed and the reactant left in excess',
  ],
}: StoichiometryProps = {}): ReactNode {
  const [preset, setPreset] = useState<RxKey>(reaction);
  const rx: Reaction = customR && customP ? { reactants: customR, products: customP, defaults: customR.map(() => 4) } : PRESETS[preset]!;
  const [amounts, setAmounts] = useState<number[]>(amounts0 ?? rx.defaults);
  const amt = rx.reactants.map((_, i) => amounts[i] ?? rx.defaults[i] ?? 4);

  const res = useMemo(() => solveStoichiometry(rx.reactants, rx.products, amt), [rx, amt.join(',')]);
  const switchPreset = (p: RxKey): void => { setPreset(p); setAmounts(PRESETS[p]!.defaults); };
  const challenge = useChallenge(STOICH_CHALLENGE);
  useCheckpoint({ solved: challenge.allCorrect, activity: 'stoichiometry' });
  const setAmt = (i: number, v: number): void => setAmounts((a) => { const n = [...(a.length ? a : rx.defaults)]; n[i] = v; return n; });

  // ── token layout ──
  const tray = (cx: number, top: number, count: number, solidUpto: number, color: string, max = 12): ReactNode[] => {
    const n = Math.min(max, Math.ceil(count - 1e-9));
    return Array.from({ length: n }, (_, k) => {
      const opacity = 0.2 + 0.8 * Math.max(0, Math.min(1, solidUpto - k));
      const col = k % 3, row = Math.floor(k / 3);
      return <circle key={k} cx={cx - 22 + col * 22} cy={top + row * 22} r={9} fill={color} opacity={opacity} stroke="var(--stage-bg)" strokeWidth={1.5} />;
    });
  };

  const nR = rx.reactants.length, nP = rx.products.length;
  const rXs = nR === 1 ? [150] : [105, 235];
  const arrowX = 350;
  const pXs = nP === 1 ? [520] : [475, 605];
  const top = 90;

  const figure = (
    <div style={{ borderRadius: 14, overflow: 'hidden', background: 'var(--stage-bg)', border: '1px solid var(--stage-grid)' }}>
      <div style={{ textAlign: 'center', fontSize: 17, fontWeight: 700, padding: '12px 8px 4px', letterSpacing: 0.3 }}>{eqn(rx)}</div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`limiting reagent ${res.limiting.join(' and ')}, ${fmt(res.products[0]!.moles)} mol product`}>
        {rx.reactants.map((s, i) => {
          const isLim = res.limiting.includes(s.name);
          return (
            <g key={s.name}>
              {isLim && <rect x={rXs[i]! - 42} y={top - 30} width={84} height={132} rx={8} fill="none" stroke="var(--stage-danger, #e03131)" strokeWidth={2} strokeDasharray="5 3" />}
              <text x={rXs[i]} y={top - 14} textAnchor="middle" fontSize={13} fontWeight={700} fill="var(--stage-fg)">{co(s.coeff)}{s.name}</text>
              {tray(rXs[i]!, top + 4, amt[i]!, res.consumed[i]!, s.color)}
              <text x={rXs[i]} y={top + 116} textAnchor="middle" fontSize={11} fill={isLim ? 'var(--stage-danger, #e03131)' : 'var(--stage-muted)'}>{isLim ? 'limiting' : `${fmt(res.leftover[i]!)} left`}</text>
            </g>
          );
        })}
        {/* arrow */}
        <line x1={arrowX - 24} y1={top + 40} x2={arrowX + 24} y2={top + 40} stroke="var(--stage-fg)" strokeWidth={2.5} />
        <polygon points={`${arrowX + 24},${top + 40} ${arrowX + 14},${top + 34} ${arrowX + 14},${top + 46}`} fill="var(--stage-fg)" />
        {rx.products.map((s, j) => (
          <g key={s.name}>
            <text x={pXs[j]} y={top - 14} textAnchor="middle" fontSize={13} fontWeight={700} fill="var(--stage-fg)">{co(s.coeff)}{s.name}</text>
            {tray(pXs[j]!, top + 4, res.products[j]!.moles, res.products[j]!.moles, s.color)}
            <text x={pXs[j]} y={top + 116} textAnchor="middle" fontSize={11} fill="var(--stage-good, #16a34a)">{fmt(res.products[j]!.moles)} mol</text>
          </g>
        ))}
      </svg>
    </div>
  );

  const p0 = res.products[0]!;
  const aside = (
    <>
      <Callout tone="result">
        <span style={{ display: 'grid', gap: 2, fontVariantNumeric: 'tabular-nums' }}>
          <span style={{ fontWeight: 800, fontSize: 15 }}>limiting: {res.limiting.join(' & ')}</span>
          <span style={{ fontSize: 13, color: 'var(--stage-muted)' }}>{fmt(p0.moles)} mol {p0.name}{p0.grams != null ? ` (${fmt(p0.grams)} g)` : ''}</span>
        </span>
      </Callout>
      <div style={{ display: 'grid', gap: 6, padding: '8px 2px 0', fontSize: 13, color: 'var(--stage-muted)' }}>
        <span>The <strong style={{ color: 'var(--stage-danger, #e03131)' }}>{res.limiting.join(' & ')}</strong> runs out first (smallest moles ÷ coefficient), so it caps the yield. Add more of it to make more product; add more of the other and it just piles up as excess.</span>
        {rx.reactants.some((s, i) => !res.limiting.includes(s.name) && res.leftover[i]! > 1e-6) && (
          <span>Left over: {rx.reactants.map((s, i) => (res.leftover[i]! > 1e-6 && !res.limiting.includes(s.name) ? `${fmt(res.leftover[i]!)} mol ${s.name}` : null)).filter(Boolean).join(', ')}.</span>
        )}
      </div>
    </>
  );

  // The challenge goes FULL-WIDTH in the footer, in the narrow aside it forced the
  // column tall and left the figure box mostly empty.
  const footer = <ChallengeCard questions={STOICH_CHALLENGE} state={challenge} title="Predict first" />;

  const controls = (
    <div style={{ display: 'grid', gap: 10 }}>
      <ControlBar>
        <Field label="reaction">
          <span className="lab-field-row" style={{ flexWrap: 'wrap' }}>
            {ORDER.map((p) => <Chip key={p} selected={!customR && preset === p} onClick={() => switchPreset(p)}>{LABEL[p]}</Chip>)}
          </span>
        </Field>
      </ControlBar>
      <ControlBar>
        {rx.reactants.map((s, i) => (
          <Field key={s.name} label={`${s.name}`} value={`${fmt(amt[i]!)} mol`}>
            <Slider value={amt[i]!} min={1} max={10} step={1} onChange={(v) => setAmt(i, v)} ariaLabel={`amount of ${s.name} in moles`} />
          </Field>
        ))}
      </ControlBar>
    </div>
  );

  return <LabFrame title={title} prompt={prompt} objectives={objectives} aside={aside} controls={controls} footer={footer}>{figure}</LabFrame>;
}
