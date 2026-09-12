'use client';

import { useMemo, useRef, type ReactNode } from 'react';
import { Quaternion, Vector3 } from 'three';
import {
  MolecularGeometryLab,
  MolecularGeometryProjectedScene,
  type MolecularGeometryProps,
  type MolecularGeometrySceneProps,
} from '../../chem/molecular-geometry/index.js';
import { hasDirectionalHybridModel } from '../../chem/molecular-geometry/core.js';
import { useScenePalette, type ScenePalette } from '../palette.js';
import { ThreeSceneSurface } from '../surface.js';
import { SceneAtom, SceneBond, SceneEnvironment, SceneOrbit } from '../primitives.js';

export type MolecularGeometryThreeLabProps = Omit<MolecularGeometryProps, 'sceneRenderer'>;

function Dipole({ to, color }: { to: [number, number, number]; color: string }): ReactNode {
  const quaternion = useMemo(
    () =>
      new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), new Vector3(...to).normalize()).toArray() as [
        number,
        number,
        number,
        number,
      ],
    [to],
  );
  return (
    <group quaternion={quaternion}>
      <mesh position={[0, 0.7, 0]}>
        <cylinderGeometry args={[0.018, 0.018, 0.42, 10]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh position={[0, 1, 0]}>
        <coneGeometry args={[0.09, 0.18, 14]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </group>
  );
}

function DirectionalShape({
  direction,
  scale,
  color,
  opacity,
}: {
  direction: [number, number, number];
  scale: [number, number, number];
  color: string;
  opacity: number;
}): ReactNode {
  const transform = useMemo(() => {
    const vector = new Vector3(...direction),
      position = vector.clone().multiplyScalar(0.5);
    const quaternion = new Quaternion().setFromUnitVectors(new Vector3(0, 0, 1), vector.clone().normalize());
    return {
      position: position.toArray() as [number, number, number],
      quaternion: quaternion.toArray() as [number, number, number, number],
    };
  }, [direction]);
  return (
    <mesh position={transform.position} quaternion={transform.quaternion} scale={scale}>
      <sphereGeometry args={[1, 24, 16]} />
      <meshStandardMaterial color={color} transparent opacity={opacity} depthWrite={false} />
    </mesh>
  );
}

function Molecule({
  spec,
  showLonePairs,
  showDipoles,
  showDomains,
  showHybridOrbitals,
  palette,
}: MolecularGeometrySceneProps & { palette: ScenePalette }): ReactNode {
  return (
    <group>
      <SceneAtom radius={0.34} color={palette.accent} roughness={0.34} />
      {spec.vectors.slice(0, spec.bonds + spec.lonePairs).map((vector, index) => {
        const bonded = index < spec.bonds;
        if (!bonded && !showLonePairs) return null;
        const direction: [number, number, number] = [vector.x * 1.8, vector.y * 1.8, vector.z * 1.8];
        const pairBase: [number, number, number] = [vector.x * 1.3, vector.y * 1.3, vector.z * 1.3];
        return (
          <group key={index}>
            {bonded && (
              <>
                <SceneBond to={direction} color={palette.foreground} radius={0.055} radialSegments={18} />
                {showDipoles && <Dipole to={direction} color={palette.warning} />}
                <SceneAtom position={direction} radius={0.25} color={palette.secondary} roughness={0.42} />
              </>
            )}
            {!bonded && (
              <group position={pairBase}>
                <mesh position={[-0.09, 0, 0]}>
                  <sphereGeometry args={[0.085, 18, 12]} />
                  <meshStandardMaterial color={palette.secondary} />
                </mesh>
                <mesh position={[0.09, 0, 0]}>
                  <sphereGeometry args={[0.085, 18, 12]} />
                  <meshStandardMaterial color={palette.secondary} />
                </mesh>
              </group>
            )}
            {showDomains && (
              <DirectionalShape
                direction={direction}
                scale={[0.35, 0.35, 1.05]}
                color={bonded ? palette.accent : palette.secondary}
                opacity={0.12}
              />
            )}
            {showHybridOrbitals && hasDirectionalHybridModel(spec) && (
              <DirectionalShape
                direction={[vector.x * 1.44, vector.y * 1.44, vector.z * 1.44]}
                scale={[0.24, 0.24, 0.78]}
                color={bonded ? palette.accent : palette.warning}
                opacity={0.22}
              />
            )}
          </group>
        );
      })}
    </group>
  );
}

export function MolecularGeometryThreeScene(props: MolecularGeometrySceneProps): ReactNode {
  const hostRef = useRef<HTMLDivElement>(null);
  const palette = useScenePalette(hostRef);
  const label = `${props.spec.formula}, ${props.spec.shape}, bond angle ${props.spec.angle}, ${props.spec.lonePairs} lone pairs, ${props.spec.polar ? 'polar' : 'non-polar'}; three-dimensional model`;
  const fallback = <MolecularGeometryProjectedScene {...props} />;
  const legend = (
    <>
      <span>
        <i data-tone="central" />
        {props.spec.central}
      </span>
      <span>
        <i data-tone="outer" />
        {props.spec.outer}
      </span>
      {props.showLonePairs && props.spec.lonePairs > 0 && (
        <span>
          <i data-tone="pair" />
          lone pair
        </span>
      )}
    </>
  );
  return (
    <div ref={hostRef}>
      <ThreeSceneSurface
        label={label}
        fallback={fallback}
        orthographic
        camera={{ position: [0, 0, 6], zoom: 92 }}
        legend={legend}
      >
        <SceneEnvironment palette={palette} ambient={1.7} keyIntensity={2.2} />
        <SceneOrbit>
          <group rotation={[(props.pitch * Math.PI) / 180, (props.yaw * Math.PI) / 180, 0]}>
            <Molecule {...props} palette={palette} />
          </group>
        </SceneOrbit>
      </ThreeSceneSurface>
    </div>
  );
}

export function MolecularGeometryThreeLab(props: MolecularGeometryThreeLabProps = {}): ReactNode {
  return <MolecularGeometryLab {...props} sceneRenderer={MolecularGeometryThreeScene} />;
}
