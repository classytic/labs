import { Badge } from '@/components/ui/badge';
import type { ReactNode } from 'react';
import { Tag } from '../../kit/electronics/index.js';
import { inBox, type Carrier, type Box } from '../../kit/carrier-engine.js';

export const W = 560;

// device-physics colours (tokens + oklch fallback; electron = blue, hole = red)
export const ELEC = 'var(--stage-semi-n, oklch(0.62 0.18 250))';
export const HOLE = 'var(--stage-semi-p, oklch(0.6 0.19 25))';
export const N_FILL = 'color-mix(in oklab, var(--stage-semi-n, oklch(0.62 0.18 250)) 18%, var(--stage-bg))';
export const P_FILL = 'color-mix(in oklab, var(--stage-semi-p, oklch(0.6 0.19 25)) 12%, var(--stage-bg))';
export const METAL = 'var(--stage-metal)';
export const OXIDE = 'color-mix(in oklab, var(--stage-metal) 28%, var(--stage-bg))';
export const MUTED = 'var(--stage-muted)';

export interface DeviceMetric {
  label: ReactNode;
  value: ReactNode;
}

/**
 * Compact evidence panel shared by semiconductor labs. Color belongs to the
 * device diagram; the surrounding UI stays neutral and scan-friendly.
 */
export function DeviceEvidence({
  state,
  active,
  metrics,
  explanation,
}: {
  state: ReactNode;
  active: boolean;
  metrics: DeviceMetric[];
  explanation: ReactNode;
}): ReactNode {
  return (
    <section className="semiconductor-evidence" aria-label="Device evidence">
      <Badge variant={active ? 'secondary' : 'outline'} className="semiconductor-state">
        <span className="semiconductor-state-dot" data-active={active || undefined} aria-hidden="true" />
        {state}
      </Badge>
      <dl className="semiconductor-metrics">
        {metrics.map((metric, index) => (
          <div key={index}>
            <dt>{metric.label}</dt>
            <dd>{metric.value}</dd>
          </div>
        ))}
      </dl>
      <p className="semiconductor-explanation">{explanation}</p>
    </section>
  );
}

// deterministic scatter: integer-only hash (no Math.sin/Math.random) so it is
// bit-identical on the server and client and never trips a hydration mismatch.
export const hash = (i: number, s: number): number => {
  let x = (Math.imul(i + 1, 73856093) ^ Math.imul(s + 1, 19349663)) >>> 0;
  x ^= x >>> 13;
  x = Math.imul(x, 1274126177) >>> 0;
  x ^= x >>> 16;
  return (x % 100000) / 100000;
};

// Carriers render on the integer pixel grid (snap like a sprite): clean DOM numbers,
// and bit-identical on server + client regardless of float rounding.
export const px = (n: number): number => Math.round(n);

function Electron({ x, y, o = 1 }: { x: number; y: number; o?: number }): ReactNode {
  const cx = px(x),
    cy = px(y);
  return (
    <g className="electronics-svg-passive" opacity={o}>
      <circle cx={cx} cy={cy} r={4.5} fill={ELEC} />
      <line
        x1={cx - 2}
        y1={cy}
        x2={cx + 2}
        y2={cy}
        stroke="var(--stage-bg)"
        strokeWidth={1.4}
        strokeLinecap="round"
      />
    </g>
  );
}
function Hole({ x, y, o = 1 }: { x: number; y: number; o?: number }): ReactNode {
  const cx = px(x),
    cy = px(y);
  return (
    <g className="electronics-svg-passive" opacity={o}>
      <circle cx={cx} cy={cy} r={4.5} fill="none" stroke={HOLE} strokeWidth={1.6} />
      <line x1={cx - 2} y1={cy} x2={cx + 2} y2={cy} stroke={HOLE} strokeWidth={1.4} strokeLinecap="round" />
      <line x1={cx} y1={cy - 2} x2={cx} y2={cy + 2} stroke={HOLE} strokeWidth={1.4} strokeLinecap="round" />
    </g>
  );
}

/** A fixed (immobile) ionised dopant core. */
export function Ion({ x, y, sign }: { x: number; y: number; sign: '+' | '−' }): ReactNode {
  const col = sign === '+' ? ELEC : HOLE;
  const cx = px(x),
    cy = px(y);
  return (
    <g className="electronics-svg-passive">
      <circle cx={cx} cy={cy} r={6} fill="none" stroke={col} strokeWidth={1} strokeDasharray="2 1.5" />
      <text
        x={cx}
        y={cy}
        fill={col}
        fontSize={9}
        fontWeight={700}
        textAnchor="middle"
        dominantBaseline="central"
      >
        {sign}
      </text>
    </g>
  );
}

/** a spread spawn point that is also the carrier's HOME (so it jiggles there, not wanders off). */
export const sited = (b: Box, seed: number): { x: number; y: number; hx: number; hy: number } => {
  const p = inBox(b, seed);
  return { x: p.x, y: p.y, hx: p.x, hy: p.y };
};

/** draw an engine carrier pool as electron / hole glyphs (positions in-bounds, opacity tweened). */
export const renderCarriers = (cs: Carrier[]): ReactNode[] =>
  cs
    .filter((c) => (c.o ?? 1) > 0.02)
    .map((c) =>
      c.t === 'e' ? (
        <Electron key={c.id} x={c.x} y={c.y} o={c.o ?? 1} />
      ) : (
        <Hole key={c.id} x={c.x} y={c.y} o={c.o ?? 1} />
      ),
    );

export function Lead({
  x,
  y1,
  y2,
  label,
  sub,
  color,
}: {
  x: number;
  y1: number;
  y2: number;
  label: string;
  sub: string;
  color: string;
}): ReactNode {
  return (
    <g>
      <line
        x1={x}
        y1={y1}
        x2={x}
        y2={y2 + 8}
        stroke="var(--stage-wire)"
        strokeWidth={2}
        strokeLinecap="round"
      />
      <circle cx={x} cy={y2 + 8} r={2.6} fill="var(--stage-metal)" />
      <Tag x={x} y={y2 + 2} text={label} color={color} size={12} weight={700} />
      {sub ? <Tag x={x} y={y2 - 10} text={sub} color={color} size={10} weight={500} /> : null}
    </g>
  );
}
