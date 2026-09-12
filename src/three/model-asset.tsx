'use client';

import { useLoader } from '@react-three/fiber';
import { useEffect, useMemo, type ReactNode } from 'react';
import { Box3, Vector3 } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export interface SceneModelAsset {
  src: string;
  label: string;
  license: string;
  source: string;
  attribution?: string;
  scale?: number;
  rotation?: [number, number, number];
}

export interface SceneModelProps {
  asset: SceneModelAsset;
  position?: [number, number, number];
  selected?: boolean;
  onSelect?: () => void;
}

/** Host-loaded GLB model, normalized to a predictable authored unit. */
export function SceneModel({
  asset,
  position = [0, 0, 0],
  selected = false,
  onSelect,
}: SceneModelProps): ReactNode {
  const gltf = useLoader(GLTFLoader, asset.src);
  const model = useMemo(() => {
    const clone = gltf.scene.clone(true);
    const bounds = new Box3().setFromObject(clone);
    const size = bounds.getSize(new Vector3());
    const centre = bounds.getCenter(new Vector3());
    clone.position.sub(centre);
    clone.scale.setScalar((asset.scale ?? 1) / (Math.max(size.x, size.y, size.z) || 1));
    clone.traverse((node) => {
      node.castShadow = false;
      node.receiveShadow = false;
    });
    return clone;
  }, [asset.scale, gltf.scene]);
  useEffect(
    () => () => {
      model.removeFromParent();
    },
    [model],
  );
  return (
    <group
      position={position}
      rotation={asset.rotation}
      onClick={(event) => {
        if (onSelect) {
          event.stopPropagation();
          onSelect();
        }
      }}
    >
      <primitive object={model} />
      {selected && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.68, 0.025, 10, 48]} />
          <meshBasicMaterial color="white" transparent opacity={0.8} />
        </mesh>
      )}
    </group>
  );
}
