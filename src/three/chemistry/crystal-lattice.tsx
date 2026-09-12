'use client';

import { useLayoutEffect, useMemo, useRef, type ReactNode } from 'react';
import { Color, InstancedMesh, Object3D } from 'three';
import {
  CrystalLatticeLab,
  CrystalLatticeProjectedScene,
  LATTICE_FACTS,
  latticePoints,
  type CrystalLatticeProps,
  type CrystalLatticeSceneProps,
} from '../../chem/crystal-lattice/index.js';
import { useScenePalette } from '../palette.js';
import { ThreeSceneSurface } from '../surface.js';
import { SceneEnvironment, SceneOrbit } from '../primitives.js';

export type CrystalLatticeThreeLabProps = Omit<CrystalLatticeProps, 'sceneRenderer'>;

function InstancedAtoms({
  points,
  repetitions,
  accent,
  secondary,
  warning,
}: {
  points: ReturnType<typeof latticePoints>;
  repetitions: number;
  accent: string;
  secondary: string;
  warning: string;
}): ReactNode {
  const ref = useRef<InstancedMesh>(null),
    helper = useMemo(() => new Object3D(), []);
  useLayoutEffect(() => {
    if (!ref.current) return;
    const colors = { corner: new Color(accent), face: new Color(secondary), body: new Color(warning) };
    points.forEach((point, index) => {
      helper.position.set(point.x - repetitions / 2, point.y - repetitions / 2, point.z - repetitions / 2);
      helper.scale.setScalar(point.site === 'corner' ? 0.82 : 1);
      helper.updateMatrix();
      ref.current?.setMatrixAt(index, helper.matrix);
      ref.current?.setColorAt(index, colors[point.site]);
    });
    ref.current.instanceMatrix.needsUpdate = true;
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
  }, [accent, helper, points, repetitions, secondary, warning]);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, points.length]}>
      <sphereGeometry args={[0.16, 18, 12]} />
      {/* Per-instance colour comes from setColorAt (instanceColor). `vertexColors` would
          multiply by a geometry colour attribute that does not exist → black atoms. */}
      <meshStandardMaterial roughness={0.36} metalness={0.08} />
    </instancedMesh>
  );
}

function CellGrid({ repetitions, color }: { repetitions: number; color: string }): ReactNode {
  const positions = useMemo(() => {
    const values: number[] = [],
      h = repetitions / 2;
    const line = (a: number[], b: number[]): void => {
      values.push(...a, ...b);
    };
    for (let i = 0; i <= repetitions; i += 1)
      for (let j = 0; j <= repetitions; j += 1) {
        const a = i - h,
          b = j - h;
        line([-h, a, b], [h, a, b]);
        line([a, -h, b], [a, h, b]);
        line([a, b, -h], [a, b, h]);
      }
    return new Float32Array(values);
  }, [repetitions]);
  return (
    <lineSegments>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <lineBasicMaterial color={color} transparent opacity={0.35} />
    </lineSegments>
  );
}

export function CrystalLatticeThreeScene(props: CrystalLatticeSceneProps): ReactNode {
  const hostRef = useRef<HTMLDivElement>(null),
    palette = useScenePalette(hostRef);
  const points = useMemo(() => latticePoints(props.kind, props.repetitions), [props.kind, props.repetitions]);
  const facts = LATTICE_FACTS[props.kind],
    label = `${facts.label}, ${props.repetitions} by ${props.repetitions} by ${props.repetitions} repeated cells, coordination number ${facts.coordination}`;
  const fallback = <CrystalLatticeProjectedScene {...props} />;
  const legend = (
    <>
      <span>
        <i data-tone="central" />
        corner site
      </span>
      {props.kind === 'body-centred' && (
        <span>
          <i data-tone="nucleus" />
          body site
        </span>
      )}
      {props.kind === 'face-centred' && (
        <span>
          <i data-tone="outer" />
          face site
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
        // Orthographic: zoom is px per world unit. A 1×1×1 cell should span ~60% of the frame
        // height, and a 3×3×3 stack must still fit — hence the +0.5 softening.
        camera={{ position: [4.8, 3.8, 5.4], zoom: 210 / (props.repetitions + 0.5) }}
        legend={legend}
      >
        <SceneEnvironment palette={palette} />
        <SceneOrbit>
          <group rotation={[(props.pitch * Math.PI) / 180, (props.yaw * Math.PI) / 180, 0]}>
            <CellGrid repetitions={props.repetitions} color={palette.foreground} />
            <InstancedAtoms
              points={points}
              repetitions={props.repetitions}
              accent={palette.accent}
              secondary={palette.secondary}
              warning={palette.warning}
            />
            {props.showPlane && (
              <mesh rotation={[-Math.PI / 2, 0, Math.PI / 4]}>
                <planeGeometry args={[props.repetitions * 1.35, props.repetitions * 1.35]} />
                <meshBasicMaterial
                  color={palette.accent}
                  transparent
                  opacity={0.14}
                  depthWrite={false}
                  side={2}
                />
              </mesh>
            )}
          </group>
        </SceneOrbit>
      </ThreeSceneSurface>
    </div>
  );
}

export function CrystalLatticeThreeLab(props: CrystalLatticeThreeLabProps = {}): ReactNode {
  return <CrystalLatticeLab {...props} sceneRenderer={CrystalLatticeThreeScene} />;
}
