'use client';

/**
 * ReactionLab — a synthesis reaction as moving atoms: A + B collide and bond into
 * A–B. Raise the temperature and they collide harder/more often (kinetics); press
 * React to run it. Atoms are conserved — none created or destroyed, just
 * rearranged.
 *
 * Now on the @classytic/stage engine (SVG, accessible, themed).
 */

import { useEffect, useState, type ReactNode } from 'react';
import { Stage, Circle, Segment, Label, useFrameLoop, useInView } from '@classytic/stage';
import { Slider, CheckButton, Chip } from '../kit/controls.js';
import { LabFrame, ControlBar, Field, Callout } from '../kit/frame.js';
import { ReactionFlow } from '../kit/reaction.js';
import { clamp } from '../core/util.js';

export interface ReactionLabProps {
  /** Labels for the two reactant atoms. */
  a?: string;
  b?: string;
  title?: string;
  height?: number;
}

// Fixed view: x ∈ [-10,10], atoms on the horizontal midline (y=0).
const VIEW = { xMin: -10, xMax: 10, yMin: -6, yMax: 6 };
const R = 1.7;

export function ReactionLab({ a = 'A', b = 'B', title = 'A + B → A–B', height = 300 }: ReactionLabProps = {}): ReactNode {
  const [temp, setTemp] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [bonded, setBonded] = useState(false);
  const [p, setP] = useState(0); // 0 = apart, 1 = bonded
  const { ref: viewRef, inView } = useInView<HTMLDivElement>();

  useFrameLoop(
    (f) => {
      setP((prev) => {
        const next = clamp(prev + (f.dtMs / 1000) * 0.35 * temp, 0, 1);
        if (next >= 1 && !bonded) { setBonded(true); setPlaying(false); }
        return next;
      });
    },
    { running: playing && !bonded && inView },
  );

  const reset = (): void => { setP(0); setBonded(false); setPlaying(false); };

  const jit = (1 - p) * 1.2 * temp;
  const apartGap = 5.2;
  const cxA = -apartGap * (1 - p) - R * p * 0.9;
  const cxB = apartGap * (1 - p) + R * p * 0.9;
  const yA = Math.sin(p * 9) * jit;
  const yB = -Math.sin(p * 9) * jit;

  const figure = (
    <>
      <ReactionFlow reactants={[{ kind: 'A' }, { kind: 'B' }]} products={[{ kind: 'AB' }]} height={60} molSize={24} ariaLabel={`${a} + ${b} react to form ${a}${b}`} />
      <div ref={viewRef}>
        <Stage view={VIEW} height={height} ariaLabel={`${a} and ${b} ${p > 0.95 ? 'bonded into a product' : 'as reactants'}`}>
          {p > 0.8 && <Segment from={{ x: cxA + R, y: yA }} to={{ x: cxB - R, y: yB }} color="var(--stage-fg)" weight={3} />}
          <Circle center={{ x: cxA, y: yA }} r={R} color="var(--stage-accent)" fill="var(--stage-accent)" fillOpacity={1} weight={0} />
          <Label x={cxA} y={yA} text={a} color="var(--stage-bg)" size={18} weight={700} />
          <Circle center={{ x: cxB, y: yB }} r={R} color="var(--stage-accent-2)" fill="var(--stage-accent-2)" fillOpacity={1} weight={0} />
          <Label x={cxB} y={yB} text={b} color="var(--stage-bg)" size={18} weight={700} />
          <Label x={0} y={VIEW.yMin + 0.8} text={p > 0.95 ? `${a}–${b} (product)` : `${a} + ${b} (reactants)`} color="var(--stage-fg)" size={13} />
        </Stage>
      </div>
    </>
  );

  const controls = (
    <ControlBar>
      <CheckButton onClick={() => { if (bonded) reset(); setPlaying(true); }}>{bonded ? 'Run again' : 'React'}</CheckButton>
      <Chip selected={false} onClick={reset}>Reset</Chip>
      <Field label="temperature">
        <Slider value={temp} min={0.3} max={3} step={0.1} onChange={setTemp} ariaLabel="temperature" style={{ width: 120 }} />
      </Field>
    </ControlBar>
  );

  return (
    <LabFrame
      title={title}
      prompt="Atoms rearrange — none are created or destroyed. Raise the temperature to react faster."
      aside={<Callout tone="result">{bonded ? 'product' : playing ? 'reacting…' : 'reactants'}</Callout>}
      controls={controls}
    >
      {figure}
    </LabFrame>
  );
}
