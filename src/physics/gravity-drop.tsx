'use client';

/**
 * GravityDrop, drop identical balls on three worlds; stronger gravity wins.
 * On the @classytic/stage engine (SVG): three lanes in a fixed coordinate box,
 * the balls fall on the engine clock, landing times appear as they hit.
 */

import { useRef, useState, type ReactNode } from 'react';
import { Stage, Segment, Label, useFrameLoop, useInView, useCoords, fmt } from '@classytic/stage';
import { CheckButton, Chip } from '../kit/controls.js';
import { LabFrame, ControlBar, Callout } from '../kit/frame.js';

const num = (v: number | string | undefined, fb: number): number => { const n = typeof v === 'string' ? parseFloat(v) : v; return Number.isFinite(n) ? (n as number) : fb; };

/**
 * A falling ball: a shaded sphere (tone fill + top-left specular) with a motion
 * trail whose length scales with speed, so the eye reads Jupiter's ball as
 * genuinely faster than the Moon's. Drawn in pixels (project the math centre
 * first); the trail and highlight are constant-quality regardless of zoom.
 */
function PlanetBall({ cx, y, rPx, tone, vNorm }: { cx: number; y: number; rPx: number; tone: string; vNorm: number }): ReactNode {
  const c = useCoords();
  const [px, py] = c.toPx(cx, y);
  const rp = rPx;
  const trail = Math.min(1, vNorm) * rp * 5.5;
  return (
    <g>
      {trail > 2 && <line x1={fmt(px)} y1={fmt(py - rp * 0.4)} x2={fmt(px)} y2={fmt(py - rp * 0.4 - trail)} stroke={tone} strokeWidth={rp * 1.3} strokeLinecap="round" opacity={0.16} />}
      <circle cx={fmt(px)} cy={fmt(py)} r={rp} fill={tone} />
      <circle cx={fmt(px - rp * 0.32)} cy={fmt(py - rp * 0.32)} r={rp * 0.4} fill="var(--stage-sheen)" opacity={0.55} />
    </g>
  );
}

const WORLDS = [
  { name: 'Moon', g: 1.6, tone: 'var(--stage-fg)' },
  { name: 'Earth', g: 9.8, tone: 'var(--stage-accent)' },
  { name: 'Jupiter', g: 24.8, tone: 'var(--stage-accent-2)' },
];

export interface GravityDropProps {
  height?: number | string;
}

// Fixed coordinate box: 3 lanes wide, top y=10 → ground y=0.
const TOP = 10;

export function GravityDrop(props: GravityDropProps): ReactNode {
  const fallH = num(props.height, 50);
  const [running, setRunning] = useState(false);
  const [t, setT] = useState(0);
  const startRef = useRef<number | null>(null);
  const { ref: viewRef, inView } = useInView<HTMLDivElement>();
  const maxT = Math.max(...WORLDS.map((wd) => Math.sqrt((2 * fallH) / wd.g)));

  useFrameLoop(
    (f) => {
      if (startRef.current === null) startRef.current = f.timeMs;
      const tt = (f.timeMs - startRef.current) / 1000;
      setT(tt);
      if (tt >= maxT + 0.4) setRunning(false);
    },
    { running: running && inView },
  );

  const drop = (): void => { startRef.current = null; setT(0); setRunning(true); };

  const view = { xMin: 0, xMax: WORLDS.length, yMin: -2.5, yMax: TOP + 3.5 };

  const figure = (
    <div ref={viewRef}>
      <Stage view={view} height={280} preserveAspect={false} ariaLabel="Identical balls falling on the Moon, Earth, and Jupiter">
        {WORLDS.map((_world, i) => (
          <Segment key={`g-${i}`} from={{ x: i + 0.5 - 0.4, y: 0 }} to={{ x: i + 0.5 + 0.4, y: 0 }} color="var(--stage-fg)" opacity={0.5} weight={1.5} />
        ))}
        {WORLDS.map((world, i) => {
          const cx = i + 0.5;
          const tLand = Math.sqrt((2 * fallH) / world.g);
          const tt = Math.min(t, tLand);
          const frac = Math.min((0.5 * world.g * tt * tt) / fallH, 1);
          const ballY = TOP - frac * TOP;
          const refV = Math.sqrt(2 * fallH * Math.max(...WORLDS.map((w) => w.g)));
          const vNorm = tt < tLand ? (world.g * tt) / refV : 0;
          return <PlanetBall key={`b-${i}`} cx={cx} y={ballY} rPx={14} tone={world.tone} vNorm={vNorm} />;
        })}
        {WORLDS.map((world, i) => (
          <Label key={`l-${i}`} x={i + 0.5} y={0} text={world.name} color="var(--stage-fg)" size={13} dy={18} />
        ))}
        {WORLDS.map((world, i) => <Label key={`g-l-${i}`} x={i + 0.5} y={TOP} text={`g=${world.g}`} color="var(--stage-fg)" size={10} dy={-22} />)}
        {WORLDS.map((world, i) => {
          const tLand = Math.sqrt((2 * fallH) / world.g);
          return t >= tLand ? <Label key={`t-${i}`} x={i + 0.5} y={1.2} text={`${tLand.toFixed(1)}s`} color="var(--stage-good)" size={11} /> : null;
        })}
      </Stage>
    </div>
  );

  const controls = (
    <ControlBar>
      <CheckButton onClick={drop}>Drop</CheckButton>
      <Chip selected={false} onClick={() => { startRef.current = null; setRunning(false); setT(0); }}>Reset</Chip>
    </ControlBar>
  );

  return (
    <LabFrame
      title="Gravity Drop"
      prompt={`Drop identical balls from ${fallH} m on three worlds, stronger gravity wins.`}
      aside={<Callout>Same mass, same height, only <strong>g</strong> differs.</Callout>}
      controls={controls}
    >
      {figure}
    </LabFrame>
  );
}
