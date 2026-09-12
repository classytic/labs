'use client';
import { Button } from '@/components/ui/button';

/**
 * EquationBalanceLab, the balance sheet that must stay LEVEL.
 *
 * Apply each authored transaction one at a time; weights slide onto a two-pan
 * scale (left = Assets, right = Liabilities + Equity) and the beam re-levels ,
 * because every balanced entry changes both sides equally, "Assets = Liabilities
 * + Equity" stops being a formula and becomes a felt constraint. A free-post mode
 * lets the learner nudge ONE side and watch the books visibly tip (the #1
 * misconception drill). Reuses the shared ScaleFrame; tokenized; reduced-motion safe.
 *
 * The A = L + E rearrangement (Equity = Assets − Liabilities) belongs in a paired
 * MathDerivation, this lab only makes the constraint felt.
 */

import { useMemo, useState, type ReactNode } from 'react';
import { Stage, Circle, Label, Segment, StageAssetDefs } from '@classytic/stage';
import { ScaleFrame } from '../../kit/scale.js';
import { Chip, CheckButton } from '../../kit/controls.js';
import { Field, LiveRegion, Readout } from '../../kit/frame.js';
import { AuthoredActivityRuntime, AuthoredMetricGate } from '../../kit/authored-activity-runtime.js';
import type { AuthoredActivity, AuthoredChoiceQuestion } from '../../kit/activity-authoring.js';
import { clamp } from '../../core/util.js';
import { CATEGORY_COLOR, equationParts, money, type Account, type AccountCategory } from './core.js';
import { EvidencePanel } from '../activity.js';

export interface TxnEffect {
  account: string;
  delta: number;
}
export interface Transaction {
  id: string;
  label: string;
  effects: TxnEffect[];
}

export interface EquationBalanceProps {
  accounts?: Account[];
  transactions?: Transaction[];
  freePost?: boolean;
  start?: number;
  title?: string;
  prompt?: string;
  height?: number;
  objectives?: string[];
}

const DEMO_ACCOUNTS: Account[] = [
  { id: 'cash', name: 'Cash', category: 'Asset' },
  { id: 'equip', name: 'Equipment', category: 'Asset' },
  { id: 'loan', name: 'Bank loan', category: 'Liability' },
  { id: 'capital', name: 'Capital', category: 'Equity' },
];
const DEMO_TXNS: Transaction[] = [
  {
    id: 't1',
    label: 'Owner invests $10,000 cash',
    effects: [
      { account: 'cash', delta: 10000 },
      { account: 'capital', delta: 10000 },
    ],
  },
  {
    id: 't2',
    label: 'Take a $5,000 bank loan',
    effects: [
      { account: 'cash', delta: 5000 },
      { account: 'loan', delta: 5000 },
    ],
  },
  {
    id: 't3',
    label: 'Buy equipment for $3,000 cash',
    effects: [
      { account: 'equip', delta: 3000 },
      { account: 'cash', delta: -3000 },
    ],
  },
];

const EQUATION_QUESTIONS: AuthoredChoiceQuestion[] = [
  {
    id: 'constraint',
    prompt: 'A balanced transaction must…',
    choices: [
      { value: 'both', label: 'preserve both sides of A = L + E' },
      { value: 'assets', label: 'change assets only' },
      { value: 'equity', label: 'change equity only' },
    ],
    answer: 'both',
    explain: 'Every valid entry preserves the equality, even when two accounts on the same side change.',
  },
];
const EQUATION_STEPS: AuthoredActivity['steps'] = [
  {
    id: 'predict',
    phase: 'predict',
    title: 'Predict the constraint',
    lead: 'Decide what every valid transaction must preserve.',
    success: 'constraint-answer',
  },
  {
    id: 'observe',
    phase: 'observe',
    title: 'Inspect the level books',
    lead: 'Read Assets against Liabilities plus Equity.',
    reveal: ['model'],
  },
  {
    id: 'act',
    phase: 'act',
    title: 'Post every transaction',
    lead: 'Apply the authored events and keep the scale level.',
    reveal: ['model'],
    controls: true,
    success: 'all-posted',
  },
  {
    id: 'transfer',
    phase: 'transfer',
    title: 'Test the constraint',
    lead: 'Use free-post controls, when enabled, to expose a one-sided entry.',
    reveal: ['model'],
    controls: true,
  },
];

const VIEW = { xMin: -7, xMax: 7, yMin: -4.6, yMax: 5.2 };
const PIVOT = { x: 0, y: 1.2 };
const HB = 4.2,
  PAN_HANG = 1.35,
  PAN_R = 1.75,
  BASE_Y = -3.6;

