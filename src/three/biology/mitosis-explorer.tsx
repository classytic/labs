'use client';
import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { useThree } from '@react-three/fiber';
import {
  MitosisExplorerLab,
  MitosisSemanticScene,
  type MitosisExplorerLabProps,
  type MitosisSceneProps,
  type SpindlePole,
} from '../../biology/cell-division/index.js';
import { useScenePalette, type ScenePalette } from '../palette.js';
import { SceneAtom, SceneBond, SceneContactShadow, SceneEnvironment, SceneOrbit } from '../primitives.js';
import { ThreeSceneSurface } from '../surface.js';
import { TranslucentShell } from './cell-world.js';

export type MitosisExplorerThreeLabProps = Omit<MitosisExplorerLabProps, 'sceneRenderer'>;
// The subject fills the frame at every checkpoint (cell r=2.55 at z=6.4 ≈ 55% of the
// viewport height). At z=8 the whole cell was a small grey ring in a sea of white.
const CAMERA = {
  cell: [0, 0, 5.25],
  nucleus: [0, 0, 3.9],
  prophase: [0, 0, 4.6],
  metaphase: [0, 0, 5.2],
  anaphase: [0, 0, 5.6],
} as const;

function Chromatin({ palette }: { palette: ScenePalette }): ReactNode {
  const strands: [number, number, number][][] = [
    [
      [-0.62, 0.36, 0.28],
      [-0.3, 0.54, 0.34],
      [0.06, 0.34, 0.38],
      [0.46, 0.5, 0.24],
    ],
    [
      [-0.58, -0.12, 0.4],
      [-0.24, 0.06, 0.46],
      [0.12, -0.2, 0.42],
      [0.55, 0.02, 0.3],
    ],
    [
      [-0.42, -0.48, 0.24],
      [-0.08, -0.3, 0.42],
      [0.28, -0.54, 0.35],
      [0.52, -0.32, 0.18],
    ],
  ];
  return (
    <group>
      {strands.flatMap((points, strandIndex) =>
        points
          .slice(0, -1)
          .map((point, index) => (
            <SceneBond
              key={`${strandIndex}-${index}`}
              from={point}
              to={points[index + 1]!}
              color={strandIndex === 1 ? palette.warning : palette.accent}
              radius={0.035}
            />
          )),
      )}
      {strands.flatMap((points, strandIndex) =>
        points.map((position, index) => (
          <SceneAtom
            key={`n-${strandIndex}-${index}`}
            position={position}
            radius={0.055}
            color={strandIndex === 1 ? palette.warning : palette.accent}
            detail="low"
          />
        )),
      )}
    </group>
  );
}

function Mitochondrion({
  position,
  rotation,
  palette,
}: {
  position: [number, number, number];
  rotation: number;
  palette: ScenePalette;
}): ReactNode {
  return (
    <group position={position} rotation={[0, 0, rotation]}>
      <mesh scale={[1.55, 0.72, 0.68]}>
        <sphereGeometry args={[0.48, 32, 20]} />
        <meshStandardMaterial color={palette.warning} roughness={0.5} />
      </mesh>
      <SceneBond
        from={[-0.42, 0.02, 0.34]}
        to={[-0.18, 0.16, 0.4]}
        color={palette.background}
        radius={0.025}
      />
      <SceneBond
        from={[-0.18, 0.16, 0.4]}
        to={[0.04, -0.14, 0.4]}
        color={palette.background}
        radius={0.025}
      />
      <SceneBond
        from={[0.04, -0.14, 0.4]}
        to={[0.28, 0.12, 0.38]}
        color={palette.background}
        radius={0.025}
      />
      <SceneBond
        from={[0.28, 0.12, 0.38]}
        to={[0.45, -0.02, 0.34]}
        color={palette.background}
        radius={0.025}
      />
    </group>
  );
}

function Golgi({ palette }: { palette: ScenePalette }): ReactNode {
  return (
    <group position={[1.35, 0.75, -0.2]} rotation={[0.2, 0, -0.2]}>
      {[0, 1, 2, 3].map((index) => (
        <mesh
          key={index}
          position={[0, (index - 1.5) * 0.13, 0]}
          scale={[1 - index * 0.08, 0.55, 1]}
          rotation={[0, 0, 0.35]}
        >
          <torusGeometry args={[0.35, 0.045, 8, 30, Math.PI * 1.45]} />
          <meshStandardMaterial color={palette.secondary} roughness={0.52} />
        </mesh>
      ))}
    </group>
  );
}

