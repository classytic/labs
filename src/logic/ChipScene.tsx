'use client';

/**
 * A 14-pin chip on a breadboard, drawn the way it is met on a lab bench.
 *
 * The notch and the pin-1 dot are drawn because counting from them is the skill: pins run 1 to 7
 * along the bottom from the notch end, then 8 to 14 back along the top, so pin 14 sits directly above
 * pin 1. Inside the chip, each pin carries its datasheet name (1A, 1B, 1Y, GND, VCC), which is how a
 * student reads a pinout and the only way the 7402's reversed outputs become visible.
 *
 * The supply rails are red and blue as on every breadboard, and those two colours are pinned rather
 * than themed: they are the colours of the physical strips a student will plug into. Wires are drawn
 * as jumper leads, coloured by where they come from, and every pin shows a small lamp when it is
 * high, so a working circuit visibly carries its signal from the switches to the LED.
 */

import type { ReactNode } from 'react';
import { Figure, FigText, HUE, STROKE, alpha, tint } from '../kit/figure/index.js';
import { ToggleSwitch } from '../kit/logic-gates/display.js';
import { BreadboardSurface } from '../kit/electronics/signals.js';
import { CHIPS, GND_PIN, VCC_PIN, type ChipId, type ChipResult, type Terminal, type Wire } from './ic.js';

const W = 680;
const H = 372;

const RAIL_TOP = 34;
const RAIL_BOTTOM = 338;
// Tall enough that the printed part number sits clear of both rows of pin names.
const CHIP = { x: 214, y: 138, w: 260, h: 100 };
const PITCH = 34;
const LEG = 16;
const SWITCH = { x: 40, w: 46, h: 22 };
const LED = { x: 612, y: 188 };

/** Physical colours, pinned: the rails and leads are objects the learner will hold. */
const RED = 'oklch(0.6 0.2 25)';
const BLUE = 'oklch(0.52 0.16 255)';
const LEAD: Record<string, string> = {
  A: 'oklch(0.62 0.17 255)',
  B: 'oklch(0.64 0.18 300)',
  VCC: RED,
  GND: BLUE,
  LED: 'oklch(0.62 0.16 150)',
  jumper: 'oklch(0.72 0.16 70)',
};
const LIVE = 'var(--stage-live)';

/** Bottom row: pins 1..7 left to right. Top row: pins 14..8 left to right, 14 above 1. */
const pinX = (n: number): number => CHIP.x + 22 + (n <= 7 ? n - 1 : 14 - n) * PITCH;
const pinTip = (n: number): [number, number] => [pinX(n), n <= 7 ? CHIP.y + CHIP.h + LEG : CHIP.y - LEG];

export interface ChipSceneProps {
  chip: ChipId;
  wires: Wire[];
  inputs: { A: boolean; B: boolean };
  result: ChipResult;
  /** Pin waiting for the other end of a jumper. */
  pending?: number | null;
  onPin?: (pin: number) => void;
  onSwitch?: (which: 'A' | 'B') => void;
  label: string;
}

function pinName(chip: ChipId, n: number): string {
  if (n === VCC_PIN) return 'VCC';
  if (n === GND_PIN) return 'GND';
  const gates = CHIPS[chip].gates;
  const index = gates.findIndex((gate) => gate.output === n || gate.inputs.includes(n));
  if (index < 0) return '';
  const gate = gates[index]!;
  return gate.output === n
    ? `${index + 1}Y`
    : `${index + 1}${gate.inputs.length === 1 ? 'A' : gate.inputs.indexOf(n) === 0 ? 'A' : 'B'}`;
}

