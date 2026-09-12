'use client';

/**
 * ElasticityRevenueLab, the stretch test: elasticity is NOT slope.
 *
 * Rotate one demand line about a pivot from steep (inelastic, few substitutes,
 * e.g. insulin) to flat (elastic, many substitutes, e.g. one water brand). Drag
 * the price down the line and the total-revenue rectangle (P×Q) grows on the
 * elastic upper half and shrinks on the inelastic lower half, the revenue
 * see-saw. The point-elasticity pill flips ELASTIC → UNIT → INELASTIC down a
 * SINGLE straight line, killing the "slope = elasticity" error.
 *
 * Reuses the shared econ core (pointElasticity / demandQ). Tokenized; reduced-motion safe.
 */

import { useState, type ReactNode } from 'react';
import { Stage, Axes, Segment, Dot, Label, Polygon, MovableDot } from '@classytic/stage';
import { Slider, Segmented } from '../../kit/controls.js';
import { Field, LiveRegion, Readout } from '../../kit/frame.js';
import { clamp } from '../../core/util.js';
import { EvidencePanel } from '../activity.js';
import { AuthoredActivityRuntime, AuthoredMetricGate } from '../../kit/authored-activity-runtime.js';
import type { AuthoredActivity, AuthoredChoiceQuestion } from '../../kit/activity-authoring.js';
import { type Curve, demandQ, pointElasticity } from './core.js';

const CHALLENGE: AuthoredChoiceQuestion[] = [
  {
    id: 'slide',
    prompt: 'As you slide the price downwards along one straight demand line, its elasticity…',
    choices: [
      {
        value: 'changes',
        label: 'changes — elastic up top, inelastic near the bottom',
      },
      { value: 'same', label: 'stays the same (it’s one line)' },
      { value: 'slope', label: 'equals the slope' },
    ],
    answer: 'changes',
    explain:
      'Elasticity is %ΔQ ÷ %ΔP, not the slope. On one straight line it runs elastic at high prices → unit at the midpoint → inelastic at low prices.',
  },
  {
    id: 'cut',
    prompt: 'For an elastic good (|E| > 1), cutting the price…',
    choices: [
      { value: 'up', label: 'raises total revenue' },
      { value: 'down', label: 'lowers it' },
      { value: 'same', label: 'leaves it unchanged' },
    ],
    answer: 'up',
    explain:
      'When demand is elastic, quantity jumps by more than the price falls, so P×Q rises. Watch the revenue box grow on the upper half of the line.',
  },
];

const STEPS: AuthoredActivity['steps'] = [
  {
    id: 'predict',
    phase: 'predict',
    title: 'Predict the stretch',
    lead: 'Decide whether elasticity stays fixed on one straight demand line.',
    success: 'elasticity-forecast',
  },
  {
    id: 'inspect',
    phase: 'observe',
    title: 'Open the revenue model',
    lead: 'Inspect the revenue rectangle and point elasticity together.',
    reveal: ['model'],
  },
  {
    id: 'configure',
    phase: 'act',
    title: 'Find an inelastic case',
    lead: 'Use the substitutes presets to make demand inelastic.',
    controls: true,
    success: 'inelastic-case',
  },
  {
    id: 'explain',
    phase: 'explain',
    title: 'Explain the revenue response',
    lead: 'Explain what an elastic price cut does to total revenue.',
    success: 'revenue-explanation',
  },
  {
    id: 'transfer',
    phase: 'transfer',
    title: 'Stress-test the curve',
    lead: 'Rotate the curve and move price to compare new cases.',
    reveal: ['transfer'],
    controls: true,
  },
];

export interface ElasticityRevenueProps {
  pivot?: { p: number; q: number };
  priceMax?: number;
  qtyMax?: number;
  anchorPresets?: Array<{ label: string; slope: number }>;
  title?: string;
  prompt?: string;
  height?: number;
  objectives?: string[];
}

const PRESETS = [
  { label: '💉 insulin (few substitutes)', slope: 2.2 },
  { label: '🛒 typical good', slope: 0.8 },
  { label: '💧 one water brand (many substitutes)', slope: 0.28 },
];

