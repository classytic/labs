'use client';

/**
 * Two claims in one picture, sharing a colour key so they reinforce instead of competing.
 *
 * ABOVE: the frame as it sits on the wire, drawn to scale. Widths are byte counts, so a bulk
 * transfer shows a wall of payload with a sliver of addressing, and a single keystroke shows the
 * opposite. Nobody has to be told that small packets are wasteful once they have seen the message
 * disappear next to its own headers.
 *
 * BELOW: the same journey across the wires. A device is filled with the colour of the deepest
 * header it opens, so the strip above is its legend: a switch is Ethernet-coloured because that is
 * as far as it ever reads, and a router is IP-coloured because it opens exactly one more.
 *
 * The MAC pair is written over each segment and changes every time. The IP pair is written ONCE,
 * under a bracket spanning the entire path, because it is set by the sender and arrives unedited.
 * The two rows are doing the arguing; the caption only has to name what is already visible.
 */

import type { ReactNode } from 'react';
import { Figure, FigText, HUE, STROKE, alpha, tint } from '../kit/figure/index.js';
import {
  HEADERS,
  opensTo,
  type Encapsulation,
  type LayerKind,
  type PathNode,
  type WireFrame,
} from './encapsulation.js';

const W = 680;
const H = 292;

const STRIP = { x: 40, y: 46, w: 600, h: 34 };
const NODE = { w: 84, h: 34, y: 166 };
const MAC_Y = 150;
const IP_Y = 248;

/** The colour of a layer is the colour of anything that works at that layer. */
const LAYER_INK: Record<LayerKind, string> = {
  'data-link': HUE[3],
  network: HUE[2],
  transport: HUE[1],
  application: HUE.good,
};
const PAYLOAD_INK = HUE.good;

/**
 * Named with the SAME words as the blocks in the strip above, so the shared colour is readable as a
 * statement rather than left as a puzzle: this box is Ethernet-coloured because Ethernet is all it
 * ever reads. Kept short because the caption must fit inside the node pitch, and "opens to the
 * application layer" is both jargon and wide enough to run over its neighbours.
 */
const READS: Record<LayerKind, string> = {
  'data-link': 'reads Ethernet',
  network: 'reads IPv4',
  transport: 'reads TCP',
  application: 'reads the message',
};

export interface EncapSceneProps {
  frame: Encapsulation;
  path: PathNode[];
  frames: WireFrame[];
  /** Which wire is being looked at. Undefined shows the whole journey at rest. */
  activeSegment?: number;
  label: string;
}

