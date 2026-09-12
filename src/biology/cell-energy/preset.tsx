'use client';
import { useState, type ComponentType, type ReactNode } from 'react';
import type { AuthoredActivity } from '../../kit/activity-authoring.js';
import { AuthoredActivityRuntime } from '../../kit/authored-activity-runtime.js';
import { Chip, Slider } from '../../kit/controls.js';
import { Field, SceneViewport } from '../../kit/frame.js';
import { cellEnergyActivity } from './activity.js';
import { cellEnergyState, type CellEnergyState } from './core.js';
export interface CellEnergySceneProps {
  state: CellEnergyState;
  glucose: number;
  oxygen: number;
  demand: number;
  fermentation: boolean;
}
export type CellEnergySceneRenderer = ComponentType<CellEnergySceneProps>;
export interface CellEnergyLabProps {
  glucose?: number;
  oxygen?: number;
  demand?: number;
  fermentation?: boolean;
  title?: string;
  prompt?: string;
  objectives?: string[];
  activity?: AuthoredActivity;
  sceneRenderer?: CellEnergySceneRenderer;
}
export function CellEnergySemanticScene({ state }: CellEnergySceneProps): ReactNode {
  return (
    <div className="lab-metric-list" role="img" aria-label={state.summary}>
      <div>
        <span>aerobic respiration</span>
        <strong>{state.aerobicRate.toFixed(1)}</strong>
      </div>
      <div>
        <span>ATP production</span>
        <strong>{state.atpProduction.toFixed(0)} relative units</strong>
      </div>
      <div>
        <span>cell work supplied</span>
        <strong>{Math.round(state.workFraction * 100)}%</strong>
      </div>
    </div>
  );
}
export function CellEnergyLab({
  glucose: initialGlucose = 6,
  oxygen: initialOxygen = 6,
  demand: initialDemand = 5,
  fermentation: initialFermentation = true,
  title = 'Power the cell: food + oxygen → ATP → work',
  prompt = 'Deliver glucose and oxygen to mitochondria, then balance ATP production against the cell’s changing workload.',
  objectives,
  activity,
  sceneRenderer: SceneRenderer,
}: CellEnergyLabProps = {}): ReactNode {
  const [glucose, setGlucose] = useState(initialGlucose),
    [oxygen, setOxygen] = useState(initialOxygen),
    [demand, setDemand] = useState(initialDemand),
    [fermentation, setFermentation] = useState(initialFermentation),
    state = cellEnergyState({ glucose, oxygen, demand, fermentation }),
    runtime = activity ?? (objectives ? { ...cellEnergyActivity.source, objectives } : cellEnergyActivity),
    props = { state, glucose, oxygen, demand, fermentation };
  return (
    <AuthoredActivityRuntime
      activity={runtime}
      activityId="cell-energy"
      focusLayout="immersive"
      eyebrow="Cell biology · energetics"
      title={title}
      description={prompt}
      status={
        <>
          <span>{state.limiting} limited</span>
          <span>{Math.round(state.workFraction * 100)}% work supplied</span>
        </>
      }
      controls={
        <>
          <Field label="glucose delivery">
            <Slider
              value={glucose}
              min={0}
              max={10}
              step={1}
              onChange={setGlucose}
              ariaLabel="glucose delivery"
            />
            <strong>{glucose}</strong>
          </Field>
          <Field label="oxygen delivery">
            <Slider
              value={oxygen}
              min={0}
              max={10}
              step={1}
              onChange={setOxygen}
              ariaLabel="oxygen delivery"
            />
            <strong>{oxygen}</strong>
          </Field>
          <Field label="ATP demand">
            <Slider value={demand} min={0} max={10} step={1} onChange={setDemand} ariaLabel="ATP demand" />
            <strong>{demand}</strong>
          </Field>
          <Field label="low-oxygen pathway">
            <Chip selected={fermentation} onClick={() => setFermentation(!fermentation)}>
              fermentation {fermentation ? 'enabled' : 'disabled'}
            </Chip>
          </Field>
        </>
      }
      evidence={
        <div className="lab-metric-list">
          <div>
            <span>aerobic rate</span>
            <strong>{state.aerobicRate.toFixed(1)}</strong>
          </div>
          <div>
            <span>fermentation rate</span>
            <strong>{state.fermentationRate.toFixed(1)}</strong>
          </div>
          <div>
            <span>ATP produced</span>
            <strong>{state.atpProduction.toFixed(0)}</strong>
          </div>
          <div>
            <span>ATP demanded</span>
            <strong>{state.atpDemand.toFixed(0)}</strong>
          </div>
        </div>
      }
      observation={state.summary}
      transcript={
        <p>
          {state.summary} This teaching model uses about 30 ATP per aerobically respired glucose and 2 ATP
          from fermentation to emphasize the yield difference.
        </p>
      }
    >
      <SceneViewport label="Cellular respiration energy model">
        {SceneRenderer ? <SceneRenderer {...props} /> : <CellEnergySemanticScene {...props} />}
      </SceneViewport>
    </AuthoredActivityRuntime>
  );
}
