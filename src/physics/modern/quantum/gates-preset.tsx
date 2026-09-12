'use client';
import { useState, type ComponentType, type ReactNode } from 'react';
import type { AuthoredActivity } from '../../../kit/activity-authoring.js';
import { AuthoredActivityRuntime } from '../../../kit/authored-activity-runtime.js';
import { Chip } from '../../../kit/controls.js';
import { Field, Readout } from '../../../kit/frame.js';
import { BlochProjectedScene, type BlochSceneProps } from './bloch-preset.js';
import { quantumGatesActivity } from './gates-activity.js';
import { applyQuantumGate, initialGateState, type QuantumGate } from './gates-core.js';
import type { MeasurementAxis } from './qubit-core.js';
export interface QuantumGateJourneyLabProps {
  targetSequence?: QuantumGate[];
  title?: string;
  prompt?: string;
  activity?: AuthoredActivity;
  sceneRenderer?: ComponentType<BlochSceneProps>;
}
export function QuantumGateJourneyLab({
  targetSequence = ['h', 'z', 'h'],
  title = 'Quantum gate journey: rotate, phase, undo',
  prompt = 'Start at |0⟩. Every gate changes amplitudes and rotates the same Bloch vector while total probability remains one.',
  activity,
  sceneRenderer: Scene = BlochProjectedScene,
}: QuantumGateJourneyLabProps = {}): ReactNode {
  const [state, setState] = useState(initialGateState),
    [history, setHistory] = useState<QuantumGate[]>([]),
    axis: MeasurementAxis = 'z',
    apply = (g: QuantumGate) => {
      setState((s) => applyQuantumGate(s, g));
      setHistory((h) => [...h, g]);
    },
    reset = () => {
      setState(initialGateState());
      setHistory([]);
    },
    matched = history.length === targetSequence.length && history.every((g, i) => g === targetSequence[i]);
  const controls = (
      <>
        <Field label="gates">
          <span className="lab-field-row">
            {(['x', 'z', 'h', 's'] as const).map((g) => (
              <Chip key={g} selected={false} onClick={() => apply(g)}>
                {g.toUpperCase()}
              </Chip>
            ))}
            <Chip selected={false} onClick={reset}>
              reset
            </Chip>
          </span>
        </Field>
        <Field label="program">
          <span>
            {history.length ? history.map((g) => g.toUpperCase()).join(' → ') : '|0⟩ · no gates yet'}
          </span>
        </Field>
        <Field label="target">
          <span>
            {targetSequence.map((g) => g.toUpperCase()).join(' → ')} {matched ? '✓' : ''}
          </span>
        </Field>
      </>
    ),
    b = state.bloch,
    p0 = (1 + b.z) / 2,
    evidence = (
      <>
        <Readout value={`P(0) ${(p0 * 100).toFixed(1)}%`} sub={`P(1) ${((1 - p0) * 100).toFixed(1)}%`} />
        <div className="lab-metric-list">
          <div>
            <span>α</span>
            <strong>
              {state.alpha.re.toFixed(2)} {state.alpha.im < 0 ? '−' : '+'}{' '}
              {Math.abs(state.alpha.im).toFixed(2)}i
            </strong>
          </div>
          <div>
            <span>β</span>
            <strong>
              {state.beta.re.toFixed(2)} {state.beta.im < 0 ? '−' : '+'} {Math.abs(state.beta.im).toFixed(2)}i
            </strong>
          </div>
          <div>
            <span>normalization</span>
            <strong>
              {(state.alpha.re ** 2 + state.alpha.im ** 2 + state.beta.re ** 2 + state.beta.im ** 2).toFixed(
                3,
              )}
            </strong>
          </div>
        </div>
      </>
    );
  return (
    <AuthoredActivityRuntime
      focusLayout="immersive"
      activity={activity ?? quantumGatesActivity}
      activityId="quantum-gates"
      eyebrow="Modern physics · quantum computing"
      title={title}
      description={prompt}
      status={
        <>
          <span>{history.length} gates</span>
          <span>{matched ? 'target reached' : 'programming'}</span>
        </>
      }
      controls={controls}
      evidence={evidence}
      observation={
        history.length
          ? `The ${history.at(-1)!.toUpperCase()} gate moved the state to Bloch coordinates (${b.x.toFixed(2)}, ${b.y.toFixed(2)}, ${b.z.toFixed(2)}) while preserving normalization.`
          : 'Apply H to create an equal Z-basis superposition, then use phase and rotation gates to steer the state.'
      }
    >
      <Scene state={b} axis={axis} />
    </AuthoredActivityRuntime>
  );
}
