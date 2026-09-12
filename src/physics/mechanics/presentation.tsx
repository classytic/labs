'use client';

import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw } from 'lucide-react';
import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { Label, Polygon, Segment, Vector, type Vec2 } from '@classytic/stage';
import { ActionButton, IconButton } from '../../kit/controls.js';
import { FigText, HUE, STROKE, alpha, shade } from '../../kit/figure/index.js';

export interface SceneSurfaceProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  tone?: 'plain' | 'grid' | 'space';
}

export interface TracePanelProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  children: ReactNode;
  title?: ReactNode;
  detail?: ReactNode;
  legend?: ReactNode;
}

/** Secondary quantitative view paired with a scene: graph, trace, or profile. */
export const TracePanel = forwardRef<HTMLDivElement, TracePanelProps>(function TracePanel(
  { children, className, title, detail, legend, ...props },
  ref,
) {
  return (
    <section ref={ref} className={['physics-trace-card', className].filter(Boolean).join(' ')} {...props}>
      {title || detail || legend ? (
        <header className="physics-trace-heading">
          <div>
            {title ? <strong>{title}</strong> : null}
            {detail ? <span>{detail}</span> : null}
          </div>
          {legend ? <div className="physics-trace-legend">{legend}</div> : null}
        </header>
      ) : null}
      {children}
    </section>
  );
});

/** Quiet, token-driven boundary for a lab's primary visual. */
export const SceneSurface = forwardRef<HTMLDivElement, SceneSurfaceProps>(function SceneSurface(
  { children, className, tone = 'plain', ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={['physics-scene-surface', className].filter(Boolean).join(' ')}
      data-tone={tone}
      {...props}
    >
      {children}
    </div>
  );
});

export interface MechanicsMassBlockProps {
  x: number;
  top: number;
  massKg: number;
  color: string;
  label?: string;
}

export interface MaterialBarrierProps {
  x: number;
  y: number;
  width: number;
  height: number;
  index?: number;
  state?: 'intact' | 'broken' | 'lodged';
}

/** A material sample used by impact and energy-transfer experiments. */
export function MaterialBarrier({
  x,
  y,
  width,
  height,
  index,
  state = 'intact',
}: MaterialBarrierProps): ReactNode {
  const color = state === 'lodged' ? HUE.warn : HUE.wood;
  const faded = state === 'broken';
  return (
    <g opacity={faded ? 0.26 : 1}>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={3}
        fill={alpha(color, faded ? 18 : 62)}
        stroke={shade(color)}
        strokeWidth={STROKE.line}
      />
      {[0.28, 0.56, 0.8].map((p) => (
        <path
          key={p}
          d={`M ${x + width * p} ${y + 7} Q ${x + width * (p - 0.12)} ${y + height * 0.48} ${x + width * (p + 0.05)} ${y + height - 7}`}
          fill="none"
          stroke={shade(color)}
          strokeWidth={STROKE.hair}
          opacity={0.34}
        />
      ))}
      {faded ? (
        <path
          d={`M ${x + 3} ${y + height * 0.28} L ${x + width * 0.62} ${y + height * 0.52} L ${x + width - 3} ${y + height * 0.78}`}
          fill="none"
          stroke={HUE.ink}
          strokeWidth={STROKE.edge}
        />
      ) : null}
      {index != null ? (
        <FigText x={x + width / 2} y={y + height + 18} anchor="middle" size="note" tone="soft">
          {index}
        </FigText>
      ) : null}
    </g>
  );
}

/** Compact projectile silhouette with its nose fixed at x for collision math. */
export function ProjectileGlyph({
  x,
  y,
  moving = false,
}: {
  x: number;
  y: number;
  moving?: boolean;
}): ReactNode {
  return (
    <g>
      {moving ? (
        <path d={`M ${x - 68} ${y} H ${x - 30}`} stroke={alpha(HUE[1], 38)} strokeWidth={STROKE.bold} />
      ) : null}
      <path
        d={`M ${x - 38} ${y - 9} H ${x - 13} L ${x} ${y} L ${x - 13} ${y + 9} H ${x - 38} Q ${x - 45} ${y} ${x - 38} ${y - 9} Z`}
        fill="var(--fig-metal)"
        stroke="var(--fig-outline)"
        strokeWidth={STROKE.line}
      />
      <path d={`M ${x - 31} ${y - 5} H ${x - 14}`} stroke="var(--fig-sheen)" strokeWidth={STROKE.hair} />
    </g>
  );
}

/**
 * A compact mechanics weight with a token-safe value plate.
 *
 * The neutral inset is deliberate: text never relies on guessing whether an
 * authored accent is light or dark, so values remain legible in every host
 * theme. Keeping this geometry here also stops pulley, lever and force labs
 * from inventing subtly different kilogram blocks.
 */
