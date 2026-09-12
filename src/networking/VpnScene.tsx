'use client';

/**
 * One watcher's view, over the path that explains why they get that view.
 *
 * The top row is the payoff: the three things anyone watching traffic wants (who, where, what),
 * each either legible or shuttered. Reading a locked block is meant to feel like being stopped,
 * which is the experience the mechanism below is producing.
 *
 * The tunnel is drawn as a sleeve that ENCLOSES the café network and the provider. That containment
 * is the argument: those two are carrying the traffic and still cannot see into it, because the
 * wrapping only comes off at the far end of the sleeve. It also makes the trade visible without a
 * word of commentary, since the gateway is sitting at the end of the sleeve where it does come off.
 */

import type { ReactNode } from 'react';
import { Figure, FigText, HUE, STROKE, alpha, tint } from '../kit/figure/index.js';
import type { Observer, Sighting } from './vpn.js';

const W = 680;
const H = 288;

const CELL = { y: 52, h: 44, gap: 14 };
const NODE = { w: 108, h: 34, y: 186 };
const SLEEVE = { y: 168, h: 74 };
const EYE_Y = 158;

/**
 * The colour states a fact, not a preference: amber means this watcher is reading it, green means
 * they are not. Two arbitrary hues would have made the reader look each cell up; a pair everyone
 * already knows lets the whole row be taken in at once, which is what the four-way comparison in
 * this lab depends on.
 */
const OPEN_INK = HUE.warn;
const LOCKED_INK = HUE.good;

export interface VpnSceneProps {
  sighting: Sighting;
  /** In path order, starting at the learner. The first entry is not a watcher. */
  chain: { id: string; name: string; watcher?: Observer }[];
  /** Index in `chain` where the tunnel ends. Undefined when there is no tunnel. */
  tunnelEndsAt?: number;
  selected: string;
  onSelect?: (id: string) => void;
  label: string;
}