export function EquationBalanceLab({
  accounts = DEMO_ACCOUNTS,
  transactions = DEMO_TXNS,
  freePost = false,
  start = 0,
  title = 'The balance sheet that must stay level',
  prompt = 'Apply each transaction, Assets must always equal Liabilities + Equity.',
  height = 320,
  objectives,
}: EquationBalanceProps): ReactNode {
  const [applied, setApplied] = useState(clamp(start, 0, transactions.length));
  const [extraA, setExtraA] = useState(0); // free-post one-sided nudges
  const [extraLE, setExtraLE] = useState(0);

  // cumulative natural balance per account from the applied transactions
  const balanceOf = useMemo(() => {
    const bal: Record<string, number> = {};
    for (let i = 0; i < applied; i++)
      for (const e of transactions[i]!.effects) bal[e.account] = (bal[e.account] ?? 0) + e.delta;
    return (id: string): number => bal[id] ?? 0;
  }, [applied, transactions]);

  const { assets: a0, liabilities, equity } = equationParts(accounts, balanceOf);
  const assets = a0 + extraA;
  const rhs = liabilities + equity + extraLE;
  const imbalance = assets - rhs;
  const balanced = Math.abs(imbalance) < 0.005;
  const ref = Math.max(assets, rhs, 1);
  // A real scale tips CLEARLY to the heavy side, level only when truly balanced.
  // Map any non-zero imbalance to an unmistakable tilt (≥ ~7°), saturating to a
  // full tip; tiny `imbalance/ref` ratios were leaving the beam looking level.
  const frac = clamp(Math.abs(imbalance) / ref, 0, 1);
  const drop = balanced ? 0 : Math.sign(imbalance) * (0.5 + 0.5 * frac) * 1.3;

  const solved = balanced && applied === transactions.length && applied > 0 && extraA === 0 && extraLE === 0;

  const beamA = { x: PIVOT.x - HB, y: PIVOT.y - drop };
  const beamB = { x: PIVOT.x + HB, y: PIVOT.y + drop };
  const trayLC = { x: beamA.x, y: beamA.y - PAN_HANG };
  const trayRC = { x: beamB.x, y: beamB.y - PAN_HANG };

  // coins resting on a pan: one per non-zero account, stacked upward, category-
  // coloured. Labels sit clear of the coin (left pan → left, right pan → right),
  // one per row with enough vertical gap that names never collide.
  const coins = (center: { x: number; y: number }, cats: AccountCategory[]): ReactNode[] => {
    const items = accounts.filter((ac) => cats.includes(ac.category) && Math.abs(balanceOf(ac.id)) > 0.005);
    const leftPan = center.x < 0;
    return items.map((ac, i) => {
      const cy = center.y + 0.7 + i * 1.15;
      return (
        <g key={ac.id}>
          <Circle
            center={{ x: center.x, y: cy }}
            r={0.4}
            color={CATEGORY_COLOR[ac.category]}
            fill={CATEGORY_COLOR[ac.category]}
            fillOpacity={0.92}
            weight={0}
          />
          <Label
            x={center.x}
            y={cy}
            text={`${ac.name} ${money(balanceOf(ac.id))}`}
            color="var(--stage-fg)"
            size={11}
            dx={leftPan ? -22 : 22}
            anchor={leftPan ? 'end' : 'start'}
          />
        </g>
      );
    });
  };

  const next = transactions[applied];

  const figure = (
    <>
      <div className="commerce-scene-frame">
        <Stage
          view={VIEW}
          height={height}
          preserveAspect
          ariaLabel={`Balance: assets ${money(assets)}, liabilities plus equity ${money(rhs)}, ${
            balanced ? 'level' : 'tipped'
          }`}
        >
          <StageAssetDefs />
          <Segment
            from={{ x: -6.4, y: 3 }}
            to={{ x: -2, y: 3 }}
            color={CATEGORY_COLOR.Asset}
            opacity={0.4}
            weight={1}
            dashed
          />
          <Label x={-4.2} y={3} text="ASSETS" color={CATEGORY_COLOR.Asset} size={11} dy={-12} />
          <Label x={4.2} y={3} text="LIABILITIES + EQUITY" color={CATEGORY_COLOR.Equity} size={11} dy={-12} />
          <ScaleFrame
            pivot={PIVOT}
            beamA={beamA}
            beamB={beamB}
            trayLC={trayLC}
            trayRC={trayRC}
            baseY={BASE_Y}
            panR={PAN_R}
            balanced={balanced}
          />
          {coins(trayLC, ['Asset'])}
          {coins(trayRC, ['Liability', 'Equity'])}
          <Label
            x={0}
            y={BASE_Y - 0.4}
            text={`A ${money(assets)}  =  L ${money(liabilities + extraLE)} + E ${money(equity)}`}
            color="var(--stage-fg)"
            size={13}
            weight={700}
          />
        </Stage>
      </div>
      <LiveRegion>
        {`Assets ${money(assets)}, Liabilities plus Equity ${money(rhs)}. ${
          balanced ? 'Balanced.' : 'Not balanced.'
        }`}
      </LiveRegion>
    </>
  );

  const evidence = (
    <EvidencePanel title="Equation evidence">
      <Readout
        tone={balanced ? 'result' : 'info'}
        accent={balanced ? 'var(--stage-good, #16a34a)' : 'var(--stage-danger, #e03131)'}
        value={<>{balanced ? 'Balanced ✓' : `Off by ${money(Math.abs(imbalance))}`}</>}
        sub={
          <>
            A {money(assets)} = L {money(liabilities + extraLE)} + E {money(equity)}
          </>
        }
      />
      <p className="finance-aside-copy">
        {next ? (
          <>
            <strong>Next:</strong> {next.label}
          </>
        ) : (
          'All transactions applied, the books still balance.'
        )}
      </p>
    </EvidencePanel>
  );

  const controls = (
    <>
      <Field label="transactions" value={`${applied}/${transactions.length}`}>
        <span className="lab-field-row">
          <Button
            variant="outline"
            size="sm"
            type="button"
            className="lab-chip"
            onClick={() => setApplied((n) => Math.max(0, n - 1))}
            disabled={applied === 0}
          >
            ◀ Back
          </Button>
          <CheckButton
            onClick={() => setApplied((n) => Math.min(transactions.length, n + 1))}
            disabled={applied >= transactions.length}
          >
            {next ? 'Apply next ▶' : 'Done'}
          </CheckButton>
        </span>
      </Field>
      {freePost && (
        <Field label="free-post (tip the books)">
          <span className="lab-field-row">
            <Chip selected={false} onClick={() => setExtraA((v) => v + 2000)}>
              +2,000 assets
            </Chip>
            <Chip selected={false} onClick={() => setExtraLE((v) => v + 2000)}>
              +2,000 L+E
            </Chip>
            <Button
              variant="outline"
              size="sm"
              type="button"
              className="lab-chip"
              onClick={() => {
                setExtraA(0);
                setExtraLE(0);
              }}
            >
              reset
            </Button>
          </span>
        </Field>
      )}
    </>
  );

  const activity: AuthoredActivity = {
    pattern: 'construction',
    title,
    objectives: objectives ?? [
      'Preserve Assets = Liabilities + Equity',
      'Trace balanced transaction effects',
      'Diagnose a one-sided posting',
    ],
    steps: EQUATION_STEPS,
    questions: EQUATION_QUESTIONS,
    success: [
      {
        id: 'constraint-answer',
        source: 'answer',
        key: 'constraint',
        pendingLabel: 'Choose the accounting constraint.',
      },
      {
        id: 'all-posted',
        source: 'metric',
        key: 'applied',
        operator: 'eq',
        value: transactions.length,
        pendingLabel: 'Apply every authored transaction.',
      },
    ],
  };
  return (
    <AuthoredActivityRuntime
      activity={activity}
      activityId="equation-balance"
      eyebrow="Accounting equation"
      title={title}
      description={prompt}
      status={
        <>
          <strong>{balanced ? 'balanced' : 'out of balance'}</strong>
          <span>
            {applied}/{transactions.length} transactions
          </span>
          <span>A {money(assets)}</span>
          <span>L + E {money(rhs)}</span>
        </>
      }
      evidence={evidence}
      controls={({ sequence }) => (sequence.current.controls ? controls : null)}
      observation={
        balanced
          ? 'Every applied transaction preserves Assets = Liabilities + Equity because its effects are balanced across the books.'
          : `The one-sided posting leaves a ${money(Math.abs(imbalance))} mismatch, so the scale exposes the broken entry.`
      }
      transcript={`Assets are ${money(assets)}. Liabilities plus equity are ${money(rhs)}. The books are ${balanced ? 'balanced' : `out of balance by ${money(Math.abs(imbalance))}`}. ${applied} of ${transactions.length} transactions are posted.`}
    >
      {({ sequence, complete }) => (
        <>
          <AuthoredMetricGate
            conditionId="all-posted"
            met={sequence.current.id === 'act' && solved}
            complete={complete}
            outcome={`${applied}/${transactions.length}`}
          />
          {sequence.shows('model') ? (
            figure
          ) : (
            <div className="commerce-model-lock">
              <strong>Commit to the constraint first</strong>
              <span>The balance opens after your prediction.</span>
            </div>
          )}
        </>
      )}
    </AuthoredActivityRuntime>
  );
}
