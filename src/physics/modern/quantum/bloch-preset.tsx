'use client';
import { useState, type ComponentType, type ReactNode } from 'react';
import type { AuthoredActivity } from '../../../kit/activity-authoring.js';
import { AuthoredActivityRuntime } from '../../../kit/authored-activity-runtime.js';
import { ActivitySelect, Segmented, Slider } from '../../../kit/controls.js';
import { Field, Readout, SceneViewport } from '../../../kit/frame.js';
import { Arrow, Ball, FigText, Figure, Guide, HUE, Track, tint } from '../../../kit/figure/index.js';
import { blochSphereActivity } from './bloch-activity.js';
import {
  measurementProbability,
  QUBIT_PRESETS,
  qubitState,
  type MeasurementAxis,
  type QubitPreset,
  type QubitState,
} from './qubit-core.js';
export interface BlochSceneProps {
  state: QubitState;
  axis: MeasurementAxis;
}
export interface BlochSphereLabProps {
  preset?: QubitPreset;
  measurementAxis?: MeasurementAxis;
  title?: string;
  prompt?: string;
  activity?: AuthoredActivity;
  sceneRenderer?: ComponentType<BlochSceneProps>;
}

const W = 520;
const H = 356;
const CX = 260;
const CY = 178;
const R = 125;
/** Oblique projection: the y axis (into the page) foreshortens onto the equator's minor radius. */
const RY = 38;
const PRESET_IDS = Object.keys(QUBIT_PRESETS) as QubitPreset[];

