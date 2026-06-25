'use client';

/**
 * DemandShiftVsMoveLab — shift the curve vs move along it.
 *
 * The #1 micro misconception. Dragging the PRICE slider slides a dot ALONG a
 * fixed demand curve — a change in QUANTITY demanded (the curve never moves).
 * Clicking a non-price TRIBE factor (Tastes, Related-good prices, Income, Buyers,
 * Expectations) translates the WHOLE curve — a change in DEMAND — and the
 * equilibrium moves along supply to a new P* and Q*. A predict-then-check asks
 * for the P/Q direction before the reveal. The decision rule: only the good's OWN
 * price (the axis variable) moves you along; anything else shifts the curve.
 *
 * Reuses the shared econ core (equilibrium / demandQ). Tokenized; reduced-motion safe.
 */

import { useState, type ReactNode } from 'react';
import { Stage, Axes, Segment, Dot, Label, MovableDot } from '@classytic/stage';
import { Chip, StatusPill } from '../../kit/controls.js';
import { LabFrame, ControlBar, Field, LiveRegion } from '../../kit/frame.js';
import { useCheckpoint } from '../../kit/pedagogy.js';
import { clamp } from '../../core/util.js';
import { type Curve, demandQ, equilibrium } from './core.js';

export interface Shifter { label: string; target: 'demand' | 'supply'; delta: number }
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

