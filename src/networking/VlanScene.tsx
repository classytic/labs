'use client';

/**
 * One switch drawn as the several switches it is pretending to be.
 *
 * The reading has to be immediate: two tinted regions, each containing some ports and the devices
 * hanging off them, sharing one physical chassis. That picture is the definition. A broadcast fills
 * its own region and visibly stops at the edge of it, and the ports in the other region are marked
 * as never having heard it rather than simply left undrawn.
 *
 * The router appears above only when a layer-3 interface exists, with a leg into each region. It is
 * drawn above the switch on purpose: crossing between VLANs means going UP a layer and back down,
 * and every crossing passes through that one box.
 */

import type { ReactNode } from 'react';
import { Figure, FigText, HUE, STROKE, alpha, tint } from '../kit/figure/index.js';
import { isLive, type VlanState } from './vlan.js';

const W = 680;
const H = 300;

const ROUTER = { w: 128, h: 34, y: 12 };
const CHASSIS = { x: 40, y: 92, w: 600, h: 62 };
const PORT = { w: 40, h: 26, gap: 24, y: 110 };
const DEVICE_Y = 214;
/* Region padding must stay under half the port gap, or the two regions meet in the middle and the
   picture argues against itself: one continuous band where the point is two separate networks. */
const REGION_PAD = 8;

const VLAN_HUE = [HUE[1], HUE[2], HUE[3]];
const hueFor = (state: VlanState, vlan: number): string =>
  VLAN_HUE[
    Math.max(
      0,
      state.vlans.findIndex((item) => item.id === vlan),
    ) % VLAN_HUE.length
  ]!;

const portX = (index: number, count: number): number => {
  const span = count * PORT.w + (count - 1) * PORT.gap;
  return CHASSIS.x + (CHASSIS.w - span) / 2 + index * (PORT.w + PORT.gap);
};

export interface VlanSceneProps {
  state: VlanState;
  /** Port a broadcast or frame was sent from. */
  source?: number;
  reached?: number[];
  blocked?: number[];
  /** Draw the path as going up through the router. */
  viaRouter?: boolean;
  onPortClick?: (portId: number) => void;
  label: string;
}