export function EncapScene({ frame, path, frames, activeSegment, label }: EncapSceneProps): ReactNode {
  // Blocks in wire order: leading headers outermost first, payload, then Ethernet's trailer.
  const leading = [...frame.headers]
    .reverse()
    .map((header) => ({
      key: header.protocol,
      kind: header.kind,
      bytes: header.bytes - (header.trailerBytes ?? 0),
      text: header.protocol,
    }))
    .filter((block) => block.bytes > 0);
  const trailing = frame.headers
    .filter((header) => header.trailerBytes)
    .map((header) => ({
      key: `${header.protocol}-fcs`,
      kind: header.kind,
      bytes: header.trailerBytes!,
      text: 'FCS',
    }));
  const blocks = [
    ...leading,
    { key: 'payload', kind: null as LayerKind | null, bytes: frame.payloadBytes, text: 'your message' },
    ...trailing,
  ];

  const total = Math.max(1, frame.onWireBytes);
  let cursor = STRIP.x;
  const drawn = blocks.map((block) => {
    const width = (block.bytes / total) * STRIP.w;
    const x = cursor;
    cursor += width;
    return { ...block, x, width, ink: block.kind ? LAYER_INK[block.kind] : PAYLOAD_INK };
  });

  const nodeX = (index: number): number => STRIP.x + (STRIP.w / path.length) * (index + 0.5) - NODE.w / 2;

  return (
    <Figure viewBox={[W, H]} domain="math" label={label}>
      {/* ── the frame on the wire, to scale ─────────────────────────────────── */}
      <FigText x={STRIP.x} y={STRIP.y - 14} size="note" tone="soft">
        on the wire
      </FigText>
      <FigText x={STRIP.x + STRIP.w} y={STRIP.y - 14} size="note" anchor="end" tone="ink">
        {frame.onWireBytes} bytes to carry {frame.payloadBytes}
      </FigText>
      {drawn.map((block) => (
        <g key={block.key}>
          <rect
            x={block.x}
            y={STRIP.y}
            width={Math.max(1, block.width)}
            height={STRIP.h}
            fill={tint(block.ink, block.kind ? 62 : 45)}
            stroke={alpha(block.ink, 70)}
            strokeWidth={STROKE.hair}
          />
          {/* A sliver cannot hold a label, and that silence is the honest reading: at one byte the
              message really is too small to write on. The byte counts below carry the numbers. */}
          {block.width > 46 && (
            <FigText
              x={block.x + block.width / 2}
              y={STRIP.y + 22}
              size="note"
              anchor="middle"
              tone="ink"
              halo={false}
            >
              {block.text}
            </FigText>
          )}
          {block.width > 26 && (
            <FigText
              x={block.x + block.width / 2}
              y={STRIP.y + STRIP.h + 16}
              size="note"
              anchor="middle"
              tone="soft"
            >
              {block.bytes}
            </FigText>
          )}
        </g>
      ))}

      {/* ── the journey ─────────────────────────────────────────────────────── */}
      {path.slice(0, -1).map((node, index) => {
        const from = nodeX(index) + NODE.w;
        const to = nodeX(index + 1);
        return (
          <line
            key={`wire-${node.id}`}
            x1={from}
            y1={NODE.y + NODE.h / 2}
            x2={to}
            y2={NODE.y + NODE.h / 2}
            stroke={alpha(HUE.soft, 55)}
            strokeWidth={STROKE.line}
          />
        );
      })}

      {frames.map((wire, index) => {
        const fromIndex = path.indexOf(wire.segment.from);
        const toIndex = path.indexOf(wire.segment.to);
        const left = nodeX(fromIndex) + NODE.w / 2;
        const right = nodeX(toIndex) + NODE.w / 2;
        const active = activeSegment === index;
        return (
          <g key={`seg-${index}`}>
            {/* The span of one frame's life: it is built at one end and thrown away at the other. */}
            <line
              x1={left}
              y1={MAC_Y + 6}
              x2={right}
              y2={MAC_Y + 6}
              stroke={active ? LAYER_INK['data-link'] : alpha(LAYER_INK['data-link'], 35)}
              strokeWidth={active ? STROKE.bold : STROKE.line}
            />
            <FigText
              x={(left + right) / 2}
              y={MAC_Y - 4}
              size="note"
              anchor="middle"
              tone={active ? 'ink' : 'soft'}
            >
              {wire.mac.from} → {wire.mac.to}
            </FigText>
          </g>
        );
      })}

      {path.map((node, index) => {
        const x = nodeX(index);
        const ink = LAYER_INK[opensTo(node.kind)];
        return (
          <g key={node.id}>
            <rect
              x={x}
              y={NODE.y}
              width={NODE.w}
              height={NODE.h}
              rx={5}
              fill={tint(ink, 66)}
              stroke={alpha(ink, 75)}
              strokeWidth={STROKE.line}
            />
            <FigText x={x + NODE.w / 2} y={NODE.y + 22} size="note" anchor="middle" tone="ink" halo={false}>
              {node.name}
            </FigText>
            <FigText x={x + NODE.w / 2} y={NODE.y + NODE.h + 16} size="note" anchor="middle" tone="soft">
              {READS[opensTo(node.kind)]}
            </FigText>
          </g>
        );
      })}

      {/* ── one IP pair, spanning everything ─────────────────────────────────── */}
      {path[0]?.ip && path[path.length - 1]?.ip && (
        <g>
          <path
            d={`M${nodeX(0) + NODE.w / 2},${IP_Y - 10} L${nodeX(0) + NODE.w / 2},${IP_Y} L${nodeX(path.length - 1) + NODE.w / 2},${IP_Y} L${nodeX(path.length - 1) + NODE.w / 2},${IP_Y - 10}`}
            fill="none"
            stroke={LAYER_INK.network}
            strokeWidth={STROKE.line}
          />
          <FigText x={W / 2} y={IP_Y + 20} size="note" anchor="middle" tone="ink">
            {path[0]!.ip} → {path[path.length - 1]!.ip}, unchanged the whole way
          </FigText>
        </g>
      )}
    </Figure>
  );
}

export const LAYER_COLOURS = LAYER_INK;
export const HEADER_ORDER = HEADERS;
