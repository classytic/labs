'use client';

/**
 * Scenes from DATA, the no-code path to a new skin. A creator (or a CMS form) supplies a
 * tiny spec, an emoji, or a shape + colour, and `dataScene` synthesises a full registry
 * scene: no render function to write. `registerDataScene` drops it straight into the same
 * registry the labs and the authoring pickers read, so a skin invented in-product behaves
 * exactly like a hand-coded one (and shows up in every dropdown automatically).
 *
 *   { kind:'count', icon:'🍕' }                 → N pizzas (highlight the new ones)
 *   { kind:'level', icon:'⭐', slots:5 }        → a 5-star row that fills with the fraction
 *   { kind:'level', shape:'box', color:'#7c83ff' } → a coloured box that fills up
 */

import type { ReactNode } from 'react';
import { registerScene, type SceneMeta, type QuantityInput } from './scenes.js';

export type DataSceneSpec =
  | { name: string; label?: string; kind: 'count'; icon: string }
  | { name: string; label?: string; kind: 'level'; icon: string; slots?: number }
  | { name: string; label?: string; kind: 'level'; shape: 'box' | 'cup' | 'circle'; color?: string };

const clamp01 = (n: number): number => Math.max(0, Math.min(1, n));
const Cap = ({ label }: { label?: string }): ReactNode =>
  label ? <span className="text-xs font-bold text-[var(--stage-fg)]">{label}</span> : null;

/** N icons, wrapped to fit; the last `highlight` stay vivid, the rest desaturate. */
function iconCountRender(icon: string): (q: QuantityInput) => ReactNode {
  return (q) => {
    const n = Math.max(0, Math.round(q.count ?? 0));
    const hl = q.highlight ?? 0;
    const w = q.width ?? 120,
      h = q.height ?? 130;
    const size = Math.max(12, Math.min(30, Math.sqrt((w * (h - 24) * 0.62) / Math.max(1, n))));
    return (
      <div className="grid justify-items-center gap-1">
        <div
          role="img"
          aria-label={`${n} ${icon}`}
          className="flex flex-wrap content-center justify-center gap-0.5"
          style={{ width: w, minHeight: h - (q.label ? 22 : 6) }}
        >
          {Array.from({ length: n }).map((_, i) => (
            <span
              key={i}
              style={{
                fontSize: size,
                lineHeight: 1,
                opacity: i >= n - hl ? 1 : 0.92,
                filter: i < n - hl ? 'saturate(0.5)' : 'none',
                animation: `scene-pop 0.3s ease-out ${i * 0.03}s backwards`,
              }}
            >
              {icon}
            </span>
          ))}
        </div>
        <Cap label={q.label} />
      </div>
    );
  };
}

/** A fixed row of `slots` icons; round(frac·slots) are lit, the rest greyed (a rating). */
function iconLevelRender(icon: string, slots: number): (q: QuantityInput) => ReactNode {
  return (q) => {
    const lit = Math.round(clamp01(q.frac ?? 0) * slots);
    const w = q.width ?? 120;
    return (
      <div className="grid justify-items-center gap-1.5">
        <div
          role="img"
          aria-label={`${lit} of ${slots}`}
          className="flex flex-wrap justify-center gap-1"
          style={{ width: w }}
        >
          {Array.from({ length: slots }).map((_, i) => (
            <span
              key={i}
              style={{
                fontSize: 26,
                opacity: i < lit ? 1 : 0.25,
                filter: i < lit ? 'none' : 'grayscale(1)',
                transition: 'opacity 0.3s, filter 0.3s',
              }}
            >
              {icon}
            </span>
          ))}
        </div>
        <Cap label={q.label} />
      </div>
    );
  };
}

