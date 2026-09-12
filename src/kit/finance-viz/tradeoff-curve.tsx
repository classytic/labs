'use client';

/**
 * TradeoffCurve — two opposing costs (one rising, one falling) and their U-shaped
 * total, with the minimum marked (EOQ, and any "sweet spot"). A pure view: the lab
 * passes the two cost functions and the optimum.
 */

import type { ReactNode } from 'react';

export interface TradeoffCurveProps {
  /** x range to plot over (e.g. order size from min to max). */
  domain: [number, number];
  /** the cost that FALLS as x grows (e.g. ordering cost). */
  falling: (x: number) => number;
  /** the cost that RISES as x grows (e.g. holding cost). */
  rising: (x: number) => number;
  /** x of the minimum-total point to mark (e.g. EOQ). */
  optimum?: number;
  /** x of the learner's current choice to mark. */
  marker?: number;
  /** Direct-manipulation seam: click/drag the graph or use arrow keys. */
  onMarkerChange?: (value: number) => void;
  markerStep?: number;
  labels?: { x?: string; falling?: string; rising?: string; total?: string; optimum?: string };
  format?: (n: number) => string;
  /** cap the y-axis so an asymptote spike clips off-top instead of flattening the curve. */
  yMax?: number;
  height?: number;
}

/** Two opposing costs and their U-shaped total, with the sweet-spot minimum marked. */
export function TradeoffCurve({
  domain,
  falling,
  rising,
  optimum,
  marker,
  onMarkerChange,
  markerStep,
  labels = {},
  format = (n) => `${Math.round(n)}`,
  yMax: yMaxProp,
  height = 300,
}: TradeoffCurveProps): ReactNode {
  const W = 720,
    H = height;
  const GX0 = 60,
    GX1 = 700,
    GY0 = 22,
    GY1 = H - 34;
  const [x0, x1] = domain;
  const N = 60;
  const xs = Array.from({ length: N + 1 }, (_, i) => x0 + (i / N) * (x1 - x0));
  const total = (x: number): number => falling(x) + rising(x);
  const maxY =
    yMaxProp ??
    (Math.max(...xs.map((x) => total(x)), ...xs.map((x) => rising(x)), ...xs.map((x) => falling(x))) * 1.06 ||
      1);
  const X = (x: number): number => GX0 + ((x - x0) / (x1 - x0)) * (GX1 - GX0);
  const Y = (v: number): number => GY1 - (Math.min(v, maxY) / maxY) * (GY1 - GY0);
  const path = (f: (x: number) => number): string =>
    xs.map((x) => `${X(x).toFixed(1)},${Y(f(x)).toFixed(1)}`).join(' ');
  const C_FALL = 'var(--stage-warn, #e0a020)';
  const C_RISE = 'var(--stage-danger, #e03131)';
  const C_TOTAL = 'var(--stage-accent, #3b82f6)';
  const setFromClientX = (clientX: number, svg: SVGSVGElement): void => {
    if (!onMarkerChange) return;
    const rect = svg.getBoundingClientRect();
    const px = ((clientX - rect.left) / Math.max(1, rect.width)) * W;
    const value = x0 + ((Math.max(GX0, Math.min(GX1, px)) - GX0) / (GX1 - GX0)) * (x1 - x0);
    const step = markerStep ?? (x1 - x0) / 100;
    onMarkerChange(Math.max(x0, Math.min(x1, Math.round(value / step) * step)));
  };
  return (
    <div className="finance-chart-frame">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        role={onMarkerChange ? 'slider' : 'img'}
        tabIndex={onMarkerChange ? 0 : undefined}
        aria-label={
          onMarkerChange
            ? `Choose ${labels.x ?? 'position'} on the cost curve`
            : `Two opposing costs and their total; minimum${optimum != null ? ` near ${Math.round(optimum)}` : ''}`
        }
        aria-valuemin={onMarkerChange ? x0 : undefined}
        aria-valuemax={onMarkerChange ? x1 : undefined}
        aria-valuenow={onMarkerChange && marker != null ? marker : undefined}
        onPointerDown={
          onMarkerChange
            ? (event) => {
                event.currentTarget.setPointerCapture(event.pointerId);
                setFromClientX(event.clientX, event.currentTarget);
              }
            : undefined
        }
        onPointerMove={
          onMarkerChange
            ? (event) => {
                if (event.currentTarget.hasPointerCapture(event.pointerId))
                  setFromClientX(event.clientX, event.currentTarget);
              }
            : undefined
        }
        onKeyDown={
          onMarkerChange
            ? (event) => {
                if (marker == null) return;
                const step = markerStep ?? (x1 - x0) / 100;
                if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
                  event.preventDefault();
                  onMarkerChange(Math.max(x0, marker - step));
                }
                if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
                  event.preventDefault();
                  onMarkerChange(Math.min(x1, marker + step));
                }
                if (event.key === 'Home') {
                  event.preventDefault();
                  onMarkerChange(x0);
                }
                if (event.key === 'End') {
                  event.preventDefault();
                  onMarkerChange(x1);
                }
              }
            : undefined
        }
        style={onMarkerChange ? { cursor: 'ew-resize', touchAction: 'none' } : undefined}
      >
        <line x1={GX0} y1={GY0} x2={GX0} y2={GY1} stroke="var(--stage-fg)" strokeWidth={1.5} />
        <line x1={GX0} y1={GY1} x2={GX1} y2={GY1} stroke="var(--stage-fg)" strokeWidth={1.5} />
        <text x={GX0 - 8} y={Y(maxY) + 10} textAnchor="end" fontSize={10} fill="var(--stage-muted)">
          {format(maxY)}
        </text>
        {labels.x && (
          <text x={GX1} y={GY1 + 16} textAnchor="end" fontSize={10} fill="var(--stage-muted)">
            {labels.x}
          </text>
        )}
        {/* optimum (minimum total) */}
        {optimum != null && optimum >= x0 && optimum <= x1 && (
          <g>
            <line
              x1={X(optimum)}
              y1={GY0}
              x2={X(optimum)}
              y2={GY1}
              stroke="var(--stage-good, #16a34a)"
              strokeWidth={1.5}
              strokeDasharray="3 3"
            />
            <circle
              cx={X(optimum)}
              cy={Y(total(optimum))}
              r={5}
              fill="var(--stage-good, #16a34a)"
              stroke="var(--stage-bg)"
              strokeWidth={2}
            />
            <text
              x={X(optimum)}
              y={GY1 + 16}
              textAnchor="middle"
              fontSize={10}
              fontWeight={700}
              fill="var(--stage-good, #16a34a)"
            >
              {labels.optimum ?? 'best'} {Math.round(optimum)}
            </text>
          </g>
        )}
        {/* learner's current choice */}
        {marker != null && marker >= x0 && marker <= x1 && (
          <line
            x1={X(marker)}
            y1={GY0}
            x2={X(marker)}
            y2={GY1}
            stroke="var(--stage-muted)"
            strokeWidth={1.5}
          />
        )}
        <polyline points={path(falling)} fill="none" stroke={C_FALL} strokeWidth={2} strokeDasharray="5 4" />
        <polyline points={path(rising)} fill="none" stroke={C_RISE} strokeWidth={2} strokeDasharray="5 4" />
        <polyline points={path(total)} fill="none" stroke={C_TOTAL} strokeWidth={3} strokeLinejoin="round" />
        {/* legend */}
        <g transform={`translate(${GX0 + 12}, ${GY0 + 4})`} fontSize={11}>
          <line x1={0} y1={0} x2={18} y2={0} stroke={C_TOTAL} strokeWidth={3} />
          <text x={24} y={4} fill="var(--stage-fg)">
            {labels.total ?? 'total'}
          </text>
          <line x1={92} y1={0} x2={110} y2={0} stroke={C_FALL} strokeWidth={2} strokeDasharray="5 4" />
          <text x={116} y={4} fill="var(--stage-muted)">
            {labels.falling ?? 'falling'}
          </text>
          <line x1={196} y1={0} x2={214} y2={0} stroke={C_RISE} strokeWidth={2} strokeDasharray="5 4" />
          <text x={220} y={4} fill="var(--stage-muted)">
            {labels.rising ?? 'rising'}
          </text>
        </g>
      </svg>
    </div>
  );
}
