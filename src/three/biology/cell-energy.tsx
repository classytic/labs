'use client';
import { useRef, type ReactNode } from 'react';
import {
  CellEnergyLab,
  CellEnergySemanticScene,
  type CellEnergyLabProps,
  type CellEnergySceneProps,
} from '../../biology/cell-energy/index.js';
import { useScenePalette } from '../palette.js';
import { SceneBond, SceneContactShadow, SceneEnvironment, SceneOrbit } from '../primitives.js';
import { ThreeSceneSurface } from '../surface.js';
import { CargoFlow, CellBoundary, CellOrganelle } from './cell-world.js';
export type CellEnergyThreeLabProps = Omit<CellEnergyLabProps, 'sceneRenderer'>;
export function CellEnergyThreeScene({
  state,
  glucose,
  oxygen,
  demand,
  fermentation,
}: CellEnergySceneProps): ReactNode {
  const ref = useRef<HTMLDivElement>(null),
    palette = useScenePalette(ref),
    fallback = (
      <CellEnergySemanticScene
        state={state}
        glucose={glucose}
        oxygen={oxygen}
        demand={demand}
        fermentation={fermentation}
      />
    );
  return (
    <div ref={ref}>
      <ThreeSceneSurface
        label={state.summary}
        fallback={fallback}
        camera={{ position: [0, 0, 6] }}
        legend={
          <>
            <span>
              <i data-tone="central" />
              glucose
            </span>
            <span>
              <i data-tone="pair" />
              oxygen
            </span>
            <span>
              <i data-tone="outer" />
              ATP
            </span>
          </>
        }
      >
        <SceneEnvironment palette={palette} ambient={1.45} keyIntensity={1.5} />
        <SceneContactShadow y={-3.1} radius={3.3} color={palette.foreground} />
        <SceneOrbit>
          <CellBoundary color={palette.secondary} />
          <CellOrganelle
            position={[0.4, 0, 0]}
            kind="mitochondrion"
            color={palette.warning}
            accent={palette.background}
          />
          <CargoFlow from={[-3, 1.15, 0]} to={[-0.6, 0.35, 0]} count={glucose} color={palette.accent} />
          <CargoFlow from={[-3, -1.15, 0]} to={[-0.6, -0.35, 0]} count={oxygen} color={palette.secondary} />
          <CargoFlow
            from={[1.25, 0, 0]}
            to={[2.55, 0, 0]}
            count={state.atpProduction / 50}
            color={palette.warning}
          />
          <CellOrganelle
            position={[2.65, 0, 0]}
            kind="membrane"
            color={state.workFraction >= 1 ? palette.secondary : palette.foreground}
            accent={palette.accent}
          />
          {state.fermentationRate > 0 && (
            <CargoFlow
              from={[-0.4, 0.65, 0.1]}
              to={[-0.4, 1.8, 0.1]}
              count={state.fermentationRate}
              color={palette.foreground}
            />
          )}
          <SceneBond from={[2.65, -0.5, 0]} to={[2.65, 0.5, 0]} color={palette.accent} radius={0.04} />
        </SceneOrbit>
      </ThreeSceneSurface>
    </div>
  );
}
export function CellEnergyThreeLab(props: CellEnergyThreeLabProps = {}): ReactNode {
  return <CellEnergyLab {...props} sceneRenderer={CellEnergyThreeScene} />;
}