export function BlochProjectedScene({ state, axis }: BlochSceneProps): ReactNode {
  const x = CX + state.x * R,
    y = CY - state.z * R + state.y * RY,
    length = Math.hypot(x - CX, y - CY);
  const guide =
    axis === 'z'
      ? { x1: CX, y1: CY + R, x2: CX, y2: CY - R }
      : axis === 'x'
        ? { x1: CX - R, y1: CY, x2: CX + R, y2: CY }
        : { x1: CX, y1: CY - RY, x2: CX, y2: CY + RY };
  return (
    <Figure
      viewBox={[W, H]}
      domain="physics"
      label={`Qubit Bloch vector x ${state.x.toFixed(2)}, y ${state.y.toFixed(2)}, z ${state.z.toFixed(2)}`}
    >
      <Ball cx={CX} cy={CY} r={R} color={tint(HUE[3], 22)} />
      {/* axes and equator */}
      <Track
        points={[
          [CX, CY - R],
          [CX, CY + R],
        ]}
        color={HUE.soft}
        weight="hair"
        dashed={false}
      />
      <Track
        points={[
          [CX - R, CY],
          [CX + R, CY],
        ]}
        color={HUE.soft}
        weight="hair"
        dashed={false}
      />
      <Track
        d={`M ${CX - R} ${CY} A ${R} ${RY} 0 1 0 ${CX + R} ${CY} A ${R} ${RY} 0 1 0 ${CX - R} ${CY}`}
        color={HUE.soft}
        weight="hair"
      />
      {/* the axis being measured */}
      <Guide {...guide} color={HUE[2]} />
      {/* the state vector */}
      {length > 4 && <Arrow x1={CX} y1={CY} x2={x} y2={y} color={HUE[1]} weight="bold" head={10} />}
      <Ball cx={x} cy={y} r={7} color={HUE[1]} />

      <FigText x={CX} y={CY - R - 12} anchor="middle" size="measure">
        |0⟩
      </FigText>
      <FigText x={CX} y={CY + R + 24} anchor="middle" size="measure">
        |1⟩
      </FigText>
      <FigText x={CX + R + 10} y={CY} baseline="middle">
        +x
      </FigText>
      <FigText x={CX - R - 10} y={CY} anchor="end" baseline="middle">
        −x
      </FigText>
      <FigText x={CX - 12} y={CY + RY + 18} anchor="end" size="note" tone="soft">
        +y
      </FigText>
    </Figure>
  );
}
export function BlochSphereLab({
  preset = 'plus',
  measurementAxis: initialAxis = 'z',
  title = 'Qubit compass: state and measurement',
  prompt = 'A pure qubit is a direction. Rotate its polar angle and relative phase, then ask different measurement questions without moving the state.',
  activity,
  sceneRenderer: Scene = BlochProjectedScene,
}: BlochSphereLabProps = {}): ReactNode {
  const initial = QUBIT_PRESETS[preset],
    [theta, setTheta] = useState(initial.theta),
    [phi, setPhi] = useState(initial.phi),
    [axis, setAxis] = useState<MeasurementAxis>(initialAxis),
    s = qubitState(theta, phi),
    p = measurementProbability(s, axis);
  const controls = (
      <>
        <Field label="state presets">
          {/* θ and φ are continuous sliders, so between presets nothing is selected: '' is that
              third state and is deliberately absent from `options`. */}
          <ActivitySelect<QubitPreset | ''>
            ariaLabel="state presets"
            value={
              PRESET_IDS.find(
                (k) =>
                  Math.abs(theta - QUBIT_PRESETS[k].theta) < 0.01 &&
                  Math.abs(phi - QUBIT_PRESETS[k].phi) < 0.01,
              ) ?? ''
            }
            onChange={(k) => {
              if (!k) return;
              setTheta(QUBIT_PRESETS[k].theta);
              setPhi(QUBIT_PRESETS[k].phi);
            }}
            options={PRESET_IDS.map((k) => ({ value: k, label: QUBIT_PRESETS[k].label }))}
          />
        </Field>
        <Field label="polar angle θ" value={`${Math.round((theta * 180) / Math.PI)}°`}>
          <Slider
            value={theta}
            min={0}
            max={Math.PI}
            step={0.01}
            onChange={setTheta}
            ariaLabel="Bloch polar angle"
          />
        </Field>
        <Field label="relative phase φ" value={`${Math.round((phi * 180) / Math.PI)}°`}>
          <Slider
            value={phi}
            min={0}
            max={2 * Math.PI}
            step={0.01}
            onChange={setPhi}
            ariaLabel="qubit relative phase"
          />
        </Field>
        <Field label="measurement basis">
          <Segmented<MeasurementAxis>
            ariaLabel="measurement basis"
            value={axis}
            onChange={setAxis}
            options={(['x', 'y', 'z'] as const).map((a) => ({ value: a, label: a.toUpperCase() }))}
          />
        </Field>
      </>
    ),
    evidence = (
      <>
        <Readout
          value={`P(+${axis}) ${(p * 100).toFixed(1)}%`}
          sub={`P(−${axis}) ${((1 - p) * 100).toFixed(1)}%`}
        />
        <div className="lab-metric-list">
          <div>
            <span>α · |0⟩</span>
            <strong>{s.alpha.re.toFixed(3)}</strong>
          </div>
          <div>
            <span>β magnitude</span>
            <strong>{Math.hypot(s.beta.re, s.beta.im).toFixed(3)}</strong>
          </div>
          <div>
            <span>β phase</span>
            <strong>{Math.round((s.phi * 180) / Math.PI)}°</strong>
          </div>
        </div>
      </>
    );
  return (
    <AuthoredActivityRuntime
      activity={activity ?? blochSphereActivity}
      activityId="bloch-sphere"
      focusLayout="immersive"
      eyebrow="Modern physics · quantum state"
      title={title}
      description={prompt}
      status={
        <>
          <span>θ {Math.round((theta * 180) / Math.PI)}°</span>
          <span>φ {Math.round((phi * 180) / Math.PI)}°</span>
          <span>{axis.toUpperCase()} basis</span>
        </>
      }
      controls={controls}
      evidence={evidence}
      observation={`The state vector is unchanged. Measuring along ${axis.toUpperCase()} asks how much it points toward that axis: P(+) = (1 + r${axis}) / 2 = ${(
        p * 100
      ).toFixed(1)}%.`}
    >
      <SceneViewport label="Bloch sphere state model">
        <Scene state={s} axis={axis} />
      </SceneViewport>
    </AuthoredActivityRuntime>
  );
}
