'use client';
import { Button } from '@/components/ui/button';

/**
 * DemandShiftVsMoveLab, shift the curve vs move along it.
 *
 * The #1 micro misconception. Dragging the PRICE slider slides a dot ALONG a
 * fixed demand curve, a change in QUANTITY demanded (the curve never moves).
 * Clicking a non-price TRIBE factor (Tastes, Related-good prices, Income, Buyers,
 * Expectations) translates the WHOLE curve, a change in DEMAND, and the
 * equilibrium moves along supply to a new P* and Q*. A predict-then-check asks
 * for the P/Q direction before the reveal. The decision rule: only the good's OWN
 * price (the axis variable) moves you along; anything else shifts the curve.
 *
 * Reuses the shared econ core (equilibrium / demandQ). Tokenized; reduced-motion safe.
 */

import { useState, type ReactNode } from 'react';
import { Stage, Axes, Segment, Dot, Label, MovableDot } from '@classytic/stage';
import { Chip, StatusPill } from '../../kit/controls.js';
import { Field, LiveRegion } from '../../kit/frame.js';
import { clamp } from '../../core/util.js';
import { type Curve, demandQ, equilibrium } from './core.js';
import { AuthoredActivityRuntime, AuthoredMetricGate } from '../../kit/authored-activity-runtime.js';
import type { AuthoredActivity, AuthoredChoiceQuestion } from '../../kit/activity-authoring.js';

export interface Shifter {
  label: string;
  target: 'demand' | 'supply';
  delta: number;
}
export interface DemandShiftVsMoveProps {
  demand?: Curve;
  supply?: Curve;
  shifters?: Shifter[];
  askPrediction?: boolean;
  priceMax?: number;
  qtyMax?: number;
  title?: string;
  prompt?: string;
  height?: number;
  objectives?: string[];
}

const DEMAND0: Curve = { intercept: 9, slope: 0.8 };
const SUPPLY0: Curve = { intercept: 1, slope: 0.7 };
const SHIFTERS: Shifter[] = [
  { label: 'Incomes rise', target: 'demand', delta: 2 },
  { label: 'Substitute gets cheaper', target: 'demand', delta: -2 },
  { label: 'Tastes favour it', target: 'demand', delta: 1.5 },
  { label: 'More buyers', target: 'demand', delta: 1 },
];
type Dir = 'up' | 'down' | 'indeterminate';

const QUESTIONS: AuthoredChoiceQuestion[] = [
  {
    id: 'own-price',
    prompt: "Changing the good's own price causes…",
    choices: [
      { value: 'move', label: 'a movement along demand' },
      { value: 'shift', label: 'the whole demand curve to shift' },
      { value: 'supply', label: 'the supply curve to shift' },
    ],
    answer: 'move',
    explain: 'Own price is the axis variable, so it changes quantity demanded along the existing curve.',
  },
  {
    id: 'non-price',
    prompt: 'A change in tastes, income, buyers, expectations, or related-good prices causes…',
    choices: [
      { value: 'shift', label: 'a shift of the demand curve' },
      { value: 'move', label: 'only a movement along demand' },
      { value: 'none', label: 'no market change' },
    ],
    answer: 'shift',
    explain: 'A non-price determinant changes demand at every own price, moving the whole curve.',
  },
];
const STEPS: AuthoredActivity['steps'] = [
  {
    id: 'predict',
    phase: 'predict',
    title: 'Classify an own-price change',
    lead: 'Predict whether own price moves the point or the curve.',
    success: 'own-price-rule',
  },
  {
    id: 'inspect',
    phase: 'observe',
    title: 'Inspect the market',
    lead: 'Compare the demand point with the full demand curve.',
    reveal: ['model'],
  },
  {
    id: 'forecast',
    phase: 'act',
    title: 'Forecast a demand shift',
    lead: 'Choose a TRIBE factor, then correctly predict its equilibrium direction.',
    controls: true,
    success: 'correct-shift',
  },
  {
    id: 'explain',
    phase: 'explain',
    title: 'Explain the distinction',
    lead: 'Identify what non-price determinants change.',
    success: 'non-price-rule',
  },
  {
    id: 'transfer',
    phase: 'transfer',
    title: 'Test more scenarios',
    lead: 'Try other factors and compare the new equilibria.',
    reveal: ['transfer'],
    controls: true,
  },
];

