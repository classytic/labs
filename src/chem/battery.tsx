'use client';

/**
 * Battery — a galvanic (voltaic) cell. Two half-cells: at the anode a metal is
 * oxidized and releases electrons; they flow through the external wire to the
 * cathode, where ions are reduced. Watch the electrons stream, see the
 * half-reactions and the cell EMF.
 *
 * Now on the @classytic/stage engine (SVG schematic + flowing electrons,
 * accessible, themed).
 */

import { useEffect, useState, type ReactNode } from 'react';
import { Stage, Segment, Polygon, Dot, Label, useFrameLoop, type Vec2 } from '@classytic/stage';
import { usePlayGate, PlayWrap } from '../kit/play.js';
import { Slider } from '../kit/controls.js';
import { LabFrame, ControlBar, Field, Callout } from '../kit/frame.js';
import { ResistorBox } from '../kit/diagram.js';
import { Tex } from '../core/tex.js';
import { num, clamp } from '../core/util.js';

export interface BatteryProps {
  /** Cell EMF in volts (Zn–Cu Daniell ≈ 1.10). */
  emf?: number | string;
  title?: string;
  height?: number;
}

// Normalized schematic view; preserveAspect=false fills the box.
const VIEW = { xMin: 0, xMax: 100, yMin: 0, yMax: 60 };
const LX = 26, RX = 74, BBOT = 6, BTOP = 30, ETOP = 44, WIRE = 53;

function rect(cx: number, halfW: number, y0: number, y1: number): Vec2[] {
  return [{ x: cx - halfW, y: y0 }, { x: cx + halfW, y: y0 }, { x: cx + halfW, y: y1 }, { x: cx - halfW, y: y1 }];
}

/** Electron position along the external wire path at fraction u∈[0,1). */
function onWire(u: number): Vec2 {
  const pts: Vec2[] = [{ x: LX, y: ETOP }, { x: LX, y: WIRE }, { x: RX, y: WIRE }, { x: RX, y: ETOP }];
  const segLen = (p: Vec2, q: Vec2): number => Math.hypot(q.x - p.x, q.y - p.y);
  let total = 0; for (let s = 0; s < 3; s++) total += segLen(pts[s]!, pts[s + 1]!);
  let d = u * total;
  for (let s = 0; s < 3; s++) {
    const p = pts[s]!, q = pts[s + 1]!, ln = segLen(p, q);
    if (d <= ln) { const k = d / ln; return { x: p.x + (q.x - p.x) * k, y: p.y + (q.y - p.y) * k }; }
    d -= ln;
  }
  return pts[3]!;
}

export function Battery({ emf, title = 'Galvanic cell: electrons on the move', height = 320 }: BatteryProps = {}): ReactNode {
  const [E, setE] = useState(clamp(num(emf, 1.1), 0.1, 5));
  const [load, setLoad] = useState(10);
  const gate = usePlayGate();
  const [t, setT] = useState(0);
  useEffect(() => { setE(clamp(num(emf, 1.1), 0.1, 5)); }, [emf]);

  const current = E / load; // amps (toy)
  useFrameLoop((f) => setT((v) => v + f.dtMs / 1000), { running: gate.running });

  const N_E = 6;
  const speed = clamp(current * 0.12, 0.02, 0.4);

  const figure = (
    <PlayWrap gate={gate}>
      <Stage view={VIEW} height={height} preserveAspect={false} ariaLabel={`Galvanic cell, ${E.toFixed(2)} V, ${(current * 1000).toFixed(0)} mA`}>
        {/* beakers (electrolyte solutions) — glass walls + a liquid surface line */}
        <Polygon points={rect(LX, 16, BBOT, BTOP)} color="var(--stage-fg)" fill="var(--stage-accent)" fillOpacity={0.16} weight={1.5} />
        <Polygon points={rect(RX, 16, BBOT, BTOP)} color="var(--stage-fg)" fill="var(--stage-accent-2)" fillOpacity={0.16} weight={1.5} />
        <Segment from={{ x: LX - 16, y: BTOP - 1.2 }} to={{ x: LX + 16, y: BTOP - 1.2 }} color="var(--stage-accent)" opacity={0.7} weight={1.5} />
        <Segment from={{ x: RX - 16, y: BTOP - 1.2 }} to={{ x: RX + 16, y: BTOP - 1.2 }} color="var(--stage-accent-2)" opacity={0.7} weight={1.5} />
        <Label x={LX} y={BBOT} text="Zn²⁺" color="var(--stage-fg)" size={11} dy={-8} />
        <Label x={RX} y={BBOT} text="Cu²⁺" color="var(--stage-fg)" size={11} dy={-8} />
        {/* electrodes */}
        <Polygon points={rect(LX, 1.4, 16, ETOP)} color="none" fill="var(--stage-fg)" fillOpacity={0.6} weight={0} />
        <Polygon points={rect(RX, 1.4, 16, ETOP)} color="none" fill="var(--stage-fg)" fillOpacity={0.6} weight={0} />
        <Label x={LX} y={ETOP} text="Zn (–) anode" color="var(--stage-fg)" size={11} dy={-22} />
        <Label x={RX} y={ETOP} text="Cu (+) cathode" color="var(--stage-fg)" size={11} dy={-22} />
        {/* external wire + load */}
        <Segment from={{ x: LX, y: ETOP }} to={{ x: LX, y: WIRE }} color="var(--stage-fg)" opacity={0.5} weight={2} />
        <Segment from={{ x: LX, y: WIRE }} to={{ x: RX, y: WIRE }} color="var(--stage-fg)" opacity={0.5} weight={2} />
        <Segment from={{ x: RX, y: WIRE }} to={{ x: RX, y: ETOP }} color="var(--stage-fg)" opacity={0.5} weight={2} />
        <ResistorBox center={{ x: 50, y: WIRE }} w={14} h={6} color="var(--stage-good)" label={`${load}Ω`} />
        <Label x={50} y={WIRE} text="e⁻ →" color="var(--stage-accent)" size={12} dy={-16} />
        {/* flowing electrons */}
        {Array.from({ length: N_E }, (_, k) => {
          const p = onWire((t * speed + k / N_E) % 1);
          return <Dot key={`e-${k}`} x={p.x} y={p.y} r={3.2} color="var(--stage-accent)" />;
        })}
      </Stage>
    </PlayWrap>
  );

  const controls = (
    <ControlBar>
      <Field label="load" value={`${load} Ω`}>
        <Slider value={load} min={2} max={50} step={1} onChange={(v) => setLoad(Math.round(v))} ariaLabel="external load" style={{ width: 120 }} />
      </Field>
    </ControlBar>
  );

  const aside = (
    <>
      <Callout tone="result">
        <span style={{ display: 'grid', gap: 4, fontVariantNumeric: 'tabular-nums' }}>
          <span>EMF {E.toFixed(2)} V</span>
          <span>I {(current * 1000).toFixed(0)} mA</span>
        </span>
      </Callout>
      <div style={{ display: 'grid', gap: 6, padding: '8px 2px 0', fontSize: 14 }}>
        <Tex tex={'\\text{anode: } Zn \\to Zn^{2+} + 2e^-'} />
        <Tex tex={'\\text{cathode: } Cu^{2+} + 2e^- \\to Cu'} />
      </div>
    </>
  );

  return (
    <LabFrame
      title={title}
      prompt="Electrons leave the zinc anode, do work in the load, and arrive at the copper cathode."
      aside={aside}
      controls={controls}
    >
      {figure}
    </LabFrame>
  );
}