export function DemandShiftVsMoveLab({
  demand = DEMAND0, supply = SUPPLY0, shifters = SHIFTERS, askPrediction = true,
  priceMax = 11, qtyMax = 13,
  title = 'Shift the curve, or move along it?',
  prompt = 'Drag PRICE → move along (Δ quantity demanded). Click a TRIBE factor → the whole curve SHIFTS (Δ demand).',
  height = 320, objectives,
}: DemandShiftVsMoveProps): ReactNode {
  const [dShift, setDShift] = useState(0);
  const [sShift, setSShift] = useState(0);
  const [movePrice, setMovePrice] = useState(6);
  const [last, setLast] = useState<'move' | 'shift' | null>(null);
  const [ghost, setGhost] = useState<Curve | null>(null);
  const [pending, setPending] = useState<Shifter | null>(null);
  const [verdict, setVerdict] = useState<string | null>(null);
  const [solved, setSolved] = useState(false);

  useCheckpoint({ solved, activity: 'demand-shift-vs-move' });

  const d: Curve = { intercept: demand.intercept + dShift, slope: demand.slope };
  const s: Curve = { intercept: supply.intercept + sShift, slope: supply.slope };
  const eq = equilibrium(d, s);
  const moveQ = clamp(demandQ(d, movePrice), 0, qtyMax);

  const apply = (sh: Shifter): void => {
    const prevD: Curve = { ...d };
    if (sh.target === 'demand') setDShift((v) => v + sh.delta); else setSShift((v) => v + sh.delta);
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
    if (askPrediction) setPending(sh); else apply(sh);
  };
  const predict = (guess: Dir): void => {
    if (!pending) return;
    const truth = dirOf(pending);
    const ok = guess === truth;
    setVerdict(ok ? `✓ Right — ${pending.label} shifts demand ${pending.delta > 0 ? 'right' : 'left'}, so P* and Q* both go ${truth}.` : `Not quite — ${pending.label} shifts demand ${pending.delta > 0 ? 'right' : 'left'}: P* and Q* both go ${truth}.`);
    apply(pending);
    setPending(null);
    if (ok) setSolved(true);
  };

  const view = { xMin: -0.9, xMax: qtyMax + 0.4, yMin: -0.9, yMax: priceMax + 0.4 };
  const lineEnds = (c: Curve, down: boolean): [{ x: number; y: number }, { x: number; y: number }] =>
    down ? [{ x: 0, y: c.intercept }, { x: c.intercept / c.slope, y: 0 }] : [{ x: 0, y: c.intercept }, { x: qtyMax, y: c.intercept + c.slope * qtyMax }];
  const [d0, d1] = lineEnds(d, true);
  const [s0, s1] = lineEnds(s, false);

  const figure = (
    <>
      <div style={{ borderRadius: 14, overflow: 'hidden', background: 'var(--stage-bg)', border: '1px solid var(--stage-grid)' }}>
        <Stage view={view} height={height} preserveAspect={false} ariaLabel={`Supply and demand; equilibrium price ${eq.p.toFixed(1)}, quantity ${eq.q.toFixed(1)}`}>
          <Axes ticks={false} />
          <Label x={qtyMax / 2} y={-0.6} text="Quantity →" color="var(--stage-muted)" size={11} />
          <Label x={-0.6} y={priceMax / 2} text="Price" color="var(--stage-muted)" size={11} />

          {/* ghost of the pre-shift demand curve */}
          {ghost && <Segment from={lineEnds(ghost, true)[0]} to={lineEnds(ghost, true)[1]} color="var(--stage-accent)" weight={1.5} dashed opacity={0.4} />}
          <Segment from={d0} to={d1} color="var(--stage-accent)" weight={2.5} />
          <Label x={d1.x * 0.5} y={d0.y * 0.5} text="Demand" color="var(--stage-accent)" size={11} dx={14} />
          <Segment from={s0} to={s1} color="var(--stage-accent-2)" weight={2.5} />
          <Label x={qtyMax * 0.7} y={s.intercept + s.slope * qtyMax * 0.7} text="Supply" color="var(--stage-accent-2)" size={11} dy={-12} />

          {/* equilibrium */}
          <Dot x={eq.q} y={eq.p} r={6} color="var(--stage-good)" />
          <Label x={eq.q} y={eq.p} text={`P* ${eq.p.toFixed(1)}, Q* ${eq.q.toFixed(1)}`} color="var(--stage-good)" size={11} dx={10} dy={-10} />

          {/* movement-along dot (own-price): a price handle that slides a dot on the demand curve */}
          <Segment from={{ x: 0, y: movePrice }} to={{ x: moveQ, y: movePrice }} color="var(--stage-fg)" weight={1} dashed opacity={0.4} />
          <MovableDot value={{ x: 0.35, y: movePrice }} onMove={(p) => { setMovePrice(clamp(p.y, 0.4, priceMax - 0.4)); setLast('move'); }} constrain="vertical" range={{ min: 0.4, max: priceMax - 0.4 }} color="var(--stage-fg)" ariaLabel="own price (moves along the demand curve)" />
          <Dot x={moveQ} y={movePrice} r={5} color="var(--stage-fg)" />
        </Stage>
      </div>
      <LiveRegion>
        {verdict ?? (last === 'move' ? 'Movement along the demand curve: a change in quantity demanded.' : last === 'shift' ? `Demand shifted; new equilibrium price ${eq.p.toFixed(1)}, quantity ${eq.q.toFixed(1)}.` : 'Drag the price or pick a factor.')}
      </LiveRegion>
    </>
  );

  const controls = (
    <ControlBar>
      {pending ? (
        <Field label={`“${pending.label}” → P* and Q* will go`}>
          <span style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <Chip selected={false} onClick={() => predict('up')}>both UP</Chip>
            <Chip selected={false} onClick={() => predict('down')}>both DOWN</Chip>
            <Chip selected={false} onClick={() => predict('indeterminate')}>indeterminate</Chip>
          </span>
        </Field>
      ) : (
        <Field label="TRIBE factor">
          <span style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {shifters.map((sh) => <Chip key={sh.label} selected={false} onClick={() => clickShifter(sh)}>{sh.label}</Chip>)}
            <button type="button" className="lab-chip" onClick={() => { setDShift(0); setSShift(0); setGhost(null); setLast(null); setVerdict(null); setSolved(false); }}>reset</button>
          </span>
        </Field>
      )}
    </ControlBar>
  );

  const footer = (
    <>
      {last === 'move' && <StatusPill ok={false}>MOVEMENT along the curve — Δ quantity demanded (own price changed)</StatusPill>}
      {last === 'shift' && <StatusPill ok>SHIFT of the whole curve — Δ demand (a TRIBE factor)</StatusPill>}
      {!last && <p className="lab-prompt">Drag the price, or click a factor.</p>}
      {verdict && <StatusPill ok={verdict.startsWith('✓')}>{verdict}</StatusPill>}
    </>
  );

  return <LabFrame title={title} prompt={prompt} objectives={objectives} controls={controls} footer={footer}>{figure}</LabFrame>;
}
