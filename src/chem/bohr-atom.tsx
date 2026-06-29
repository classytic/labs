'use client';

/**
 * BohrAtom, the classic shell model of an atom, animated.
 *
 * Nucleus (Z protons) ringed by electron shells filled 2, 8, 8, 18…; electrons
 * orbit at a steady clip via the engine clock. Drag the proton count to walk the
 * first 20 elements and watch shells fill and close.
 *
 * Now on the @classytic/stage engine (SVG, accessible, themed), shells are
 * Circles, electrons are Dots, the nucleus is a labelled Circle.
 */

import { useEffect, useState, type ReactNode } from 'react';
import { Stage, Circle, Dot, Label, useFrameLoop } from '@classytic/stage';
import { usePlayGate, PlayWrap } from '../kit/play.js';
import { Slider } from '../kit/controls.js';
import { LabFrame, ControlBar, Field, Callout } from '../kit/frame.js';
import { num, clamp } from '../core/util.js';

const SYMBOLS = ['', 'H', 'He', 'Li', 'Be', 'B', 'C', 'N', 'O', 'F', 'Ne', 'Na', 'Mg', 'Al', 'Si', 'P', 'S', 'Cl', 'Ar', 'K', 'Ca'];
const SHELL_CAP = [2, 8, 8, 18];

// A fixed packed nucleon cluster (p = proton/warm, else neutron/grey), purely
// representational, so the nucleus reads as nucleons, not one flat disc.
const NUCLEONS: { dx: number; dy: number; p: boolean }[] = [
  { dx: 0, dy: 0, p: true }, { dx: 0.6, dy: 0.25, p: false }, { dx: -0.55, dy: 0.35, p: true },
  { dx: 0.3, dy: -0.55, p: false }, { dx: -0.4, dy: -0.5, p: true }, { dx: 0.7, dy: -0.25, p: true },
  { dx: -0.7, dy: -0.1, p: false }, { dx: 0.1, dy: 0.6, p: false },
];

function shellsFor(z: number): number[] {
  const shells: number[] = [];
  let left = z;
  for (const cap of SHELL_CAP) { if (left <= 0) break; const n = Math.min(cap, left); shells.push(n); left -= n; }
  return shells;
}

export interface BohrAtomProps {
  /** Atomic number Z (protons). 1–20. Default 6 (carbon). */
  protons?: number | string;
  title?: string;
  height?: number;
}

// Square math view centered on the origin.
const VIEW = { xMin: -10, xMax: 10, yMin: -10, yMax: 10 };

export function BohrAtom({ protons, title = 'Bohr model of the atom', height = 340 }: BohrAtomProps = {}): ReactNode {
  const [z, setZ] = useState(clamp(Math.round(num(protons, 6)), 1, 20));
  const [spin, setSpin] = useState(0);
  const gate = usePlayGate();
  useEffect(() => { setZ(clamp(Math.round(num(protons, 6)), 1, 20)); }, [protons]);

  useFrameLoop((f) => setSpin((s) => s + (f.dtMs / 1000) * Math.PI), { running: gate.running });

  const shells = shellsFor(z);
  const baseR = 2.6, maxR = 9;
  const gap = shells.length > 1 ? (maxR - baseR) / (shells.length - 1) : 0;

  const figure = (
    <PlayWrap gate={gate}>
      <Stage view={VIEW} height={height} ariaLabel={`Bohr model of ${SYMBOLS[z] ?? z} (Z=${z}), configuration ${shells.join(', ')}`}>
        {shells.map((_count, i) => (
          <Circle key={`s-${i}`} center={{ x: 0, y: 0 }} r={shells.length === 1 ? baseR + 2.2 : baseR + i * gap} color="var(--stage-fg)" opacity={0.25} weight={1} fill="none" />
        ))}
        {shells.flatMap((count, i) => {
          const r = shells.length === 1 ? baseR + 2.2 : baseR + i * gap;
          const dir = i % 2 === 0 ? 1 : -1;
          const speed = 0.6 / (i + 1);
          return Array.from({ length: count }, (_, e) => {
            const a = (e / count) * Math.PI * 2 + dir * spin * speed;
            return <Dot key={`e-${i}-${e}`} x={r * Math.cos(a)} y={r * Math.sin(a)} r={4} color="var(--stage-accent)" />;
          });
        })}
        {/* nucleus, a packed cluster of protons (warm) + neutrons (grey) */}
        {NUCLEONS.map((nuc, i) => (
          <Circle key={`nuc-${i}`} center={{ x: nuc.dx, y: nuc.dy }} r={0.62} color="none" fill={nuc.p ? 'var(--stage-warn)' : 'var(--stage-muted)'} fillOpacity={1} weight={0} />
        ))}
        <Label x={0} y={0} text={SYMBOLS[z] ?? String(z)} color="var(--stage-fg)" size={15} weight={700} />
      </Stage>
    </PlayWrap>
  );

  const controls = (
    <ControlBar>
      <Field label="protons (Z)" value={z}>
        <Slider value={z} min={1} max={20} step={1} onChange={(v) => setZ(Math.round(v))} ariaLabel="proton count" style={{ width: 130 }} />
      </Field>
    </ControlBar>
  );

  const aside = (
    <Callout tone="result">
      <span style={{ display: 'grid', gap: 4, fontVariantNumeric: 'tabular-nums' }}>
        <span>element {SYMBOLS[z] ?? ', '}</span>
        <span>Z {z}</span>
        <span>config {shells.join(', ')}</span>
      </span>
    </Callout>
  );

  return (
    <LabFrame
      title={title}
      prompt="Drag the proton count to walk the first 20 elements, watch the shells fill (2, 8, 8, …)."
      aside={aside}
      controls={controls}
    >
      {figure}
    </LabFrame>
  );
}
