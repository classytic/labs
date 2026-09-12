'use client';

/**
 * An eight-port switch, drawn so the hardware is recognisable and the STATE is readable.
 *
 * Two things had to be true at once. A student who has seen a switch in a rack should recognise
 * this as one, because that recognition is what makes the abstraction stick. A student who has not
 * should read link, traffic and administrative state at a glance, which a photograph cannot deliver.
 *
 * A first version drew the chassis as a pale tinted rectangle and every device as the same grey
 * box. It looked like a diagram of a switch rather than a switch, and the four devices were
 * distinguishable only by reading them. So: the body is dark with a recessed port panel and a
 * power light, and each device has its own silhouette. Colour still carries meaning only, which is
 * why the shape work is done in neutrals and the hues are spent on the frame's path.
 */

import type { ReactNode } from 'react';
import { Figure, FigText, HUE, STROKE, alpha, shade, tint } from '../kit/figure/index.js';
import { linkUp, type SwitchPort, type SwitchState } from './switch.js';

const W = 680;
const H = 250;

const CHASSIS = { x: 30, y: 26, w: 620, h: 90 };
const PANEL = { inset: 10, top: 32, h: 64 };
const PORT = { w: 46, h: 38, gap: 18, y: 40 };
// Device width must stay BELOW the port pitch (46 + 18 = 64) or neighbours overlap, which is
// exactly what the first render showed.
const DEVICE = { y: 172, h: 46, w: 56 };

/**
 * The chassis uses the HARDWARE neutrals, which nudge between themes instead of inverting.
 *
 * The rest of the figure palette derives from --stage-fg / --stage-bg and flips, which is right for
 * a diagram and wrong for an object: an earlier version used `tint(HUE.ink, 84)` and the switch
 * turned white in dark mode along with the inside of all eight jacks. These four give a depth
 * ladder instead, lightest shield through to darkest hole, and hold it in both themes.
 */
const SHIELD = 'var(--fig-device-soft)';
const BODY = 'var(--fig-device)';
const PANEL_FILL = 'var(--fig-device-edge)';
const CAVITY = 'var(--fig-cavity)';

const portX = (index: number, count: number): number => {
  const span = count * PORT.w + (count - 1) * PORT.gap;
  return CHASSIS.x + (CHASSIS.w - span) / 2 + index * (PORT.w + PORT.gap);
};

/** One RJ45 jack: shielded body, dark cavity, latch slot cut from the bottom, gold contacts. */
function Jack({
  x,
  live,
  active,
  down,
}: {
  x: number;
  live: boolean;
  active: boolean;
  down: boolean;
}): ReactNode {
  const { w, h, y } = PORT;
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={3}
        fill={down ? alpha(SHIELD, 45) : SHIELD}
        stroke={PANEL_FILL}
        strokeWidth={STROKE.hair}
      />
      <path
        d={`M${x + 5},${y + 5} H${x + w - 5} V${y + h - 9} H${x + w / 2 + 7} V${y + h - 4}
            H${x + w / 2 - 7} V${y + h - 9} H${x + 5} Z`}
        fill={CAVITY}
      />
      {Array.from({ length: 8 }, (_, pin) => (
        <line
          key={pin}
          x1={x + 9 + pin * 3.6}
          y1={y + 8}
          x2={x + 9 + pin * 3.6}
          y2={y + 16}
          stroke={down ? alpha(HUE.warn, 30) : HUE.warn}
          strokeWidth={STROKE.hair}
        />
      ))}
      {active && (
        <rect
          x={x - 3}
          y={y - 3}
          width={w + 6}
          height={h + 6}
          rx={5}
          fill="none"
          stroke={HUE[1]}
          strokeWidth={STROKE.edge}
        />
      )}
      <circle
        cx={x + w / 2}
        cy={y + h + 10}
        r={4}
        fill={live ? HUE.good : alpha(SHIELD, 30)}
        stroke={live ? HUE.good : alpha(SHIELD, 40)}
        strokeWidth={STROKE.hair}
      />
      {live && <circle cx={x + w / 2} cy={y + h + 10} r={8} fill={alpha(HUE.good, 22)} />}
    </g>
  );
}

/**
 * Device silhouettes. Each is ~46 wide and drawn in neutrals so the hue stays free to mean
 * "the frame went this way". Recognising a printer at a glance is the whole point of drawing one.
 */
function DeviceGlyph({ kind, x, y, tone }: { kind: string; x: number; y: number; tone: string }): ReactNode {
  const stroke = { stroke: tone, strokeWidth: STROKE.line, fill: 'none' } as const;
  const solid = { fill: alpha(tone, 16), stroke: tone, strokeWidth: STROKE.line } as const;
  switch (kind) {
    case 'Laptop':
      return (
        <g>
          <rect x={x - 13} y={y - 12} width={26} height={17} rx={2} {...solid} />
          <path d={`M${x - 19},${y + 8} H${x + 19} L${x + 15},${y + 5} H${x - 15} Z`} {...solid} />
        </g>
      );
    case 'Desktop':
      return (
        <g>
          <rect x={x - 9} y={y - 13} width={18} height={26} rx={2} {...solid} />
          <line x1={x - 5} y1={y - 8} x2={x + 5} y2={y - 8} {...stroke} />
          <line x1={x - 5} y1={y - 4} x2={x + 5} y2={y - 4} {...stroke} />
          <circle cx={x} cy={y + 7} r={2.5} {...stroke} />
        </g>
      );
    case 'Printer':
      return (
        <g>
          <rect x={x - 10} y={y - 13} width={20} height={8} rx={1} {...stroke} />
          <rect x={x - 15} y={y - 5} width={30} height={13} rx={2} {...solid} />
          <rect x={x - 8} y={y + 8} width={16} height={6} rx={1} {...stroke} />
        </g>
      );
    default:
      // Server: a short rack of units with drive lights.
      return (
        <g>
          {[0, 1, 2].map((row) => (
            <g key={row}>
              <rect x={x - 15} y={y - 13 + row * 9} width={30} height={8} rx={1.5} {...solid} />
              <circle cx={x + 10} cy={y - 9 + row * 9} r={1.6} fill={tone} />
            </g>
          ))}
        </g>
      );
  }
}