export function DemandShiftVsMoveLab({
  demand = DEMAND0,
  supply = SUPPLY0,
  shifters = SHIFTERS,
  askPrediction = true,
  priceMax = 11,
  qtyMax = 13,
  title = 'Shift the curve, or move along it?',
  prompt = 'Drag the price and you move along the curve, changing quantity demanded. Click a TRIBE factor and the whole curve shifts, changing demand itself.',
  height = 320,
  objectives = [
    'Distinguish a movement along demand from a shift of demand',
    'Classify own-price and non-price changes correctly',
    'Predict how demand shifts change equilibrium price and quantity',
  ],
}: DemandShiftVsMoveProps): ReactNode {
  const [dShift, setDShift] = useState(0);
  const [sShift, setSShift] = useState(0);
  const [movePrice, setMovePrice] = useState(6);
  const [last, setLast] = useState<'move' | 'shift' | null>(null);
  const [ghost, setGhost] = useState<Curve | null>(null);
  const [pending, setPending] = useState<Shifter | null>(null);
  const [verdict, setVerdict] = useState<string | null>(null);
  const [correctForecast, setCorrectForecast] = useState(false);

  const d: Curve = {
    intercept: demand.intercept + dShift,
    slope: demand.slope,
  };
  const s: Curve = {
    intercept: supply.intercept + sShift,
    slope: supply.slope,
  };
  const eq = equilibrium(d, s);
  const moveQ = clamp(demandQ(d, movePrice), 0, qtyMax);

  const apply = (sh: Shifter): void => {
    const prevD: Curve = { ...d };
    if (sh.target === 'demand') setDShift((v) => v + sh.delta);
    else setSShift((v) => v + sh.delta);
    setGhost(sh.target === 'demand' ? prevD : null);
    setLast('shift');
  };
  const dirOf = (sh: Shifter): Dir => {
    // demand right (delta>0) → P,Q up; demand left → down; supply right → P down/Q up (mixed → not both)
    if (sh.target === 'demand') return sh.delta > 0 ? 'up' : 'down';
    return 'indeterminate'; // supply shift moves P and Q opposite ways
  };
  const clickShifter = (sh: Shifter): void => {
    setVerdict(null);
    if (askPrediction) setPending(sh);
    else {
      apply(sh);
      setCorrectForecast(true);
    }
  };
  const predict = (guess: Dir): void => {
    if (!pending) return;
    const truth = dirOf(pending);
    const ok = guess === truth;
    setVerdict(
      ok
        ? `✓ Right, ${pending.label} shifts demand ${
            pending.delta > 0 ? 'right' : 'left'
          }, so P* and Q* both go ${truth}.`
        : `Not quite, ${pending.label} shifts demand ${
            pending.delta > 0 ? 'right' : 'left'
          }: P* and Q* both go ${truth}.`,
    );
    apply(pending);
    setPending(null);
    if (ok) setCorrectForecast(true);
  };

  const view = {
    xMin: -0.9,
    xMax: qtyMax + 0.4,
    yMin: -0.9,
    yMax: priceMax + 0.4,
  };
  const lineEnds = (c: Curve, down: boolean): [{ x: number; y: number }, { x: number; y: number }] =>
    down
      ? [
          { x: 0, y: c.intercept },
          { x: c.intercept / c.slope, y: 0 },
        ]
      : [
          { x: 0, y: c.intercept },
          { x: qtyMax, y: c.intercept + c.slope * qtyMax },
        ];
  const [d0, d1] = lineEnds(d, true);
  const [s0, s1] = lineEnds(s, false);

  const figure = (
    <>
      <div className="commerce-scene-frame">
        <Stage
          view={view}
          height={height}
          preserveAspect={false}
          ariaLabel={`Supply and demand; equilibrium price ${eq.p.toFixed(1)}, quantity ${eq.q.toFixed(1)}`}
        >
          <Axes ticks={false} />
          <Label x={qtyMax / 2} y={-0.6} text="Quantity →" color="var(--stage-muted)" size={11} />
          <Label x={-0.6} y={priceMax / 2} text="Price" color="var(--stage-muted)" size={11} />

          {/* ghost of the pre-shift demand curve */}
          {ghost && (
            <Segment
              from={lineEnds(ghost, true)[0]}
              to={lineEnds(ghost, true)[1]}
              color="var(--stage-accent)"
              weight={1.5}
              dashed
              opacity={0.4}
            />
          )}
          <Segment from={d0} to={d1} color="var(--stage-accent)" weight={2.5} />
          <Label x={d1.x * 0.5} y={d0.y * 0.5} text="Demand" color="var(--stage-accent)" size={11} dx={14} />
          <Segment from={s0} to={s1} color="var(--stage-accent-2)" weight={2.5} />
          <Label
            x={qtyMax * 0.7}
            y={s.intercept + s.slope * qtyMax * 0.7}
            text="Supply"
            color="var(--stage-accent-2)"
            size={11}
            dy={-12}
          />

          {/* equilibrium */}
          <Dot x={eq.q} y={eq.p} r={6} color="var(--stage-good)" />
          <Label
            x={eq.q}
            y={eq.p}
            text={`P* ${eq.p.toFixed(1)}, Q* ${eq.q.toFixed(1)}`}
            color="var(--stage-good)"
            size={11}
            dx={10}
            dy={-10}
          />

          {/* movement-along dot (own-price): a price handle that slides a dot on the demand curve */}
          <Segment
            from={{ x: 0, y: movePrice }}
            to={{ x: moveQ, y: movePrice }}
            color="var(--stage-fg)"
            weight={1}
            dashed
            opacity={0.4}
          />
          <MovableDot
            value={{ x: 0.35, y: movePrice }}
            onMove={(p) => {
              setMovePrice(clamp(p.y, 0.4, priceMax - 0.4));
              setLast('move');
            }}
            constrain="vertical"
            range={{ min: 0.4, max: priceMax - 0.4 }}
            color="var(--stage-fg)"
            ariaLabel="own price (moves along the demand curve)"
          />
          <Dot x={moveQ} y={movePrice} r={5} color="var(--stage-fg)" />
        </Stage>
      </div>
      <LiveRegion>
        {verdict ??
          (last === 'move'
            ? 'Movement along the demand curve: a change in quantity demanded.'
            : last === 'shift'
              ? `Demand shifted; new equilibrium price ${eq.p.toFixed(1)}, quantity ${eq.q.toFixed(1)}.`
              : 'Drag the price or pick a factor.')}
      </LiveRegion>
    </>
  );

  const controls = (
    <>
      {pending ? (
        <Field label={`“${pending.label}” → P* and Q* will go`}>
          <span className="lab-field-row">
            <Chip selected={false} onClick={() => predict('up')}>
              both UP
            </Chip>
            <Chip selected={false} onClick={() => predict('down')}>
              both DOWN
            </Chip>
            <Chip selected={false} onClick={() => predict('indeterminate')}>
              indeterminate
            </Chip>
          </span>
        </Field>
      ) : (
        <Field label="TRIBE factor">
          <span className="lab-field-row">
            {shifters.map((sh) => (
              <Chip key={sh.label} selected={false} onClick={() => clickShifter(sh)}>
                {sh.label}
              </Chip>
            ))}
            <Button
              variant="outline"
              size="sm"
              type="button"
              className="lab-chip"
              onClick={() => {
                setDShift(0);
                setSShift(0);
                setGhost(null);
                setLast(null);
                setVerdict(null);
                setCorrectForecast(false);
              }}
            >
              reset
            </Button>
          </span>
        </Field>
      )}
    </>
  );

  const footer = (
    <>
      {last === 'move' && (
        <StatusPill ok={false}>MOVEMENT along the curve, Δ quantity demanded (own price changed)</StatusPill>
      )}
      {last === 'shift' && <StatusPill ok>SHIFT of the whole curve, Δ demand (a TRIBE factor)</StatusPill>}
      {!last && <p className="lab-prompt">Drag the price, or click a factor.</p>}
      {verdict && <StatusPill ok={verdict.startsWith('✓')}>{verdict}</StatusPill>}
    </>
  );

  const activity: AuthoredActivity = {
    pattern: 'forecast',
    title,
    objectives,
    steps: STEPS,
    questions: QUESTIONS,
    success: [
      {
        id: 'own-price-rule',
        source: 'answer',
        key: 'own-price',
        pendingLabel: 'Classify the own-price change.',
      },
      {
        id: 'correct-shift',
        source: 'metric',
        key: 'correctForecast',
        operator: 'eq',
        value: true,
        pendingLabel: 'Correctly forecast a TRIBE-factor shift.',
      },
      {
        id: 'non-price-rule',
        source: 'answer',
        key: 'non-price',
        pendingLabel: 'Explain the non-price rule.',
      },
    ],
  };

  return (
    <AuthoredActivityRuntime
      activity={activity}
      activityId="demand-shift-vs-move"
      eyebrow="Demand analysis"
      title={title}
      description={prompt}
      status={
        <>
          <span>
            {last === 'shift' ? 'curve shifted' : last === 'move' ? 'movement along curve' : 'ready'}
          </span>
          <span>P* {eq.p.toFixed(1)}</span>
          <span>Q* {eq.q.toFixed(1)}</span>
        </>
      }
      task={({ sequence }) =>
        sequence.current.id === 'forecast' ? (
          <p className="commerce-task-copy">
            {pending
              ? `Predict how “${pending.label}” changes equilibrium price and quantity.`
              : 'Choose a TRIBE factor, then predict the direction.'}
          </p>
        ) : null
      }
      controls={({ sequence }) =>
        sequence.current.id === 'forecast' || sequence.shows('transfer') ? controls : null
      }
      observation={footer}
      transcript={`Demand ${dShift === 0 ? 'is at its starting position' : `has shifted by ${dShift.toFixed(1)}`}. Equilibrium price is ${eq.p.toFixed(1)} and quantity is ${eq.q.toFixed(1)}. ${last === 'move' ? `Own price ${movePrice.toFixed(1)} gives quantity demanded ${moveQ.toFixed(1)} along the curve.` : last === 'shift' ? 'A non-price factor shifted the whole curve.' : 'No change has been applied yet.'}`}
    >
      {({ sequence, complete }) => (
        <>
          <AuthoredMetricGate
            conditionId="correct-shift"
            met={sequence.current.id === 'forecast' && correctForecast}
            complete={complete}
            outcome={verdict ?? undefined}
          />
          {sequence.shows('model') ? (
            figure
          ) : (
            <div className="commerce-model-lock">
              <strong>Classify the change first</strong>
              <span>The market model opens after your own-price prediction.</span>
            </div>
          )}
        </>
      )}
    </AuthoredActivityRuntime>
  );
}