export function ChipScene({
  chip,
  wires,
  inputs,
  result,
  pending,
  onPin,
  onSwitch,
  label,
}: ChipSceneProps): ReactNode {
  const switchY = { A: 150, B: 226 } as const;
  const anchor = (t: Terminal, other: Terminal): [number, number] => {
    if (t === 'A' || t === 'B') return [SWITCH.x + SWITCH.w + 10, switchY[t]];
    if (t === 'LED') return [LED.x - 22, LED.y];
    if (t === 'VCC' || t === 'GND') {
      const x = other.startsWith('p') ? pinX(Number(other.slice(1))) : 120;
      return [x, t === 'VCC' ? RAIL_TOP : RAIL_BOTTOM];
    }
    return pinTip(Number(t.slice(1)));
  };
  const leadColour = (wire: Wire): string => {
    const off = wire.find((t) => !t.startsWith('p'));
    return LEAD[off ?? 'jumper'] ?? LEAD.jumper!;
  };

  return (
    <Figure viewBox={[W, H]} domain="physics" label={label}>
      {/* ── the breadboard and its supply rails ───────────────────────────── */}
      <BreadboardSurface x={20} y={20} width={W - 40} height={H - 40} trenchY={CHIP.y + CHIP.h / 2} />
      <line x1={110} y1={RAIL_TOP} x2={W - 40} y2={RAIL_TOP} stroke={RED} strokeWidth={STROKE.edge} />
      <line x1={110} y1={RAIL_BOTTOM} x2={W - 40} y2={RAIL_BOTTOM} stroke={BLUE} strokeWidth={STROKE.edge} />
      <FigText x={104} y={RAIL_TOP + 4} size="note" anchor="end" tone="ink">
        +5 V
      </FigText>
      <FigText x={104} y={RAIL_BOTTOM + 4} size="note" anchor="end" tone="ink">
        GND
      </FigText>

      {/* ── the chip ──────────────────────────────────────────────────────── */}
      {Array.from({ length: 14 }, (_, i) => i + 1).map((n) => {
        const [x, tip] = pinTip(n);
        const bottom = n <= 7;
        const level = result.pins[n];
        const waiting = pending === n;
        return (
          <g
            key={`pin-${n}`}
            role={onPin ? 'button' : undefined}
            tabIndex={onPin ? 0 : undefined}
            aria-label={`Pin ${n}, ${pinName(chip, n)}`}
            style={{ cursor: onPin ? 'pointer' : undefined }}
            onClick={() => onPin?.(n)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onPin?.(n);
              }
            }}
          >
            <rect
              x={x - 6}
              y={bottom ? CHIP.y + CHIP.h : tip}
              width={12}
              height={LEG}
              fill={waiting ? tint(LEAD.jumper!, 70) : 'oklch(0.78 0.02 250)'}
              stroke={waiting ? LEAD.jumper : 'oklch(0.55 0.02 250)'}
              strokeWidth={STROKE.hair}
            />
            <circle
              cx={x}
              cy={tip}
              r={waiting ? 7 : 5}
              fill="var(--fig-paper)"
              stroke={waiting ? LEAD.jumper : alpha(HUE.soft, 65)}
              strokeWidth={waiting ? STROKE.edge : STROKE.line}
            />
            {level === true && <circle cx={x} cy={bottom ? tip - 5 : tip + 5} r={3.5} fill={LIVE} />}
            {/* Beside the leg, not beyond it: the tip is where wires land, and a number there was
                run through by every lead plugged into that pin. */}
            <FigText
              x={x + 8}
              y={bottom ? CHIP.y + CHIP.h + LEG / 2 + 4 : tip + LEG / 2 + 4}
              size="note"
              anchor="start"
              tone="soft"
            >
              {n}
            </FigText>
          </g>
        );
      })}
      <rect
        x={CHIP.x}
        y={CHIP.y}
        width={CHIP.w}
        height={CHIP.h}
        rx={4}
        fill="var(--fig-device)"
        stroke="var(--fig-device-edge)"
        strokeWidth={STROKE.line}
      />
      {/* The notch, and pin 1's dot: the two marks every pin is counted from. */}
      <path
        d={`M${CHIP.x},${CHIP.y + CHIP.h / 2 - 11} A11,11 0 0 1 ${CHIP.x},${CHIP.y + CHIP.h / 2 + 11}`}
        fill="var(--fig-device-edge)"
      />
      <circle cx={CHIP.x + 9} cy={CHIP.y + CHIP.h - 10} r={4} fill="var(--fig-device-edge)" />
      {!result.powered ? (
        <>
          {[VCC_PIN, GND_PIN].map((n) => {
            const [x, y] = pinTip(n);
            return (
              <circle
                key={n}
                cx={x}
                cy={y}
                r={11}
                fill="none"
                stroke={HUE.warn}
                strokeWidth={STROKE.edge}
                strokeDasharray="4 3"
              />
            );
          })}
          <FigText x={CHIP.x + CHIP.w / 2} y={CHIP.y - 42} size="note" anchor="middle" tone="hue-2">
            connect both supply pins
          </FigText>
        </>
      ) : null}
      <FigText
        x={CHIP.x + CHIP.w / 2}
        y={CHIP.y + CHIP.h / 2 + 5}
        size="label"
        anchor="middle"
        tone="inverse"
        halo={false}
      >
        74HC{chip.slice(2)} · {CHIPS[chip].name}
      </FigText>
      {Array.from({ length: 14 }, (_, i) => i + 1).map((n) => (
        <FigText
          key={`name-${n}`}
          x={pinX(n)}
          y={n <= 7 ? CHIP.y + CHIP.h - 12 : CHIP.y + 20}
          size="note"
          anchor="middle"
          tone="inverse"
          halo={false}
        >
          {pinName(chip, n)}
        </FigText>
      ))}

      {/* ── wires, drawn as jumper leads ──────────────────────────────────── */}
      {wires.map((wire, index) => {
        const [x1, y1] = anchor(wire[0], wire[1]);
        const [x2, y2] = anchor(wire[1], wire[0]);
        const lift = Math.min(60, Math.abs(x2 - x1) * 0.35 + 18);
        const bow = (y1 + y2) / 2 < CHIP.y + CHIP.h / 2 ? -lift : lift;
        return (
          <path
            key={`wire-${index}`}
            d={`M${x1},${y1} C${x1 + (x2 - x1) * 0.25},${y1 + bow} ${x1 + (x2 - x1) * 0.75},${y2 + bow} ${x2},${y2}`}
            fill="none"
            stroke={leadColour(wire)}
            strokeWidth={3}
            strokeLinecap="round"
          />
        );
      })}

      {/* ── the switches and the LED ──────────────────────────────────────── */}
      {(['A', 'B'] as const).map((which) => (
        <g
          key={which}
          role={onSwitch ? 'switch' : undefined}
          aria-checked={inputs[which]}
          aria-label={`Switch ${which}`}
          tabIndex={onSwitch ? 0 : undefined}
          style={{ cursor: onSwitch ? 'pointer' : undefined }}
          onClick={() => onSwitch?.(which)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              onSwitch?.(which);
            }
          }}
        >
          <ToggleSwitch
            x={SWITCH.x}
            y={switchY[which] - SWITCH.h / 2}
            w={SWITCH.w}
            h={SWITCH.h}
            on={inputs[which]}
          />
          <FigText
            x={SWITCH.x + SWITCH.w / 2}
            y={switchY[which] - 18}
            size="label"
            anchor="middle"
            tone="ink"
          >
            {which}
          </FigText>
          <circle cx={SWITCH.x + SWITCH.w + 10} cy={switchY[which]} r={3.5} fill={LEAD[which]} />
        </g>
      ))}
      <circle
        cx={LED.x}
        cy={LED.y}
        r={16}
        fill={result.led === true ? LIVE : alpha(HUE.soft, 15)}
        stroke={result.led === true ? LIVE : alpha(HUE.soft, 55)}
        strokeWidth={STROKE.line}
      />
      {result.led === true && (
        <circle cx={LED.x} cy={LED.y} r={24} fill="none" stroke={alpha(LIVE, 40)} strokeWidth={4} />
      )}
      <circle cx={LED.x - 22} cy={LED.y} r={3.5} fill={LEAD.LED} />
      <FigText x={LED.x} y={LED.y + 38} size="label" anchor="middle" tone="ink">
        LED
      </FigText>
    </Figure>
  );
}
