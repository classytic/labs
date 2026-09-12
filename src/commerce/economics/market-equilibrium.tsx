'use client';

/**
 * MarketEquilibriumLab, Marshall's scissors: where the market clears.
 *
 * Drag a horizontal PRICE line across a fixed demand line + supply line. At any
 * non-equilibrium price the lab shades the HORIZONTAL gap between Qd and Qs ,
 * amber SURPLUS above equilibrium (pressure pushes price down), red SHORTAGE
 * below (pressure pushes price up), and the band collapses to nothing at the
 * crossing, where a green pill reads "market clears, Qd = Qs". Shift sliders move
 * either curve to watch BOTH P* and Q* move. Reuses the shared econ core +
 * Stage primitives; tokenized; reduced-motion safe (no autoplay, the learner drags).
 *
 * The algebra (solve a−bQ = c+dQ for Q*) belongs in a paired MathDerivation.
 */

import { useState, type ReactNode } from 'react';
import { Stage, Axes, Segment, Dot, Label, Polygon, MovableDot } from '@classytic/stage';
import { Slider, CheckButton } from '../../kit/controls.js';
import { Field, LiveRegion, Readout } from '../../kit/frame.js';
import { AuthoredActivityRuntime, AuthoredMetricGate } from '../../kit/authored-activity-runtime.js';
import type { AuthoredActivity, AuthoredChoiceQuestion } from '../../kit/activity-authoring.js';
import { clamp } from '../../core/util.js';
import { type Curve, demandQ, supplyQ, equilibrium } from './core.js';
import { EvidencePanel } from '../activity.js';

const ABOVE: AuthoredChoiceQuestion = {
  id: 'above',
  prompt: 'At a price above the equilibrium, the market has…',
  choices: [
    {
      value: 'surplus',
      label: 'a surplus — sellers cut the price',
      feedback: 'Correct: sellers have unsold stock when Qs exceeds Qd.',
    },
    {
      value: 'shortage',
      label: 'a shortage — buyers bid it up',
      feedback: 'At a high price, suppliers offer more than buyers demand.',
    },
    {
      value: 'clears',
      label: 'it still clears',
      feedback: 'The market clears only where the two curves cross.',
    },
  ],
  answer: 'surplus',
  explain:
    'Above the crossing, quantity supplied exceeds quantity demanded (Qs > Qd); unsold stock pushes the price back down toward equilibrium.',
};

const SHIFT_DEMAND: AuthoredChoiceQuestion = {
  id: 'shiftD',
  prompt: 'If demand rises (its curve shifts right), the equilibrium price…',
  choices: [
    { value: 'up', label: 'rises', feedback: 'Correct: the new crossing is higher on the supply curve.' },
    {
      value: 'down',
      label: 'falls',
      feedback: 'A rightward demand shift meets the upward-sloping supply curve at a higher price.',
    },
    {
      value: 'same',
      label: 'stays put',
      feedback: 'The crossing moves when demand changes and supply stays fixed.',
    },
  ],
  answer: 'up',
  explain:
    'More demand at every price lifts the crossing up along the supply curve, so both P* and Q* rise. Try the shift-demand slider.',
};

const STEPS: AuthoredActivity['steps'] = [
  {
    id: 'predict',
    phase: 'predict',
    title: 'Predict the pressure',
    lead: 'Commit before opening the market model.',
    success: 'surplus-prediction',
  },
  {
    id: 'clear',
    phase: 'act',
    title: 'Clear the market',
    lead: 'Move the price until quantity demanded equals quantity supplied.',
    reveal: ['model'],
    controls: true,
    success: 'market-cleared',
  },
  {
    id: 'observe',
    phase: 'observe',
    title: 'Read the adjustment evidence',
    lead: 'Compare the price line, quantity gap, and direction of pressure.',
    reveal: ['equilibrium'],
  },
  {
    id: 'explain',
    phase: 'explain',
    title: 'Explain a demand shift',
    lead: 'Use the crossing of the curves to explain what changes.',
    success: 'demand-explanation',
  },
  {
    id: 'transfer',
    phase: 'transfer',
    title: 'Move the equilibrium',
    lead: 'Shift demand and identify the market’s new clearing point.',
    reveal: ['shifts'],
    controls: true,
    success: 'shift-tested',
  },
];