function CellContext({ palette, visible }: { palette: ScenePalette; visible: boolean }): ReactNode {
  if (!visible) return null;
  return (
    <group>
      <Mitochondrion position={[-1.4, 0.8, 0.05]} rotation={0.35} palette={palette} />
      <Mitochondrion position={[1.35, -0.72, 0.15]} rotation={-0.28} palette={palette} />
      <Golgi palette={palette} />
      <SceneAtom position={[-1.55, -0.7, 0.35]} radius={0.15} color={palette.secondary} />
      <SceneAtom position={[1.72, 0.08, -0.28]} radius={0.11} color={palette.accent} />
    </group>
  );
}

function CheckpointCamera({ checkpoint }: { checkpoint: keyof typeof CAMERA }): null {
  const { camera, invalidate } = useThree();
  useEffect(() => {
    const [x, y, z] = CAMERA[checkpoint];
    camera.position.set(x, y, z);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    invalidate();
  }, [camera, checkpoint, invalidate]);
  return null;
}

function Chromosome({
  position,
  separated = false,
  color,
}: {
  position: [number, number, number];
  separated?: boolean;
  color: string;
}): ReactNode {
  const [x, y, z] = position;
  if (separated)
    return (
      <SceneBond from={[x - 0.08, y - 0.3, z]} to={[x + 0.08, y + 0.3, z]} color={color} radius={0.065} />
    );
  return (
    <group position={position} rotation={[0, 0, Math.PI / 4]}>
      <SceneBond from={[-0.34, 0, 0]} to={[0.34, 0, 0]} color={color} radius={0.065} />
      <SceneBond from={[0, -0.34, 0]} to={[0, 0.34, 0]} color={color} radius={0.065} />
      <SceneAtom radius={0.09} color={color} detail="low" />
    </group>
  );
}

function Fibres({ positions, color }: { positions: [number, number, number][]; color: string }): ReactNode {
  const values = useMemo(
    () =>
      new Float32Array(positions.flatMap((position) => [-2.45, 0, 0, ...position, 2.45, 0, 0, ...position])),
    [positions],
  );
  return (
    <lineSegments>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[values, 3]} />
      </bufferGeometry>
      <lineBasicMaterial color={color} transparent opacity={0.42} />
    </lineSegments>
  );
}

function Pole({
  side,
  palette,
  onAttach,
}: {
  side: SpindlePole;
  palette: ScenePalette;
  onAttach: (pole: SpindlePole) => void;
}): ReactNode {
  const x = side === 'left' ? -2.45 : 2.45;
  return (
    <group
      position={[x, 0, 0]}
      onClick={(event) => {
        event.stopPropagation();
        onAttach(side);
      }}
    >
      <SceneAtom radius={0.17} color={palette.secondary} />
      <mesh>
        <sphereGeometry args={[0.34, 18, 12]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}

function TargetSister({
  id,
  x,
  selected,
  color,
  onSelect,
}: {
  id: 'a' | 'b';
  x: number;
  selected: boolean;
  color: string;
  onSelect: (id: 'a' | 'b') => void;
}): ReactNode {
  return (
    <group
      position={[x, 0.72, 0.2]}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(id);
      }}
    >
      <SceneBond
        from={[-0.05, -0.34, 0]}
        to={[0.05, 0.34, 0]}
        color={color}
        radius={selected ? 0.085 : 0.065}
      />
      <mesh>
        <sphereGeometry args={[0.24, 18, 12]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      {selected && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.2, 0.025, 10, 28]} />
          <meshBasicMaterial color={color} />
        </mesh>
      )}
    </group>
  );
}

function MetaphaseChallenge({
  attachments,
  selectedSister,
  onSelectSister,
  onAttach,
  palette,
}: Omit<MitosisSceneProps, 'state'> & { palette: ScenePalette }): ReactNode {
  const sisterPosition = {
      a: [-0.11, 0.72, 0.2],
      b: [0.11, 0.72, 0.2],
    } as const,
    poleX = { left: -2.45, right: 2.45 } as const;
  return (
    <>
      <Pole side="left" palette={palette} onAttach={onAttach} />
      <Pole side="right" palette={palette} onAttach={onAttach} />
      {(['a', 'b'] as const).map(
        (id) =>
          attachments[id] && (
            <SceneBond
              key={id}
              from={[poleX[attachments[id]], 0, 0]}
              to={[...sisterPosition[id]]}
              color={attachments.a === attachments.b ? palette.warning : palette.secondary}
              radius={0.018}
            />
          ),
      )}
      <TargetSister
        id="a"
        x={-0.11}
        selected={selectedSister === 'a'}
        color={palette.accent}
        onSelect={onSelectSister}
      />
      <TargetSister
        id="b"
        x={0.11}
        selected={selectedSister === 'b'}
        color={palette.warning}
        onSelect={onSelectSister}
      />
      {[
        [0.1, 0.2, -0.1],
        [-0.1, -0.3, 0.1],
        [0.1, -0.78, -0.1],
      ].map((position, index) => (
        <Chromosome
          key={index}
          position={position as [number, number, number]}
          color={index % 2 ? palette.warning : palette.accent}
        />
      ))}
    </>
  );
}