export function ElasticityRevenueLab({
  pivot = { p: 5, q: 5 },
  priceMax = 11,
  qtyMax = 13,
  anchorPresets = PRESETS,
  title = 'The stretch test: elasticity is not slope',
  prompt = 'Rotate the curve (substitutes), then drag the price: watch the revenue box + the elasticity flip.',
  height = 320,
  objectives = [
    'Distinguish point elasticity from the slope of a demand curve',
    'Connect elastic and inelastic demand to changes in total revenue',
    'Compare elasticity at different points and with different substitutes',
  ],
}: ElasticityRevenueProps): ReactNode {
  const [b, setB] = useState(0.8);
  // demand through the pivot with slope b:  P = intercept − bQ  ⇒ intercept = p + b·q
  const curve: Curve = { intercept: pivot.p + b * pivot.q, slope: b };
  const [price, setPrice] = useState(pivot.p + 1.5);
  const q = clamp(demandQ(curve, price), 0, qtyMax);
  const revenue = price * q;
  const E = pointElasticity(curve, price);
  const kind: 'elastic' | 'unit' | 'inelastic' =
    Math.abs(E - 1) < 0.06 ? 'unit' : E > 1 ? 'elastic' : 'inelastic';
  const kindColor =
    kind === 'elastic' ? 'var(--stage-good)' : kind === 'unit' ? 'var(--stage-warn)' : 'var(--stage-danger)';

  const view = {
    xMin: -0.9,
    xMax: qtyMax + 0.4,
    yMin: -0.9,
    yMax: priceMax + 0.4,
  };
  const qAtP0 = clamp(curve.intercept / b, 0, qtyMax * 1.3);
  const pAtQ0 = clamp(curve.intercept, 0, priceMax * 1.3);

  const figure = (
    <>
      <div className="commerce-scene-frame">
        <Stage
          view={view}
          height={height}
          preserveAspect={false}
          ariaLabel={`Demand elasticity ${E.toFixed(2)} (${kind}); revenue ${revenue.toFixed(1)}`}
        >
          <Axes ticks={false} />
          <Label x={qtyMax / 2} y={-0.6} text="Quantity →" color="var(--stage-muted)" size={11} />
          <Label x={-0.6} y={priceMax / 2} text="Price" color="var(--stage-muted)" size={11} />

          {/* total-revenue rectangle P×Q */}
          <Polygon
            points={[
              { x: 0, y: 0 },
              { x: q, y: 0 },
              { x: q, y: price },
              { x: 0, y: price },
            ]}
            color={kindColor}
            fill={kindColor}
            fillOpacity={0.16}
            weight={0}
          />
          <Label x={q / 2} y={price / 2} text={`revenue ${revenue.toFixed(1)}`} color={kindColor} size={11} />

          {/* demand line through the pivot */}
          <Segment
            from={{ x: 0, y: pAtQ0 }}
            to={{ x: qAtP0, y: pAtQ0 > 0 ? 0 : pAtQ0 }}
            color="var(--stage-accent)"
            weight={2.5}
          />
          <Dot x={pivot.q} y={pivot.p} r={4} color="var(--stage-muted)" />

          {/* price handle on the y-axis + the (Q,P) point on the curve */}
          <Segment
            from={{ x: 0, y: price }}
            to={{ x: q, y: price }}
            color="var(--stage-fg)"
            weight={1}
            dashed
            opacity={0.45}
          />
          <Segment
            from={{ x: q, y: 0 }}
            to={{ x: q, y: price }}
            color="var(--stage-fg)"
            weight={1}
            dashed
            opacity={0.45}
          />
          <MovableDot
            value={{ x: 0.35, y: price }}
            onMove={(pt) => setPrice(clamp(pt.y, 0.4, priceMax - 0.4))}
            constrain="vertical"
            range={{ min: 0.4, max: priceMax - 0.4 }}
            color="var(--stage-fg)"
            ariaLabel="price"
          />
          <Dot x={q} y={price} r={5} color="var(--stage-accent)" />
        </Stage>
      </div>
      <LiveRegion>
        {`At price ${price.toFixed(1)}, quantity ${q.toFixed(1)}, revenue ${revenue.toFixed(1)}. Elasticity ${
          E === Infinity ? 'infinite' : E.toFixed(2)
        }, ${kind}.`}
      </LiveRegion>
    </>
  );

  const evidence = (
    <EvidencePanel title="Elasticity evidence">
      <Readout
        accent={kindColor}
        value={
          <>
            |E| {E === Infinity ? '∞' : E.toFixed(2)} · {kind.toUpperCase()}
          </>
        }
        sub={
          <>
            price {price.toFixed(1)} · Q {q.toFixed(1)} · revenue {revenue.toFixed(1)}
          </>
        }
      />
      <p className="finance-aside-copy">
        <strong>Elastic</strong> (|E| &gt; 1): a price cut raises revenue. <strong>Inelastic</strong> (|E|
        &lt; 1): a price cut lowers it. Same straight line, elasticity still changes as you slide.
      </p>
    </EvidencePanel>
  );

  const controls = (
    <>
      <Field label="steep ↔ flat">
        <Slider
          value={b}
          min={0.2}
          max={2.4}
          step={0.05}
          onChange={setB}
          ariaLabel="rotate the demand curve (substitutes)"
        />
      </Field>
      <Field label="substitutes">
        {/* The slider rotates the curve continuously, so between presets NONE is selected: the
            empty key is that third state and is deliberately absent from `options`. */}
        <Segmented
          ariaLabel="substitutes"
          value={anchorPresets.find((a) => Math.abs(b - a.slope) < 0.03)?.label ?? ''}
          onChange={(v) => {
            const preset = anchorPresets.find((a) => a.label === v);
            if (preset) setB(preset.slope);
          }}
          options={anchorPresets.map((a) => ({ value: a.label, label: a.label }))}
        />
      </Field>
    </>
  );

  const activity: AuthoredActivity = {
    pattern: 'forecast',
    title,
    objectives,
    steps: STEPS,
    questions: CHALLENGE,
    success: [
      {
        id: 'elasticity-forecast',
        source: 'answer',
        key: 'slide',
        pendingLabel: 'Commit to an elasticity forecast.',
      },
      {
        id: 'inelastic-case',
        source: 'metric',
        key: 'inelastic',
        operator: 'eq',
        value: true,
        pendingLabel: 'Choose a curve that makes this point inelastic.',
      },
      {
        id: 'revenue-explanation',
        source: 'answer',
        key: 'cut',
        pendingLabel: 'Explain the elastic revenue response.',
      },
    ],
  };
  const observation =
    kind === 'elastic'
      ? 'Quantity responds proportionally more than price, so the quantity effect dominates total revenue.'
      : kind === 'inelastic'
        ? 'Quantity responds proportionally less than price, so the price effect dominates total revenue.'
        : 'The percentage changes balance at unit elasticity.';

  return (
    <AuthoredActivityRuntime
      activity={activity}
      activityId="elasticity-revenue"
      eyebrow="Demand responsiveness"
      title={title}
      description={prompt}
      status={
        <>
          <span>{kind}</span>
          <span>|E| {E === Infinity ? '∞' : E.toFixed(2)}</span>
          <span>revenue {revenue.toFixed(1)}</span>
        </>
      }
      evidence={({ sequence }) => (sequence.shows('model') ? evidence : null)}
      controls={({ sequence }) =>
        sequence.current.id === 'configure' || sequence.shows('transfer') ? controls : null
      }
      observation={observation}
      transcript={`Demand slope ${b.toFixed(2)}. At price ${price.toFixed(1)}, quantity is ${q.toFixed(1)}, total revenue is ${revenue.toFixed(1)}, and point elasticity is ${E === Infinity ? 'infinite' : E.toFixed(2)} (${kind}).`}
    >
      {({ sequence, complete }) => (
        <>
          <AuthoredMetricGate
            conditionId="inelastic-case"
            met={sequence.current.id === 'configure' && kind === 'inelastic'}
            complete={complete}
            outcome={kind}
          />
          {sequence.shows('model') ? (
            figure
          ) : (
            <div className="commerce-model-lock">
              <strong>Predict before inspecting</strong>
              <span>The demand curve and revenue rectangle open after your forecast.</span>
            </div>
          )}
        </>
      )}
    </AuthoredActivityRuntime>
  );
}
