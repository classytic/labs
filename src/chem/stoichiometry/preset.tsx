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
import { Slider, Segmented } from '../../kit/controls.js';
import { Field, Readout } from '../../kit/frame.js';
import { AuthoredActivityRuntime, AuthoredMetricGate } from '../../kit/authored-activity-runtime.js';
import type { AuthoredActivity, AuthoredChoiceQuestion } from '../../kit/activity-authoring.js';
import {
  Figure,
  FigText,
  Particle,
  Region,
  Arrow,
  HUE,
  STROKE,
  tint,
  shade,
} from '../../kit/figure/index.js';

interface Spec extends StoichSpecies {
  color: string;
}
interface Reaction {
  reactants: Spec[];
  products: Spec[];
  defaults: number[];
}

// Species colours are figure roles: hue-1 (subject), hue-2 (other party), hue-3 (medium),
// `hot` for oxygen, neutrals for carbon/iron, so every recipe reads in the same language.
const PRESETS: Record<string, Reaction> = {
  water: {
    reactants: [
      { name: 'H₂', coeff: 2, color: HUE[1] },
      { name: 'O₂', coeff: 1, color: HUE.hot },
    ],
    products: [{ name: 'H₂O', coeff: 2, molarMass: 18, color: HUE[3] }],
    defaults: [4, 3],
  },
  ammonia: {
    reactants: [
      { name: 'N₂', coeff: 1, color: HUE[2] },
      { name: 'H₂', coeff: 3, color: HUE[1] },
    ],
    products: [{ name: 'NH₃', coeff: 2, molarMass: 17, color: HUE.good }],
    defaults: [2, 5],
  },
  methane: {
    reactants: [
      { name: 'CH₄', coeff: 1, color: HUE.metal },
      { name: 'O₂', coeff: 2, color: HUE.hot },
    ],
    products: [
      { name: 'CO₂', coeff: 1, molarMass: 44, color: shade(HUE.metal, 55) },
      { name: 'H₂O', coeff: 2, molarMass: 18, color: HUE[3] },
    ],
    defaults: [3, 5],
  },
  rust: {
    reactants: [
      { name: 'Fe', coeff: 4, color: HUE.metal },
      { name: 'O₂', coeff: 3, color: HUE.hot },
    ],
    products: [{ name: 'Fe₂O₃', coeff: 2, molarMass: 160, color: shade(HUE[2], 75) }],
    defaults: [8, 5],
  },
};
type RxKey = 'water' | 'ammonia' | 'methane' | 'rust';
const ORDER: RxKey[] = ['water', 'ammonia', 'methane', 'rust'];
const LABEL: Record<RxKey, string> = {
  water: 'Water',
  ammonia: 'Ammonia (Haber)',
  methane: 'Methane burning',
  rust: 'Rusting',
};

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
  /** Override the authored lesson flow while retaining the stoichiometry engine and scene. */
  activity?: AuthoredActivity;
}

// The viewBox is cropped to the trays plus a small optical margin; the scene stays
// fluid because the viewBox, not a fixed CSS height, controls composition.
const W = 720,
  H = 190;
// token grid: 3 columns × up to 4 rows of r=10 tokens
const TOK_R = 10,
  TOK_GAP = 25,
  TOK_MAX = 12;
const NAME_Y = 32,
  TOK_TOP = 58,
  NOTE_Y = 166;
