'use client';
import { useRef, type ReactNode } from 'react';
import {
  OrbitalOverlapLab,
  OrbitalOverlapProjectedScene,
  type OrbitalOverlapProps,
  type OrbitalOverlapSceneProps,
} from '../../chem/orbital-overlap/index.js';
import { useScenePalette } from '../palette.js';
import { SceneEnvironment } from '../primitives.js';
import { ThreeSceneSurface } from '../surface.js';
export type OrbitalOverlapThreeLabProps = Omit<OrbitalOverlapProps, 'sceneRenderer'>;
function Lobe({
  position,
  scale,
  color,
}: {
  position: [number, number, number];
  scale: [number, number, number];
  color: string;
}): ReactNode {
  return (
    <mesh position={position} scale={scale}>
      <sphereGeometry args={[1, 28, 18]} />
      <meshStandardMaterial color={color} transparent opacity={0.62} roughness={0.38} />
    </mesh>
  );
}
export function OrbitalOverlapThreeScene(p: OrbitalOverlapSceneProps): ReactNode {
  const ref = useRef<HTMLDivElement>(null),
    pal = useScenePalette(ref),
    d = 0.42 + p.separation * 0.34,
    same = p.phase === 'bonding',
    pi = p.mode === 'p-p-pi',
    s = p.mode === 's-s-sigma';
  const atom = (side: -1 | 1) => (
    <group key={side} position={[side * d, 0, 0]}>
      <mesh>
        <sphereGeometry args={[0.08, 18, 12]} />
        <meshStandardMaterial color={pal.warning} />
      </mesh>
      {s ? (
        <Lobe
          position={[0, 0, 0]}
          scale={[0.55, 0.55, 0.55]}
          color={side === 1 && !same ? pal.secondary : pal.accent}
        />
      ) : pi ? (
        <>
          <Lobe
            position={[0, 0.48, 0]}
            scale={[0.4, 0.62, 0.4]}
            color={side === 1 && !same ? pal.secondary : pal.accent}
          />
          <Lobe
            position={[0, -0.48, 0]}
            scale={[0.4, 0.62, 0.4]}
            color={side === 1 && !same ? pal.accent : pal.secondary}
          />
        </>
      ) : (
        <>
          <Lobe
            position={[-side * 0.48, 0, 0]}
            scale={[0.62, 0.4, 0.4]}
            color={side === 1 && !same ? pal.secondary : pal.accent}
          />
          <Lobe
            position={[side * 0.48, 0, 0]}
            scale={[0.62, 0.4, 0.4]}
            color={side === 1 && !same ? pal.accent : pal.secondary}
          />
        </>
      )}
    </group>
  );
  return (
    <div ref={ref}>
      <ThreeSceneSurface
        label={`${p.mode}, ${p.phase} orbital overlap`}
        fallback={<OrbitalOverlapProjectedScene {...p} />}
        orthographic
        camera={{ position: [0, 0, 6], zoom: 140 }}
        legend={
          <>
            <span>
              <i data-tone="central" />
              positive phase
            </span>
            <span>
              <i data-tone="outer" />
              negative phase
            </span>
          </>
        }
      >
        <SceneEnvironment palette={pal} ambient={1.8} keyIntensity={1.8} keyPosition={[3, 4, 6]} />
        <group rotation={[(p.pitch * Math.PI) / 180, (p.yaw * Math.PI) / 180, 0]}>
          {atom(-1)}
          {atom(1)}
        </group>
      </ThreeSceneSurface>
    </div>
  );
}
export function OrbitalOverlapThreeLab(p: OrbitalOverlapThreeLabProps = {}): ReactNode {
  return <OrbitalOverlapLab {...p} sceneRenderer={OrbitalOverlapThreeScene} />;
}
