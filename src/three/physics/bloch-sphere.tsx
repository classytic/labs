'use client';
import { useRef, type ReactNode } from 'react';
import {
  BlochProjectedScene,
  BlochSphereLab,
  type BlochSceneProps,
  type BlochSphereLabProps,
} from '../../physics/modern/quantum/bloch-preset.js';
import {
  QuantumGateJourneyLab,
  type QuantumGateJourneyLabProps,
} from '../../physics/modern/quantum/gates-preset.js';
import { TranslucentShell } from '../biology/cell-world.js';
import { useScenePalette } from '../palette.js';
import { ThreeSceneSurface } from '../surface.js';
import { SceneEnvironment, SceneLabel, SceneOrbit, SceneRing, SceneVector } from '../primitives.js';

export type BlochSphereThreeLabProps = Omit<BlochSphereLabProps, 'sceneRenderer'>;

const R = 1;

/** The three measurement axes, each a lit rod through the sphere with its poles named. */
const AXES = [
  { key: 'x' as const, dir: [1, 0, 0] as [number, number, number], plus: '|+⟩', minus: '|−⟩' },
  { key: 'y' as const, dir: [0, 0, 1] as [number, number, number], plus: '|i⟩', minus: '|−i⟩' },
  { key: 'z' as const, dir: [0, 1, 0] as [number, number, number], plus: '|0⟩', minus: '|1⟩' },
];

export function BlochSphereThreeScene(p: BlochSceneProps): ReactNode {
  const ref = useRef<HTMLDivElement>(null);
  const pal = useScenePalette(ref);
  const v = p.state;
  // Scene axes are (x, z, y) in three's frame: the qubit's z (|0⟩/|1⟩) is drawn UP, the way
  // every textbook draws it, so "north pole is |0⟩" survives the change of coordinates.
  const tip: [number, number, number] = [v.x * R, v.z * R, v.y * R];

  return (
    <div ref={ref}>
      <ThreeSceneSurface
        label={`Bloch sphere. State vector x ${v.x.toFixed(2)}, y ${v.y.toFixed(2)}, z ${v.z.toFixed(
          2,
        )}. Measuring along ${p.axis.toUpperCase()}.`}
        fallback={<BlochProjectedScene {...p} />}
        camera={{ position: [1.95, 1.45, 2.55] }}
        legend={
          <>
            <span>
              <i data-tone="central" />
              state vector
            </span>
            <span>
              <i data-tone="nucleus" />
              measured axis ({p.axis.toUpperCase()})
            </span>
            <span>
              <i data-tone="neutral" />
              other axes
            </span>
          </>
        }
      >
        <SceneEnvironment palette={pal} ambient={1.5} keyIntensity={1.25} keyPosition={[3, 4, 5]} />
        <SceneOrbit>
          <group>
            {/* The sphere is a translucent SHELL with crisp great circles, not a 36x24 wireframe:
                a dense wireframe on a light page is grey noise and hides the vector inside it. */}
            <TranslucentShell radius={R} color={pal.foreground} opacity={0.1} />
            <SceneRing radius={R} color={pal.foreground} rotation={[Math.PI / 2, 0, 0]} opacity={0.4} />
            <SceneRing radius={R} color={pal.foreground} rotation={[0, 0, 0]} opacity={0.18} />
            <SceneRing radius={R} color={pal.foreground} rotation={[0, Math.PI / 2, 0]} opacity={0.18} />

            {/* axes: the one being measured is highlighted, the others recede */}
            {AXES.map((a) => {
              const measured = p.axis === a.key;
              const color = measured ? pal.warning : pal.foreground;
              const end: [number, number, number] = [
                a.dir[0] * R * 1.18,
                a.dir[1] * R * 1.18,
                a.dir[2] * R * 1.18,
              ];
              const start: [number, number, number] = [-end[0], -end[1], -end[2]];
              return (
                <group key={a.key}>
                  <SceneVector
                    from={start}
                    to={end}
                    color={color}
                    radius={measured ? 0.016 : 0.009}
                    head={false}
                    focus={measured ? 'active' : undefined}
                  />
                  <SceneLabel
                    position={[end[0] * 1.16, end[1] * 1.16, end[2] * 1.16]}
                    color={measured ? pal.warning : pal.foreground}
                    halo={pal.background}
                    size={measured ? 0.26 : 0.22}
                  >
                    {a.plus}
                  </SceneLabel>
                  <SceneLabel
                    position={[start[0] * 1.16, start[1] * 1.16, start[2] * 1.16]}
                    color={measured ? pal.warning : pal.foreground}
                    halo={pal.background}
                    size={measured ? 0.26 : 0.22}
                  >
                    {a.minus}
                  </SceneLabel>
                </group>
              );
            })}

            {/* the state itself: a real arrow from the origin, the brightest thing in the scene */}
            <SceneVector from={[0, 0, 0]} to={tip} color={pal.accent} radius={0.032} focus="active" />
            <mesh position={tip}>
              <sphereGeometry args={[0.075, 20, 16]} />
              <meshStandardMaterial
                color={pal.accent}
                roughness={0.32}
                emissive={pal.accent}
                emissiveIntensity={0.4}
              />
            </mesh>
          </group>
        </SceneOrbit>
      </ThreeSceneSurface>
    </div>
  );
}

export function BlochSphereThreeLab(p: BlochSphereThreeLabProps = {}): ReactNode {
  return <BlochSphereLab {...p} sceneRenderer={BlochSphereThreeScene} />;
}
export type QuantumGateJourneyThreeLabProps = Omit<QuantumGateJourneyLabProps, 'sceneRenderer'>;
export function QuantumGateJourneyThreeLab(p: QuantumGateJourneyThreeLabProps = {}): ReactNode {
  return <QuantumGateJourneyLab {...p} sceneRenderer={BlochSphereThreeScene} />;
}