/** A coloured shape that fills with the fraction: a box / cup (fill up) or circle (pie). */
function shapeLevelRender(shape: 'box' | 'cup' | 'circle', color?: string): (q: QuantityInput) => ReactNode {
  return (q) => {
    const w = q.width ?? 120,
      h = q.height ?? 150;
    const f = clamp01(q.frac ?? 0);
    const c = color ?? q.color ?? 'var(--stage-accent)';
    const FG = 'var(--stage-fg)';
    // soft, token-tinted rims + a fill sheen, so data-scenes match the crafted kit
    const RIM = 'color-mix(in oklab, var(--stage-fg) 14%, transparent)';
    const GLASS = 'color-mix(in oklab, var(--stage-fg) 5%, transparent)';
    const SHEEN = 'var(--stage-sheen)';
    const fillTrans = { transition: 'y 0.5s ease-out, height 0.5s ease-out' } as const;
    const aria = `${shape} ${(f * 100) | 0}% full`;
    const lbl = q.label ? (
      <text x={w / 2} y={h - 6} fontSize={12} fontWeight={700} fill={FG} textAnchor="middle">
        {q.label}
      </text>
    ) : null;
    if (shape === 'circle') {
      const cx = w / 2,
        cy = (h - (q.label ? 22 : 8)) / 2 + 4,
        r = Math.min(cx, cy) - 8;
      const a = f * 2 * Math.PI,
        ex = cx + r * Math.sin(a),
        ey = cy - r * Math.cos(a),
        large = f > 0.5 ? 1 : 0;
      const d =
        f <= 0
          ? ''
          : f >= 1
            ? `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r} Z`
            : `M ${cx} ${cy} L ${cx} ${cy - r} A ${r} ${r} 0 ${large} 1 ${ex} ${ey} Z`;
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label={aria}>
          <circle cx={cx} cy={cy} r={r} fill={GLASS} stroke={RIM} strokeWidth={1.25} />
          {d && <path d={d} fill={c} />}
          <circle cx={cx} cy={cy} r={r - 0.5} fill="none" stroke="#000" strokeOpacity={0.1} strokeWidth={1} />
          <ellipse
            cx={cx - r * 0.3}
            cy={cy - r * 0.4}
            rx={r * 0.52}
            ry={r * 0.3}
            fill={SHEEN}
            opacity={0.18}
          />
          {lbl}
        </svg>
      );
    }
    const bw = shape === 'cup' ? Math.min(w - 24, 78) : w - 36,
      bx = (w - bw) / 2;
    const top = 12,
      bot = h - (q.label ? 28 : 12);
    const fillTop = bot - f * (bot - top);
    const rb = 9; // rounded base for a softer, modern container
    const outline =
      shape === 'cup'
        ? `M ${bx + 5} ${top} L ${bx + rb * 0.4} ${bot - rb} Q ${bx} ${bot} ${bx + rb} ${bot} L ${bx + bw - rb} ${bot} Q ${bx + bw} ${bot} ${bx + bw - rb * 0.4} ${bot - rb} L ${bx + bw - 5} ${top}`
        : `M ${bx} ${top} L ${bx} ${bot - rb} Q ${bx} ${bot} ${bx + rb} ${bot} L ${bx + bw - rb} ${bot} Q ${bx + bw} ${bot} ${bx + bw} ${bot - rb} L ${bx + bw} ${top}`;
    const fh = Math.max(0, bot - fillTop);
    return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label={aria}>
        <path d={`${outline} Z`} fill={GLASS} />
        <rect
          x={bx + 1}
          y={fillTop}
          width={bw - 2}
          height={Math.max(0, fh - 1)}
          rx={Math.min(7, fh / 2)}
          fill={c}
          fillOpacity={0.62}
          style={fillTrans}
        />
        <rect
          x={bx + 1}
          y={fillTop}
          width={Math.max(3, (bw - 2) * 0.24)}
          height={Math.max(0, fh - 1)}
          rx={Math.min(7, fh / 2)}
          fill={SHEEN}
          opacity={0.2}
          style={fillTrans}
        />
        <path
          d={outline}
          fill="none"
          stroke={RIM}
          strokeWidth={1.75}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {lbl}
      </svg>
    );
  };
}

/** Build a registry scene from a data spec, no render code authored. */
export function dataScene(spec: DataSceneSpec): SceneMeta {
  if (spec.kind === 'count')
    return {
      name: spec.name,
      kind: 'count',
      label: spec.label ?? spec.name,
      render: iconCountRender(spec.icon),
    };
  if ('icon' in spec)
    return {
      name: spec.name,
      kind: 'level',
      label: spec.label ?? spec.name,
      render: iconLevelRender(spec.icon, spec.slots ?? 5),
    };
  return {
    name: spec.name,
    kind: 'level',
    label: spec.label ?? spec.name,
    render: shapeLevelRender(spec.shape, spec.color),
  };
}

/** Build AND register a data scene, so it appears in every lab + authoring picker. */
export function registerDataScene(spec: DataSceneSpec): SceneMeta {
  const meta = dataScene(spec);
  registerScene(meta);
  return meta;
}
