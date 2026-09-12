'use client';
import { useRef, type ReactNode } from 'react';
import {
  MeiosisExplorerLab,
  MeiosisSemanticScene,
  type MeiosisExplorerLabProps,
  type MeiosisSceneProps,
} from '../../biology/cell-division/index.js';
import { useScenePalette } from '../palette.js';
import { SceneAtom, SceneBond, SceneEnvironment, SceneOrbit } from '../primitives.js';
import { ThreeSceneSurface } from '../surface.js';
import { CellBoundary } from './cell-world.js';

export type MeiosisExplorerThreeLabProps = Omit<MeiosisExplorerLabProps, 'sceneRenderer'>;

function Chromatid({
  x,
  y,
  color,
  tipColor,
  separated = false,
}: {
  x: number;
  y: number;
  color: string;
  tipColor?: string;
  separated?: boolean;
}): ReactNode {
  if (separated)
    return (
      <SceneBond from={[x, y - 0.32, 0]} to={[x, y + 0.32, 0]} color={tipColor ?? color} radius={0.065} />
    );
  return (
    <group position={[x, y, 0]} rotation={[0, 0, Math.PI / 4]}>
      <SceneBond from={[-0.3, 0, 0]} to={[0.3, 0, 0]} color={color} radius={0.06} />
      <SceneBond from={[0, -0.3, 0]} to={[0, 0.3, 0]} color={tipColor ?? color} radius={0.06} />
      <SceneAtom radius={0.075} color={color} detail="low" />
    </group>
  );
}

function Cell({
  x,
  y,
  r = 1.15,
  color,
  children,
}: {
  x: number;
  y: number;
  r?: number;
  color: string;
  children: ReactNode;
}): ReactNode {
  return (
    <CellBoundary position={[x, y, 0]} radius={r} color={color}>
      {children}
    </CellBoundary>
  );
}

export function MeiosisExplorerThreeScene({
  state,
  crossover,
  orientation,
  products,
}: MeiosisSceneProps): ReactNode {
  const ref = useRef<HTMLDivElement>(null),
    palette = useScenePalette(ref);
  const maternal = palette.accent,
    paternal = palette.warning,
    leftFirst = orientation === 'maternal-left';
  const fallback = (
    <MeiosisSemanticScene state={state} crossover={crossover} orientation={orientation} products={products} />
  );
  let content: ReactNode;
  if (state.checkpoint === 'anaphase-i')
    content = (
      <>
        <Cell x={-1.45} y={0} color={palette.secondary}>
          <Chromatid x={0} y={0} color={leftFirst ? maternal : paternal} />
        </Cell>
        <Cell x={1.45} y={0} color={palette.secondary}>
          <Chromatid x={0} y={0} color={leftFirst ? paternal : maternal} />
        </Cell>
      </>
    );
  else if (state.checkpoint === 'metaphase-ii')
    content = (
      <>
        <Cell x={-1.45} y={0} color={palette.secondary}>
          <Chromatid x={0} y={0} color={leftFirst ? maternal : paternal} />
        </Cell>
        <Cell x={1.45} y={0} color={palette.secondary}>
          <Chromatid x={0} y={0} color={leftFirst ? paternal : maternal} />
        </Cell>
        <SceneAtom radius={0.12} position={[-2.2, 0, 0]} color={palette.secondary} />
        <SceneAtom radius={0.12} position={[-0.7, 0, 0]} color={palette.secondary} />
        <SceneAtom radius={0.12} position={[0.7, 0, 0]} color={palette.secondary} />
        <SceneAtom radius={0.12} position={[2.2, 0, 0]} color={palette.secondary} />
      </>
    );
  else if (state.checkpoint === 'products')
    content = (
      <>
        {(
          [
            [-1.4, 0.75],
            [-1.4, -0.75],
            [1.4, 0.75],
            [1.4, -0.75],
          ] as [number, number][]
        ).map(([x, y], index) => (
          <Cell key={index} x={x} y={y} r={0.64} color={palette.secondary}>
            <Chromatid
              x={0}
              y={0}
              separated
              color={index < 2 ? maternal : paternal}
              tipColor={crossover && index % 2 ? (index < 2 ? paternal : maternal) : undefined}
            />
          </Cell>
        ))}
      </>
    );
  else
    content = (
      <Cell x={0} y={0} r={2.05} color={palette.secondary}>
        <Chromatid
          x={-0.35}
          y={0}
          color={maternal}
          tipColor={crossover && state.checkpoint !== 'pairing' ? paternal : undefined}
        />
        <Chromatid
          x={0.35}
          y={0}
          color={paternal}
          tipColor={crossover && state.checkpoint !== 'pairing' ? maternal : undefined}
        />
        {state.checkpoint === 'metaphase-i' && (
          <>
            <SceneAtom radius={0.13} position={[-1.65, 0, 0]} color={palette.secondary} />
            <SceneAtom radius={0.13} position={[1.65, 0, 0]} color={palette.secondary} />
            <SceneBond from={[-1.65, 0, 0]} to={[-0.35, 0, 0]} color={palette.secondary} radius={0.018} />
            <SceneBond from={[1.65, 0, 0]} to={[0.35, 0, 0]} color={palette.secondary} radius={0.018} />
          </>
        )}
      </Cell>
    );
  return (
    <div ref={ref}>
      <ThreeSceneSurface
        label={`${state.title}. ${state.summary}`}
        fallback={fallback}
        // Four r≈1.15 cells span ~5 units at the widest stage, so pull in until they fill the
        // frame instead of floating as small dots in the middle of it.
        camera={{ position: [0, 0, 4.4] }}
        legend={
          <>
            <span>
              <i data-tone="central" />
              maternal homolog
            </span>
            <span>
              <i data-tone="outer" />
              paternal homolog
            </span>
            <span>
              <i data-tone="pair" />
              cell boundary
            </span>
          </>
        }
      >
        <SceneEnvironment palette={palette} ambient={1.5} keyIntensity={1.3} />
        <SceneOrbit>{content}</SceneOrbit>
      </ThreeSceneSurface>
    </div>
  );
}

export function MeiosisExplorerThreeLab(props: MeiosisExplorerThreeLabProps = {}): ReactNode {
  return <MeiosisExplorerLab {...props} sceneRenderer={MeiosisExplorerThreeScene} />;
}
