'use client';

import { useCallback, useState, type ComponentType, type ReactNode } from 'react';
import type { AuthoredActivity } from '../../kit/activity-authoring.js';
import { AuthoredActivityRuntime } from '../../kit/authored-activity-runtime.js';
import { Chip, Segmented } from '../../kit/controls.js';
import { Field, Readout, SceneViewport } from '../../kit/frame.js';
import { meiosisExplorerActivity } from './meiosis-activity.js';
import {
  MEIOSIS_CHECKPOINTS,
  meiosisProducts,
  meiosisState,
  type AssortmentOrientation,
  type MeiosisCheckpoint,
  type MeiosisState,
} from './meiosis-core.js';

export interface MeiosisSceneProps {
  state: MeiosisState;
  crossover: boolean;
  orientation: AssortmentOrientation;
  products: string[];
}
export type MeiosisSceneRenderer = ComponentType<MeiosisSceneProps>;
export interface MeiosisExplorerLabProps {
  checkpoint?: MeiosisCheckpoint;
  crossover?: boolean;
  orientation?: AssortmentOrientation;
  title?: string;
  prompt?: string;
  objectives?: string[];
  activity?: AuthoredActivity;
  sceneRenderer?: MeiosisSceneRenderer;
}
export { MeiosisSemanticScene } from './meiosis-scene.js';
import { MeiosisSemanticScene } from './meiosis-scene.js';

export function MeiosisExplorerLab({
  checkpoint: initial = 'pairing',
  crossover: initialCross = true,
  orientation: initialOrientation = 'maternal-left',
  title = 'Meiosis: shuffle two genomes into four cells',
  prompt = 'Pair homologs, exchange matching segments, choose their orientation, and follow two divisions into four haploid products.',
  objectives,
  activity,
  sceneRenderer: SceneRenderer,
}: MeiosisExplorerLabProps = {}): ReactNode {
  const [checkpoint, setCheckpoint] = useState<MeiosisCheckpoint>(initial);
  const [crossover, setCrossover] = useState(initialCross);
  const [orientation, setOrientation] = useState<AssortmentOrientation>(initialOrientation);
  const state = meiosisState(checkpoint);
  const products = meiosisProducts(crossover, orientation);
  const runtime =
    activity ?? (objectives ? { ...meiosisExplorerActivity.source, objectives } : meiosisExplorerActivity);
  const sceneProps = { state, crossover, orientation, products };
  const syncStep = useCallback((step: { id: string }): void => {
    if (MEIOSIS_CHECKPOINTS.includes(step.id as MeiosisCheckpoint))
      setCheckpoint(step.id as MeiosisCheckpoint);
  }, []);
  const controls = (
    <>
      <Field label="checkpoint">
        <Segmented
          ariaLabel="checkpoint"
          value={checkpoint}
          onChange={setCheckpoint}
          options={MEIOSIS_CHECKPOINTS.map((id, index) => ({
            value: id,
            label: (
              <>
                {index + 1}. {id}
              </>
            ),
          }))}
        />
      </Field>
      <Field label="sources of variation">
        {/* crossing over is an independent toggle; the bivalent orientation is one-of-two. */}
        <span className="lab-field-row">
          <Chip selected={crossover} onClick={() => setCrossover(!crossover)}>
            crossing over
          </Chip>
          <Segmented
            ariaLabel="bivalent orientation"
            value={orientation}
            onChange={setOrientation}
            options={[
              { value: 'maternal-left', label: 'maternal ↤' },
              { value: 'paternal-left', label: 'paternal ↤' },
            ]}
          />
        </span>
      </Field>
    </>
  );
  const evidence = (
    <>
      <Readout value={state.title} sub={state.summary} />
      <div className="lab-metric-list">
        <div>
          <span>division</span>
          <strong>{state.division || 'preparation'}</strong>
        </div>
        <div>
          <span>ploidy</span>
          <strong>{state.ploidy}</strong>
        </div>
        <div>
          <span>cells</span>
          <strong>{state.cellCount}</strong>
        </div>
        <div>
          <span>sisters joined</span>
          <strong>{state.sistersAttached ? 'yes' : 'no'}</strong>
        </div>
        <div>
          <span>modeled products</span>
          <strong>{products.join(' · ')}</strong>
        </div>
      </div>
    </>
  );
  return (
    <AuthoredActivityRuntime
      activity={runtime}
      activityId="meiosis-explorer"
      focusLayout="immersive"
      eyebrow="Cell biology · inheritance"
      title={title}
      description={prompt}
      initialStepId={initial}
      onStepChange={syncStep}
      status={
        <>
          <span>{state.index + 1}/6</span>
          <span>{state.ploidy}</span>
          <span>
            {state.cellCount} {state.cellCount === 1 ? 'cell' : 'cells'}
          </span>
        </>
      }
      controls={controls}
      evidence={evidence}
      observation={state.summary}
      transcript={
        <p>
          {state.summary} The modeled haploid products carry {products.join(', ')}.
        </p>
      }
    >
      <SceneViewport label={`${state.checkpoint} meiosis model`}>
        {SceneRenderer ? <SceneRenderer {...sceneProps} /> : <MeiosisSemanticScene {...sceneProps} />}
      </SceneViewport>
    </AuthoredActivityRuntime>
  );
}
