'use client';

import { useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react';
import type { AuthoredActivity } from '../../kit/activity-authoring.js';
import { AuthoredActivityRuntime } from '../../kit/authored-activity-runtime.js';
import { ActivitySelect, Slider } from '../../kit/controls.js';
import { Field } from '../../kit/frame.js';
import { measurementActivity } from './activity.js';
import { MEASUREMENT_MODES, measurementState, type MeasurementMode } from './core.js';

export interface MeasurementLabProps {
  mode?: MeasurementMode;
  radius?: number;
  height?: number;
  turns?: number;
  length?: number;
  width?: number;
  pathWidth?: number;
  gridSize?: number;
  coveredCells?: number;
  partialCells?: number;
  title?: string;
  prompt?: string;
  objectives?: string[];
  activity?: AuthoredActivity;
}

const labels: Record<MeasurementMode, string> = {
  'pi-roll': 'Discover π',
  'wheel-distance': 'Wheel travel',
  cylinder: 'Build a cylinder',
  'walking-path': 'Measure a path',
  'irregular-area': 'Estimate an area',
};

function PiRollScene({ radius }: { radius: number }): ReactNode {
  const r = 28 + radius * 7;
  const diameter = r * 2;
  const circumference = 2 * Math.PI * r;
  const unrolled = Math.min(390, circumference);
  return (
    <svg
      className="lab-diagram measurement-scene"
      viewBox="0 0 640 340"
      role="img"
      aria-label="A circular rim unrolled beside its diameter to reveal pi"
    >
      <circle cx="155" cy="142" r={r} className="measurement-shape" />
      <line x1="155" y1={142 - r} x2="155" y2={142 + r} className="measurement-guide" />
      <text x="166" y="148" className="measurement-label">
        diameter = 2r
      </text>
      <circle cx="155" cy={142 - r} r="6" className="measurement-marker" />
      <path
        d={`M 155 ${142 - r} C 220 96, 238 232, 278 232 H ${278 + unrolled}`}
        className="measurement-unroll"
        pathLength="1"
      />
      <line x1="278" y1="254" x2={278 + unrolled} y2="254" className="measurement-dimension" />
      <text x={278 + unrolled / 2} y="310" textAnchor="middle" className="measurement-label">
        rim = π diameter-units
      </text>
      {[0, 1, 2, 3].map((unit) => (
        <g key={unit} transform={`translate(${278 + Math.min(unit * diameter, unrolled)} 254)`}>
          <line y1="-7" y2="7" className="measurement-tick" />
          <text y="22" textAnchor="middle" className="measurement-small">
            {unit}
          </text>
        </g>
      ))}
    </svg>
  );
}

function WheelScene({ radius, turns }: { radius: number; turns: number }): ReactNode {
  const r = 35 + radius * 5;
  const start = 90;
  const distance = Math.min(440, 2 * Math.PI * r * turns);
  const cx = start + distance;
  const cy = 230 - r;
  const angle = turns * Math.PI * 2;
  const markerX = cx + Math.sin(angle) * r;
  const markerY = cy - Math.cos(angle) * r;
  const samples = Array.from({ length: 49 }, (_, index) => {
    const t = (turns * Math.PI * 2 * index) / 48;
    return `${start + r * (t - Math.sin(t))},${230 - r * (1 - Math.cos(t))}`;
  }).join(' ');
  return (
    <svg
      className="lab-diagram measurement-scene"
      viewBox="0 0 640 340"
      role="img"
      aria-label={`Wheel rotated ${turns} turns and travelled along its cycloid path`}
    >
      <line x1="55" y1="230" x2="585" y2="230" className="measurement-axis" />
      <polyline points={samples} className="measurement-trace" />
      <line x1={start} y1="262" x2={cx} y2="262" className="measurement-dimension" />
      <circle cx={cx} cy={cy} r={r} className="measurement-shape" />
      <line x1={cx} y1={cy} x2={markerX} y2={markerY} className="measurement-guide" />
      <circle cx={markerX} cy={markerY} r="7" className="measurement-marker" />
      <text x={(start + cx) / 2} y="290" textAnchor="middle" className="measurement-label">
        {turns} × circumference
      </text>
    </svg>
  );
}

function CylinderScene({ radius, height }: { radius: number; height: number }): ReactNode {
  const r = 25 + radius * 6;
  const h = 70 + height * 8;
  const layers = Math.max(3, Math.min(8, Math.round(height)));
  const netWidth = Math.min(225, 2 * Math.PI * r * 0.72);
  return (
    <svg
      className="lab-diagram measurement-scene"
      viewBox="0 0 640 340"
      role="img"
      aria-label="A cylinder shown as stacked circular layers and unfolded into two circles and a rectangle"
    >
      <text x="142" y="55" textAnchor="middle" className="measurement-kicker">
        STACK πr² LAYERS
      </text>
      <path
        d={`M ${142 - r} 90 V ${90 + h} A ${r} 15 0 0 0 ${142 + r} ${90 + h} V 90`}
        className="measurement-fill"
      />
      {Array.from({ length: layers + 1 }, (_, i) => (
        <ellipse
          key={i}
          cx="142"
          cy={90 + (h * i) / layers}
          rx={r}
          ry="15"
          className={i === layers ? 'measurement-shape' : 'measurement-layer'}
        />
      ))}
      <line x1="142" y1="90" x2={142 + r} y2="90" className="measurement-guide" />
      <text x={150 + r / 2} y="82" className="measurement-small">
        r
      </text>
      <line x1={142 + r + 14} y1="90" x2={142 + r + 14} y2={90 + h} className="measurement-dimension" />
      <text x={166 + r} y={95 + h / 2} className="measurement-small">
        h
      </text>
      <path d="M245 170h38" className="measurement-unroll" />
      <text x="264" y="156" textAnchor="middle" className="measurement-small">
        unfold
      </text>
      <rect x="315" y="84" width={netWidth} height={h * 0.62} className="measurement-net" />
      <circle
        cx={315 + netWidth * 0.25}
        cy={91 + h * 0.62 + r * 0.5}
        r={r * 0.48}
        className="measurement-net"
      />
      <circle
        cx={315 + netWidth * 0.75}
        cy={91 + h * 0.62 + r * 0.5}
        r={r * 0.48}
        className="measurement-net"
      />
      <text x={315 + netWidth / 2} y="68" textAnchor="middle" className="measurement-kicker">
        NET: 2 CIRCLES + 2πr × h
      </text>
    </svg>
  );
}

type DragTarget = 'length' | 'width' | 'path';
function WalkingPathScene({
  length,
  width,
  pathWidth,
  onLength,
  onWidth,
  onPath,
}: {
  length: number;
  width: number;
  pathWidth: number;
  onLength: (v: number) => void;
  onWidth: (v: number) => void;
  onPath: (v: number) => void;
}): ReactNode {
  const drag = useRef<DragTarget | null>(null);
  const scale = Math.min(22, 390 / (length + 2 * pathWidth), 205 / (width + 2 * pathWidth));
  const innerW = length * scale,
    innerH = width * scale,
    p = pathWidth * scale;
  const outerW = innerW + 2 * p,
    outerH = innerH + 2 * p;
  const outerX = (640 - outerW) / 2,
    outerY = (290 - outerH) / 2 + 18;
  const x = outerX + p,
    y = outerY + p;
  const move = (event: PointerEvent<SVGSVGElement>) => {
    if (!drag.current) return;
    const box = event.currentTarget.getBoundingClientRect(),
      px = ((event.clientX - box.left) * 640) / box.width,
      py = ((event.clientY - box.top) * 340) / box.height;
    if (drag.current === 'length') onLength(Math.max(4, Math.min(20, Math.round((px - x) / scale))));
    if (drag.current === 'width') onWidth(Math.max(3, Math.min(14, Math.round((py - y) / scale))));
    if (drag.current === 'path')
      onPath(
        Math.max(
          0.5,
          Math.min(
            3,
            Math.round((Math.max(x - px, px - (x + innerW), y - py, py - (y + innerH)) / scale) * 2) / 2,
          ),
        ),
      );
  };
  const handle = (target: DragTarget) => (event: PointerEvent<SVGCircleElement>) => {
    drag.current = target;
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const keyAdjust = (target: DragTarget) => (event: KeyboardEvent<SVGCircleElement>) => {
    const direction =
      event.key === 'ArrowRight' || event.key === 'ArrowUp'
        ? 1
        : event.key === 'ArrowLeft' || event.key === 'ArrowDown'
          ? -1
          : 0;
    if (!direction) return;
    event.preventDefault();
    if (target === 'length') onLength(Math.max(4, Math.min(20, length + direction)));
    if (target === 'width') onWidth(Math.max(3, Math.min(14, width + direction)));
    if (target === 'path') onPath(Math.max(0.5, Math.min(3, pathWidth + direction * 0.5)));
  };
  return (
    <svg
      className="lab-diagram measurement-scene measurement-interactive"
      viewBox="0 0 640 340"
      role="img"
      aria-label="A pond and surrounding walking path, with draggable dimension handles"
      onPointerMove={move}
      onPointerUp={() => {
        drag.current = null;
      }}
      onPointerCancel={() => {
        drag.current = null;
      }}
    >
      <text x="320" y="28" textAnchor="middle" className="measurement-kicker">
        OUTER AREA − POND AREA = WALKING PATH
      </text>
      <rect
        x={outerX}
        y={outerY}
        width={outerW}
        height={outerH}
        rx="16"
        className="measurement-path"
        data-testid="walking-path-region"
      />
      <rect x={x} y={y} width={innerW} height={innerH} rx="10" className="measurement-water" />
      <text x={x + innerW / 2} y={y + innerH / 2 + 5} textAnchor="middle" className="measurement-label">
        pond {length} m × {width} m
      </text>
      <line
        x1={x}
        y1={outerY + outerH + 20}
        x2={x + innerW}
        y2={outerY + outerH + 20}
        className="measurement-dimension"
      />
      <text x={x + innerW / 2} y={outerY + outerH + 43} textAnchor="middle" className="measurement-label">
        length {length} m
      </text>
      <line x1={outerX - 20} y1={y} x2={outerX - 20} y2={y + innerH} className="measurement-dimension" />
      <text
        x={outerX - 33}
        y={y + innerH / 2}
        textAnchor="middle"
        className="measurement-label"
        transform={`rotate(-90 ${outerX - 33} ${y + innerH / 2})`}
      >
        width {width} m
      </text>
      <line
        x1={x + innerW}
        y1={outerY + 10}
        x2={outerX + outerW}
        y2={outerY + 10}
        className="measurement-dimension"
      />
      <text x={x + innerW + p / 2} y={outerY - 7} textAnchor="middle" className="measurement-label">
        path {pathWidth} m
      </text>
      <circle
        cx={x + innerW}
        cy={outerY + outerH + 20}
        r="11"
        className="measurement-handle"
        onPointerDown={handle('length')}
        onKeyDown={keyAdjust('length')}
        role="slider"
        tabIndex={0}
        aria-label="Pond length"
        aria-valuemin={4}
        aria-valuemax={20}
        aria-valuenow={length}
      />
      <circle
        cx={outerX - 20}
        cy={y + innerH}
        r="11"
        className="measurement-handle"
        onPointerDown={handle('width')}
        onKeyDown={keyAdjust('width')}
        role="slider"
        tabIndex={0}
        aria-label="Pond width"
        aria-valuemin={3}
        aria-valuemax={14}
        aria-valuenow={width}
      />
      <circle
        cx={outerX + outerW}
        cy={outerY + 10}
        r="11"
        className="measurement-handle"
        onPointerDown={handle('path')}
        onKeyDown={keyAdjust('path')}
        role="slider"
        tabIndex={0}
        aria-label="Path width"
        aria-valuemin={0.5}
        aria-valuemax={3}
        aria-valuenow={pathWidth}
      />
    </svg>
  );
}

function IrregularAreaScene({
  full,
  partial,
  gridSize,
}: {
  full: number;
  partial: number;
  gridSize: number;
}): ReactNode {
  const cells = Array.from({ length: 60 }, (_, i) => i),
    fullCount = Math.min(full, 60),
    partialCount = Math.min(partial, 60 - fullCount);
  return (
    <svg
      className="lab-diagram measurement-scene"
      viewBox="0 0 640 340"
      role="img"
      aria-label={`${full} full and ${partial} partial grid cells estimate an irregular area`}
    >
      <path
        d="M116 241C74 173 129 73 238 93C326 34 525 104 493 211C449 286 249 281 116 241Z"
        className="measurement-region"
      />
      {cells.map((_, i) => {
        const x = 90 + (i % 10) * 46,
          y = 47 + Math.floor(i / 10) * 43,
          type = i < fullCount ? 'full' : i < fullCount + partialCount ? 'partial' : 'empty';
        return (
          <rect key={i} x={x} y={y} width="46" height="43" className="measurement-cell" data-cell={type} />
        );
      })}
      <g transform="translate(92 306)">
        <rect width="16" height="16" className="measurement-cell" data-cell="full" />
        <text x="24" y="13" className="measurement-small">
          full = {gridSize * gridSize} m²
        </text>
        <rect x="132" width="16" height="16" className="measurement-cell" data-cell="partial" />
        <text x="156" y="13" className="measurement-small">
          boundary ≈ ½
        </text>
      </g>
    </svg>
  );
}

export function MeasurementLab({
  mode: initialMode = 'pi-roll',
  radius: initialRadius = 2,
  height: initialHeight = 5,
  turns: initialTurns = 1,
  length: initialLength = 12,
  width: initialWidth = 8,
  pathWidth: initialPath = 1,
  gridSize = 1,
  coveredCells: initialCovered = 24,
  partialCells: initialPartial = 10,
  title = 'Measure it: roll, unwrap, fill, or estimate',
  prompt = 'Switch representations and connect every formula term to a visible length, surface, turn, or counted region.',
  objectives,
  activity,
}: MeasurementLabProps = {}): ReactNode {
  const [mode, setMode] = useState<MeasurementMode>(initialMode),
    [radius, setRadius] = useState(initialRadius),
    [height, setHeight] = useState(initialHeight),
    [turns, setTurns] = useState(initialTurns),
    [length, setLength] = useState(initialLength),
    [width, setWidth] = useState(initialWidth),
    [pathWidth, setPathWidth] = useState(initialPath),
    [coveredCells, setCovered] = useState(initialCovered),
    [partialCells, setPartial] = useState(initialPartial);
  const input = {
      mode,
      radius,
      height,
      turns,
      length,
      width,
      pathWidth,
      gridSize,
      coveredCells,
      partialCells,
    },
    state = measurementState(input),
    runtime = activity ?? (objectives ? { ...measurementActivity.source, objectives } : measurementActivity);
  const scene =
    mode === 'pi-roll' ? (
      <PiRollScene radius={radius} />
    ) : mode === 'wheel-distance' ? (
      <WheelScene radius={radius} turns={turns} />
    ) : mode === 'cylinder' ? (
      <CylinderScene radius={radius} height={height} />
    ) : mode === 'walking-path' ? (
      <WalkingPathScene
        length={length}
        width={width}
        pathWidth={pathWidth}
        onLength={setLength}
        onWidth={setWidth}
        onPath={setPathWidth}
      />
    ) : (
      <IrregularAreaScene full={coveredCells} partial={partialCells} gridSize={gridSize} />
    );
  return (
    <AuthoredActivityRuntime
      activity={runtime}
      activityId="measurement"
      eyebrow="Geometry · measurement"
      title={title}
      description={prompt}
      status={
        <>
          <span>{labels[mode]}</span>
          <span>{state.formula}</span>
        </>
      }
      controls={
        <>
          <div className="lab-activity-select-field">
            <span className="lab-field-label">model</span>
            <ActivitySelect
              ariaLabel="measurement model"
              value={mode}
              onChange={setMode}
              options={MEASUREMENT_MODES.map((value) => ({ value, label: labels[value] }))}
            />
          </div>
          {(mode === 'pi-roll' || mode === 'wheel-distance' || mode === 'cylinder') && (
            <Field label="radius">
              <Slider value={radius} min={0.5} max={5} step={0.5} onChange={setRadius} ariaLabel="radius" />
              <strong>{radius} m</strong>
            </Field>
          )}
          {mode === 'wheel-distance' && (
            <Field label="turns">
              <Slider
                value={turns}
                min={0.25}
                max={5}
                step={0.25}
                onChange={setTurns}
                ariaLabel="wheel turns"
              />
              <strong>{turns}</strong>
            </Field>
          )}
          {mode === 'cylinder' && (
            <Field label="height">
              <Slider
                value={height}
                min={1}
                max={10}
                step={0.5}
                onChange={setHeight}
                ariaLabel="cylinder height"
              />
              <strong>{height} m</strong>
            </Field>
          )}
          {mode === 'walking-path' && (
            <p className="measurement-hint">Drag a scene handle, or use a precise control.</p>
          )}
          {mode === 'walking-path' && (
            <>
              <Field label="pond length">
                <Slider
                  value={length}
                  min={4}
                  max={20}
                  step={1}
                  onChange={setLength}
                  ariaLabel="pond length"
                />
                <strong>{length} m</strong>
              </Field>
              <Field label="pond width">
                <Slider value={width} min={3} max={14} step={1} onChange={setWidth} ariaLabel="pond width" />
                <strong>{width} m</strong>
              </Field>
              <Field label="path width">
                <Slider
                  value={pathWidth}
                  min={0.5}
                  max={3}
                  step={0.5}
                  onChange={setPathWidth}
                  ariaLabel="path width"
                />
                <strong>{pathWidth} m</strong>
              </Field>
            </>
          )}
          {mode === 'irregular-area' && (
            <>
              <Field label="full cells">
                <Slider
                  value={coveredCells}
                  min={0}
                  max={60}
                  step={1}
                  onChange={setCovered}
                  ariaLabel="full cells"
                />
                <strong>{coveredCells}</strong>
              </Field>
              <Field label="partial cells">
                <Slider
                  value={partialCells}
                  min={0}
                  max={30}
                  step={1}
                  onChange={setPartial}
                  ariaLabel="partial cells"
                />
                <strong>{partialCells}</strong>
              </Field>
            </>
          )}
        </>
      }
      evidence={
        <div className="lab-metric-list">
          <div>
            <span>{state.primaryLabel}</span>
            <strong>
              {state.primaryValue.toFixed(2)} {state.unit}
            </strong>
          </div>
          <div>
            <span>{state.secondaryLabel}</span>
            <strong>{state.secondaryValue.toFixed(2)}</strong>
          </div>
        </div>
      }
      observation={state.explanation}
      transcript={
        <p>
          {state.explanation} {state.primaryLabel}: {state.primaryValue.toFixed(2)} {state.unit}.
        </p>
      }
    >
      {scene}
    </AuthoredActivityRuntime>
  );
}
