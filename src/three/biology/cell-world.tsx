'use client';
import { useMemo, type ReactNode } from 'react';
import { BackSide } from 'three';
import { SceneAtom, SceneBond } from '../primitives.js';

/**
 * A translucent membrane you can see INTO: a darker back face under a glossy front face
 * gives the ball volume without any dense wireframe (a grey 48×32 mesh on a white page
 * reads as noise, not as a cell). Shared by the cell membrane and the nuclear envelope.
 */
export function TranslucentShell({
  radius,
  color,
  opacity = 0.26,
  segments = [48, 32] as [number, number],
}: {
  radius: number;
  color: string;
  opacity?: number;
  segments?: [number, number];
}): ReactNode {
  // Opacity floor matters: a tinted shell below ~0.2 over a white page collapses to pale grey
  // (that was the "dirty grey ball"). The back face is denser so the far wall reads darker.
  return (
    <>
      <mesh>
        <sphereGeometry args={[radius, ...segments]} />
        <meshPhysicalMaterial
          color={color}
          transparent
          opacity={Math.min(1, opacity * 1.6)}
          roughness={0.45}
          side={BackSide}
          depthWrite={false}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[radius, ...segments]} />
        <meshPhysicalMaterial
          color={color}
          transparent
          opacity={opacity}
          roughness={0.2}
          clearcoat={0.8}
          clearcoatRoughness={0.25}
          depthWrite={false}
        />
      </mesh>
    </>
  );
}

/** Cell membrane. The shell stays visually quiet so the organelles remain the lesson. */
export function CellBoundary({
  position = [0, 0, 0],
  radius = 2.7,
  color,
  children,
}: {
  position?: [number, number, number];
  radius?: number;
  color: string;
  children?: ReactNode;
}): ReactNode {
  return (
    <group position={position}>
      <TranslucentShell radius={radius} color={color} opacity={0.22} />
      {children}
    </group>
  );
}

export function CargoFlow({
  from,
  to,
  count,
  color,
  radius = 0.1,
}: {
  from: [number, number, number];
  to: [number, number, number];
  count: number;
  color: string;
  radius?: number;
}): ReactNode {
  const points = useMemo(
    () =>
      Array.from(
        { length: Math.min(8, Math.max(0, Math.ceil(count))) },
        (_, index): [number, number, number] => {
          const total = Math.min(8, Math.max(0, Math.ceil(count))),
            t = (index + 1) / (total + 1);
          return [from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t, ((index % 3) - 1) * 0.08];
        },
      ),
    [count, from, to],
  );
  return (
    <>
      {points.map((position, index) => (
        <SceneAtom key={index} position={position} radius={radius} color={color} detail="low" />
      ))}
    </>
  );
}

