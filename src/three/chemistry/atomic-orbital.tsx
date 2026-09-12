'use client';

import { useMemo, useRef, type ReactNode } from 'react';
import { Color } from 'three';
import {
  AtomicOrbitalLab,
  AtomicOrbitalProjectedScene,
  orbitalCloud,
  orbitalFacts,
  type AtomicOrbitalProps,
  type AtomicOrbitalSceneProps,
} from '../../chem/orbitals/index.js';
import { useScenePalette } from '../palette.js';
import { ThreeSceneSurface } from '../surface.js';
import { SceneAtom, SceneEnvironment, SceneOrbit } from '../primitives.js';

export type AtomicOrbitalThreeLabProps = Omit<AtomicOrbitalProps, 'sceneRenderer'>;

function OrbitalPoints({
  kind,
  view,
  yaw,
  pitch,
  samples,
  accent,
  secondary,
}: AtomicOrbitalSceneProps & { accent: string; secondary: string }): ReactNode {
  const geometry = useMemo(() => {
    const source = orbitalCloud(kind, Math.max(120, Math.min(700, samples)));
    const yawRad = (yaw * Math.PI) / 180,
      pitchRad = (pitch * Math.PI) / 180;
    const visible =
      view === 'cloud'
        ? source
        : source.filter((point) => {
            const rotatedZ = -point.x * Math.sin(yawRad) + point.z * Math.cos(yawRad);
            const depth = point.y * Math.sin(pitchRad) + rotatedZ * Math.cos(pitchRad);
            return Math.abs(depth) < 0.18;
          });
    const positions = new Float32Array(visible.length * 3);
    const colors = new Float32Array(visible.length * 3);
    const positive = new Color(accent),
      negative = new Color(secondary);
    visible.forEach((point, index) => {
      positions.set([point.x, point.y, point.z], index * 3);
      const color = point.phase > 0 ? positive : negative;
      colors.set([color.r, color.g, color.b], index * 3);
    });
    return { positions, colors };
  }, [accent, kind, pitch, samples, secondary, view, yaw]);
  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[geometry.positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[geometry.colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={view === 'cloud' ? 0.065 : 0.09}
        sizeAttenuation
        transparent
        opacity={0.82}
        vertexColors
        depthWrite={false}
      />
    </points>
  );
}

export function AtomicOrbitalThreeScene(props: AtomicOrbitalSceneProps): ReactNode {
  const hostRef = useRef<HTMLDivElement>(null);
  const palette = useScenePalette(hostRef);
  const facts = orbitalFacts(props.kind);
  const label = `${props.kind} orbital probability ${props.view}; ${facts.radialNodes} radial and ${facts.angularNodes} angular nodes; three-dimensional model`;
  const fallback = <AtomicOrbitalProjectedScene {...props} />;
  const legend = (
    <>
      <span>
        <i data-tone="central" />
        positive phase
      </span>
      <span>
        <i data-tone="outer" />
        negative phase
      </span>
      <span>
        <i data-tone="nucleus" />
        nucleus
      </span>
    </>
  );
  return (
    <div ref={hostRef}>
      <ThreeSceneSurface
        label={label}
        fallback={fallback}
        orthographic
        camera={{ position: [0, 0, 7], zoom: 72 }}
        legend={legend}
      >
        <SceneEnvironment palette={palette} ambient={1.4} keyIntensity={0} />
        <SceneOrbit>
          <group rotation={[(props.pitch * Math.PI) / 180, (props.yaw * Math.PI) / 180, 0]}>
            <OrbitalPoints {...props} accent={palette.accent} secondary={palette.secondary} />
            <SceneAtom radius={0.09} color={palette.warning} detail="low" />
          </group>
        </SceneOrbit>
      </ThreeSceneSurface>
    </div>
  );
}

export function AtomicOrbitalThreeLab(props: AtomicOrbitalThreeLabProps = {}): ReactNode {
  return <AtomicOrbitalLab {...props} sceneRenderer={AtomicOrbitalThreeScene} />;
}
