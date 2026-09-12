'use client';
import { useMemo, useRef, type ReactNode } from 'react';
import { Quaternion, Vector3 } from 'three';
import {
  StereochemistryLab,
  StereochemistryProjectedScene,
  chiralVectors,
  mirrorEnantiomer,
  type ChiralGroup,
  type Enantiomer,
  type StereochemistryProps,
  type StereochemistrySceneProps,
} from '../../chem/stereochemistry/index.js';
import { useScenePalette, type ScenePalette } from '../palette.js';
import { ThreeSceneSurface } from '../surface.js';
export type StereochemistryThreeLabProps = Omit<StereochemistryProps, 'sceneRenderer'>;

function Bond({ to, color }: { to: [number, number, number]; color: string }): ReactNode {
  const transform = useMemo(() => {
    const end = new Vector3(...to),
      midpoint = end.clone().multiplyScalar(0.5),
      quaternion = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), end.clone().normalize());
    return {
      midpoint: midpoint.toArray() as [number, number, number],
      quaternion: quaternion.toArray() as [number, number, number, number],
      length: end.length(),
    };
  }, [to]);
  return (
    <mesh position={transform.midpoint} quaternion={transform.quaternion}>
      <cylinderGeometry args={[0.045, 0.045, transform.length, 14]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}
function toneColor(group: ChiralGroup, palette: ScenePalette): string {
  return group.tone === 'accent'
    ? palette.accent
    : group.tone === 'secondary'
      ? palette.secondary
      : group.tone === 'warning'
        ? palette.warning
        : palette.foreground;
}
function ChiralModel({
  groups,
  enantiomer,
  palette,
  x,
}: {
  groups: StereochemistrySceneProps['spec']['groups'];
  enantiomer: Enantiomer;
  palette: ScenePalette;
  x: number;
}): ReactNode {
  return (
    <group position={[x, 0, 0]}>
      <mesh>
        <sphereGeometry args={[0.28, 28, 18]} />
        <meshStandardMaterial color={palette.accent} roughness={0.34} />
      </mesh>
      {chiralVectors(enantiomer).map((vector, index) => {
        const direction: [number, number, number] = [vector.x * 0.82, vector.y * 0.82, vector.z * 0.82],
          group = groups[index]!,
          color = toneColor(group, palette);
        return (
          <group key={group.priority}>
            <Bond to={direction} color={palette.foreground} />
            <mesh position={direction}>
              <sphereGeometry args={[0.18 + (4 - group.priority) * 0.018, 24, 16]} />
              <meshStandardMaterial color={color} roughness={0.4} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
export function StereochemistryThreeScene(props: StereochemistrySceneProps): ReactNode {
  const hostRef = useRef<HTMLDivElement>(null),
    palette = useScenePalette(hostRef),
    mirror = mirrorEnantiomer(props.enantiomer),
    fallback = <StereochemistryProjectedScene {...props} />;
  const legend = (
    <>
      {props.spec.groups.map((group) => (
        <span key={group.priority}>
          <i style={{ background: toneColor(group, palette) }} />
          {props.showPriorities ? `${group.priority} · ` : ''}
          {group.label}
        </span>
      ))}
    </>
  );
  return (
    <div ref={hostRef}>
      <ThreeSceneSurface
        label={`${props.enantiomer}-${props.spec.name}${props.compareMirror ? ` and its ${mirror} mirror image` : ''}, rotatable tetrahedral models`}
        fallback={fallback}
        orthographic
        camera={{ position: [0, 0, 6], zoom: props.compareMirror ? 78 : 96 }}
        legend={legend}
      >
        <color attach="background" args={[palette.background]} />
        <ambientLight intensity={1.7} />
        <directionalLight position={[3, 5, 6]} intensity={2.1} />
        <group rotation={[(props.pitch * Math.PI) / 180, (props.yaw * Math.PI) / 180, 0]}>
          <ChiralModel
            groups={props.spec.groups}
            enantiomer={props.enantiomer}
            palette={palette}
            x={props.compareMirror ? -1.2 : 0}
          />
          {props.compareMirror && (
            <ChiralModel groups={props.spec.groups} enantiomer={mirror} palette={palette} x={1.2} />
          )}
        </group>
        {props.compareMirror && (
          <mesh position={[0, 0, -0.25]}>
            <planeGeometry args={[0.02, 3]} />
            <meshBasicMaterial color={palette.foreground} transparent opacity={0.18} />
          </mesh>
        )}
      </ThreeSceneSurface>
    </div>
  );
}
export function StereochemistryThreeLab(props: StereochemistryThreeLabProps = {}): ReactNode {
  return <StereochemistryLab {...props} sceneRenderer={StereochemistryThreeScene} />;
}
