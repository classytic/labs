'use client';

/**
 * ElasticityRevenueLab — the stretch test: elasticity is NOT slope.
 *
 * Rotate one demand line about a pivot from steep (inelastic — few substitutes,
 * e.g. insulin) to flat (elastic — many substitutes, e.g. one water brand). Drag
 * the price down the line and the total-revenue rectangle (P×Q) grows on the
 * elastic upper half and shrinks on the inelastic lower half — the revenue
 * see-saw. The point-elasticity pill flips ELASTIC → UNIT → INELASTIC down a
 * SINGLE straight line, killing the "slope = elasticity" error.
 *
 * Reuses the shared econ core (pointElasticity / demandQ). Tokenized; reduced-motion safe.
 */

import { useState, type ReactNode } from 'react';
import { Stage, Axes, Segment, Dot, Label, Polygon, MovableDot } from '@classytic/stage';
import { Slider, Chip, StatusPill } from '../../kit/controls.js';
import { LabFrame, ControlBar, Field, LiveRegion } from '../../kit/frame.js';
import { clamp } from '../../core/util.js';
import { type Curve, demandQ, pointElasticity } from './core.js';

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
  pivot = { p: 5, q: 5 }, priceMax = 11, qtyMax = 13, anchorPresets = PRESETS,
  title = 'The stretch test — elasticity is not slope',
  prompt = 'Rotate the curve (substitutes), then drag the price: watch the revenue box + the elasticity flip.',
  height = 320, objectives,
}: ElasticityRevenueProps): ReactNode {
  const [b, setB] = useState(0.8);
  // demand through the pivot with slope b:  P = intercept − bQ  ⇒ intercept = p + b·q
  const curve: Curve = { intercept: pivot.p + b * pivot.q, slope: b };
  const [price, setPrice] = useState(pivot.p + 1.5);
  const q = clamp(demandQ(curve, price), 0, qtyMax);
  const revenue = price * q;
  const E = pointElasticity(curve, price);
  const kind: 'elastic' | 'unit' | 'inelastic' = Math.abs(E - 1) < 0.06 ? 'unit' : E > 1 ? 'elastic' : 'inelastic';
  const kindColor = kind === 'elastic' ? 'var(--stage-good)' : kind === 'unit' ? 'var(--stage-warn)' : 'var(--stage-danger)';

  const view = { xMin: -0.9, xMax: qtyMax + 0.4, yMin: -0.9, yMax: priceMax + 0.4 };
  const qAtP0 = clamp(curve.intercept / b, 0, qtyMax * 1.3);
  const pAtQ0 = clamp(curve.intercept, 0, priceMax * 1.3);

  const figure = (
    <>
      <div style={{ borderRadius: 14, overflow: 'hidden', background: 'var(--stage-bg)', border: '1px solid var(--stage-grid)' }}>
        <Stage view={view} height={height} preserveAspect={false} ariaLabel={`Demand elasticity ${E.toFixed(2)} (${kind}); revenue ${revenue.toFixed(1)}`}>
          <Axes ticks={false} />
          <Label x={qtyMax / 2} y={-0.6} text="Quantity →" color="var(--stage-muted)" size={11} />
          <Label x={-0.6} y={priceMax / 2} text="Price" color="var(--stage-muted)" size={11} />

          {/* total-revenue rectangle P×Q */}
          <Polygon points={[{ x: 0, y: 0 }, { x: q, y: 0 }, { x: q, y: price }, { x: 0, y: price }]} color={kindColor} fill={kindColor} fillOpacity={0.16} weight={0} />
          <Label x={q / 2} y={price / 2} text={`revenue ${revenue.toFixed(1)}`} color={kindColor} size={11} />

          {/* demand line through the pivot */}
          <Segment from={{ x: 0, y: pAtQ0 }} to={{ x: qAtP0, y: pAtQ0 > 0 ? 0 : pAtQ0 }} color="var(--stage-accent)" weight={2.5} />
          <Dot x={pivot.q} y={pivot.p} r={4} color="var(--stage-muted)" />

          {/* price handle on the y-axis + the (Q,P) point on the curve */}
          <Segment from={{ x: 0, y: price }} to={{ x: q, y: price }} color="var(--stage-fg)" weight={1} dashed opacity={0.45} />
          <Segment from={{ x: q, y: 0 }} to={{ x: q, y: price }} color="var(--stage-fg)" weight={1} dashed opacity={0.45} />
          <MovableDot value={{ x: 0.35, y: price }} onMove={(pt) => setPrice(clamp(pt.y, 0.4, priceMax - 0.4))} constrain="vertical" range={{ min: 0.4, max: priceMax - 0.4 }} color="var(--stage-fg)" ariaLabel="price" />
          <Dot x={q} y={price} r={5} color="var(--stage-accent)" />
        </Stage>
      </div>
      <LiveRegion>
        {`At price ${price.toFixed(1)}, quantity ${q.toFixed(1)}, revenue ${revenue.toFixed(1)}. Elasticity ${E === Infinity ? 'infinite' : E.toFixed(2)} — ${kind}.`}
      </LiveRegion>
    </>
  );

  const controls = (
    <ControlBar>
      <Field label="steep ↔ flat">
        <Slider value={b} min={0.2} max={2.4} step={0.05} onChange={setB} ariaLabel="rotate the demand curve (substitutes)" />
      </Field>
      <Field label="substitutes">
        <span style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {anchorPresets.map((a) => <Chip key={a.label} selected={Math.abs(b - a.slope) < 0.03} onClick={() => setB(a.slope)}>{a.label}</Chip>)}
        </span>
      </Field>
      <Field label="price" value={price.toFixed(1)}><span /></Field>
      <Field label="Q" value={<span style={{ color: 'var(--stage-accent)' }}>{q.toFixed(1)}</span>}><span /></Field>
      <Field label="revenue" value={revenue.toFixed(1)}><span /></Field>
    </ControlBar>
  );

  const footer = (
    <StatusPill ok={kind === 'elastic'}>|E| {E === Infinity ? '∞' : E.toFixed(2)} · {kind.toUpperCase()}</StatusPill>
  );

  return <LabFrame title={title} prompt={prompt} objectives={objectives} controls={controls} footer={footer}>{figure}</LabFrame>;
}
