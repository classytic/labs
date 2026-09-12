'use client';

import { useRef, type ReactNode } from 'react';
import {
  CELL_JOURNEY,
  CellSystemLab,
  CellSystemSemanticScene,
  type CellSystemLabProps,
  type CellSystemSceneProps,
} from '../../biology/cell-system/index.js';
import { useScenePalette } from '../palette.js';
import { SceneAtom, SceneEnvironment } from '../primitives.js';
import { ThreeSceneSurface } from '../surface.js';
import { CellBoundary, CellRoute } from './cell-world.js';
import { BiologicalOrganelle, type CellModelAssets } from './organelles.js';

export type CellSystemThreeLabProps = Omit<CellSystemLabProps, 'sceneRenderer'> & {
  modelAssets?: CellModelAssets;
};

const POSITIONS: Record<(typeof CELL_JOURNEY)[number], [number, number, number]> = {
  nucleus: [-1.65, 0.45, 0],
  ribosome: [-0.65, 0.9, 0.15],
  'rough-er': [-0.35, 0.15, 0],
  golgi: [0.75, 0.35, 0],
  vesicle: [1.55, 0.2, 0.15],
  membrane: [2.35, 0.2, 0],
};

const LABELS: Record<(typeof CELL_JOURNEY)[number], string> = {
  nucleus: 'Nucleus',
  ribosome: 'Ribosome',
  'rough-er': 'Rough ER',
  golgi: 'Golgi apparatus',
  vesicle: 'Transport vesicle',
  membrane: 'Cell membrane',
};

export function CellSystemThreeScene({
  state,
  onSelectStep,
  modelAssets,
}: CellSystemSceneProps & { modelAssets?: CellModelAssets }): ReactNode {
  const ref = useRef<HTMLDivElement>(null);
  const palette = useScenePalette(ref);
  const fallback = <CellSystemSemanticScene state={state} />;
  const points = CELL_JOURNEY.map((id) => POSITIONS[id]);
  const tools = onSelectStep
    ? CELL_JOURNEY.map((id, index) => (
        <button key={id} type="button" aria-pressed={id === state.step} onClick={() => onSelectStep(id)}>
          {index + 1}. {LABELS[id]}
        </button>
      ))
    : undefined;
  const inspector = (
    <>
      <h3>{LABELS[state.step]}</h3>
      <p>{state.process}</p>
      <dl>
        <div>
          <dt>Journey step</dt>
          <dd>
            {state.index + 1} / {CELL_JOURNEY.length}
          </dd>
        </div>
        <div>
          <dt>Transport</dt>
          <dd>{state.blocked ? 'Blocked' : 'Active'}</dd>
        </div>
        <div>
          <dt>Outcome</dt>
          <dd>{state.consequence}</dd>
        </div>
      </dl>
    </>
  );

  const model = (
    <>
      <CellBoundary color={palette.secondary} />
      <CellRoute
        points={points}
        color={state.blocked ? palette.foreground : palette.secondary}
        activeThrough={state.index}
      />
      {CELL_JOURNEY.map((id) => (
        <BiologicalOrganelle
          key={id}
          position={POSITIONS[id]}
          kind={id}
          active={id === state.step}
          failed={id === state.failure}
          color={palette.warning}
          accent={id === state.failure ? palette.foreground : palette.secondary}
          asset={modelAssets?.[id]}
          onSelect={onSelectStep ? () => onSelectStep(id) : undefined}
        />
      ))}
      <SceneAtom
        position={POSITIONS[state.step]}
        radius={0.13}
        color={state.blocked ? palette.foreground : palette.accent}
      />
    </>
  );

  return (
    <div ref={ref}>
      <ThreeSceneSurface
        label={`${state.process} ${state.consequence} Select an organelle to inspect that step.`}
        fallback={fallback}
        camera={{ position: [0, 0, 7] }}
        layout="explorer"
        tools={tools}
        inspector={inspector}
        legend={
          <>
            <span>
              <i data-tone="central" />
              current cargo
            </span>
            <span>
              <i data-tone="pair" />
              available route
            </span>
          </>
        }
      >
        <SceneEnvironment palette={palette} ambient={1.5} keyIntensity={1.35} />
        {model}
      </ThreeSceneSurface>
    </div>
  );
}

export function CellSystemThreeLab({ modelAssets, ...props }: CellSystemThreeLabProps = {}): ReactNode {
  const Renderer = (sceneProps: CellSystemSceneProps): ReactNode => (
    <CellSystemThreeScene {...sceneProps} modelAssets={modelAssets} />
  );
  return <CellSystemLab {...props} sceneRenderer={Renderer} />;
}