export function VpnScene({
  sighting,
  chain,
  tunnelEndsAt,
  selected,
  onSelect,
  label,
}: VpnSceneProps): ReactNode {
  const cells = [
    { key: 'from', title: 'who is sending', field: sighting.from },
    { key: 'to', title: 'where it is going', field: sighting.to },
    { key: 'contents', title: 'what it says', field: sighting.contents },
  ];
  const cellW = (600 - CELL.gap * 2) / 3;
  const nodeX = (index: number): number => 40 + (600 / chain.length) * (index + 0.5) - NODE.w / 2;

  return (
    <Figure viewBox={[W, H]} domain="math" label={label}>
      <FigText x={40} y={38} size="note" tone="soft">
        {sighting.observer.name} can see
      </FigText>

      {/* ── who / where / what ──────────────────────────────────────────────── */}
      {cells.map((cell, index) => {
        const x = 40 + index * (cellW + CELL.gap);
        const ink = cell.field.hidden ? LOCKED_INK : OPEN_INK;
        return (
          <g key={cell.key}>
            <rect
              x={x}
              y={CELL.y}
              width={cellW}
              height={CELL.h}
              rx={5}
              fill={cell.field.hidden ? tint(ink, 78) : tint(ink, 66)}
              stroke={alpha(ink, cell.field.hidden ? 45 : 80)}
              strokeWidth={STROKE.line}
              strokeDasharray={cell.field.hidden ? '5 3' : undefined}
            />
            {/* A shut padlock, drawn rather than written: the block should read as stopped before
                anybody gets to the word. */}
            {cell.field.hidden && (
              <g>
                <rect x={x + 12} y={CELL.y + 19} width={13} height={11} rx={2} fill={alpha(ink, 85)} />
                <path
                  d={`M${x + 15},${CELL.y + 19} v-4 a3.5,3.5 0 0 1 7,0 v4`}
                  fill="none"
                  stroke={alpha(ink, 85)}
                  strokeWidth={STROKE.line}
                />
              </g>
            )}
            <FigText
              x={x + (cell.field.hidden ? 34 : 12)}
              y={CELL.y + 27}
              size="note"
              tone={cell.field.hidden ? 'soft' : 'ink'}
              halo={false}
            >
              {cell.field.value}
            </FigText>
            <FigText x={x + 12} y={CELL.y + CELL.h + 16} size="note" tone="soft">
              {cell.title}
            </FigText>
          </g>
        );
      })}

      {/* ── the tunnel, enclosing everyone who carries it without seeing in ──── */}
      {tunnelEndsAt != null && (
        <g>
          <rect
            x={nodeX(0) - 10}
            y={SLEEVE.y}
            width={nodeX(tunnelEndsAt) + NODE.w + 10 - (nodeX(0) - 10)}
            height={SLEEVE.h}
            rx={16}
            fill={alpha(LOCKED_INK, 8)}
            stroke={alpha(LOCKED_INK, 55)}
            strokeWidth={STROKE.line}
          />
          <FigText
            x={(nodeX(0) + nodeX(tunnelEndsAt) + NODE.w) / 2}
            y={SLEEVE.y + SLEEVE.h + 15}
            size="note"
            anchor="middle"
            tone="ink"
          >
            encrypted tunnel: the wrapping only comes off at the far end
          </FigText>
        </g>
      )}

      {/* ── the path ────────────────────────────────────────────────────────── */}
      {chain.slice(0, -1).map((node, index) => (
        <line
          key={`wire-${node.id}`}
          x1={nodeX(index) + NODE.w}
          y1={NODE.y + NODE.h / 2}
          x2={nodeX(index + 1)}
          y2={NODE.y + NODE.h / 2}
          stroke={alpha(HUE.soft, 55)}
          strokeWidth={STROKE.line}
        />
      ))}

      {chain.map((node, index) => {
        const x = nodeX(index);
        const active = node.id === selected;
        // Green is spoken for: it means "covered" on the cells and on the sleeve. The origin gets a
        // hue of its own rather than borrowing a meaning it does not have.
        const ink = node.watcher ? (active ? HUE[1] : HUE.soft) : HUE[3];
        return (
          <g
            key={node.id}
            className="network-scene-target"
            data-interactive={(node.watcher && Boolean(onSelect)) || undefined}
            role={node.watcher && onSelect ? 'button' : undefined}
            tabIndex={node.watcher && onSelect ? 0 : undefined}
            aria-label={node.watcher ? `Watch from ${node.name}` : node.name}
            onClick={() => node.watcher && onSelect?.(node.id)}
            onKeyDown={(event) => {
              if (node.watcher && (event.key === 'Enter' || event.key === ' ')) {
                event.preventDefault();
                onSelect?.(node.id);
              }
            }}
          >
            {node.watcher && (
              <g>
                <circle
                  cx={x + NODE.w / 2}
                  cy={EYE_Y}
                  r={8}
                  fill={active ? tint(HUE[1], 55) : 'none'}
                  stroke={active ? HUE[1] : alpha(HUE.soft, 60)}
                  strokeWidth={active ? STROKE.edge : STROKE.hair}
                />
                <circle cx={x + NODE.w / 2} cy={EYE_Y} r={2.6} fill={active ? HUE[1] : alpha(HUE.soft, 70)} />
              </g>
            )}
            <rect
              x={x}
              y={NODE.y}
              width={NODE.w}
              height={NODE.h}
              rx={5}
              fill={tint(ink, active ? 58 : 70)}
              stroke={alpha(ink, active ? 90 : 60)}
              strokeWidth={active ? STROKE.edge : STROKE.hair}
            />
            <FigText x={x + NODE.w / 2} y={NODE.y + 22} size="note" anchor="middle" tone="ink" halo={false}>
              {node.name}
            </FigText>
          </g>
        );
      })}
    </Figure>
  );
}