export function CellOrganelle({
  position,
  kind,
  color,
  accent,
  active = false,
  failed = false,
  onSelect,
}: {
  position: [number, number, number];
  kind: 'nucleus' | 'mitochondrion' | 'ribosome' | 'rough-er' | 'golgi' | 'vesicle' | 'membrane';
  color: string;
  accent: string;
  active?: boolean;
  failed?: boolean;
  onSelect?: () => void;
}): ReactNode {
  const visibleColor = failed ? accent : color;
  const material = (
    <meshStandardMaterial color={visibleColor} roughness={0.38} transparent opacity={failed ? 0.28 : 1} />
  );
  const shape =
    kind === 'nucleus' ? (
      <>
        <TranslucentShell
          radius={0.58}
          color={visibleColor}
          opacity={failed ? 0.14 : 0.34}
          segments={[32, 20]}
        />
        <SceneAtom radius={0.18} color={accent} roughness={0.5} />
      </>
    ) : kind === 'ribosome' ? (
      <group rotation={[0, 0, -0.25]}>
        <mesh position={[-0.08, 0, 0]} scale={[1.2, 0.78, 0.9]}>
          <sphereGeometry args={[0.2, 24, 16]} />
          {material}
        </mesh>
        <mesh position={[0.14, 0.08, 0.03]} scale={[0.82, 0.58, 0.72]}>
          <sphereGeometry args={[0.18, 24, 16]} />
          {material}
        </mesh>
      </group>
    ) : kind === 'rough-er' ? (
      <group rotation={[Math.PI / 2, 0, 0]}>
        {[0.24, 0.36, 0.48].map((radius) => (
          <mesh key={radius}>
            <torusGeometry args={[radius, 0.055, 10, 36, Math.PI * 1.45]} />
            {material}
          </mesh>
        ))}
        {[-0.34, -0.12, 0.12, 0.34].map((x) => (
          <SceneAtom key={x} position={[x, 0.2, 0.08]} radius={0.045} color={accent} detail="low" />
        ))}
      </group>
    ) : kind === 'golgi' ? (
      <group rotation={[Math.PI / 2, 0, 0]}>
        {[-0.18, -0.06, 0.06, 0.18].map((y, index) => (
          <mesh key={y} position={[0, y, 0]} scale={[1 + index * 0.08, 1, 1]}>
            <torusGeometry args={[0.34, 0.045, 10, 32, Math.PI * 1.35]} />
            {material}
          </mesh>
        ))}
      </group>
    ) : kind === 'vesicle' ? (
      <>
        <TranslucentShell
          radius={0.3}
          color={visibleColor}
          opacity={failed ? 0.12 : 0.42}
          segments={[24, 16]}
        />
        <SceneAtom radius={0.09} color={accent} detail="low" />
      </>
    ) : kind === 'membrane' ? (
      <group>
        {[-0.15, 0.15].flatMap((x) =>
          [-0.42, -0.14, 0.14, 0.42].map((y) => (
            <SceneAtom
              key={`${x}:${y}`}
              position={[x, y, 0]}
              radius={0.085}
              color={visibleColor}
              detail="low"
            />
          )),
        )}
        <SceneBond from={[0, -0.46, 0]} to={[0, 0.46, 0]} color={accent} radius={0.045} />
      </group>
    ) : (
      <group rotation={[0, 0, -0.18]}>
        <mesh scale={[1.35, 0.68, 0.72]}>
          <sphereGeometry args={[0.46, 28, 18]} />
          {material}
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.27, 0.035, 10, 30]} />
          <meshBasicMaterial color={accent} />
        </mesh>
      </group>
    );
  return (
    <group
      position={position}
      onClick={(event) => {
        if (onSelect) {
          event.stopPropagation();
          onSelect();
        }
      }}
    >
      {shape}
      {active && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[kind === 'nucleus' ? 0.78 : 0.58, 0.035, 10, 40]} />
          <meshBasicMaterial color={accent} />
        </mesh>
      )}
    </group>
  );
}

export function CellRoute({
  points,
  color,
  activeThrough = points.length - 1,
}: {
  points: [number, number, number][];
  color: string;
  activeThrough?: number;
}): ReactNode {
  return (
    <>
      {points.slice(0, -1).map((point, index) => (
        <SceneBond
          key={index}
          from={point}
          to={points[index + 1]!}
          color={color}
          radius={index < activeThrough ? 0.035 : 0.018}
        />
      ))}
    </>
  );
}

export function Bilayer({
  protein = false,
  color,
  accent,
}: {
  protein?: boolean;
  color: string;
  accent: string;
}): ReactNode {
  return (
    <group>
      {Array.from({ length: 12 }, (_, index) => {
        const x = -2.75 + index * 0.5;
        return (
          <group key={index}>
            <SceneAtom position={[x, 0.18, 0]} radius={0.1} color={color} detail="low" />
            <SceneAtom position={[x, -0.18, 0]} radius={0.1} color={color} detail="low" />
            <SceneBond from={[x, 0.11, 0]} to={[x, -0.11, 0]} color={color} radius={0.025} />
          </group>
        );
      })}
      {protein && (
        <group>
          <mesh>
            <torusGeometry args={[0.28, 0.13, 14, 30]} />
            <meshStandardMaterial color={accent} roughness={0.35} />
          </mesh>
          <SceneBond from={[0, -0.46, 0]} to={[0, 0.46, 0]} color={accent} radius={0.07} />
        </group>
      )}
    </group>
  );
}