const STOICH_CHALLENGE: AuthoredChoiceQuestion[] = [
  {
    id: 'which',
    prompt: 'The limiting reagent is the reactant that…',
    choices: [
      { value: 'runsout', label: 'runs out first (smallest moles ÷ coefficient)' },
      { value: 'least', label: 'you simply have the fewest moles of' },
      { value: 'smallcoeff', label: 'has the smallest coefficient' },
    ],
    answer: 'runsout',
    explain:
      'Compare moles ÷ coefficient for each reactant, the smallest is the limiting one. Raw moles or the coefficient alone can mislead.',
  },
  {
    id: 'excess',
    prompt: 'Adding yet more of the reactant that is already in excess changes the product made by…',
    choices: [
      { value: 'none', label: 'nothing: it just piles up as leftover' },
      { value: 'more', label: 'making proportionally more product' },
      { value: 'less', label: 'making less product' },
    ],
    answer: 'none',
    explain:
      'Only the limiting reagent caps the yield. Excess reactant can’t react without more of the limiting one, so it’s left over.',
  },
];
const STEPS: AuthoredActivity['steps'] = [
  {
    id: 'predict',
    phase: 'predict',
    title: 'Predict what limits yield',
    lead: 'Choose the rule before viewing the molecule trays.',
    success: 'limiting-rule',
  },
  {
    id: 'act',
    phase: 'act',
    title: 'Change a reactant amount',
    lead: 'Adjust either tray and watch consumption, product, and leftover update together.',
    reveal: ['model', 'evidence'],
    controls: true,
    success: 'amount-changed',
  },
  {
    id: 'observe',
    phase: 'observe',
    title: 'Account for every mole',
    lead: 'Read which reagent empties and which remains.',
    reveal: ['model', 'evidence'],
  },
  {
    id: 'explain',
    phase: 'explain',
    title: 'Explain excess reagent',
    lead: 'Decide whether adding more excess changes yield.',
    success: 'excess-explanation',
  },
  {
    id: 'transfer',
    phase: 'transfer',
    title: 'Test another reaction',
    lead: 'Switch recipes and identify the new limiting reagent.',
    reveal: ['model', 'evidence'],
    controls: true,
    success: 'reaction-changed',
  },
];
const co = (n: number): string => (n === 1 ? '' : `${n} `);
const eqn = (rx: Reaction): string =>
  `${rx.reactants.map((s) => co(s.coeff) + s.name).join(' + ')}  →  ${rx.products.map((s) => co(s.coeff) + s.name).join(' + ')}`;
