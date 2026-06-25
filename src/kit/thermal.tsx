'use client';

/**
 * Thermal glyph vocabulary — illustrative, STATE-DRIVEN heat & temperature props:
 *  • ThermometerGlyph — bulb + mercury column whose height & colour track temperature
 *  • BeakerGlyph       — glass beaker with a liquid fill + meniscus, floating ice that
 *                        melts (iceFrac→0), bubbles that rise while boiling, steam wisps
 *  • BurnerGlyph       — a burner whose flame grows with heating power (or frosts when cooling)
 *
 * Same authoring contract as the electronics kit: PURE SVG <g> fragments (no
 * <defs>, no hooks, no CSS animation), drawn in PIXEL space, colours are
 * --stage-* tokens, and MOTION IS DATA — the host's frame loop passes a `phase`
 * (seconds) and the intensities (boiling/steam/iceFrac 0..1), so everything
 * honours prefers-reduced-motion upstream and replays deterministically as video.
 * These are illustrative (lesson-facing), not exam schematic symbols.
 */

import type { ReactNode } from 'react';

const METAL = 'var(--stage-metal, #8a8a8a)';
const BG = 'var(--stage-bg, #fff)';
const FG = 'var(--stage-fg, #222)';
const GLASS = 'color-mix(in oklab, var(--stage-fg) 28%, transparent)';

/** Blue (cold) → red (hot) along a 0..1 fraction, in perceptual space. */
export function thermalColor(frac: number): string {
  const f = Math.max(0, Math.min(1, frac));
  return `color-mix(in oklab, #e23b3b ${(f * 100).toFixed(0)}%, #2b7fff)`;
}

// ── Thermometer ──────────────────────────────────────────────────────────────
export function ThermometerGlyph({ cx, top, h, frac, label }: {
  /** centre x, top y, total height (px). */
  cx: number; top: number; h: number;
  /** mercury fill fraction 0..1 (already mapped from temperature by the caller). */
  frac: number;
  label?: string;
}): ReactNode {
  const f = Math.max(0, Math.min(1, frac));
  const bulbR = Math.max(9, h * 0.085);
  const stemW = bulbR * 0.85;
  const bulbCy = top + h - bulbR;
  const stemTop = top + bulbR * 0.5;
  const colBot = bulbCy;
  const colTop = colBot - f * (colBot - stemTop);
  const col = thermalColor(f);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((tk) => colBot - tk * (colBot - stemTop));
  return (
    <g aria-hidden>
      {/* mercury bulb */}
      <circle cx={cx} cy={bulbCy} r={bulbR} fill={col} stroke={METAL} strokeWidth={2} />
      {/* glass stem (over bulb top) */}
      <rect x={cx - stemW / 2} y={stemTop} width={stemW} height={colBot - stemTop} rx={stemW / 2} fill={BG} stroke={METAL} strokeWidth={2} />
      {/* mercury column */}
      <rect x={cx - stemW / 2 + 2.5} y={colTop} width={stemW - 5} height={colBot - colTop} fill={col} />
      {/* connect column into the bulb */}
      <rect x={cx - stemW / 2 + 2.5} y={colBot - 4} width={stemW - 5} height={bulbR} fill={col} />
      {/* scale ticks */}
      {ticks.map((ty, i) => (
        <line key={i} x1={cx + stemW / 2 + 1} y1={ty} x2={cx + stemW / 2 + (i % 2 ? 5 : 8)} y2={ty} stroke={METAL} strokeWidth={1.5} />
      ))}
      {/* sheen */}
      <rect x={cx - stemW / 2 + 3} y={stemTop + 3} width={2} height={colBot - stemTop - 6} rx={1} fill="color-mix(in oklab, var(--stage-sheen, #fff) 55%, transparent)" />
      {label && <text x={cx} y={top - 4} textAnchor="middle" fontSize={12} fontWeight={700} fill={FG}>{label}</text>}
    </g>
  );
}

