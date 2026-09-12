'use client';

/**
 * An RJ45 plug with its eight channels open, which is the view you have while crimping one.
 *
 * The colour order is the thing students memorise and cannot reconstruct. Drawing the PAIRS under
 * the pins is what makes it reconstructable: four pairs, the blue one pinned to the middle for
 * telephone compatibility, and the green pair therefore forced to straddle it. The bracket that
 * arcs over pins 4 and 5 is the whole explanation, so it is drawn rather than written.
 *
 * Wire colours are fixed rather than themed, for the same reason the link LED is green: here the
 * colour IS the information, and a learner holding a real cable needs the two to agree.
 */

import type { ReactNode } from 'react';
import { Figure, FigText, HUE, STROKE, alpha } from '../kit/figure/index.js';
import {
  PAIRS,
  WIRE_INK,
  isStriped,
  pairOf,
  pairPins,
  type PinoutStandard,
  type WireColor,
} from './media.js';

const W = 680;
const H = 330;

const PLUG = { x: 176, y: 34, w: 328, h: 132 };
const CH = { w: 32, gap: 5, top: 44, bottom: 158 };
const CONTACT_H = 16;
const BRACKET_Y = 214;
// Hardware neutrals: they nudge between themes rather than inverting, so the plug stays a plug.
// An empty channel is a slot rather than a hole: the darker cavity token made eight of them read
// as one black brick before any wire was placed.
const EMPTY = 'var(--fig-device-edge)';
const PLUG_BODY = 'var(--fig-device-soft)';
const PLUG_EDGE = 'var(--fig-device-edge)';

const chX = (index: number): number => {
  const span = 8 * CH.w + 7 * CH.gap;
  return PLUG.x + (PLUG.w - span) / 2 + index * (CH.w + CH.gap);
};

/** A striped wire is the pale half of its pair: the colour with white bands across it. */
function Wire({
  x,
  y,
  w,
  h,
  wire,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  wire?: WireColor;
}): ReactNode {
  const id = wire ? `stripe-${wire}` : undefined;
  if (!wire) return <rect x={x} y={y} width={w} height={h} fill={EMPTY} />;
  const ink = WIRE_INK[wire];
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill={ink} />
      {isStriped(wire) && (
        <g clipPath={`url(#${id})`}>
          <clipPath id={id}>
            <rect x={x} y={y} width={w} height={h} />
          </clipPath>
          {Array.from({ length: 6 }, (_, band) => (
            <rect
              key={band}
              x={x}
              y={y + 8 + band * 18}
              width={w}
              height={7}
              fill="oklch(0.99 0 0)"
              opacity={0.92}
            />
          ))}
        </g>
      )}
    </g>
  );
}

export interface PlugSceneProps {
  pins: (WireColor | undefined)[];
  standard: PinoutStandard;
  wrong?: number[];
  /** Highlight the pair brackets, which is the explanation for the order. */
  showPairs?: boolean;
  onPinClick?: (pin: number) => void;
  selected?: WireColor;
  label: string;
}

export function PlugScene({
  pins,
  standard,
  wrong = [],
  showPairs = true,
  onPinClick,
  selected,
  label,
}: PlugSceneProps): ReactNode {
  return (
    <Figure viewBox={[W, H]} domain="math" label={label}>
      {/* ── the plug body, with the latch on top ────────────────────────────── */}
      <rect
        x={PLUG.x + 128}
        y={PLUG.y - 14}
        width={72}
        height={18}
        rx={4}
        fill={PLUG_BODY}
        stroke={PLUG_EDGE}
        strokeWidth={STROKE.hair}
      />
      <rect
        x={PLUG.x}
        y={PLUG.y}
        width={PLUG.w}
        height={PLUG.h}
        rx={7}
        fill={PLUG_BODY}
        stroke={PLUG_EDGE}
        strokeWidth={STROKE.edge}
      />

      {/* ── eight channels: gold contact on top, wire below ─────────────────── */}
      {Array.from({ length: 8 }, (_, index) => {
        const x = chX(index);
        const pin = index + 1;
        const wire = pins[index];
        const isWrong = wrong.includes(pin);
        return (
          <g
            key={pin}
            className="network-scene-target"
            data-interactive={Boolean(onPinClick) || undefined}
            role={onPinClick ? 'button' : undefined}
            tabIndex={onPinClick ? 0 : undefined}
            aria-label={`Pin ${pin}, ${wire ? wire.replace('-', ' ') : 'empty'}${isWrong ? ', wrong' : ''}`}
            onClick={() => onPinClick?.(pin)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onPinClick?.(pin);
              }
            }}
          >
            <Wire x={x} y={CH.top + CONTACT_H} w={CH.w} h={CH.bottom - CH.top - CONTACT_H} wire={wire} />
            {/* gold contact */}
            <rect x={x + 4} y={CH.top} width={CH.w - 8} height={CONTACT_H} rx={1.5} fill={HUE.warn} />
            <rect
              x={x}
              y={CH.top}
              width={CH.w}
              height={CH.bottom - CH.top}
              fill="none"
              stroke={isWrong ? HUE.danger : PLUG_EDGE}
              strokeWidth={isWrong ? STROKE.edge : STROKE.hair}
            />
            {selected && !wire && (
              <rect
                x={x + 2}
                y={CH.top + CONTACT_H + 2}
                width={CH.w - 4}
                height={16}
                rx={2}
                fill={alpha(WIRE_INK[selected], 45)}
              />
            )}
            <FigText
              x={x + CH.w / 2}
              y={CH.bottom + 18}
              size="note"
              anchor="middle"
              tone={isWrong ? 'hot' : 'ink'}
            >
              {pin}
            </FigText>
          </g>
        );
      })}

      {/* ── the pairs, which are the reason for the order ───────────────────── */}
      {showPairs &&
        PAIRS.map((pair, index) => {
          const pinsFor = pairPins(standard, pair.name);
          if (pinsFor.length !== 2) return null;
          const a = chX(pinsFor[0]! - 1) + CH.w / 2;
          const b = chX(pinsFor[1]! - 1) + CH.w / 2;
          const split = pinsFor[1]! - pinsFor[0]! !== 1;
          // A split pair arcs higher, so it visibly steps over the pair sitting between it.
          const lift = split ? 30 : 12;
          const ink = WIRE_INK[pair.wires[1]];
          return (
            <g key={pair.name}>
              <path
                d={`M${a},${BRACKET_Y - 10} C${a},${BRACKET_Y + lift} ${b},${BRACKET_Y + lift} ${b},${BRACKET_Y - 10}`}
                fill="none"
                stroke={ink}
                strokeWidth={split ? STROKE.bold : STROKE.line}
              />
              {/* A split pair and the pair it straddles share a centre, so labels cannot all sit
                  under their arcs: "blue" landed on the green line twice, once below it and once
                  on it. Nested pairs label ABOVE the bracket line, where no arc passes. */}
              <FigText
                x={(a + b) / 2}
                y={split ? BRACKET_Y + lift + 14 : BRACKET_Y - 14}
                size="note"
                anchor="middle"
                tone={pairOf(pair.wires[1]) >= 0 ? 'ink' : 'soft'}
              >
                {pair.name}
              </FigText>
            </g>
          );
        })}

      {showPairs && (
        <FigText x={W / 2} y={H - 12} size="note" anchor="middle" tone="soft">
          blue holds the middle two pins, so green has to step around it
        </FigText>
      )}
    </Figure>
  );
}
