'use client';
import { useState, type ComponentType, type ReactNode } from 'react';
import type { AuthoredActivity } from '../../kit/activity-authoring.js';
import { AuthoredActivityRuntime } from '../../kit/authored-activity-runtime.js';
import { ActivitySelect } from '../../kit/controls.js';
import { Field, Readout, SceneViewport } from '../../kit/frame.js';
import { cellSystemActivity } from './activity.js';
import {
  CELL_JOURNEY,
  ORGANELLE_FAILURES,
  cellSystemState,
  type CellJourneyStep,
  type CellSystemState,
  type OrganelleFailure,
} from './core.js';
export interface CellSystemSceneProps {
  state: CellSystemState;
  onSelectStep?: (step: CellJourneyStep) => void;
}
export type CellSystemSceneRenderer = ComponentType<CellSystemSceneProps>;
export interface CellSystemLabProps {
  step?: CellJourneyStep;
  failure?: OrganelleFailure;
  title?: string;
  prompt?: string;
  objectives?: string[];
  activity?: AuthoredActivity;
  sceneRenderer?: CellSystemSceneRenderer;
}
export function CellSystemSemanticScene({ state }: CellSystemSceneProps): ReactNode {
  return (
    <div className="lab-metric-list" role="img" aria-label={`${state.process} ${state.consequence}`}>
      <div>
        <span>cargo</span>
        <strong>{state.cargo}</strong>
      </div>
      <div>
        <span>location</span>
        <strong>{state.location}</strong>
      </div>
      <div>
        <span>process</span>
        <strong>{state.process}</strong>
      </div>
    </div>
  );
}
export function CellSystemLab({
  step: initialStep = 'nucleus',
  failure: initialFailure = 'none',
  title = 'The cell as a shipping system',
  prompt = 'Follow one secreted protein from DNA instructions to release, then disable an organelle and diagnose what disappears downstream.',
  objectives,
  activity,
  sceneRenderer: SceneRenderer,
}: CellSystemLabProps = {}): ReactNode {
  const [step, setStep] = useState<CellJourneyStep>(initialStep),
    [failure, setFailure] = useState<OrganelleFailure>(initialFailure),
    state = cellSystemState(step, failure),
    runtime = activity ?? (objectives ? { ...cellSystemActivity.source, objectives } : cellSystemActivity);
  return (
    <AuthoredActivityRuntime
      activity={runtime}
      activityId="cell-system"
      focusLayout="immersive"
      eyebrow="Cell biology · organelles"
      title={title}
      description={prompt}
      status={<span>{state.blocked ? 'route blocked' : 'cargo moving'}</span>}
      controls={
        <>
          <Field label="protein journey">
            <ActivitySelect
              ariaLabel="protein journey"
              value={step}
              onChange={setStep}
              options={CELL_JOURNEY.map((value, index) => ({ value, label: `${index + 1}. ${value}` }))}
            />
          </Field>
          <Field label="organelle failure">
            <ActivitySelect
              ariaLabel="organelle failure"
              value={failure}
              onChange={setFailure}
              options={ORGANELLE_FAILURES.map((value) => ({ value, label: value }))}
            />
          </Field>
        </>
      }
      // Say it once: the journey chips carry the step number, the status strip carries the
      // route state, so the evidence is just the cargo and where it is.
      evidence={<Readout label="cargo now" value={state.cargo} sub={state.location} />}
      observation={state.blocked ? state.consequence : state.process}
      transcript={
        <p>
          {state.process} {state.consequence}
        </p>
      }
    >
      <SceneViewport label={`${state.location} cell-system model`}>
        {SceneRenderer ? (
          <SceneRenderer state={state} onSelectStep={setStep} />
        ) : (
          <CellSystemSemanticScene state={state} />
        )}
      </SceneViewport>
    </AuthoredActivityRuntime>
  );
}