// ── Beaker (liquid + ice + bubbles + steam) ───────────────────────────────────
export function BeakerGlyph({ x, y, w, h, fillFrac, color, boiling = 0, steam = 0, iceFrac = 0, phase = 0, label }: {
  /** top-left x,y and size of the beaker bounding box (px). */
  x: number; y: number; w: number; h: number;
  /** liquid level 0..1 of the inner height. */
  fillFrac: number;
  /** liquid colour token. */
  color: string;
  /** boiling intensity 0..1 (bubble density). */
  boiling?: number;
  /** steam intensity 0..1 above the rim. */
  steam?: number;
  /** floating-ice amount 0..1 (1 = lots of ice, 0 = none/melted). */
  iceFrac?: number;
  /** animation phase in seconds (host frame loop). */
  phase?: number;
  label?: string;
}): ReactNode {
  const lipH = 8;
  const innerTop = y + lipH;
  const innerBot = y + h - 3;
  const innerH = innerBot - innerTop;
  const liq = Math.max(0, Math.min(1, fillFrac));
  const liquidTop = innerBot - liq * innerH;
  const lx = x + 4, rx = x + w - 4;

  // rising bubbles while boiling
  const nB = Math.round(boiling * 10);
  const bubbles: ReactNode[] = [];
  for (let i = 0; i < nB; i++) {
    const fr = ((phase * 0.7 + i * 0.137 * 7) % 1);                 // 0 bottom → 1 surface
    const by = innerBot - fr * (innerBot - liquidTop);
    const bx = lx + 8 + ((i * 0.41) % 1) * (rx - lx - 16);
    const r = 1.6 + (i % 3);
    bubbles.push(<circle key={`b${i}`} cx={bx} cy={by} r={r} fill={BG} opacity={0.5 * (1 - fr) + 0.25} />);
  }

  // floating, melting ice cubes
  const nIce = iceFrac > 0.02 ? Math.max(1, Math.round(iceFrac * 5)) : 0;
  const cubes: ReactNode[] = [];
  for (let i = 0; i < nIce; i++) {
    const s = (7 + (i % 2) * 4) * (0.5 + 0.5 * iceFrac);
    const cxp = lx + 10 + ((i * 0.37 + 0.1) % 1) * (rx - lx - 20);
    const bob = Math.sin(phase * 1.4 + i) * 2;
    const cyp = liquidTop + 3 + bob;
    cubes.push(
      <g key={`i${i}`} opacity={0.9}>
        <rect x={cxp} y={cyp} width={s} height={s} rx={2} fill="color-mix(in oklab, #cfeaff 80%, var(--stage-bg))" stroke="color-mix(in oklab, #2b7fff 40%, transparent)" strokeWidth={1} />
        <line x1={cxp + 2} y1={cyp + s * 0.35} x2={cxp + s - 2} y2={cyp + s * 0.35} stroke="color-mix(in oklab, #2b7fff 30%, transparent)" strokeWidth={1} />
      </g>,
    );
  }

  // steam wisps drifting up from the rim
  const wisps: ReactNode[] = [];
  if (steam > 0.04) {
    for (let i = 0; i < 3; i++) {
      const sx = x + w * (0.3 + i * 0.2);
      const off = (phase * 18 + i * 13) % 26;
      const o = steam * 0.5 * (1 - off / 26);
      wisps.push(
        <path key={`s${i}`} d={`M ${sx} ${y - off} q 6 -8 0 -16 q -6 -8 0 -16`} fill="none" stroke="color-mix(in oklab, var(--stage-fg) 35%, transparent)" strokeWidth={3} strokeLinecap="round" opacity={Math.max(0, o)} />,
      );
    }
  }

  return (
    <g>
      {wisps}
      {/* liquid */}
      {liq > 0.001 && (
        <>
          <rect x={lx} y={liquidTop} width={rx - lx} height={innerBot - liquidTop} fill={color} fillOpacity={0.45} />
          <ellipse cx={(lx + rx) / 2} cy={liquidTop} rx={(rx - lx) / 2} ry={4} fill={color} fillOpacity={0.7} />
        </>
      )}
      {bubbles}
      {cubes}
      {/* glass walls (drawn over the liquid edge) */}
      <path d={`M ${x} ${y} L ${lx} ${innerBot} Q ${x + w / 2} ${y + h + 4} ${rx} ${innerBot} L ${x + w} ${y}`} fill="none" stroke={GLASS} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />
      {/* rim lip */}
      <line x1={x - 3} y1={y} x2={x + w + 3} y2={y} stroke={METAL} strokeWidth={3} strokeLinecap="round" />
      {label && <text x={x + w / 2} y={y + h + 22} textAnchor="middle" fontSize={12} fontWeight={700} fill={FG}>{label}</text>}
    </g>
  );
}

