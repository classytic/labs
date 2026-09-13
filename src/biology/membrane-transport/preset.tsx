'use client';
import { useState, type ComponentType, type ReactNode } from 'react';
import type { AuthoredActivity } from '../../kit/activity-authoring.js';
import { AuthoredActivityRuntime } from '../../kit/authored-activity-runtime.js';
import { ActivitySelect, Chip, Slider } from '../../kit/controls.js';
import { Field, SceneViewport } from '../../kit/frame.js';
import { membraneTransportActivity } from './activity.js';
import {
  membraneTransportState,
  TRANSPORT_MODES,
  type MembraneTransportState,
  type TransportMode,
} from './core.js';
export interface MembraneTransportSceneProps {
  state: MembraneTransportState;
  outside: number;
  inside: number;
  atp: boolean;
}
export type MembraneTransportSceneRenderer = ComponentType<MembraneTransportSceneProps>;
export interface MembraneTransportLabProps {
  mode?: TransportMode;
  outside?: number;
  inside?: number;
  permeability?: number;
  atp?: boolean;
  title?: string;
  prompt?: string;
  objectives?: string[];
  activity?: AuthoredActivity;
  sceneRenderer?: MembraneTransportSceneRenderer;
}
export function MembraneTransportSemanticScene({
  state,
  outside,
  inside,
}: MembraneTransportSceneProps): ReactNode {
  return (
    <div className="lab-metric-list" role="img" aria-label={state.summary}>
      <div>
        <span>outside concentration</span>
        <strong>{outside}</strong>
      </div>
      <div>
        <span>membrane</span>
        <strong>{state.requiresProtein ? 'transport protein' : 'lipid bilayer'}</strong>
      </div>
      <div>
        <span>inside concentration</span>
        <strong>{inside}</strong>
      </div>
    </div>
  );
}
export function MembraneTransportLab({
  mode: initialMode = 'diffusion',
  outside: initialOutside = 8,
  inside: initialInside = 2,
  permeability: initialPermeability = 0.8,
  atp: initialAtp = true,
  title = 'Across the membrane: gradient, channel, or pump?',
  prompt = 'Compare both sides, choose a pathway, and distinguish random particle motion from net transport.',
  objectives,
  activity,
  sceneRenderer: SceneRenderer,
}: MembraneTransportLabProps = {}): ReactNode {
  const [mode, setMode] = useState<TransportMode>(initialMode),
    [outside, setOutside] = useState(initialOutside),
    [inside, setInside] = useState(initialInside),
    [permeability, setPermeability] = useState(initialPermeability),
    [atp, setAtp] = useState(initialAtp),
    state = membraneTransportState({ mode, outside, inside, permeability, atp }),
    runtime =
      activity ??
      (objectives ? { ...membraneTransportActivity.source, objectives } : membraneTransportActivity),
    sceneProps = { state, outside, inside, atp };
  return (
    <AuthoredActivityRuntime
      activity={runtime}
      activityId="membrane-transport"
      focusLayout="immersive"
      eyebrow="Cell biology · transport"
      title={title}
      description={prompt}
      status={
        <>
          <span>{mode}</span>
          <span>{state.netDirection}</span>
        </>
      }
      controls={
        <>
          <Field label="transport pathway">
            <ActivitySelect
              ariaLabel="transport pathway"
              value={mode}
              onChange={setMode}
              options={TRANSPORT_MODES.map((value) => ({ value, label: value }))}
            />
          </Field>
          <Field label="outside concentration">
            <Slider
              value={outside}
              min={0}
              max={10}
              step={1}
              onChange={setOutside}
              ariaLabel="outside concentration"
            />
            <strong>{outside}</strong>
          </Field>
          <Field label="inside concentration">
            <Slider
              value={inside}
              min={0}
              max={10}
              step={1}
              onChange={setInside}
              ariaLabel="inside concentration"
            />
            <strong>{inside}</strong>
          </Field>
          <Field label="membrane permeability">
            <Slider
              value={permeability}
              min={0}
              max={1}
              step={0.1}
              onChange={setPermeability}
              ariaLabel="membrane permeability"
            />
            <strong>{permeability.toFixed(1)}</strong>
          </Field>
          {mode === 'active' && (
            <Field label="energy">
              <Chip selected={atp} onClick={() => setAtp(!atp)}>
                ATP {atp ? 'available' : 'absent'}
              </Chip>
            </Field>
          )}
        </>
      }
      evidence={
        <div className="lab-metric-list">
          <div>
            <span>relative rate</span>
            <strong>{state.rate.toFixed(1)}</strong>
          </div>
          <div>
            <span>protein</span>
            <strong>{state.requiresProtein ? 'required' : 'not required'}</strong>
          </div>
          <div>
            <span>ATP</span>
            <strong>{state.requiresAtp ? 'required' : 'not required'}</strong>
          </div>
        </div>
      }
      observation={state.summary}
      transcript={
        <p>
          {state.summary} Outside concentration is {outside}; inside concentration is {inside}. Relative net
          rate is {state.rate.toFixed(1)}.
        </p>
      }
    >
      <SceneViewport size="wide" label={`${state.mode} membrane transport model`}>
        {SceneRenderer ? (
          <SceneRenderer {...sceneProps} />
        ) : (
          <MembraneTransportSemanticScene {...sceneProps} />
        )}
      </SceneViewport>
    </AuthoredActivityRuntime>
  );
}