export interface MarketEquilibriumProps {
  demand?: Curve;
  supply?: Curve;
  shiftControls?: { demand?: boolean; supply?: boolean };
  priceMax?: number;
  qtyMax?: number;
  goodLabel?: string;
  title?: string;
  prompt?: string;
  height?: number;
  objectives?: string[];
}

const DEMAND0: Curve = { intercept: 9, slope: 0.8 };
const SUPPLY0: Curve = { intercept: 1, slope: 0.7 };

export function MarketEquilibriumLab({
  demand = DEMAND0,
  supply = SUPPLY0,
  shiftControls = { demand: true, supply: true },
  priceMax = 10,
  qtyMax = 12,
  goodLabel = 'the good',
  title = "Marshall's scissors: where the market clears",
  prompt = 'Drag the price. Above equilibrium → surplus; below → shortage; the gap is Qs − Qd.',
  height = 320,
  objectives = [
    'Distinguish surplus from shortage using Qs and Qd',
    'Locate the price where the market clears',
    'Explain how a demand shift moves equilibrium',
  ],
}: MarketEquilibriumProps): ReactNode {
  const [dShift, setDShift] = useState(0);
  const [sShift, setSShift] = useState(0);
  const d: Curve = {
    intercept: demand.intercept + dShift,
    slope: demand.slope,
  };
  const s: Curve = {
    intercept: supply.intercept + sShift,
    slope: supply.slope,
  };
  const eq = equilibrium(d, s);
  const [price, setPrice] = useState(clamp(eq.p + 2, 0.4, priceMax - 0.4));

  const qd = demandQ(d, price);
  const qs = supplyQ(s, price);
  const gap = qs - qd; // >0 surplus, <0 shortage
  const cleared = Math.abs(gap) < 0.05;
  const state: 'surplus' | 'shortage' | 'cleared' = cleared ? 'cleared' : gap > 0 ? 'surplus' : 'shortage';

  const shifted = Math.abs(dShift) >= 0.5 || Math.abs(sShift) >= 0.5;

  const view = {
    xMin: -0.8,
    xMax: qtyMax + 0.4,
    yMin: -0.8,
    yMax: priceMax + 0.4,
  };
  // line endpoints within the first quadrant
  const dQatP0 = d.intercept / d.slope; // demand hits P=0 here
  const sPatQmax = s.intercept + s.slope * qtyMax;
  const bandColor = state === 'surplus' ? 'var(--stage-warn)' : 'var(--stage-danger)';
  const lo = Math.min(qd, qs),
    hi = Math.max(qd, qs);

  const figure = (
    <>
      <div className="commerce-scene-frame">
        <Stage
          view={view}
          height={height}
          preserveAspect={false}
          ariaLabel={`Supply and demand; price ${price.toFixed(
            1,
          )}, Qd ${qd.toFixed(1)}, Qs ${qs.toFixed(1)}, ${state}`}
        >
          <Axes ticks={false} />
          <Label x={qtyMax / 2} y={-0.5} text="Quantity →" color="var(--stage-muted)" size={11} />
          <Label x={-0.5} y={priceMax / 2} text="Price" color="var(--stage-muted)" size={11} />

          {/* demand (down) + supply (up) */}
          <Segment
            from={{ x: 0, y: d.intercept }}
            to={{ x: dQatP0, y: 0 }}
            color="var(--stage-accent)"
            weight={2.5}
          />
          <Label
            x={dQatP0 * 0.5}
            y={d.intercept * 0.5}
            text="Demand"
            color="var(--stage-accent)"
            size={11}
            dx={14}
          />
          <Segment
            from={{ x: 0, y: s.intercept }}
            to={{ x: qtyMax, y: sPatQmax }}
            color="var(--stage-accent-2)"
            weight={2.5}
          />
          <Label
            x={qtyMax * 0.7}
            y={s.intercept + s.slope * qtyMax * 0.7}
            text="Supply"
            color="var(--stage-accent-2)"
            size={11}
            dy={-12}
          />

          {/* surplus / shortage horizontal gap at the dragged price */}
          {!cleared && (
            <>
              <Segment
                from={{ x: lo, y: price }}
                to={{ x: hi, y: price }}
                color={bandColor}
                weight={9}
                opacity={0.4}
              />
              <Label
                x={(lo + hi) / 2}
                y={price}
                text={state === 'surplus' ? `SURPLUS ${gap.toFixed(1)}` : `SHORTAGE ${(-gap).toFixed(1)}`}
                color={bandColor}
                size={11}
                dy={state === 'surplus' ? -12 : 14}
              />
              {/* pressure arrow: surplus → price pushed down, shortage → up */}
              <Polygon
                points={
                  state === 'surplus'
                    ? [
                        { x: hi + 0.5, y: price - 0.1 },
                        { x: hi + 0.9, y: price - 0.1 },
                        { x: hi + 0.7, y: price - 0.9 },
                      ]
                    : [
                        { x: hi + 0.5, y: price + 0.1 },
                        { x: hi + 0.9, y: price + 0.1 },
                        { x: hi + 0.7, y: price + 0.9 },
                      ]
                }
                color={bandColor}
                fill={bandColor}
                fillOpacity={0.8}
                weight={0}
              />
            </>
          )}

          {/* equilibrium */}
          <Segment
            from={{ x: eq.q, y: 0 }}
            to={{ x: eq.q, y: eq.p }}
            color="var(--stage-good)"
            weight={1}
            dashed
            opacity={0.6}
          />
          <Segment
            from={{ x: 0, y: eq.p }}
            to={{ x: eq.q, y: eq.p }}
            color="var(--stage-good)"
            weight={1}
            dashed
            opacity={0.6}
          />
          <Dot x={eq.q} y={eq.p} r={cleared ? 8 : 5} color="var(--stage-good)" />
          <Label
            x={eq.q}
            y={eq.p}
            text={`P* ${eq.p.toFixed(1)}, Q* ${eq.q.toFixed(1)}`}
            color="var(--stage-good)"
            size={11}
            dx={10}
            dy={-10}
          />

          {/* the draggable price line + handle (constrained to price/y) */}
          <Segment
            from={{ x: 0, y: price }}
            to={{ x: qtyMax, y: price }}
            color="var(--stage-fg)"
            weight={1.5}
            opacity={0.5}
            dashed
          />
          <MovableDot
            value={{ x: 0.35, y: price }}
            onMove={(p) => setPrice(clamp(p.y, 0.4, priceMax - 0.4))}
            constrain="vertical"
            range={{ min: 0.4, max: priceMax - 0.4 }}
            color="var(--stage-fg)"
            ariaLabel="price"
          />
          {/* Qd / Qs points on the curves at this price */}
          <Dot x={qd} y={price} r={4} color="var(--stage-accent)" />
          <Dot x={qs} y={price} r={4} color="var(--stage-accent-2)" />
        </Stage>
      </div>
      <LiveRegion>
        {`Price ${price.toFixed(1)} for ${goodLabel}. Quantity demanded ${qd.toFixed(
          1,
        )}, supplied ${qs.toFixed(1)}. ${state}. Equilibrium price ${eq.p.toFixed(
          1,
        )}, quantity ${eq.q.toFixed(1)}.`}
      </LiveRegion>
    </>
  );

  const controls = (
    <>
      {shiftControls.demand && (
        <Field label="shift demand">
          <Slider
            value={dShift}
            min={-4}
            max={4}
            step={0.5}
            onChange={setDShift}
            ariaLabel="shift the demand curve"
          />
        </Field>
      )}
      {shiftControls.supply && (
        <Field label="shift supply">
          <Slider
            value={sShift}
            min={-4}
            max={4}
            step={0.5}
            onChange={setSShift}
            ariaLabel="shift the supply curve"
          />
        </Field>
      )}
      <Field label="price" value={price.toFixed(1)}>
        <CheckButton onClick={() => setPrice(clamp(eq.p, 0.4, priceMax - 0.4))}>
          Snap to equilibrium
        </CheckButton>
      </Field>
    </>
  );

  const evidence = (
    <EvidencePanel title="Market evidence">
      <Readout
        tone={cleared ? 'result' : 'info'}
        accent={cleared ? 'var(--stage-good, #16a34a)' : 'var(--stage-warn, #e0a020)'}
        value={
          <>
            {state === 'cleared'
              ? 'Market clears · Qd = Qs ✓'
              : state === 'surplus'
                ? 'Surplus → price falls'
                : 'Shortage → price rises'}
          </>
        }
        sub={
          <>
            price {price.toFixed(1)} · Qd {qd.toFixed(1)} · Qs {qs.toFixed(1)}
          </>
        }
      />
      <p className="finance-aside-copy">
        Above the crossing there’s a surplus (sellers cut price); below it a shortage (buyers bid it up). It
        settles where Qd = Qs.
      </p>
    </EvidencePanel>
  );

  const activity: AuthoredActivity = {
    pattern: 'investigation',
    title,
    objectives,
    steps: STEPS,
    questions: [ABOVE, SHIFT_DEMAND],
    success: [
      {
        id: 'surplus-prediction',
        source: 'answer',
        key: 'above',
        pendingLabel: 'Choose what happens above equilibrium.',
      },
      {
        id: 'market-cleared',
        source: 'metric',
        key: 'quantityGap',
        operator: 'between',
        min: -0.05,
        max: 0.05,
        pendingLabel: 'Set a price where Qd equals Qs.',
      },
      {
        id: 'demand-explanation',
        source: 'answer',
        key: 'shiftD',
        pendingLabel: 'Explain how rising demand changes equilibrium price.',
      },
      {
        id: 'shift-tested',
        source: 'metric',
        key: 'curveShift',
        operator: 'gte',
        value: 0.5,
        pendingLabel: 'Shift demand or supply to create a new equilibrium.',
      },
    ],
  };

  return (
    <AuthoredActivityRuntime
      activity={activity}
      activityId="market-equilibrium"
      eyebrow="Market economics"
      title={title}
      description={prompt}
      status={
        <>
          <span>{state}</span>
          <span>price {price.toFixed(1)}</span>
          <span>Qd {qd.toFixed(1)}</span>
          <span>Qs {qs.toFixed(1)}</span>
        </>
      }
      evidence={({ sequence }) => (sequence.shows('model') ? evidence : null)}
      controls={({ sequence }) =>
        sequence.shows('model') ? (
          <>
            {sequence.current.id === 'clear' && (
              <Field label="price" value={price.toFixed(1)}>
                <CheckButton onClick={() => setPrice(clamp(eq.p, 0.4, priceMax - 0.4))}>
                  Snap to equilibrium
                </CheckButton>
              </Field>
            )}
            {sequence.shows('shifts') && controls}
          </>
        ) : null
      }
      observation={({ sequence }) =>
        sequence.shows('model')
          ? cleared
            ? 'Quantity demanded equals quantity supplied, so the pressure to change price disappears.'
            : state === 'surplus'
              ? 'Unsold supply creates downward pressure on price.'
              : 'Excess demand creates upward pressure on price.'
          : null
      }
      transcript={
        <p>{`At price ${price.toFixed(1)} for ${goodLabel}, quantity demanded is ${qd.toFixed(1)} and quantity supplied is ${qs.toFixed(1)}. The market has a ${state}. Equilibrium is price ${eq.p.toFixed(1)} and quantity ${eq.q.toFixed(1)}.`}</p>
      }
    >
      {({ sequence, complete }) => (
        <>
          <AuthoredMetricGate
            conditionId="market-cleared"
            met={sequence.current.id === 'clear' && cleared}
            complete={complete}
          />
          <AuthoredMetricGate
            conditionId="shift-tested"
            met={sequence.current.id === 'transfer' && shifted}
            complete={complete}
          />
          {sequence.shows('model') ? (
            figure
          ) : (
            <div className="commerce-model-lock">
              <strong>Predict the market pressure first</strong>
              <span>The supply-and-demand model opens after you commit.</span>
            </div>
          )}
        </>
      )}
    </AuthoredActivityRuntime>
  );
}
