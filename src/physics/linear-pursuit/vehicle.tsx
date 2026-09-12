import type { ReactNode } from 'react';
import { FigText, HUE, STROKE, shade } from '../../kit/figure/index.js';

export type VehicleKind = 'car' | 'bus' | 'train';

export function LinearVehicle({
  x,
  y,
  kind,
  color,
  label,
}: {
  x: number;
  y: number;
  kind: VehicleKind;
  color: string;
  label: ReactNode;
}): ReactNode {
  const width = kind === 'train' ? 94 : kind === 'bus' ? 76 : 58;
  const height = kind === 'car' ? 26 : 34;
  const left = x - width / 2;
  const top = y - height;
  return (
    <g>
      <ellipse cx={x} cy={y + 7} rx={width * 0.55} ry={5} fill={HUE.soft} opacity={0.18} />
      <path
        d={
          kind === 'car'
            ? `M ${left} ${y - 4} L ${left + 9} ${top + 9} Q ${left + 15} ${top} ${left + 28} ${top} H ${left + 41} Q ${left + 49} ${top + 5} ${left + 55} ${y - 4} V ${y} H ${left} Z`
            : `M ${left + 5} ${top} H ${left + width - 8} Q ${left + width} ${top} ${left + width} ${top + 8} V ${y} H ${left} V ${top + 6} Q ${left} ${top} ${left + 5} ${top} Z`
        }
        fill={color}
        stroke={shade(color)}
        strokeWidth={STROKE.line}
      />
      {kind !== 'car' &&
        [0.2, 0.4, 0.6, 0.8].map((p) => (
          <rect
            key={p}
            x={left + width * p - 6}
            y={top + 7}
            width={12}
            height={9}
            rx={2}
            fill="var(--fig-paper)"
            opacity={0.8}
          />
        ))}
      {kind === 'car' ? (
        <path
          d={`M ${left + 16} ${top + 8} H ${left + 39} L ${left + 45} ${y - 7} H ${left + 10} Z`}
          fill="var(--fig-paper)"
          opacity={0.78}
        />
      ) : null}
      {[left + 14, left + width - 15].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy={y} r={7} fill="var(--fig-ink)" />
          <circle cx={cx} cy={y} r={3} fill="var(--fig-paper)" />
        </g>
      ))}
      <FigText x={x} y={top - 10} anchor="middle" size="label">
        {label}
      </FigText>
    </g>
  );
}