// ── Burner / heat source ──────────────────────────────────────────────────────
export function BurnerGlyph({ cx, baseY, w, level, phase = 0 }: {
  /** centre x, the y of the burner top (flame grows upward from here). */
  cx: number; baseY: number; w: number;
  /** −1..1 — positive heats (flame, taller with level), negative cools (frost). */
  level: number;
  phase?: number;
}): ReactNode {
  const flame = Math.max(0, level);
  const cold = Math.max(0, -level);
  const flicker = 1 + Math.sin(phase * 9) * 0.06;
  const fh = flame * (w * 1.5) * flicker;          // flame height
  const fw = w * 0.42;
  const tip = baseY - fh;

  const teardrop = (scale: number, fill: string, op: number): ReactNode => {
    const hw = fw * scale, ht = fh * scale, ty = baseY - ht;
    return <path d={`M ${cx} ${baseY + 3} C ${cx - hw} ${baseY - ht * 0.4} ${cx - hw * 0.5} ${ty} ${cx} ${ty} C ${cx + hw * 0.5} ${ty} ${cx + hw} ${baseY - ht * 0.4} ${cx} ${baseY + 3} Z`} fill={fill} opacity={op} />;
  };

  return (
    <g aria-hidden>
      {/* burner bar + stand */}
      <rect x={cx - w / 2} y={baseY} width={w} height={9} rx={4} fill={METAL} />
      <rect x={cx - w / 2 - 4} y={baseY + 9} width={w + 8} height={4} rx={2} fill="color-mix(in oklab, var(--stage-metal) 70%, var(--stage-bg))" />
      {/* heating flame — stacked translucent teardrops give a soft glow without filters */}
      {flame > 0.02 && (
        <>
          {teardrop(1.25, 'color-mix(in oklab, var(--stage-warn, #e0a020) 55%, transparent)', 0.35)}
          {teardrop(1.0, 'var(--stage-warn, #e0a020)', 0.9)}
          {teardrop(0.6, 'color-mix(in oklab, #ffd23b 80%, var(--stage-warn))', 0.95)}
          {teardrop(0.28, 'color-mix(in oklab, #fff 75%, #ffd23b)', 0.95)}
          <circle cx={cx} cy={tip} r={1.5} fill="#fff" opacity={0.8} />
        </>
      )}
      {/* cooling — frost spikes below the bar */}
      {cold > 0.02 && (
        <g opacity={0.5 + cold * 0.45} stroke="color-mix(in oklab, #2b7fff 70%, var(--stage-bg))" strokeWidth={2} strokeLinecap="round">
          {[-1, 0, 1].map((k) => {
            const sx = cx + k * w * 0.28, len = 10 + cold * 12;
            return <g key={k}><line x1={sx} y1={baseY + 14} x2={sx} y2={baseY + 14 + len} /><line x1={sx - 4} y1={baseY + 18} x2={sx + 4} y2={baseY + 22} /><line x1={sx + 4} y1={baseY + 18} x2={sx - 4} y2={baseY + 22} /></g>;
          })}
        </g>
      )}
    </g>
  );
}