export function MitosisExplorerThreeScene({
  state,
  attachments,
  selectedSister,
  onSelectSister,
  onAttach,
}: MitosisSceneProps): ReactNode {
  const ref = useRef<HTMLDivElement>(null),
    palette = useScenePalette(ref);
  const anaphasePositions: [number, number, number][] = [
    [-1.65, 0.9, 0.15],
    [-1.4, 0.35, -0.1],
    [-1.55, -0.35, 0.1],
    [-1.3, -0.9, -0.15],
    [1.65, 0.9, -0.15],
    [1.4, 0.35, 0.1],
    [1.55, -0.35, -0.1],
    [1.3, -0.9, 0.15],
  ];
  const condensedPositions: [number, number, number][] = [
    [-0.15, 0.72, 0.12],
    [0.15, 0.22, -0.12],
    [-0.15, -0.28, 0.1],
    [0.15, -0.78, -0.1],
  ];
  const fallback = <MitosisSemanticScene state={state} attachments={attachments} />;
  const overview = state.checkpoint === 'cell';
  const nuclearFocus = state.checkpoint === 'nucleus';
  const legend = overview ? (
    <>
      <span>
        <i data-tone="pair" />
        cell membrane
      </span>
      <span>
        <i data-tone="central" />
        nucleus
      </span>
      <span>
        <i data-tone="outer" />
        organelles
      </span>
    </>
  ) : nuclearFocus ? (
    <>
      <span>
        <i data-tone="central" />
        chromatin
      </span>
      <span>
        <i data-tone="pair" />
        nuclear envelope
      </span>
    </>
  ) : (
    <>
      <span>
        <i data-tone="central" />
        chromosome
      </span>
      <span>
        <i data-tone="outer" />
        spindle
      </span>
      <span>
        <i data-tone="pair" />
        nuclear envelope
      </span>
    </>
  );
  return (
    <div ref={ref}>
      <ThreeSceneSurface
        label={`${state.title}. ${state.summary}`}
        fallback={fallback}
        camera={{ position: [0, 0, 8] }}
        legend={legend}
        inspector={
          <>
            <h3>{state.title}</h3>
            <p>{state.summary}</p>
          </>
        }
      >
        <CheckpointCamera checkpoint={state.checkpoint} />
        <SceneEnvironment palette={palette} ambient={1.4} keyIntensity={1.5} />
        {overview && <SceneContactShadow y={-2.65} radius={3.15} opacity={0.2} color={palette.foreground} />}
        <SceneOrbit>
          {overview && (
            <group scale={[1.12, 0.92, 1]}>
              <TranslucentShell radius={2.55} color={palette.secondary} opacity={0.13} />
            </group>
          )}
          <CellContext palette={palette} visible={overview} />
          {state.nuclearEnvelope !== 'absent' && (
            <>
              <TranslucentShell
                radius={state.checkpoint === 'cell' ? 1.05 : 1.65}
                color={palette.accent}
                opacity={state.nuclearEnvelope === 'breaking-down' ? 0.2 : 0.34}
              />
              <mesh>
                <sphereGeometry args={[state.checkpoint === 'cell' ? 0.9 : 1.4, 32, 20]} />
                <meshStandardMaterial color={palette.accent} transparent opacity={0.08} depthWrite={false} />
              </mesh>
              {!state.chromosomesCondensed && <Chromatin palette={palette} />}
            </>
          )}
          {state.checkpoint === 'metaphase' && (
            <MetaphaseChallenge
              attachments={attachments}
              selectedSister={selectedSister}
              onSelectSister={onSelectSister}
              onAttach={onAttach}
              palette={palette}
            />
          )}
          {state.checkpoint === 'anaphase' && (
            <>
              <Pole side="left" palette={palette} onAttach={onAttach} />
              <Pole side="right" palette={palette} onAttach={onAttach} />
              <Fibres positions={anaphasePositions} color={palette.secondary} />
              {anaphasePositions.map((position, index) => (
                <Chromosome
                  key={index}
                  position={position}
                  separated
                  color={index % 2 ? palette.warning : palette.accent}
                />
              ))}
            </>
          )}
          {state.checkpoint === 'prophase' &&
            condensedPositions.map((position, index) => (
              <Chromosome
                key={index}
                position={position}
                color={index % 2 ? palette.warning : palette.accent}
              />
            ))}
        </SceneOrbit>
      </ThreeSceneSurface>
    </div>
  );
}
export function MitosisExplorerThreeLab(props: MitosisExplorerThreeLabProps = {}): ReactNode {
  return <MitosisExplorerLab {...props} sceneRenderer={MitosisExplorerThreeScene} />;
}