export interface SwitchSceneProps {
  state: SwitchState;
  ingress?: number;
  delivered?: number[];
  flooded?: boolean;
  onTogglePort?: (portId: number) => void;
  label: string;
}

export function SwitchScene({
  state,
  ingress,
  delivered = [],
  flooded = false,
  onTogglePort,
  label,
}: SwitchSceneProps): ReactNode {
  const count = state.ports.length;
  const pathColor = flooded ? HUE.warn : HUE[1];

  return (
    <Figure viewBox={[W, H]} domain="math" label={label}>
      {/* ── chassis: dark body, recessed port panel, power light ────────────── */}
      <rect
        x={CHASSIS.x}
        y={CHASSIS.y}
        width={CHASSIS.w}
        height={CHASSIS.h}
        rx={9}
        fill={BODY}
        stroke={PANEL_FILL}
        strokeWidth={STROKE.edge}
      />
      <rect
        x={CHASSIS.x + 4}
        y={CHASSIS.y + 3}
        width={CHASSIS.w - 8}
        height={9}
        rx={4}
        fill="var(--fig-sheen)"
        opacity={0.28}
      />
      <rect
        x={CHASSIS.x + PANEL.inset}
        y={PANEL.top}
        width={CHASSIS.w - PANEL.inset * 2}
        height={PANEL.h}
        rx={5}
        fill={PANEL_FILL}
      />
      <circle cx={CHASSIS.x + CHASSIS.w - 16} cy={CHASSIS.y + 14} r={3.2} fill={HUE.good} />

      {/* ── patch cables and devices ────────────────────────────────────────── */}
      {state.ports.map((port, index) => {
        if (!port.device) return null;
        const x = portX(index, count) + PORT.w / 2;
        const carrying = ingress === port.id || delivered.includes(port.id);
        const tone = carrying ? pathColor : HUE.soft;
        const top = CHASSIS.y + CHASSIS.h;
        return (
          <g key={`cable-${port.id}`}>
            {/* the boot where the cable meets the chassis */}
            <rect x={x - 5} y={top - 2} width={10} height={9} rx={2} fill={carrying ? pathColor : HUE.soft} />
            <path
              d={`M${x},${top + 7} C${x},${top + 34} ${x},${DEVICE.y - 30} ${x},${DEVICE.y - 4}`}
              fill="none"
              stroke={carrying ? pathColor : linkUp(port) ? alpha(HUE.soft, 60) : alpha(HUE.soft, 24)}
              strokeWidth={carrying ? STROKE.bold : STROKE.edge}
              strokeLinecap="round"
              strokeDasharray={linkUp(port) ? undefined : '4 5'}
            />
            <DeviceGlyph kind={port.device.name} x={x} y={DEVICE.y + 16} tone={tone} />
            <FigText x={x} y={DEVICE.y + 46} size="label" anchor="middle" tone={carrying ? 'hue-1' : 'ink'}>
              {port.device.name}
            </FigText>
            <FigText x={x} y={DEVICE.y + 62} size="note" anchor="middle" tone="soft">
              {port.device.mac}
            </FigText>
          </g>
        );
      })}

      {/* ── jacks last, so their outlines sit above the panel ───────────────── */}
      {state.ports.map((port, index) => {
        const x = portX(index, count);
        return (
          <g
            key={`port-${port.id}`}
            className="network-scene-target"
            data-interactive={Boolean(onTogglePort) || undefined}
            role={onTogglePort ? 'button' : undefined}
            tabIndex={onTogglePort ? 0 : undefined}
            aria-label={`Port ${port.id}, ${port.enabled ? 'enabled' : 'disabled'}, ${
              port.device ? `connected to ${port.device.name}` : 'nothing plugged in'
            }`}
            onClick={() => onTogglePort?.(port.id)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onTogglePort?.(port.id);
              }
            }}
          >
            <Jack
              x={x}
              live={linkUp(port)}
              active={ingress === port.id || delivered.includes(port.id)}
              down={!port.enabled}
            />
            {/* Numbers sit ABOVE the chassis, on the page rather than on the dark body. That keeps
                them on the palette so they adapt with the theme, while the chassis does not. */}
            <FigText
              x={x + PORT.w / 2}
              y={CHASSIS.y - 8}
              size="note"
              anchor="middle"
              tone={port.enabled ? 'ink' : 'hot'}
            >
              {port.id}
            </FigText>
            {/* A disabled port is struck through, which reads faster than a word */}
            {!port.enabled && (
              <line
                x1={x + 4}
                y1={PORT.y + PORT.h - 4}
                x2={x + PORT.w - 4}
                y2={PORT.y + 4}
                stroke={HUE.danger}
                strokeWidth={STROKE.edge}
                strokeLinecap="round"
              />
            )}
          </g>
        );
      })}
    </Figure>
  );
}
