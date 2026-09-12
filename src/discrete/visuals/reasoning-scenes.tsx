'use client';

import type { ReactNode } from 'react';
import { Figure, FigText, HUE, Particle, STROKE, tint } from '../../kit/figure/index.js';

export function DominoInductionScene({
  first,
  last,
  reached,
  base,
  bridge,
}: {
  first: number;
  last: number;
  reached: ReadonlySet<number>;
  base: boolean;
  bridge: boolean;
}): ReactNode {
  const values = Array.from({ length: last - first + 1 }, (_, index) => first + index);
  const gap = 74;
  const startX = 50;
  const width = Math.max(620, startX * 2 + (values.length - 1) * gap + 50);
  return (
    <Figure
      viewBox={`0 0 ${width} 210`}
      domain="math"
      className="reasoning-figure"
      label={`${values.length} induction dominoes; base case ${base ? 'established' : 'missing'}; inductive bridge ${bridge ? 'established' : 'missing'}; ${reached.size} cases reached`}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <marker id="induction-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
          <path d="M 0 0 L 8 4 L 0 8 Z" fill={bridge ? HUE.good : HUE.soft} />
        </marker>
      </defs>
      <FigText x={startX} y={36} size="note" tone={base ? 'good' : 'soft'}>
        {base ? 'ANCHOR PROVED' : 'START HERE'}
      </FigText>
      <FigText x={width - 50} y={36} anchor="end" size="note" tone={bridge ? 'good' : 'soft'}>
        {bridge ? 'RULE CONNECTED' : 'BRIDGE REQUIRED'}
      </FigText>
      {values.slice(0, -1).map((value, index) => (
        <path
          key={`link-${value}`}
          d={`M ${startX + index * gap + 45} 112 H ${startX + (index + 1) * gap - 8}`}
          fill="none"
          stroke={bridge ? HUE.good : HUE.soft}
          strokeWidth={STROKE.edge}
          strokeDasharray={bridge ? undefined : '6 6'}
          markerEnd="url(#induction-arrow)"
        />
      ))}
      {values.map((value, index) => {
        const active = reached.has(value);
        const x = startX + index * gap;
        return (
          <g key={value}>
            <circle
              cx={x + 24}
              cy={112}
              r={24}
              fill={active ? tint(HUE.good, 18) : tint(HUE.soft, 12)}
              stroke={active ? HUE.good : HUE.soft}
              strokeWidth={active ? STROKE.bold : STROKE.edge}
            />
            <FigText
              x={x + 24}
              y={112}
              anchor="middle"
              baseline="middle"
              tone={active ? 'good' : 'soft'}
              halo={false}
            >
              P({value})
            </FigText>
            <FigText x={x + 24} y={156} anchor="middle" size="note" tone={active ? 'good' : 'soft'}>
              {active ? 'justified' : value === first ? 'base' : 'waiting'}
            </FigText>
          </g>
        );
      })}
      <FigText x={width / 2} y={192} anchor="middle" tone="soft">
        Base case starts the chain; the inductive step carries truth from k to k + 1.
      </FigText>
    </Figure>
  );
}

