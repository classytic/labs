'use client';
import { useMemo, useRef, type ReactNode } from 'react';
import {
  SpatialLorentzLab,
  SpatialLorentzProjectedScene,
  fieldsFor,
  type SpatialLorentzProps,
  type SpatialLorentzSceneProps,
} from '../../physics/fields/index.js';
import { useScenePalette } from '../palette.js';
import { SceneContactShadow, SceneEnvironment, SceneLabel, SceneTrail, SceneVector } from '../primitives.js';
import { ThreeSceneSurface } from '../surface.js';

export type SpatialLorentzThreeLabProps = Omit<SpatialLorentzProps, 'sceneRenderer'>;

/** Lattice of field arrows filling the volume, so the field reads as a SPACE, not a row. */
const LATTICE = [-1.9, 0, 1.9];

export function SpatialLorentzThreeScene(p: SpatialLorentzSceneProps): ReactNode {
  const ref = useRef<HTMLDivElement>(null);
  const pal = useScenePalette(ref);
  const trail = useMemo(() => p.path.map((v): [number, number, number] => [v.x, v.y, v.z]), [p.path]);
  const end = p.path.at(-1)!;
  // Draw the fields that ACTUALLY act. The scene used to draw five arrows along +y whatever the
  // mode, so in magnetic mode it showed an electric field that is not there, pointing the wrong
  // way: B lies along +z. E is vertical, B points along the viewing axis.
  const { e, b } = fieldsFor(p.mode, p.strength);
  const hasE = Math.abs(e.y) > 1e-6;
  const hasB = Math.abs(b.z) > 1e-6;
  const floor = Math.min(-2.2, ...p.path.map((v) => v.y)) - 0.15;

  return (
    <div ref={ref}>
      <ThreeSceneSurface
        label={`${p.mode} field. A ${p.charge > 0 ? 'positive' : 'negative'} charge traces a three-dimensional path; ${
          hasE ? 'the electric field points up' : 'there is no electric field'
        } and ${hasB ? 'the magnetic field points along the view axis' : 'there is no magnetic field'}.`}
        fallback={<SpatialLorentzProjectedScene {...p} />}
        camera={{ position: [1.5, 2.1, 6.9] }}
        legend={
          <>
            <span>
              <i data-tone="central" />
              trajectory
            </span>
            <span>
              <i data-tone="nucleus" />
              {p.charge > 0 ? 'positive charge (+q)' : 'negative charge (−q)'}
            </span>
            {hasE && (
              <span>
                <i data-tone="outer" />E field (up)
              </span>
            )}
            {hasB && (
              <span>
                <i data-tone="neutral" />B field (along view)
              </span>
            )}
          </>
        }
      >
        {/* A lit rig, not a flat one: the trajectory is solid geometry, so it needs a key light
            to read as a ribbon curving through space. */}
        <SceneEnvironment palette={pal} ambient={1.3} keyIntensity={1.25} />
        <group rotation={[(p.pitch * Math.PI) / 180, (p.yaw * Math.PI) / 180, 0]}>
          {/* A ground shadow is what makes the loop read as a path through a VOLUME rather than
              a flat curve drawn on the page. */}
          <SceneContactShadow y={floor} radius={3.4} opacity={0.22} />

          {/* electric field: vertical arrows spread across the floor plane */}
          {hasE &&
            LATTICE.flatMap((x) =>
              LATTICE.map((z) => (
                <group key={`e${x}:${z}`}>
                  <SceneVector
                    from={[x, -1.15, z]}
                    to={[x, 1.15, z]}
                    color={pal.secondary}
                    radius={0.02}
                    opacity={0.6}
                  />
                </group>
              )),
            )}
          {/* magnetic field: arrows along the view axis, offset so they never sit on the path */}
          {hasB &&
            LATTICE.flatMap((x) =>
              LATTICE.map((y) => (
                <SceneVector
                  key={`b${x}:${y}`}
                  from={[x, y, -1.9]}
                  to={[x, y, 1.9]}
                  color={pal.foreground}
                  radius={0.015}
                  opacity={0.4}
                />
              )),
            )}
          {hasE && (
            <SceneLabel
              position={[LATTICE[2]! + 0.35, 1.35, LATTICE[2]!]}
              color={pal.secondary}
              halo={pal.background}
              size={0.38}
            >
              E
            </SceneLabel>
          )}
          {hasB && (
            <SceneLabel
              position={[LATTICE[2]! + 0.35, LATTICE[2]!, 2.15]}
              color={pal.foreground}
              halo={pal.background}
              size={0.38}
            >
              B
            </SceneLabel>
          )}

          <SceneTrail points={trail} color={pal.accent} radius={0.05} focus="active" />
          <mesh position={[end.x, end.y, end.z]}>
            <sphereGeometry args={[0.15, 20, 14]} />
            <meshStandardMaterial
              color={pal.warning}
              emissive={pal.warning}
              emissiveIntensity={0.4}
              roughness={0.36}
            />
          </mesh>
          <SceneLabel
            position={[end.x, end.y + 0.34, end.z]}
            color={pal.foreground}
            halo={pal.background}
            size={0.32}
          >
            {p.charge > 0 ? '+q' : '−q'}
          </SceneLabel>
        </group>
      </ThreeSceneSurface>
    </div>
  );
}

export function SpatialLorentzThreeLab(p: SpatialLorentzThreeLabProps = {}): ReactNode {
  return <SpatialLorentzLab {...p} sceneRenderer={SpatialLorentzThreeScene} />;
}
