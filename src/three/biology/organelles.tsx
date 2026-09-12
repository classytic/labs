'use client';

import { Suspense, type ReactNode } from 'react';
import type { CellJourneyStep } from '../../biology/cell-system/core.js';
import { SceneModel, type SceneModelAsset } from '../model-asset.js';
import { SceneAtom } from '../primitives.js';

export type CellModelAssets = Partial<Record<CellJourneyStep, SceneModelAsset>>;

interface OrganelleProps {
  kind: CellJourneyStep;
  position: [number, number, number];
  color: string;
  accent: string;
  active?: boolean;
  failed?: boolean;
  asset?: SceneModelAsset;
  onSelect?: () => void;
}

function ProceduralOrganelle({
  kind,
  color,
  accent,
  active,
  failed,
}: Omit<OrganelleProps, 'position' | 'asset' | 'onSelect'>): ReactNode {
  const base = failed ? accent : color;
  if (kind === 'nucleus')
    return (
      <group>
        <mesh>
          <sphereGeometry args={[0.72, 36, 24]} />
          <meshPhysicalMaterial
            color={base}
            transparent
            opacity={failed ? 0.3 : 0.72}
            roughness={0.32}
            clearcoat={0.35}
          />
        </mesh>
        <SceneAtom radius={0.24} color={accent} focus={active ? 'active' : undefined} />
      </group>
    );
  if (kind === 'ribosome')
    return (
      <group>
        <SceneAtom radius={0.2} color={base} focus={active ? 'active' : undefined} />
        <SceneAtom position={[0.14, -0.12, 0.05]} radius={0.13} color={accent} />
      </group>
    );
  if (kind === 'rough-er')
    return (
      <group>
        {[-0.3, 0, 0.3].map((y) => (
          <mesh key={y} position={[0, y, 0]} scale={[0.72, 0.08, 0.34]}>
            <sphereGeometry args={[1, 24, 12]} />
            <meshStandardMaterial color={base} roughness={0.55} />
          </mesh>
        ))}
        {[-0.48, -0.16, 0.16, 0.48].map((x) => (
          <SceneAtom key={x} position={[x, 0.38, 0.12]} radius={0.045} color={accent} />
        ))}
      </group>
    );
  if (kind === 'golgi')
    return (
      <group>
        {[-0.3, -0.15, 0, 0.15, 0.3].map((y, index) => (
          <mesh key={y} position={[index * 0.055, y, 0]} scale={[0.62 - index * 0.04, 0.055, 0.25]}>
            <sphereGeometry args={[1, 24, 10]} />
            <meshStandardMaterial color={base} roughness={0.5} />
          </mesh>
        ))}
      </group>
    );
  if (kind === 'vesicle')
    return (
      <group>
        <mesh>
          <sphereGeometry args={[0.34, 28, 18]} />
          <meshPhysicalMaterial
            color={base}
            transparent
            opacity={failed ? 0.28 : 0.58}
            roughness={0.25}
            clearcoat={0.5}
          />
        </mesh>
        <SceneAtom radius={0.1} color={accent} focus={active ? 'active' : undefined} />
      </group>
    );
  return (
    <group>
      <mesh scale={[0.18, 0.78, 0.48]}>
        <sphereGeometry args={[1, 28, 18]} />
        <meshPhysicalMaterial color={base} transparent opacity={failed ? 0.28 : 0.62} roughness={0.3} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.5, 0.035, 10, 42]} />
        <meshBasicMaterial color={accent} />
      </mesh>
    </group>
  );
}

/** Named biology part, replaceable by a licensed host-provided GLB. */
export function BiologicalOrganelle({
  kind,
  position,
  color,
  accent,
  active = false,
  failed = false,
  asset,
  onSelect,
}: OrganelleProps): ReactNode {
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
      {asset ? (
        <Suspense
          fallback={
            <ProceduralOrganelle kind={kind} color={color} accent={accent} active={active} failed={failed} />
          }
        >
          <SceneModel asset={asset} selected={active} />
        </Suspense>
      ) : (
        <ProceduralOrganelle kind={kind} color={color} accent={accent} active={active} failed={failed} />
      )}
      {active && !asset && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.7, 0.035, 10, 40]} />
          <meshBasicMaterial color={accent} />
        </mesh>
      )}
    </group>
  );
}
