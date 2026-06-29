'use client';

/**
 * CircuitBuilder, a circuit you BUILD and PLAY with, not a walkthrough.
 *
 * A creator declares the components in a series loop (battery + any mix of
 * resistors, bulbs, switches); the learner flips switches, tunes the battery, and
 * watches conventional current flow around the loop while bulbs glow in proportion
 * to the power through them. Open any switch → the loop breaks, current stops, the
 * bulb goes dark.
 *
 * Now on the @classytic/stage engine (SVG): the schematic + flowing-current dots
 * are primitives (accessible, themed); switches toggle via real buttons (keyboard-
 * operable) instead of canvas hit-testing.
 *
 * (Single series loop, the canonical "flashlight" circuit. Parallel topologies
 * are a future extension of the same model.)
 */

import { useEffect, useState, type ReactNode } from 'react';
import { Stage, Segment, Dot, Label, useFrameLoop, useInView, type Vec2 } from '@classytic/stage';
import { solveDC, type Elem } from '@classytic/stage/circuit';
import { Slider, Chip } from '../kit/controls.js';
import { LabFrame, ControlBar, Field, Callout } from '../kit/frame.js';
import { ResistorBox, CellBox, BulbBox, SwitchBox } from '../kit/diagram.js';
import { num, clamp } from '../core/util.js';

export type CircuitComponent =
  | { type: 'resistor'; ohms: number; label?: string }
  | { type: 'bulb'; ohms: number; label?: string }
  | { type: 'switch'; closed?: boolean; label?: string };

export interface CircuitBuilderProps {
  battery?: number | string;
  components?: CircuitComponent[];
  title?: string;
  height?: number;
}

const DEFAULT: CircuitComponent[] = [
  { type: 'switch', closed: false, label: 'switch' },
  { type: 'bulb', ohms: 12, label: 'bulb' },
];

// Normalized schematic view; preserveAspect=false fills the box.
const VIEW = { xMin: 0, xMax: 100, yMin: 0, yMax: 60 };
const L = 12, R = 92, TOP = 46, BOT = 12;

/** Position along the rectangular loop perimeter at fraction u∈[0,1). */
function onPerimeter(u: number): Vec2 {
  const pts: Vec2[] = [{ x: L, y: TOP }, { x: R, y: TOP }, { x: R, y: BOT }, { x: L, y: BOT }, { x: L, y: TOP }];
  const segLen = (p: Vec2, q: Vec2): number => Math.hypot(q.x - p.x, q.y - p.y);
  let total = 0; for (let s = 0; s < 4; s++) total += segLen(pts[s]!, pts[s + 1]!);
  let d = u * total;
  for (let s = 0; s < 4; s++) {
    const p = pts[s]!, q = pts[s + 1]!, ln = segLen(p, q);
    if (d <= ln) { const k = d / ln; return { x: p.x + (q.x - p.x) * k, y: p.y + (q.y - p.y) * k }; }
    d -= ln;
  }
  return pts[0]!;
}