const fmt = (n: number): string =>
  Math.abs(n - Math.round(n)) < 1e-6 ? Math.round(n).toString() : n.toFixed(2);

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
  activity,
}: StoichiometryProps = {}): ReactNode {
  const [preset, setPreset] = useState<RxKey>(reaction);
  const rx: Reaction =
    customR && customP
      ? { reactants: customR, products: customP, defaults: customR.map(() => 4) }
      : PRESETS[preset]!;
  const [amounts, setAmounts] = useState<number[]>(amounts0 ?? rx.defaults);
  const amt = rx.reactants.map((_, i) => amounts[i] ?? rx.defaults[i] ?? 4);

  const res = useMemo(() => solveStoichiometry(rx.reactants, rx.products, amt), [rx, amt.join(',')]);
  const switchPreset = (p: RxKey): void => {
    setPreset(p);
    setAmounts(PRESETS[p]!.defaults);
  };
  const setAmt = (i: number, v: number): void =>
    setAmounts((a) => {
      const n = [...(a.length ? a : rx.defaults)];
      n[i] = v;
      return n;
    });

  // ── token layout: consumed tokens are solid, leftover tokens are hollow "ghost" rings ──
  const tray = (cx: number, count: number, solidUpto: number, color: string): ReactNode[] => {
    const n = Math.min(TOK_MAX, Math.ceil(count - 1e-9));
    return Array.from({ length: n }, (_, k) => {
      const used = Math.max(0, Math.min(1, solidUpto - k));
      const col = k % 3,
        row = Math.floor(k / 3);
      const x = cx - TOK_GAP + col * TOK_GAP,
        y = TOK_TOP + row * TOK_GAP;
      if (used >= 0.999) return <Particle key={k} x={x} y={y} r={TOK_R} color={color} />;
      return (
        <g key={k}>
          <circle
            cx={x}
            cy={y}
            r={TOK_R}
            fill={tint(color, 14)}
            stroke={color}
            strokeWidth={STROKE.hair}
            strokeDasharray={`${STROKE.hair * 3} ${STROKE.hair * 2.5}`}
          />
          {used > 0.02 && <Particle x={x} y={y} r={TOK_R * Math.sqrt(used)} color={color} />}
        </g>
      );
    });
  };

  const nR = rx.reactants.length,
    nP = rx.products.length;
  const rXs = nR === 1 ? [150] : [105, 235];
  const arrowX = 350;
  const pXs = nP === 1 ? [520] : [475, 605];
  const gridMidY = TOK_TOP + TOK_GAP * 1.5;
  const trayW = TOK_GAP * 2 + TOK_R * 2 + 20;

  const figure = (
    <div
      className="chem-scene chem-stoich-scene chem-wide-scene"
      role="region"
      aria-label="Stoichiometric reaction trays; scroll horizontally on a narrow screen"
      tabIndex={0}
    >
      <div className="chem-reaction-equation">{eqn(rx)}</div>
      <Figure
        viewBox={[W, H]}
        domain="chem"
        label={`limiting reagent ${res.limiting.join(' and ')}, ${fmt(res.products[0]!.moles)} mol product`}
      >
        {rx.reactants.map((s, i) => {
          const isLim = res.limiting.includes(s.name);
          const cx = rXs[i]!;
          return (
            <g key={s.name}>
              {isLim && <Region x={cx - trayW / 2} y={12} w={trayW} h={H - 20} color={HUE.hot} radius={10} />}
              <FigText x={cx} y={NAME_Y} anchor="middle" size="title">
                {co(s.coeff)}
                {s.name}
              </FigText>
              {tray(cx, amt[i]!, res.consumed[i]!, s.color)}
              <FigText x={cx} y={NOTE_Y} anchor="middle" size="note" tone={isLim ? 'hot' : 'soft'}>
                {isLim ? 'limiting · runs out' : `${fmt(res.leftover[i]!)} left over`}
              </FigText>
            </g>
          );
        })}
        {nR === 2 && (
          <FigText
            x={(rXs[0]! + rXs[1]!) / 2}
            y={gridMidY}
            anchor="middle"
            baseline="middle"
            size="measure"
            tone="soft"
          >
            +
          </FigText>
        )}
        <Arrow x1={arrowX - 26} y1={gridMidY} x2={arrowX + 26} y2={gridMidY} weight="edge" head={10} />
        {rx.products.map((s, j) => (
          <g key={s.name}>
            <FigText x={pXs[j]!} y={NAME_Y} anchor="middle" size="title">
              {co(s.coeff)}
              {s.name}
            </FigText>
            {tray(pXs[j]!, res.products[j]!.moles, res.products[j]!.moles, s.color)}
            <FigText x={pXs[j]!} y={NOTE_Y} anchor="middle" size="note" tone="good">
              {fmt(res.products[j]!.moles)} mol made
            </FigText>
          </g>
        ))}
        {nP === 2 && (
          <FigText
            x={(pXs[0]! + pXs[1]!) / 2}
            y={gridMidY}
            anchor="middle"
            baseline="middle"
            size="measure"
            tone="soft"
          >
            +
          </FigText>
        )}
      </Figure>
    </div>
  );

  const p0 = res.products[0]!;
  const evidence = (
    <>
      <Readout
        value={<>limiting: {res.limiting.join(' & ')}</>}
        sub={
          <>
            {fmt(p0.moles)} mol {p0.name}
            {p0.grams != null ? ` (${fmt(p0.grams)} g)` : ''}
          </>
        }
      />
      <div className="chem-explanation">
        <span>
          The <strong data-tone="danger">{res.limiting.join(' & ')}</strong> runs out first (smallest moles ÷
          coefficient), so it caps the yield. Add more of it to make more product; add more of the other and
          it just piles up as excess.
        </span>
        {rx.reactants.some((s, i) => !res.limiting.includes(s.name) && res.leftover[i]! > 1e-6) && (
          <span>
            Left over:{' '}
            {rx.reactants
              .map((s, i) =>
                res.leftover[i]! > 1e-6 && !res.limiting.includes(s.name)
                  ? `${fmt(res.leftover[i]!)} mol ${s.name}`
                  : null,
              )
              .filter(Boolean)
              .join(', ')}
            .
          </span>
        )}
      </div>
    </>
  );

  const controls = (
    <>
      <Field label="reaction">
        {/* An authored custom reaction is none of the presets, so nothing should read as
            pressed: '' is that state and is deliberately absent from `options`. */}
        <Segmented<RxKey | ''>
          ariaLabel="reaction"
          value={customR ? '' : preset}
          onChange={(p) => {
            if (p) switchPreset(p);
          }}
          options={ORDER.map((p) => ({ value: p, label: LABEL[p] }))}
        />
      </Field>
      {rx.reactants.map((s, i) => (
        <Field key={s.name} label={`${s.name}`} value={`${fmt(amt[i]!)} mol`}>
          <Slider
            value={amt[i]!}
            min={1}
            max={10}
            step={1}
            onChange={(v) => setAmt(i, v)}
            ariaLabel={`amount of ${s.name} in moles`}
          />
        </Field>
      ))}
    </>
  );

  const amountChanged = amt.some((value, index) => value !== (amounts0 ?? rx.defaults)[index]);
  const reactionChanged = !customR && preset !== reaction;
  const runtimeActivity: AuthoredActivity = activity ?? {
    pattern: 'investigation',
    title,
    objectives,
    steps: STEPS,
    questions: STOICH_CHALLENGE,
    success: [
      {
        id: 'limiting-rule',
        source: 'answer',
        key: 'which',
        pendingLabel: 'Choose the rule for identifying a limiting reagent.',
      },
      {
        id: 'amount-changed',
        source: 'metric',
        key: 'amountChanged',
        operator: 'eq',
        value: true,
        pendingLabel: 'Change at least one reactant amount.',
      },
      {
        id: 'excess-explanation',
        source: 'answer',
        key: 'excess',
        pendingLabel: 'Explain what happens when more excess reagent is added.',
      },
      {
        id: 'reaction-changed',
        source: 'metric',
        key: 'reactionChanged',
        operator: 'eq',
        value: true,
        pendingLabel: 'Choose a different reaction.',
      },
    ],
  };

  return (
    <AuthoredActivityRuntime
      focusLayout="immersive"
      activity={runtimeActivity}
      activityId="stoichiometry"
      eyebrow="Chemical quantities"
      title={title}
      description={prompt}
      status={<span>limiting {res.limiting.join(' & ')}</span>}
      evidence={({ sequence }) => (sequence.shows('evidence') ? evidence : null)}
      controls={({ sequence }) => (sequence.current.controls ? controls : null)}
      observation={({ sequence }) =>
        sequence.shows('model')
          ? `${res.limiting.join(' and ')} runs out first; ${fmt(p0.moles)} mol ${p0.name} forms.`
          : null
      }
      transcript={
        <p>
          The balanced reaction is {eqn(rx)}. Available amounts are{' '}
          {rx.reactants.map((s, i) => `${fmt(amt[i]!)} moles ${s.name}`).join(' and ')}. The limiting reagent
          is {res.limiting.join(' and ')}. {fmt(p0.moles)} moles of {p0.name} forms.
        </p>
      }
    >
      {({ sequence, complete }) => (
        <>
          <AuthoredMetricGate
            conditionId="amount-changed"
            met={sequence.current.id === 'act' && amountChanged}
            complete={complete}
          />
          <AuthoredMetricGate
            conditionId="reaction-changed"
            met={sequence.current.id === 'transfer' && reactionChanged}
            complete={complete}
          />
          {sequence.shows('model') ? figure : <p>Answer the prediction to reveal the reaction model.</p>}
        </>
      )}
    </AuthoredActivityRuntime>
  );
}
