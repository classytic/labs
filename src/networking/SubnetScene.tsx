'use client';

/**
 * Two addresses in binary, with the prefix as a line you can move across them.
 *
 * Subnetting is taught in dotted decimal, where the boundary is invisible and the rule has to be
 * memorised. Here it is a vertical line: everything left of it is the network, everything right is
 * the host, and the question "can these two talk directly?" is answered by whether the highlighted
 * halves are identical.
 *
 * The bits where the two addresses differ are marked, because they are what decides everything.
 * Slide the line past the first marked bit and the verdict flips, which turns a rule into something
 * a learner watches happen.
 */

import type { ReactNode } from 'react';
import { Figure, FigText, HUE, STROKE, alpha, tint } from '../kit/figure/index.js';
import type { Bit } from './subnet.js';

const W = 680;
const H = 250;
const LABEL_X = 12;
const BITS_X = 128;
const BIT_W = 15;
const BIT_STEP = 16;
const OCTET_GAP = 6;
const ROW_H = 26;
const ROW_A = 86;
const ROW_B = 140;

const bitX = (index: number): number => BITS_X + index * BIT_STEP + Math.floor(index / 8) * OCTET_GAP;

function BitRow({
  y,
  bits,
  differing,
  label,
}: {
  y: number;
  bits: Bit[];
  differing: number[];
  label: string;
}): ReactNode {
  return (
    <g>
      <FigText x={LABEL_X} y={y + ROW_H / 2 + 5} size="label" tone="ink">
        {label}
      </FigText>
      {bits.map((bit, index) => {
        const x = bitX(index);
        const differs = differing.includes(index);
        return (
          <g key={index}>
            <rect
              x={x}
              y={y}
              width={BIT_W}
              height={ROW_H}
              rx={2}
              fill={bit.network ? tint(HUE[1], 30) : alpha(HUE.soft, 10)}
              stroke={differs ? HUE.danger : alpha(HUE.soft, 30)}
              strokeWidth={differs ? STROKE.line : STROKE.hair}
            />
            <FigText
              x={x + BIT_W / 2}
              y={y + ROW_H / 2 + 4}
              size="note"
              anchor="middle"
              tone={bit.network ? 'ink' : 'soft'}
              halo={false}
            >
              {bit.value}
            </FigText>
          </g>
        );
      })}
    </g>
  );
}

export interface SubnetSceneProps {
  aLabel: string;
  bLabel: string;
  aBits: Bit[];
  bBits: Bit[];
  prefix: number;
  /** Bit indexes where the two addresses differ. */
  differing: number[];
  same: boolean;
  label: string;
}

export function SubnetScene({
  aLabel,
  bLabel,
  aBits,
  bBits,
  prefix,
  differing,
  same,
  label,
}: SubnetSceneProps): ReactNode {
  // The boundary sits just before the first host bit, or past the last bit at /32.
  const lineX = prefix >= 32 ? bitX(31) + BIT_W + 3 : bitX(prefix) - 3;
  const first = differing.length ? differing[0]! : -1;

  return (
    <Figure viewBox={[W, H]} domain="math" label={label}>
      <FigText x={BITS_X} y={30} size="note" tone="soft">
        network
      </FigText>
      <FigText x={Math.min(W - 40, lineX + 10)} y={30} size="note" tone="soft">
        host
      </FigText>

      {/* the prefix boundary */}
      <line x1={lineX} y1={38} x2={lineX} y2={ROW_B + ROW_H + 10} stroke={HUE[1]} strokeWidth={STROKE.bold} />
      <FigText x={lineX} y={52} size="label" anchor="middle" tone="hue-1">
        /{prefix}
      </FigText>

      <BitRow y={ROW_A} bits={aBits} differing={differing} label={aLabel} />
      <BitRow y={ROW_B} bits={bBits} differing={differing} label={bLabel} />

      {/* the bit that decides it */}
      {first >= 0 && (
        <>
          <path
            d={`M${bitX(first) + BIT_W / 2},${ROW_B + ROW_H + 6} l0,14`}
            stroke={HUE.danger}
            strokeWidth={STROKE.line}
          />
          <FigText
            x={Math.min(W - 90, bitX(first) + BIT_W / 2)}
            y={ROW_B + ROW_H + 34}
            size="note"
            anchor="middle"
            tone="hot"
          >
            first bit that differs
          </FigText>
        </>
      )}

      <FigText x={W / 2} y={H - 14} size="label" anchor="middle" tone={same ? 'good' : 'hot'}>
        {same
          ? 'the network halves match, so these two can talk directly'
          : 'the network halves differ, so everything between them goes through a router'}
      </FigText>
    </Figure>
  );
}
