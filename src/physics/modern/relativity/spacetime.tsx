import type { ReactNode } from 'react';
import { Arrow, Ball, Curve, FigText, Figure, HUE, Track } from '../../../kit/figure/index.js';
import { lightClockEvents, type LightClockState } from './core.js';
import { clipSegment } from './scene-primitives.js';

const W = 520;
const H = 300;
const OX = 260;
const OY = 262;
const RANGE = 210;
const PLOT = { x0: 30, y0: 40, x1: 500, y1: OY + 12 };

export function SpacetimeDiagram({ state }: { state: LightClockState }): ReactNode {
  const e = lightClockEvents(state.beta, state.mirrorHeight * 2),
    max = Math.max(2.2, e.return.ct * 1.08),
    sx = (x: number) => OX + (x / max) * RANGE,
    sy = (ct: number) => OY - (ct / max) * RANGE,
    current = { x: state.shipX, ct: state.coordinateElapsed },
    left = -max,
    right = max,
    ctLeft = current.ct + state.beta * (left - current.x),
    ctRight = current.ct + state.beta * (right - current.x),
    now = clipSegment(sx(left), sy(ctLeft), sx(right), sy(ctRight), PLOT);
  return (
    <Figure
      viewBox={[W, H]}
      domain="physics"
      label={`Spacetime diagram with ship worldline at beta ${state.beta.toFixed(2)}`}
    >
      {/* axes */}
      <Arrow x1={PLOT.x0} y1={OY} x2={PLOT.x1 + 4} y2={OY} color={HUE.ink} head={8} />
      <Arrow x1={OX} y1={OY + 14} x2={OX} y2={30} color={HUE.ink} head={8} />
      <FigText x={PLOT.x1 + 10} y={OY} baseline="middle" size="note" tone="soft">
        x
      </FigText>
      <FigText x={OX + 8} y={34} size="note" tone="soft">
        ct
      </FigText>

      {/* light cone */}
      <Track
        points={[
          [sx(-max), sy(max)],
          [sx(0), sy(0)],
          [sx(max), sy(max)],
        ]}
        color={HUE[2]}
        weight="line"
      />

      {/* the ship's line of simultaneity through the current event */}
      {now && (
        <Track
          points={[
            [now[0], now[1]],
            [now[2], now[3]],
          ]}
          color={HUE.soft}
          weight="line"
        />
      )}

      {/* ship worldline: the one emphasised path */}
      <Curve
        points={[
          [sx(0), sy(0)],
          [sx(e.return.x), sy(e.return.ct)],
        ]}
        color={HUE[1]}
        weight="bold"
      />

      {/* tick events on the worldline */}
      <Ball cx={sx(0)} cy={sy(0)} r={4.5} color={HUE[2]} />
      <Ball
        cx={sx(e.reflection.x)}
        cy={sy(e.reflection.ct)}
        r={5}
        color={HUE[2]}
        flash={state.event === 'reflection' ? 1 : 0}
        flashColor={HUE[2]}
      />
      <Ball cx={sx(e.return.x)} cy={sy(e.return.ct)} r={4.5} color={HUE[2]} />
      <Ball cx={sx(current.x)} cy={sy(current.ct)} r={7} color={HUE[1]} active />

      {/* legend */}
      <Track
        points={[
          [30, 290],
          [54, 290],
        ]}
        dashed={false}
        color={HUE[1]}
        weight="edge"
      />
      <FigText x={62} y={290} baseline="middle" size="note" tone="soft">
        ship worldline
      </FigText>
      <Track
        points={[
          [170, 290],
          [194, 290],
        ]}
        color={HUE[2]}
        weight="line"
      />
      <FigText x={202} y={290} baseline="middle" size="note" tone="soft">
        light cone
      </FigText>
      <Track
        points={[
          [280, 290],
          [304, 290],
        ]}
        color={HUE.soft}
        weight="line"
      />
      <FigText x={312} y={290} baseline="middle" size="note" tone="soft">
        ship’s now
      </FigText>
      <Ball cx={400} cy={290} r={4.5} color={HUE[2]} />
      <FigText x={410} y={290} baseline="middle" size="note" tone="soft">
        tick events
      </FigText>
    </Figure>
  );
}
