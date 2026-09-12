'use client';

import { useState, type ReactNode } from 'react';
import type { AuthoredActivity } from '../../kit/activity-authoring.js';
import { AuthoredActivityRuntime } from '../../kit/authored-activity-runtime.js';
import { ActivitySelect, Slider } from '../../kit/controls.js';
import { Field } from '../../kit/frame.js';
import { geometryFoundationsActivity } from './activity.js';
import { GEOMETRY_FOUNDATION_MODES, geometryFoundationState, type GeometryFoundationMode } from './core.js';

export interface GeometryFoundationsLabProps {
  mode?: GeometryFoundationMode;
  sideA?: number;
  sideB?: number;
  centralAngle?: number;
  sides?: number;
  title?: string;
  prompt?: string;
  objectives?: string[];
  activity?: AuthoredActivity;
}

const point = (cx: number, cy: number, r = 5): ReactNode => (
  <circle cx={cx} cy={cy} r={r} fill="var(--stage-accent)" />
);

export function GeometryFoundationsLab({
  mode: initialMode = 'pythagorean',
  sideA: initialA = 3,
  sideB: initialB = 4,
  centralAngle: initialAngle = 100,
  sides: initialSides = 6,
  title = 'Geometry by decomposition',
  prompt = 'Change the construction and watch a formula emerge from pieces you can account for.',
  objectives,
  activity,
}: GeometryFoundationsLabProps = {}): ReactNode {
  const [mode, setMode] = useState<GeometryFoundationMode>(initialMode);
  const [sideA, setSideA] = useState(initialA);
  const [sideB, setSideB] = useState(initialB);
  const [centralAngle, setCentralAngle] = useState(initialAngle);
  const [sides, setSides] = useState(initialSides);
  const state = geometryFoundationState({ mode, sideA, sideB, centralAngle, sides });
  const runtime =
    activity ??
    (objectives ? { ...geometryFoundationsActivity.source, objectives } : geometryFoundationsActivity);
  return (
    <AuthoredActivityRuntime
      activity={runtime}
      activityId="geometry-foundations"
      eyebrow="Geometry · foundations"
      title={title}
      description={prompt}
      status={
        <>
          <span>{mode.replaceAll('-', ' ')}</span>
          <span>{state.formula}</span>
        </>
      }
      controls={
        <>
          <Field label="construction">
            <ActivitySelect
              ariaLabel="construction"
              value={mode}
              onChange={setMode}
              options={GEOMETRY_FOUNDATION_MODES.map((value) => ({
                value,
                label: value.replaceAll('-', ' '),
              }))}
            />
          </Field>
          {mode === 'pythagorean' && (
            <>
              <Field label="side a" value={sideA}>
                <Slider
                  value={sideA}
                  min={2}
                  max={8}
                  step={1}
                  onChange={setSideA}
                  ariaLabel="triangle side a"
                />
              </Field>
              <Field label="side b" value={sideB}>
                <Slider
                  value={sideB}
                  min={2}
                  max={8}
                  step={1}
                  onChange={setSideB}
                  ariaLabel="triangle side b"
                />
              </Field>
            </>
          )}
          {mode === 'circle-theorem' && (
            <Field label="subtended arc" value={`${centralAngle}°`}>
              <Slider
                value={centralAngle}
                min={30}
                max={240}
                step={10}
                onChange={setCentralAngle}
                ariaLabel="angle at centre"
              />
            </Field>
          )}
          {mode === 'polygon-angles' && (
            <Field label="polygon sides" value={sides}>
              <Slider
                value={sides}
                min={3}
                max={10}
                step={1}
                onChange={setSides}
                ariaLabel="number of polygon sides"
              />
            </Field>
          )}
        </>
      }
      evidence={
        <div className="lab-metric-list">
          {state.values.map((item) => (
            <div key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>
      }
      observation={state.explanation}
      transcript={
        <p>
          {state.explanation} {state.headline}.
        </p>
      }
    >
      <svg
        className="lab-diagram geometry-foundation-scene"
        viewBox="0 0 640 360"
        role="img"
        aria-label={`${mode}. ${state.explanation}`}
      >
        {mode === 'pythagorean' && <PythagoreanScene a={sideA} b={sideB} />}
        {mode === 'circle-theorem' && <CircleTheoremScene angle={centralAngle} />}
        {mode === 'polygon-angles' && <PolygonScene sides={sides} />}
        <text x="320" y="325" textAnchor="middle" fill="var(--stage-fg)">
          {state.headline}
        </text>
      </svg>
    </AuthoredActivityRuntime>
  );
}

function PythagoreanScene({ a, b }: { a: number; b: number }): ReactNode {
  const c = Math.hypot(a, b);
  const maxSide = Math.max(a, b, c);
  const scale = 112 / maxSide;
  const aSize = a * scale;
  const bSize = b * scale;
  const cSize = c * scale;
  const baseline = 238;
  return (
    <g className="geometry-area-proof">
      <text x="320" y="54" textAnchor="middle" className="geometry-scene-title">
        Add the areas—not the side lengths
      </text>
      <g transform={`translate(${72 + (112 - aSize) / 2} ${baseline - aSize})`}>
        <rect width={aSize} height={aSize} className="geometry-area-a" />
        <text x={aSize / 2} y={aSize / 2 + 6} textAnchor="middle" className="geometry-area-value">
          a² = {a ** 2}
        </text>
      </g>
      <text x="214" y="190" textAnchor="middle" className="geometry-operator">
        +
      </text>
      <g transform={`translate(${246 + (112 - bSize) / 2} ${baseline - bSize})`}>
        <rect width={bSize} height={bSize} className="geometry-area-b" />
        <text x={bSize / 2} y={bSize / 2 + 6} textAnchor="middle" className="geometry-area-value">
          b² = {b ** 2}
        </text>
      </g>
      <text x="390" y="190" textAnchor="middle" className="geometry-operator">
        =
      </text>
      <g transform={`translate(${438 + (112 - cSize) / 2} ${baseline - cSize})`}>
        <rect width={cSize} height={cSize} className="geometry-area-c" />
        <path d={`M0 ${cSize} L ${cSize} 0`} className="geometry-area-diagonal" />
        <text x={cSize / 2} y={cSize / 2 + 6} textAnchor="middle" className="geometry-area-value">
          c² = {a ** 2 + b ** 2}
        </text>
      </g>
      <text x="320" y="280" textAnchor="middle" className="geometry-scene-note">
        The combined blue and teal area equals the square on the hypotenuse.
      </text>
    </g>
  );
}

function CircleTheoremScene({ angle }: { angle: number }): ReactNode {
  const cx = 320,
    cy = 175,
    r = 115,
    half = (angle * Math.PI) / 360;
  const a = { x: cx + r * Math.cos(-half), y: cy + r * Math.sin(-half) },
    b = { x: cx + r * Math.cos(half), y: cy + r * Math.sin(half) },
    p = { x: cx - r, y: cy };
  return (
    <>
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="color-mix(in oklab,var(--stage-accent) 8%,transparent)"
        stroke="var(--stage-accent)"
        strokeWidth="3"
      />
      <path
        d={`M${a.x} ${a.y}L${cx} ${cy}L${b.x} ${b.y}M${a.x} ${a.y}L${p.x} ${p.y}L${b.x} ${b.y}`}
        fill="none"
        stroke="var(--stage-fg)"
        strokeWidth="2"
      />
      {point(cx, cy)}
      {point(a.x, a.y)}
      {point(b.x, b.y)}
      {point(p.x, p.y)}
      <text x={cx + 14} y={cy - 10} fill="var(--stage-accent)">
        {angle}°
      </text>
      <text x={p.x + 18} y={p.y - 8} fill="var(--stage-accent-2)">
        {angle / 2}°
      </text>
    </>
  );
}

function PolygonScene({ sides }: { sides: number }): ReactNode {
  const cx = 320,
    cy = 165,
    r = 120;
  const pts = Array.from({ length: sides }, (_, i) => ({
    x: cx + r * Math.cos(-Math.PI / 2 + (i * 2 * Math.PI) / sides),
    y: cy + r * Math.sin(-Math.PI / 2 + (i * 2 * Math.PI) / sides),
  }));
  const path = pts.map((p) => `${p.x},${p.y}`).join(' '),
    origin = pts[0]!;
  return (
    <>
      <polygon
        points={path}
        fill="color-mix(in oklab,var(--stage-accent) 12%,transparent)"
        stroke="var(--stage-accent)"
        strokeWidth="3"
      />
      {pts.slice(2, -1).map((p, i) => (
        <line
          key={i}
          x1={origin.x}
          y1={origin.y}
          x2={p.x}
          y2={p.y}
          stroke="var(--stage-accent-2)"
          strokeWidth="2"
        />
      ))}
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="4" fill="var(--stage-fg)" />
      ))}
      <text x="320" y="305" textAnchor="middle" fill="var(--stage-fg)">
        {sides - 2} non-overlapping triangles
      </text>
    </>
  );
}
