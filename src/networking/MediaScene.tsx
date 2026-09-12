'use client';

/**
 * Three media, drawn by their MECHANISM rather than as three labelled rectangles.
 *
 * "Copper, fibre, wireless" is usually a comparison table, and a table cannot explain why fibre
 * shrugs off a factory floor. Each drawing here shows the thing that carries the signal and the
 * thing that limits it, in the same frame: a voltage on a twisted pair with noise being induced
 * into it, light bouncing inside a glass core with the same noise unable to touch it, and a radio
 * wave spreading to everyone in range including the person you did not mean to tell.
 *
 * The twist is drawn, not mentioned. Two conductors that swap places repeatedly pick up the same
 * interference in both wires, and a receiver reading the DIFFERENCE between them cancels it. That
 * is the entire reason the cable in a student's hand is twisted, and it is a picture, not a rule.
 */

import type { ReactNode } from 'react';
import { Figure, FigText, HUE, STROKE, alpha, tint } from '../kit/figure/index.js';
import type { MediumId } from './media.js';

const W = 680;
const H = 250;
const RUN = { x: 96, w: 470, y: 118 };

const DEVICE_BODY = 'var(--fig-device)';
const DEVICE_EDGE = 'var(--fig-device-edge)';
const CAVITY = 'var(--fig-cavity)';

/** A small box at each end, so every medium visibly connects two things. */
function Endpoint({ x, label }: { x: number; label: string }): ReactNode {
  return (
    <g>
      <rect
        x={x - 26}
        y={RUN.y - 22}
        width={52}
        height={44}
        rx={5}
        fill={DEVICE_BODY}
        stroke={DEVICE_EDGE}
        strokeWidth={STROKE.hair}
      />
      <rect x={x - 16} y={RUN.y - 12} width={32} height={12} rx={2} fill={CAVITY} />
      <FigText x={x} y={RUN.y + 40} size="note" anchor="middle" tone="soft">
        {label}
      </FigText>
    </g>
  );
}

/** Interference arriving from a noisy machine. Only copper cares. */
function Noise({ absorbed }: { absorbed: boolean }): ReactNode {
  const x = RUN.x + RUN.w / 2;
  return (
    <g>
      <FigText x={x} y={34} size="note" anchor="middle" tone={absorbed ? 'hot' : 'soft'}>
        electrical noise
      </FigText>
      {[-70, -20, 30].map((offset) => (
        <path
          key={offset}
          d={`M${x + offset},44 l6,10 l-9,4 l8,12`}
          fill="none"
          stroke={absorbed ? HUE.danger : alpha(HUE.soft, 40)}
          strokeWidth={STROKE.line}
          strokeLinecap="round"
        />
      ))}
      <FigText x={x} y={92} size="note" anchor="middle" tone={absorbed ? 'hot' : 'good'}>
        {absorbed ? 'induced into both wires' : 'cannot enter the glass'}
      </FigText>
    </g>
  );
}

/** Twisted pair: two conductors that swap sides, so induced noise lands equally on both. */
function Copper(): ReactNode {
  const { x, w, y } = RUN;
  const turns = 11;
  const step = w / turns;
  const amp = 9;
  const wave = (phase: number): string => {
    let d = `M${x},${y + phase * amp}`;
    for (let index = 0; index < turns; index++) {
      const x0 = x + index * step;
      d += ` Q${x0 + step / 2},${y - phase * amp * 1.6} ${x0 + step},${y + phase * amp}`;
    }
    return d;
  };
  return (
    <g>
      <path d={wave(1)} fill="none" stroke={HUE[1]} strokeWidth={STROKE.edge} />
      <path d={wave(-1)} fill="none" stroke={tint(HUE[1], 55)} strokeWidth={STROKE.edge} />
      <FigText x={x + w / 2} y={y + 62} size="note" anchor="middle" tone="soft">
        the same noise lands on both wires, so the difference between them survives
      </FigText>
    </g>
  );
}

/** Optical fibre: light bouncing inside a core it cannot escape. */
function Fibre(): ReactNode {
  const { x, w, y } = RUN;
  const half = 15;
  const bounces = 7;
  const step = w / bounces;
  let path = `M${x},${y}`;
  for (let index = 0; index < bounces; index++) {
    path += ` L${x + (index + 0.5) * step},${y + (index % 2 === 0 ? -half + 3 : half - 3)}`;
  }
  path += ` L${x + w},${y}`;
  return (
    <g>
      {/* cladding, then core */}
      <rect x={x} y={y - half - 6} width={w} height={(half + 6) * 2} rx={4} fill={alpha(HUE[3], 18)} />
      <rect
        x={x}
        y={y - half}
        width={w}
        height={half * 2}
        fill={alpha(HUE.paper, 90)}
        stroke={alpha(HUE[3], 45)}
        strokeWidth={STROKE.hair}
      />
      <path d={path} fill="none" stroke={HUE.warn} strokeWidth={STROKE.bold} strokeLinejoin="round" />
      <FigText x={x + w / 2} y={y + 62} size="note" anchor="middle" tone="soft">
        light reflects off the boundary every time, so it never leaves the core
      </FigText>
    </g>
  );
}

/** Radio: one transmitter, and everyone inside the circle receives it. */
function Radio(): ReactNode {
  const { x, w, y } = RUN;
  const cx = x + 40;
  return (
    <g>
      {[46, 78, 110, 142].map((r, index) => (
        <path
          key={r}
          d={`M${cx + r * 0.3},${y - r * 0.72} A${r},${r} 0 0 1 ${cx + r * 0.3},${y + r * 0.72}`}
          fill="none"
          stroke={HUE[2]}
          strokeWidth={STROKE.line}
          opacity={0.8 - index * 0.15}
        />
      ))}
      <FigText x={x + w / 2 + 40} y={y + 62} size="note" anchor="middle" tone="soft">
        everyone inside the circle receives it, whether or not they were meant to
      </FigText>
    </g>
  );
}

export interface MediaSceneProps {
  medium: MediumId;
  /** Draw the interference source, and whether this medium absorbs it. */
  noisy?: boolean;
  label: string;
}

export function MediaScene({ medium, noisy = false, label }: MediaSceneProps): ReactNode {
  const { x, w } = RUN;
  return (
    <Figure viewBox={[W, H]} domain="physics" label={label}>
      {noisy && <Noise absorbed={medium !== 'fibre'} />}

      {medium === 'copper' && <Copper />}
      {medium === 'fibre' && <Fibre />}
      {medium === 'radio' && <Radio />}

      <Endpoint x={x - 34} label="switch" />
      {medium === 'radio' ? (
        <>
          <Endpoint x={x + w - 60} label="in range" />
          <Endpoint x={x + w + 30} label="also in range" />
        </>
      ) : (
        <Endpoint x={x + w + 34} label="device" />
      )}
    </Figure>
  );
}