export function VlanScene({
  state,
  source,
  reached = [],
  blocked = [],
  viaRouter = false,
  onPortClick,
  label,
}: VlanSceneProps): ReactNode {
  const count = state.ports.length;

  // One tinted region per VLAN, spanning the ports that belong to it.
  const regions = state.vlans
    .map((vlan) => {
      const indexes = state.ports
        .map((port, index) => (port.vlan === vlan.id ? index : -1))
        .filter((index) => index >= 0);
      if (!indexes.length) return null;
      const left = portX(Math.min(...indexes), count) - REGION_PAD;
      const right = portX(Math.max(...indexes), count) + PORT.w + REGION_PAD;
      // A region can stretch over empty ports, so centre the verdict on the machines it is about.
      const missedHere = indexes.filter((index) => blocked.includes(state.ports[index]!.id));
      const blockedX = missedHere.length
        ? missedHere.reduce((sum, index) => sum + portX(index, count) + PORT.w / 2, 0) / missedHere.length
        : null;
      return { vlan, left, right, blockedX, ink: hueFor(state, vlan.id) };
    })
    .filter(Boolean) as {
    vlan: { id: number; name: string };
    left: number;
    right: number;
    blockedX: number | null;
    ink: string;
  }[];

  return (
    <Figure viewBox={[W, H]} domain="math" label={label}>
      {/* ── VLAN regions, drawn first so everything sits inside them ────────── */}
      {regions.map((region) => (
        <g key={region.vlan.id}>
          <rect
            x={region.left}
            y={CHASSIS.y - 16}
            width={region.right - region.left}
            height={DEVICE_Y + 52 - (CHASSIS.y - 16)}
            rx={10}
            fill={alpha(region.ink, 8)}
            stroke={alpha(region.ink, 45)}
            strokeWidth={STROKE.hair}
            strokeDasharray="6 4"
          />
        </g>
      ))}

      {/* ── the layer-3 interface, only when it exists ──────────────────────── */}
      {state.routing && (
        <g>
          <rect
            x={W / 2 - ROUTER.w / 2}
            y={ROUTER.y}
            width={ROUTER.w}
            height={ROUTER.h}
            rx={6}
            fill="var(--fig-device)"
            stroke="var(--fig-device-edge)"
            strokeWidth={STROKE.hair}
          />
          <FigText x={W / 2} y={ROUTER.y + 22} size="note" anchor="middle" tone="inverse" halo={false}>
            layer 3 interface
          </FigText>
          {regions.map((region) => {
            const x = (region.left + region.right) / 2;
            return (
              <path
                key={region.vlan.id}
                d={`M${W / 2},${ROUTER.y + ROUTER.h} C${W / 2},${ROUTER.y + ROUTER.h + 30} ${x},${CHASSIS.y - 40} ${x},${CHASSIS.y - 16}`}
                fill="none"
                stroke={viaRouter ? region.ink : alpha(HUE.soft, 40)}
                strokeWidth={viaRouter ? STROKE.bold : STROKE.line}
              />
            );
          })}
        </g>
      )}

      {/* ── region names, AFTER the router so its legs cannot strike through them ─ */}
      {regions.map((region) => (
        <g key={`label-${region.vlan.id}`}>
          {/* Named at the OUTER corner. The router's legs converge on the middle of the figure, so
              a name on the inner side sits exactly where a leg comes down. */}
          <FigText
            x={(region.left + region.right) / 2 < W / 2 ? region.left + 10 : region.right - 10}
            y={CHASSIS.y - 24}
            size="note"
            tone="ink"
            anchor={(region.left + region.right) / 2 < W / 2 ? 'start' : 'end'}
          >
            {region.vlan.name}
          </FigText>
          {/* Said once for the whole region, not once per machine: the port pitch is narrower than
              the phrase, so per-device labels overlapped into each other. The region is also the
              truthful unit, since it is the VLAN that is excluded and not any one device. */}
          {region.blockedX != null && (
            <FigText x={region.blockedX} y={DEVICE_Y + 46} size="note" anchor="middle" tone="hot">
              never hears it
            </FigText>
          )}
        </g>
      ))}

      {/* ── the chassis ─────────────────────────────────────────────────────── */}
      <rect
        x={CHASSIS.x}
        y={CHASSIS.y}
        width={CHASSIS.w}
        height={CHASSIS.h}
        rx={7}
        fill="var(--fig-device)"
        stroke="var(--fig-device-edge)"
        strokeWidth={STROKE.edge}
      />

      {/* ── ports and their devices ─────────────────────────────────────────── */}
      {state.ports.map((port, index) => {
        const x = portX(index, count);
        const ink = hueFor(state, port.vlan);
        const live = isLive(port);
        const isSource = source === port.id;
        const heard = reached.includes(port.id);
        const missed = blocked.includes(port.id);
        return (
          <g
            key={port.id}
            className="network-scene-target"
            data-interactive={Boolean(onPortClick) || undefined}
            role={onPortClick ? 'button' : undefined}
            tabIndex={onPortClick ? 0 : undefined}
            aria-label={`Port ${port.id}, VLAN ${port.vlan}${port.device ? `, ${port.device.name}` : ', empty'}${
              heard ? ', received' : missed ? ', did not receive' : ''
            }`}
            onClick={() => onPortClick?.(port.id)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onPortClick?.(port.id);
              }
            }}
          >
            {/* An empty port is a recess in the face, not a hole: `cavity` on a dark chassis reads
                as a black brick and takes its own number down with it. */}
            <rect
              x={x}
              y={PORT.y}
              width={PORT.w}
              height={PORT.h}
              rx={3}
              fill={live ? tint(ink, 55) : 'var(--fig-device-edge)'}
              stroke={isSource ? HUE.ink : alpha(ink, live ? 60 : 28)}
              strokeWidth={isSource ? STROKE.edge : STROKE.hair}
            />
            <FigText
              x={x + PORT.w / 2}
              y={PORT.y + 18}
              size="note"
              anchor="middle"
              tone={live ? 'ink' : 'inverse'}
              halo={false}
            >
              {port.id}
            </FigText>

            {port.device && (
              <>
                <line
                  x1={x + PORT.w / 2}
                  y1={CHASSIS.y + CHASSIS.h}
                  x2={x + PORT.w / 2}
                  y2={DEVICE_Y}
                  stroke={heard || isSource ? ink : alpha(HUE.soft, 40)}
                  strokeWidth={heard || isSource ? STROKE.bold : STROKE.line}
                />
                <rect
                  x={x + PORT.w / 2 - 24}
                  y={DEVICE_Y}
                  width={48}
                  height={28}
                  rx={4}
                  fill={heard ? alpha(ink, 22) : 'none'}
                  stroke={isSource ? HUE.ink : alpha(ink, 55)}
                  strokeWidth={isSource ? STROKE.edge : STROKE.hair}
                />
                <FigText x={x + PORT.w / 2} y={DEVICE_Y + 18} size="note" anchor="middle" tone="ink">
                  {port.device.name}
                </FigText>
              </>
            )}
          </g>
        );
      })}
    </Figure>
  );
}
