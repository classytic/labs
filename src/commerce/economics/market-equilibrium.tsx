'use client';

/**
 * MarketEquilibriumLab — Marshall's scissors: where the market clears.
 *
 * Drag a horizontal PRICE line across a fixed demand line + supply line. At any
 * non-equilibrium price the lab shades the HORIZONTAL gap between Qd and Qs —
 * amber SURPLUS above equilibrium (pressure pushes price down), red SHORTAGE
 * below (pressure pushes price up) — and the band collapses to nothing at the
 * crossing, where a green pill reads "market clears, Qd = Qs". Shift sliders move
 * either curve to watch BOTH P* and Q* move. Reuses the shared econ core +
 * Stage primitives; tokenized; reduced-motion safe (no autoplay — the learner drags).
 *
 * The algebra (solve a−bQ = c+dQ for Q*) belongs in a paired MathDerivation.
 */

import { useRef, useState, type ReactNode } from 'react';
import { Stage, Axes, Segment, Dot, Label, Polygon, MovableDot } from '@classytic/stage';
import { Slider, CheckButton, StatusPill } from '../../kit/controls.js';
import { LabFrame, ControlBar, Field, LiveRegion } from '../../kit/frame.js';
import { useCheckpoint } from '../../kit/pedagogy.js';
import { clamp } from '../../core/util.js';
import { type Curve, demandQ, supplyQ, equilibrium } from './core.js';

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
  demand = DEMAND0, supply = SUPPLY0, shiftControls = { demand: true, supply: true },
  priceMax = 10, qtyMax = 12, goodLabel = 'the good',
  title = "Marshall's scissors — where the market clears",
  prompt = 'Drag the price. Above equilibrium → surplus; below → shortage; the gap is Qs − Qd.',
  height = 320, objectives,
}: MarketEquilibriumProps): ReactNode {
  const [dShift, setDShift] = useState(0);
  const [sShift, setSShift] = useState(0);
  const d: Curve = { intercept: demand.intercept + dShift, slope: demand.slope };
  const s: Curve = { intercept: supply.intercept + sShift, slope: supply.slope };
  const eq = equilibrium(d, s);
  const [price, setPrice] = useState(clamp(eq.p + 2, 0.4, priceMax - 0.4));

  const qd = demandQ(d, price);
  const qs = supplyQ(s, price);
  const gap = qs - qd;                         // >0 surplus, <0 shortage
  const cleared = Math.abs(gap) < 0.05;
  const state: 'surplus' | 'shortage' | 'cleared' = cleared ? 'cleared' : gap > 0 ? 'surplus' : 'shortage';

  useCheckpoint({ solved: cleared, activity: 'market-equilibrium' });

  const view = { xMin: -0.8, xMax: qtyMax + 0.4, yMin: -0.8, yMax: priceMax + 0.4 };
  // line endpoints within the first quadrant
  const dQatP0 = d.intercept / d.slope;        // demand hits P=0 here
  const sPatQmax = s.intercept + s.slope * qtyMax;
  const bandColor = state === 'surplus' ? 'var(--stage-warn)' : 'var(--stage-danger)';
  const lo = Math.min(qd, qs), hi = Math.max(qd, qs);

  const figure = (
    <>
      <div style={{ borderRadius: 14, overflow: 'hidden', background: 'var(--stage-bg)', border: '1px solid var(--stage-grid)' }}>
        <Stage view={view} height={height} preserveAspect={false} ariaLabel={`Supply and demand; price ${price.toFixed(1)}, Qd ${qd.toFixed(1)}, Qs ${qs.toFixed(1)}, ${state}`}>
          <Axes ticks={false} />
          <Label x={qtyMax / 2} y={-0.5} text="Quantity →" color="var(--stage-muted)" size={11} />
          <Label x={-0.5} y={priceMax / 2} text="Price" color="var(--stage-muted)" size={11} />

          {/* demand (down) + supply (up) */}
          <Segment from={{ x: 0, y: d.intercept }} to={{ x: dQatP0, y: 0 }} color="var(--stage-accent)" weight={2.5} />
          <Label x={dQatP0 * 0.5} y={d.intercept * 0.5} text="Demand" color="var(--stage-accent)" size={11} dx={14} />
          <Segment from={{ x: 0, y: s.intercept }} to={{ x: qtyMax, y: sPatQmax }} color="var(--stage-accent-2)" weight={2.5} />
          <Label x={qtyMax * 0.7} y={s.intercept + s.slope * qtyMax * 0.7} text="Supply" color="var(--stage-accent-2)" size={11} dy={-12} />

          {/* surplus / shortage horizontal gap at the dragged price */}
          {!cleared && (
            <>
              <Segment from={{ x: lo, y: price }} to={{ x: hi, y: price }} color={bandColor} weight={9} opacity={0.4} />
              <Label x={(lo + hi) / 2} y={price} text={state === 'surplus' ? `SURPLUS ${gap.toFixed(1)}` : `SHORTAGE ${(-gap).toFixed(1)}`} color={bandColor} size={11} dy={state === 'surplus' ? -12 : 14} />
              {/* pressure arrow: surplus → price pushed down, shortage → up */}
              <Polygon points={state === 'surplus'
                ? [{ x: hi + 0.5, y: price - 0.1 }, { x: hi + 0.9, y: price - 0.1 }, { x: hi + 0.7, y: price - 0.9 }]
                : [{ x: hi + 0.5, y: price + 0.1 }, { x: hi + 0.9, y: price + 0.1 }, { x: hi + 0.7, y: price + 0.9 }]}
                color={bandColor} fill={bandColor} fillOpacity={0.8} weight={0} />
            </>
          )}

          {/* equilibrium */}
          <Segment from={{ x: eq.q, y: 0 }} to={{ x: eq.q, y: eq.p }} color="var(--stage-good)" weight={1} dashed opacity={0.6} />
          <Segment from={{ x: 0, y: eq.p }} to={{ x: eq.q, y: eq.p }} color="var(--stage-good)" weight={1} dashed opacity={0.6} />
          <Dot x={eq.q} y={eq.p} r={cleared ? 8 : 5} color="var(--stage-good)" />
          <Label x={eq.q} y={eq.p} text={`P* ${eq.p.toFixed(1)}, Q* ${eq.q.toFixed(1)}`} color="var(--stage-good)" size={11} dx={10} dy={-10} />

          {/* the draggable price line + handle (constrained to price/y) */}
          <Segment from={{ x: 0, y: price }} to={{ x: qtyMax, y: price }} color="var(--stage-fg)" weight={1.5} opacity={0.5} dashed />
          <MovableDot value={{ x: 0.35, y: price }} onMove={(p) => setPrice(clamp(p.y, 0.4, priceMax - 0.4))} constrain="vertical" range={{ min: 0.4, max: priceMax - 0.4 }} color="var(--stage-fg)" ariaLabel="price" />
          {/* Qd / Qs points on the curves at this price */}
          <Dot x={qd} y={price} r={4} color="var(--stage-accent)" />
          <Dot x={qs} y={price} r={4} color="var(--stage-accent-2)" />
        </Stage>
      </div>
      <LiveRegion>
        {`Price ${price.toFixed(1)} for ${goodLabel}. Quantity demanded ${qd.toFixed(1)}, supplied ${qs.toFixed(1)}. ${state}. Equilibrium price ${eq.p.toFixed(1)}, quantity ${eq.q.toFixed(1)}.`}
      </LiveRegion>
    </>
  );

  const controls = (
    <ControlBar>
      {shiftControls.demand && (
        <Field label="shift demand">
          <Slider value={dShift} min={-4} max={4} step={0.5} onChange={setDShift} ariaLabel="shift the demand curve" />
        </Field>
      )}
      {shiftControls.supply && (
        <Field label="shift supply">
          <Slider value={sShift} min={-4} max={4} step={0.5} onChange={setSShift} ariaLabel="shift the supply curve" />
        </Field>
      )}
      <Field label="price" value={price.toFixed(1)}>
        <CheckButton onClick={() => setPrice(clamp(eq.p, 0.4, priceMax - 0.4))}>Snap to equilibrium</CheckButton>
      </Field>
      <Field label="Qd" value={<span style={{ color: 'var(--stage-accent)' }}>{qd.toFixed(1)}</span>}><span /></Field>
      <Field label="Qs" value={<span style={{ color: 'var(--stage-accent-2)' }}>{qs.toFixed(1)}</span>}><span /></Field>
    </ControlBar>
  );

  const footer = (
    <StatusPill ok={cleared}>{state === 'cleared' ? 'Market clears · Qd = Qs ✓' : state === 'surplus' ? 'Surplus → price pressured DOWN' : 'Shortage → price pressured UP'}</StatusPill>
  );

  return <LabFrame title={title} prompt={prompt} objectives={objectives} controls={controls} footer={footer}>{figure}</LabFrame>;
}