export function CircuitBuilder({ battery, components, title = 'Build a circuit', height = 320 }: CircuitBuilderProps = {}): ReactNode {
  const comps = components && components.length ? components : DEFAULT;
  const [emf, setEmf] = useState(clamp(num(battery, 6), 1, 24));
  const [closed, setClosed] = useState<Record<number, boolean>>(() =>
    Object.fromEntries(comps.map((c, i) => [i, c.type === 'switch' ? c.closed !== false : true])),
  );
  const [t, setT] = useState(0);
  const { ref: viewRef, inView } = useInView<HTMLDivElement>();
  useEffect(() => { setEmf(clamp(num(battery, 6), 1, 24)); }, [battery]);
  const compKey = comps.map((c) => c.type + (('ohms' in c && c.ohms) || '')).join('|');
  useEffect(() => {
    setClosed(Object.fromEntries(comps.map((c, i) => [i, c.type === 'switch' ? c.closed !== false : true])));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compKey]);

  // solve the series loop through the one circuit engine (stage/circuit) — a netlist,
  // not a per-lab formula: battery + a chain of resistors/bulbs back to ground.
  const allClosed = comps.every((c, i) => c.type !== 'switch' || closed[i]);
  const totalR = comps.reduce((s, c) => s + ('ohms' in c ? c.ohms : 0), 0);
  const current = (() => {
    if (!allClosed) return 0;
    const elems: Elem[] = [{ kind: 'V', n1: 1, n2: 0, value: emf, id: 'b' }];
    let prev = 1; let node = 2;
    const withR = comps.filter((c) => 'ohms' in c);
    withR.forEach((c, idx) => {
      const nb = idx === withR.length - 1 ? 0 : node++;
      elems.push({ kind: 'R', n1: prev, n2: nb, value: Math.max(0.5, (c as { ohms: number }).ohms) });
      prev = nb;
    });
    return Math.abs(solveDC(elems).current['b'] ?? 0); // amps
  })();

  useFrameLoop((f) => setT((v) => v + f.dtMs / 1000), { running: current > 1e-4 && inView });

  const n = comps.length;
  const segW = (R - L) / n;
  const cyMid = (TOP + BOT) / 2;
  const speed = clamp(current * 0.18, 0.03, 0.5);
  const N_DOTS = 28;

  const switches = comps.map((c, i) => ({ c, i })).filter((x) => x.c.type === 'switch');

  const figure = (
    <div ref={viewRef}>
      <Stage view={VIEW} height={height} preserveAspect={false} ariaLabel={`Series circuit, ${emf}V battery, ${(current * 1000).toFixed(0)} mA${allClosed ? '' : ', open, no current'}`}>
        {/* loop wires */}
        <Segment from={{ x: L, y: BOT }} to={{ x: R, y: BOT }} color="var(--stage-fg)" opacity={0.5} weight={2.5} />
        <Segment from={{ x: R, y: BOT }} to={{ x: R, y: TOP }} color="var(--stage-fg)" opacity={0.5} weight={2.5} />
        <Segment from={{ x: L, y: BOT }} to={{ x: L, y: cyMid - 6 }} color="var(--stage-fg)" opacity={0.5} weight={2.5} />
        <Segment from={{ x: L, y: cyMid + 6 }} to={{ x: L, y: TOP }} color="var(--stage-fg)" opacity={0.5} weight={2.5} />
        {/* battery on the left edge (canonical cell glyph, vertical) */}
        <CellBox center={{ x: L, y: cyMid }} half={6} orient="v" live={current > 1e-4} label={`${emf.toFixed(0)} V`} />

        {/* top-edge components, tiled L→R */}
        {comps.map((c, i) => {
          const cx = L + (i + 0.5) * segW;
          const half = Math.min(segW * 0.28, 10);
          const leftX = i === 0 ? L : L + i * segW;
          const rightX = i === n - 1 ? R : L + (i + 1) * segW;
          const label = c.label ?? c.type;
          const wires = (
            <>
              <Segment from={{ x: leftX, y: TOP }} to={{ x: cx - half, y: TOP }} color="var(--stage-fg)" opacity={0.5} weight={2.5} />
              <Segment from={{ x: cx + half, y: TOP }} to={{ x: rightX, y: TOP }} color="var(--stage-fg)" opacity={0.5} weight={2.5} />
            </>
          );
          const energized = current > 1e-4;
          if (c.type === 'resistor') {
            return <g key={i}>{wires}<ResistorBox center={{ x: cx, y: TOP }} w={2 * half} h={7} live={energized} label={`${label} ${c.ohms}Ω`} /></g>;
          }
          if (c.type === 'bulb') {
            const bright = clamp(current * 1.2, 0, 1) * (c.ohms / Math.max(totalR, 1));
            return <g key={i}>{wires}<BulbBox center={{ x: cx, y: TOP }} half={half} live={energized} brightness={bright} label={label} /></g>;
          }
          // switch
          const open = !closed[i];
          return <g key={i}>{wires}<SwitchBox center={{ x: cx, y: TOP }} half={half} live={energized && !open} closed={!open} label={label} /></g>;
        })}

        {/* flowing current */}
        {current > 1e-4 && Array.from({ length: N_DOTS }, (_, k) => {
          const p = onPerimeter((t * speed + k / N_DOTS) % 1);
          return <Dot key={`f-${k}`} x={p.x} y={p.y} r={3} color="var(--stage-accent)" />;
        })}
      </Stage>
    </div>
  );

  const controls = (
    <ControlBar>
      <Field label="battery" value={`${emf} V`}>
        <Slider value={emf} min={1} max={24} step={1} onChange={setEmf} ariaLabel="battery voltage" style={{ width: 120 }} />
      </Field>
      {switches.map(({ c, i }) => (
        <Chip key={i} selected={!!closed[i]} onClick={() => setClosed((s) => ({ ...s, [i]: !s[i] }))}>
          {(c.label ?? 'switch')}: {closed[i] ? 'closed' : 'open'}
        </Chip>
      ))}
    </ControlBar>
  );

  const aside = (
    <Callout tone="result">
      <span style={{ display: 'grid', gap: 4, fontVariantNumeric: 'tabular-nums' }}>
        <span>{allClosed ? 'closed' : 'open, no current'}</span>
        <span>R {totalR.toFixed(0)} Ω</span>
        <span>I {(current * 1000).toFixed(0)} mA</span>
      </span>
    </Callout>
  );

  return (
    <LabFrame
      title={title}
      prompt={switches.length ? 'Flip a switch to open/close it. Tune the battery and watch the current, and the bulb.' : 'Tune the battery and watch the current flow.'}
      aside={aside}
      controls={controls}
    >
      {figure}
    </LabFrame>
  );
}