export function PigeonholePackingScene({
  occupancy,
  target,
  labels,
}: {
  occupancy: readonly number[];
  target: number;
  labels?: readonly string[];
}): ReactNode {
  const columns = occupancy.length;
  const boxW = 112;
  const gap = 18;
  const width = Math.max(560, 48 + columns * (boxW + gap));
  const least = Math.min(...occupancy);
  return (
    <Figure
      viewBox={`0 0 ${width} 220`}
      domain="math"
      className="reasoning-figure"
      label={`${occupancy.reduce((a, b) => a + b, 0)} items spread across ${columns} categories; target occupancy ${target}`}
      preserveAspectRatio="xMidYMid meet"
    >
      <FigText x={width / 2} y={28} anchor="middle" size="title">
        Spread evenly until one category must overflow
      </FigText>
      {occupancy.map((count, index) => {
        const x = 28 + index * (boxW + gap);
        const forced = count >= target;
        const next = count === least && !occupancy.some((value) => value >= target);
        return (
          <g key={index}>
            <rect
              x={x}
              y={68}
              width={boxW}
              height={112}
              rx={14}
              fill={forced ? tint(HUE.good, 13) : next ? tint(HUE[1], 10) : tint(HUE.soft, 8)}
              stroke={forced ? HUE.good : next ? HUE[1] : HUE.soft}
              strokeWidth={STROKE.edge}
            />
            <FigText x={x + 12} y={90} size="note" tone={forced ? 'good' : 'soft'}>
              {labels?.[index] ?? `category ${index + 1}`}
            </FigText>
            {Array.from({ length: count }, (_, item) => (
              <Particle
                key={item}
                x={x + 24 + (item % 4) * 22}
                y={154 - Math.floor(item / 4) * 24}
                r={7}
                color={forced ? HUE.good : HUE[1]}
              />
            ))}
            <FigText x={x + boxW - 12} y={90} anchor="end" size="measure" tone={forced ? 'good' : 'ink'}>
              {count}/{target}
            </FigText>
            {next ? (
              <FigText x={x + boxW / 2} y={204} anchor="middle" size="note" tone="hue-1">
                next emptiest
              </FigText>
            ) : null}
          </g>
        );
      })}
    </Figure>
  );
}

export function RecurrenceDependencyScene({
  terms,
  revealed,
  active,
  dependencies,
}: {
  terms: readonly number[];
  revealed: number;
  active: number;
  dependencies: ReadonlySet<number>;
}): ReactNode {
  const cellW = 68;
  const gap = 16;
  const width = Math.max(620, 52 + terms.length * (cellW + gap));
  return (
    <Figure
      viewBox={`0 0 ${width} 220`}
      domain="math"
      className="reasoning-figure"
      label={`${revealed} of ${terms.length} recurrence terms known; term ${active} depends on ${[...dependencies].join(' and ')}`}
      preserveAspectRatio="xMidYMid meet"
    >
      {dependencies.has(active - 1) && dependencies.has(active - 2) ? (
        <path
          d={`M ${46 + (active - 2) * (cellW + gap) + cellW / 2} 104 Q ${46 + active * (cellW + gap)} 24 ${46 + active * (cellW + gap) + cellW / 2} 76 M ${46 + (active - 1) * (cellW + gap) + cellW / 2} 104 Q ${46 + active * (cellW + gap)} 48 ${46 + active * (cellW + gap) + cellW / 2} 76`}
          fill="none"
          stroke={HUE.good}
          strokeWidth={STROKE.edge}
        />
      ) : null}
      {terms.map((term, index) => {
        const x = 46 + index * (cellW + gap);
        const known = index < revealed;
        const source = dependencies.has(index);
        return (
          <g key={index}>
            <rect
              x={x}
              y={76}
              width={cellW}
              height={76}
              rx={12}
              fill={
                source
                  ? tint(HUE.good, 16)
                  : index === active
                    ? tint(HUE[1], 16)
                    : known
                      ? tint(HUE[1], 8)
                      : tint(HUE.soft, 7)
              }
              stroke={source ? HUE.good : index === active ? HUE[1] : HUE.soft}
              strokeWidth={index === active ? STROKE.bold : STROKE.edge}
              strokeDasharray={!known && index !== active ? '5 5' : undefined}
            />
            <FigText
              x={x + cellW / 2}
              y={98}
              anchor="middle"
              size="note"
              tone={source ? 'good' : index === active ? 'hue-1' : 'soft'}
              halo={false}
            >
              a{index}
            </FigText>
            <FigText
              x={x + cellW / 2}
              y={126}
              anchor="middle"
              baseline="middle"
              size="measure"
              tone={source ? 'good' : index === active ? 'hue-1' : known ? 'ink' : 'soft'}
              halo={false}
            >
              {known ? term : '?'}
            </FigText>
          </g>
        );
      })}
      <FigText x={width / 2} y={188} anchor="middle" tone="soft">
        Green terms are the inputs; the outlined term is the result being built.
      </FigText>
    </Figure>
  );
}
