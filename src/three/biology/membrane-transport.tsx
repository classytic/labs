'use client';
import { useMemo, useRef, type ReactNode } from 'react';
import {
  MembraneTransportLab,
  MembraneTransportSemanticScene,
  type MembraneTransportLabProps,
  type MembraneTransportSceneProps,
} from '../../biology/membrane-transport/index.js';
import { useScenePalette } from '../palette.js';
import { SceneAtom, SceneBond, SceneEnvironment } from '../primitives.js';
import { ThreeSceneSurface } from '../surface.js';
import { Bilayer } from './cell-world.js';
export type MembraneTransportThreeLabProps = Omit<MembraneTransportLabProps, 'sceneRenderer'>;
function Particles({
  count,
  side,
  color,
  water = false,
}: {
  count: number;
  side: 'outside' | 'inside';
  color: string;
  water?: boolean;
}): ReactNode {
  const points = useMemo(
    () =>
      Array.from({ length: count }, (_, index): [number, number, number] => {
        const column = index % 5,
          row = Math.floor(index / 5);
        return [
          -2.2 + column * 1.05,
          side === 'outside' ? 0.82 + row * 0.46 : -0.82 - row * 0.46,
          (((index * 7) % 5) - 2) * 0.08,
        ];
      }),
    [count, side],
  );
  return (
    <>
      {points.map((position, index) => (
        <SceneAtom key={index} position={position} radius={water ? 0.105 : 0.15} color={color} detail="low" />
      ))}
    </>
  );
}
function Direction({
  direction,
  color,
}: {
  direction: MembraneTransportSceneProps['state']['netDirection'];
  color: string;
}): ReactNode {
  if (direction === 'equilibrium' || direction === 'stalled')
    return (
      <mesh position={[1.15, 0, 0.15]}>
        <torusGeometry args={[0.22, 0.035, 10, 26]} />
        <meshBasicMaterial color={color} />
      </mesh>
    );
  const into = direction === 'into cell';
  return (
    <group position={[1.15, 0, 0.15]}>
      <SceneBond
        from={[0, into ? 0.55 : -0.55, 0]}
        to={[0, into ? -0.55 : 0.55, 0]}
        color={color}
        radius={0.045}
      />
      <mesh position={[0, into ? -0.62 : 0.62, 0]} rotation={[0, 0, into ? 0 : Math.PI]}>
        <coneGeometry args={[0.13, 0.28, 18]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  );
}
export function MembraneTransportThreeScene({
  state,
  outside,
  inside,
  atp,
}: MembraneTransportSceneProps): ReactNode {
  const ref = useRef<HTMLDivElement>(null),
    palette = useScenePalette(ref),
    water = state.mode === 'osmosis',
    fallback = <MembraneTransportSemanticScene state={state} outside={outside} inside={inside} atp={atp} />;
  return (
    <div ref={ref}>
      <ThreeSceneSurface
        label={state.summary}
        fallback={fallback}
        camera={{ position: [0, 0, 4.3] }}
        legend={
          <>
            <span>
              <i data-tone="central" />
              {water ? 'water' : 'solute'}
            </span>
            <span>
              <i data-tone="pair" />
              phospholipid bilayer
            </span>
            {state.requiresProtein && (
              <span>
                <i data-tone="outer" />
                {state.mode === 'active' ? 'pump' : 'channel'}
              </span>
            )}
          </>
        }
      >
        <SceneEnvironment palette={palette} ambient={1.5} keyIntensity={1.3} />
        <Bilayer protein={state.requiresProtein} color={palette.foreground} accent={palette.warning} />
        <Particles
          count={outside}
          side="outside"
          color={water ? palette.secondary : palette.accent}
          water={water}
        />
        <Particles
          count={inside}
          side="inside"
          color={water ? palette.secondary : palette.accent}
          water={water}
        />
        <Direction
          direction={state.netDirection}
          color={state.netDirection === 'stalled' ? palette.foreground : palette.secondary}
        />
        {state.requiresAtp && atp && (
          <group position={[-1.05, 0, 0.2]}>
            <SceneAtom radius={0.2} color={palette.warning} />
            <mesh position={[0, 0, 0.22]}>
              <ringGeometry args={[0.08, 0.13, 18]} />
              <meshBasicMaterial color={palette.background} />
            </mesh>
          </group>
        )}
      </ThreeSceneSurface>
    </div>
  );
}
export function MembraneTransportThreeLab(props: MembraneTransportThreeLabProps = {}): ReactNode {
  return <MembraneTransportLab {...props} sceneRenderer={MembraneTransportThreeScene} />;
}
