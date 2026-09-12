'use client';

/**
 * SolutionField, the SHARED "solute particles in a beaker" primitive (single
 * source of truth for the concentration family). Both SolutionBoxLab and
 * DilutionLab compose it, so the particle field, the density tint, the Brownian
 * jitter and the draggable probe live in exactly ONE place.
 *
 * GENERIC on purpose: it takes a particle COUNT + a fill fraction (the liquid's
 * level in the vessel = volume) + a tint 0..1, the chemistry (moles→dots, M→tint)
 * is the lab's job, not the field's. Particles hold fixed fractional positions
 * inside the liquid so raising the level spreads the SAME particles apart
 * (dilution = spreading, never removing).
 *
 * Drawn with the figure kit (Glass + Particle, colour roles only); deterministic
 * seed (no Math.random at render) so SSR == client; jitter + probe run client-side;
 * honours prefers-reduced-motion.
 */

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { useInView } from '@classytic/stage';
import { useFrameTick, useReducedMotionDeferred } from '../../kit/anim.js';
import { clamp } from '../../core/util.js';
import { Figure, FigTag, Glass, glassInner, Particle, HUE, STROKE, alpha } from '../../kit/figure/index.js';

export interface SolutionFieldProps {
  /** Solute particle count (the amount). Capped internally for perf. */
  dots: number;
  /** Liquid level, 0..1 of the vessel's inner height (represents volume). */
  fill: number;
  /** Density tint 0..1 (e.g. molarity / maxMolarity), deepens the solution colour. */
  tint: number;
  /**
   * Legacy species hue (HSL degrees). Colour now comes from the figure palette
   * (solute = hue-1, solution = hue-3); the prop is accepted for API compatibility.
   */
  hue?: number;
  /** Figure height in user units (renders 1 unit ≈ 1 px at full column width). */
  height?: number;
  /** Figure width in user units (default 640; use ~320 for a half-column cell). */
  width?: number;
  /** Vessel width as a fraction of the figure width (default 0.6). */
  vessel?: number;
  /** Drag a fixed-size probe to count particles in a sub-region. */
  showProbe?: boolean;
  animate?: boolean;
  ariaLabel?: string;
}

const MAXDOTS = 260;
const PAD = 0.06; // inner padding (fraction) so particles stay off the glass
const DOT_R = 3.1;
const TOP = 10; // room above the rim
const BOTTOM = 14; // room for the contact shadow

interface Seed {
  fx: number;
  fy: number;
  vx: number;
  vy: number;
}

