import type { ReactNode } from 'react';
import { Arrow, Ball, Block, FigText, Figure, HUE, Ray, Track, alpha } from '../../../kit/figure/index.js';
import { lightClockEvents, type LightClockState } from './core.js';
import { ClockFace } from './scene-primitives.js';

const W = 568;
const H = 312;
const MIRROR_W = 100;
const MIRROR_H = 8;
const TOP = 56; // top mirror y (its lower face is TOP + MIRROR_H)
const BOT = 232; // bottom mirror y (its upper face)
const R = 7; // photon radius
const Y_START = BOT - R; // photon centre resting on the bottom mirror
const Y_END = TOP + MIRROR_H + R; // photon centre touching the top mirror
const SHIP_CX = 110;
const ORIGIN = 340; // emission x in the platform panel
const TRAVEL = 125; // max horizontal travel of the moving clock (user units)
const PLATFORM_CX = ORIGIN + 62;
const LEDGER_Y = 273;

function Mirrors({ cx, ghost = false }: { cx: number; ghost?: boolean }): ReactNode {
  return (
    <g opacity={ghost ? 0.3 : undefined}>
      <Block x={cx - MIRROR_W / 2} y={TOP} w={MIRROR_W} h={MIRROR_H} color={HUE.metal} radius={2} />
      <Block x={cx - MIRROR_W / 2} y={BOT} w={MIRROR_W} h={MIRROR_H} color={HUE.metal} radius={2} />
    </g>
  );
}

function Ledger({
  cx,
  symbol,
  value,
  turns,
}: {
  cx: number;
  symbol: string;
  value: number;
  turns: number;
}): ReactNode {
  return (
    <g>
      <ClockFace cx={cx - 52} cy={LEDGER_Y - 5} r={12} turns={turns} />
      <FigText x={cx - 34} y={LEDGER_Y} size="measure">
        {symbol} {value.toFixed(2)} s
      </FigText>
    </g>
  );
}

export function LightClockScene({ state }: { state: LightClockState }): ReactNode {
  const properTick = state.mirrorHeight * 2;
  const phaseY = Y_START - (state.photonY / state.mirrorHeight) * (Y_START - Y_END);
  const scale = TRAVEL / Math.max(0.01, state.gamma * properTick);
  const x = ORIGIN + state.shipX * scale;
  const events = lightClockEvents(state.beta, properTick);
  const rx = ORIGIN + events.reflection.x * scale;
  const xx = ORIGIN + events.return.x * scale;
  const returning = state.progress > 0.5;
  const eventFlash =
    state.event === 'emission' || state.event === 'reflection' || state.progress >= 1 ? 1 : 0;
  const moving = Math.abs(state.beta) > 0.005;
  return (
    <Figure
      viewBox={[W, H]}
      domain="physics"
      label={`Light clock at ${Math.abs(state.beta).toFixed(2)} c; ship elapsed ${state.properElapsed.toFixed(2)}, platform elapsed ${state.coordinateElapsed.toFixed(2)}`}
    >
      <FigText x={SHIP_CX} y={26} anchor="middle" size="title">
        ship frame
      </FigText>
      <FigText x={PLATFORM_CX} y={26} anchor="middle" size="title">
        platform frame
      </FigText>
      <Track
        points={[
          [222, 40],
          [222, 256],
        ]}
        dashed={false}
        color={HUE.glass}
        weight="hair"
      />

      {/* ship frame: the pulse bounces straight up and down */}
      <Mirrors cx={SHIP_CX} />
      <Track
        points={[
          [SHIP_CX, Y_START],
          [SHIP_CX, Y_END],
        ]}
        color={alpha(HUE[2], 45)}
        weight="hair"
      />
      {returning ? (
        <>
          <Ray x1={SHIP_CX} y1={Y_START} x2={SHIP_CX} y2={Y_END} color={HUE[2]} width={5} opacity={0.4} />
          <Ray x1={SHIP_CX} y1={Y_END} x2={SHIP_CX} y2={phaseY} color={HUE[2]} width={5} />
        </>
      ) : (
        state.progress > 0 && (
          <Ray x1={SHIP_CX} y1={Y_START} x2={SHIP_CX} y2={phaseY} color={HUE[2]} width={5} />
        )
      )}
      <Ball cx={SHIP_CX} cy={phaseY} r={R} color={HUE[2]} flash={eventFlash} flashColor={HUE[2]} />

      {/* platform frame: the same pulse, reconstructed on a clock that slides right */}
      {moving && <Mirrors cx={ORIGIN} ghost />}
      <Mirrors cx={x} />
      <Track
        points={[
          [ORIGIN, Y_START],
          [rx, Y_END],
          [xx, Y_START],
        ]}
        color={alpha(HUE[2], 45)}
        weight="hair"
      />
      {returning ? (
        <>
          <Ray x1={ORIGIN} y1={Y_START} x2={rx} y2={Y_END} color={HUE[2]} width={5} opacity={0.4} />
          <Ray x1={rx} y1={Y_END} x2={x} y2={phaseY} color={HUE[2]} width={5} />
        </>
      ) : (
        state.progress > 0 && <Ray x1={ORIGIN} y1={Y_START} x2={x} y2={phaseY} color={HUE[2]} width={5} />
      )}
      <Ball cx={x} cy={phaseY} r={R} color={HUE[2]} flash={eventFlash} flashColor={HUE[2]} />
      {moving && (
        <Arrow
          x1={x + MIRROR_W / 2 + 8}
          y1={TOP + MIRROR_H / 2}
          x2={x + MIRROR_W / 2 + 36}
          y2={TOP + MIRROR_H / 2}
          color={HUE[1]}
          head={7}
          label="v"
          labelSide="right"
        />
      )}

      {/* clock ledger */}
      <Ledger
        cx={SHIP_CX}
        symbol="Δτ"
        value={state.properElapsed}
        turns={(state.properElapsed / properTick) * 0.5}
      />
      <Ledger
        cx={PLATFORM_CX}
        symbol="Δt"
        value={state.coordinateElapsed}
        turns={(state.coordinateElapsed / properTick) * 0.5}
      />

      {/* legend */}
      <Ball cx={60} cy={301} r={5} color={HUE[2]} />
      <FigText x={70} y={301} baseline="middle" size="note" tone="soft">
        light pulse
      </FigText>
      <Block x={150} y={298} w={18} h={6} color={HUE.metal} radius={2} />
      <FigText x={174} y={301} baseline="middle" size="note" tone="soft">
        mirror
      </FigText>
    </Figure>
  );
}