export function MechanicsMassBlock({ x, top, massKg, color, label }: MechanicsMassBlockProps): ReactNode {
  const width = 0.76 + Math.min(massKg, 10) * 0.035;
  const height = 0.76 + Math.min(massKg, 10) * 0.045;
  const left = x - width / 2;
  const right = x + width / 2;
  const bottom = top - height;
  const plateInset = 0.1;

  return (
    <>
      <Polygon
        points={[
          { x: left, y: bottom },
          { x: right, y: bottom },
          { x: right, y: top },
          { x: left, y: top },
        ]}
        color={color}
        fill={color}
        fillOpacity={0.88}
        weight={2}
      />
      <Polygon
        points={[
          { x: left + plateInset, y: bottom + plateInset },
          { x: right - plateInset, y: bottom + plateInset },
          { x: right - plateInset, y: top - plateInset },
          { x: left + plateInset, y: top - plateInset },
        ]}
        color="var(--stage-bg)"
        fill="var(--stage-bg)"
        fillOpacity={0.92}
        weight={1}
      />
      <Label
        x={x}
        y={top - height / 2}
        text={`${massKg} kg`}
        color="var(--stage-fg)"
        size={14}
        weight={750}
      />
      {label ? (
        <Label x={x} y={bottom} dy={22} text={label} color="var(--stage-muted)" size={11} weight={650} />
      ) : null}
      <Segment
        from={{ x: x - width * 0.32, y: top - 0.09 }}
        to={{ x: x + width * 0.32, y: top - 0.09 }}
        color={color}
        opacity={0.62}
        weight={2}
      />
    </>
  );
}

export interface MechanicsVectorProps {
  tail: Vec2;
  tip: Vec2;
  color: string;
  label?: string;
  labelAt?: Vec2;
  labelDx?: number;
  labelDy?: number;
  weight?: number;
  labelSize?: number;
  active?: boolean;
}

/** A measured mechanics arrow: its value label can never drift away from the vector it describes. */
export function MechanicsVector({
  tail,
  tip,
  color,
  label,
  labelAt,
  labelDx,
  labelDy,
  weight = 2.75,
  labelSize = 13,
  active,
}: MechanicsVectorProps): ReactNode {
  const dx = tip.x - tail.x;
  const dy = tip.y - tail.y;
  const length = Math.hypot(dx, dy) || 1;
  const anchor = labelAt ?? { x: tip.x + (dx / length) * 0.18, y: tip.y + (dy / length) * 0.18 };
  return (
    <>
      {active ? <Vector tail={tail} tip={tip} color={color} weight={weight + 3} opacity={0.16} /> : null}
      <Vector tail={tail} tip={tip} color={color} weight={weight} />
      {label ? (
        <Label
          x={anchor.x}
          y={anchor.y}
          dx={labelDx}
          dy={labelDy}
          text={label}
          color={color}
          size={labelSize}
          weight={700}
        />
      ) : null}
    </>
  );
}

export interface SimulationTransportProps {
  running: boolean;
  onReset: () => void;
  onToggle: () => void;
  state: ReactNode;
  detail?: ReactNode;
  startLabel?: string;
  pauseLabel?: string;
  resetLabel?: string;
  disabled?: boolean;
  center?: ReactNode;
  renderAction?: (action: ReactNode) => ReactNode;
}

/** Consistent thumb-reachable simulation controls; labels stay visible where they add meaning. */
export function SimulationTransport({
  running,
  onReset,
  onToggle,
  state,
  detail,
  startLabel = 'Play',
  pauseLabel = 'Pause',
  resetLabel = 'Reset',
  disabled,
  center,
  renderAction,
}: SimulationTransportProps): ReactNode {
  const action = (
    <ActionButton className="physics-play-button" onClick={onToggle} pressed={running} disabled={disabled}>
      {running ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
      <span>{running ? pauseLabel : startLabel}</span>
    </ActionButton>
  );
  return (
    <div className="physics-simulation-actions">
      <IconButton label={resetLabel} onClick={onReset}>
        <RotateCcw aria-hidden="true" />
      </IconButton>
      {center ?? (
        <div className="physics-transport-state" aria-live="polite">
          <strong>{state}</strong>
          {detail ? <span>{detail}</span> : null}
        </div>
      )}
      {renderAction ? renderAction(action) : action}
    </div>
  );
}

export function ResetTransport({
  onReset,
  state,
  detail,
  resetLabel = 'Reset',
}: Pick<SimulationTransportProps, 'onReset' | 'state' | 'detail' | 'resetLabel'>): ReactNode {
  return (
    <div className="physics-simulation-actions" data-reset-only="true">
      <IconButton label={resetLabel} onClick={onReset}>
        <RotateCcw aria-hidden="true" />
      </IconButton>
      <div className="physics-transport-state physics-transport-state-wide" aria-live="polite">
        <strong>{state}</strong>
        {detail ? <span>{detail}</span> : null}
      </div>
    </div>
  );
}

export interface StepTransportProps {
  step: number;
  count: number;
  onPrevious: () => void;
  onNext: () => void;
  onReset?: () => void;
  label: ReactNode;
  previousLabel?: string;
  nextLabel?: string;
}

/** Compact, keyboard-native walkthrough navigation for authored explanation steps. */
export function StepTransport({
  step,
  count,
  onPrevious,
  onNext,
  onReset,
  label,
  previousLabel = 'Previous step',
  nextLabel = 'Next step',
}: StepTransportProps): ReactNode {
  return (
    <div className="physics-simulation-actions" data-stepper="true">
      <div className="physics-step-actions">
        {onReset ? (
          <IconButton label="Reset walkthrough" onClick={onReset}>
            <RotateCcw aria-hidden="true" />
          </IconButton>
        ) : null}
        <IconButton label={previousLabel} onClick={onPrevious} disabled={step <= 0}>
          <ChevronLeft aria-hidden="true" />
        </IconButton>
      </div>
      <div className="physics-step-transport" aria-live="polite">
        <strong>
          {step + 1}/{count}
        </strong>
        <span>{label}</span>
      </div>
      <IconButton label={nextLabel} onClick={onNext} disabled={step >= count - 1}>
        <ChevronRight aria-hidden="true" />
      </IconButton>
    </div>
  );
}