export function SolutionField({
  dots,
  fill,
  tint,
  height = 230,
  width = 640,
  vessel = 0.6,
  showProbe = false,
  animate = true,
  ariaLabel = 'solution',
}: SolutionFieldProps): ReactNode {
  const n = clamp(Math.round(dots), 0, MAXDOTS);
  const seeds = useRef<Seed[]>([]);
  // probe centre as a fraction of the vessel's inner rect (starts low, inside the liquid)
  const probe = useRef({ x: 0.5, y: 0.78 });
  const dragging = useRef(false);
  const [mounted, setMounted] = useState(false);
  const reduce = useReducedMotionDeferred();
  const { ref: viewRef, inView } = useInView<HTMLDivElement>();
  useEffect(() => {
    setMounted(true);
  }, []);

  if (seeds.current.length === 0) {
    const pool: Seed[] = [];
    for (let i = 0; i < MAXDOTS; i++) {
      // deterministic 2-D low-discrepancy scatter (R2 sequence, SSR-safe) + a tiny seeded
      // velocity. The old φ / (1−φ) pair was correlated (fx + fy ≈ const mod 1), which lined
      // every dot up along one diagonal "squiggle" instead of filling the liquid.
      const fx = (0.5 + i * 0.7548776662) % 1;
      const fy = (0.5 + i * 0.569840291) % 1;
      const a = (i * 2.39996) % (Math.PI * 2);
      pool.push({ fx, fy, vx: Math.cos(a), vy: Math.sin(a) });
    }
    seeds.current = pool;
  }

  // gentle Brownian drift via the engine clock, paused off-screen + on reduced-motion
  const repaint = useFrameTick(mounted && animate && !reduce && inView, (f) => {
    const dt = Math.min(0.05, f.dtMs / 1000);
    for (let i = 0; i < n; i++) {
      const s = seeds.current[i]!;
      s.fx = clamp(s.fx + s.vx * dt * 0.06, 0, 1);
      s.fy = clamp(s.fy + s.vy * dt * 0.09, 0, 1);
      if (s.fx <= 0 || s.fx >= 1) s.vx *= -1;
      if (s.fy <= 0 || s.fy >= 1) s.vy *= -1;
    }
  });

  // ── geometry (user units) ──
  const W = width;
  const H = height;
  const vw = clamp(vessel, 0.2, 0.96) * W;
  const vh = H - TOP - BOTTOM;
  const vx = (W - vw) / 2;
  const inner = glassInner(vx, TOP, vw, vh, 'beaker');
  const liq = clamp(fill, 0.08, 1);
  const liquidTop = inner.y + inner.h - liq * inner.h;
  const liquidH = inner.y + inner.h - liquidTop;
  const dotX = (s: Seed): number => inner.x + (PAD + s.fx * (1 - 2 * PAD)) * inner.w;
  const dotY = (s: Seed): number => liquidTop + (PAD + s.fy * (1 - 2 * PAD)) * liquidH;

  // probe: a fixed square window (local density = particles per window)
  const PROBE = Math.round(Math.min(inner.w, inner.h) * 0.3);
  const px = inner.x + probe.current.x * inner.w;
  const py = inner.y + probe.current.y * inner.h;
  const px0 = clamp(px - PROBE / 2, inner.x, inner.x + inner.w - PROBE);
  const py0 = clamp(py - PROBE / 2, inner.y, inner.y + inner.h - PROBE);
  let probeCount = 0;
  if (showProbe) {
    for (let i = 0; i < n; i++) {
      const s = seeds.current[i]!;
      const x = dotX(s);
      const y = dotY(s);
      if (x >= px0 && x <= px0 + PROBE && y >= py0 && y <= py0 + PROBE) probeCount++;
    }
  }

  const moveProbe = (e: ReactPointerEvent<HTMLDivElement>): void => {
    const svg = e.currentTarget.querySelector('svg');
    const rect = (svg ?? e.currentTarget).getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const ux = ((e.clientX - rect.left) / rect.width) * W;
    const uy = ((e.clientY - rect.top) / rect.height) * H;
    probe.current = {
      x: clamp((ux - inner.x) / inner.w, 0, 1),
      y: clamp((uy - inner.y) / inner.h, 0, 1),
    };
    repaint();
  };
  const onPointerDown = showProbe
    ? (e: ReactPointerEvent<HTMLDivElement>) => {
        dragging.current = true;
        e.currentTarget.setPointerCapture?.(e.pointerId);
        moveProbe(e);
      }
    : undefined;
  const onPointerMove = showProbe
    ? (e: ReactPointerEvent<HTMLDivElement>) => {
        if (dragging.current) moveProbe(e);
      }
    : undefined;
  const onPointerUp = showProbe
    ? (e: ReactPointerEvent<HTMLDivElement>) => {
        dragging.current = false;
        e.currentTarget.releasePointerCapture?.(e.pointerId);
      }
    : undefined;

  const particles: ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const s = seeds.current[i]!;
    particles.push(<Particle key={i} x={dotX(s)} y={dotY(s)} r={DOT_R} color={HUE[1]} />);
  }

  // the probe tag sits above the window, or below it when the window is at the rim
  const tagAbove = py0 - 16 > inner.y;
  const tagY = tagAbove ? py0 - 13 : py0 + PROBE + 13;

  return (
    <div
      ref={viewRef}
      className="chem-solution-field"
      style={showProbe ? { touchAction: 'none', cursor: 'crosshair' } : undefined}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <Figure viewBox={[W, H]} domain="chem" label={ariaLabel}>
        <Glass
          x={vx}
          y={TOP}
          w={vw}
          h={vh}
          shape="beaker"
          fill={liq}
          liquid={HUE[3]}
          liquidOpacity={0.35 + 0.55 * clamp(tint, 0, 1)}
          overlay={
            showProbe ? (
              <g>
                <rect
                  x={px0}
                  y={py0}
                  width={PROBE}
                  height={PROBE}
                  rx={3}
                  fill={alpha(HUE[2], 14)}
                  stroke={HUE[2]}
                  strokeWidth={STROKE.edge}
                  strokeLinejoin="round"
                />
                <FigTag x={px0 + PROBE / 2} y={tagY} anchor="middle" color={HUE[2]}>
                  {`probe · ${probeCount}`}
                </FigTag>
              </g>
            ) : undefined
          }
        >
          {particles}
        </Glass>
      </Figure>
    </div>
  );
}
