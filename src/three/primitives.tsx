'use client';

import { useEffect, useMemo, type ReactNode } from 'react';
import { CanvasTexture, CatmullRomCurve3, Quaternion, TubeGeometry, Vector3 } from 'three';
import type { ScenePalette } from './palette.js';

export interface SceneEnvironmentProps {
  palette: ScenePalette;
  ambient?: number;
  keyIntensity?: number;
  keyPosition?: [number, number, number];
}

/**
 * Shared STUDIO light rig (the recipe premium anatomy viewers use, adapted to our tokens):
 * a warm-sky / cool-ground hemisphere, a strong key from the upper front-right, a soft
 * accent-tinted fill from the left, and a small accent rim from behind so translucent
 * shells get an edge. Scenes still communicate with shape and colour, not effects.
 * `ambient` / `keyIntensity` remain scale factors so existing scenes keep their balance.
 */
export function SceneEnvironment({
  palette,
  ambient = 1.55,
  keyIntensity = 1.8,
  keyPosition = [4.2, 5.2, 5.8],
}: SceneEnvironmentProps): ReactNode {
  return (
    <>
      <hemisphereLight args={[palette.background, palette.foreground, ambient * 0.48]} />
      <ambientLight intensity={ambient * 0.5} />
      {keyIntensity > 0 && (
        <directionalLight position={keyPosition} intensity={keyIntensity * 1.05} color={palette.background} />
      )}
      {keyIntensity > 0 && (
        <spotLight
          position={[-3.6, 3.2, 4.6]}
          angle={0.45}
          penumbra={0.75}
          intensity={keyIntensity * 0.45}
          color={palette.accent}
        />
      )}
      {keyIntensity > 0 && (
        <pointLight position={[2.8, -1.2, -3.2]} intensity={keyIntensity * 0.25} color={palette.secondary} />
      )}
    </>
  );
}

export interface SceneContactShadowProps {
  /** Vertical position of the shadow plane — just under the subject's lowest point. */
  y: number;
  radius?: number;
  opacity?: number;
  color?: string;
}

/**
 * A soft, drei-free contact shadow: a radial-gradient texture on a flat disc under the
 * subject. It is what makes a floating model read as an OBJECT in a space instead of a
 * sticker on the page. Client-only (uses a 2D canvas), which every WebGL scene already is.
 */
export function SceneContactShadow({
  y,
  radius = 2.6,
  opacity = 0.28,
  color = '#1a1f2b',
}: SceneContactShadowProps): ReactNode {
  const texture = useMemo(() => {
    if (typeof document === 'undefined') return null;
    const size = 256,
      canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const context = canvas.getContext('2d');
    if (!context) return null;
    const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, 'rgba(0,0,0,1)');
    gradient.addColorStop(0.45, 'rgba(0,0,0,.55)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);
    return new CanvasTexture(canvas);
  }, []);
  if (!texture) return null;
  return (
    <mesh
      position={[0, y, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      scale={[radius, radius * 0.72, 1]}
      renderOrder={-1}
    >
      <planeGeometry args={[2, 2]} />
      <meshBasicMaterial map={texture} color={color} transparent opacity={opacity} depthWrite={false} />
    </mesh>
  );
}

export interface SceneTrailProps {
  points: readonly [number, number, number][];
  color: string;
  radius?: number;
  focus?: SceneFocus;
}

/**
 * A path with real thickness. WebGL ignores `lineWidth` on `lineBasicMaterial`, so a
 * `<line>` trajectory is always a 1px hairline that all but disappears in a large frame.
 * Sweeping a tube along the curve gives a lit ribbon that reads as a path through space.
 */
export function SceneTrail({ points, color, radius = 0.035, focus }: SceneTrailProps): ReactNode {
  const geometry = useMemo(() => {
    if (points.length < 2) return null;
    const curve = new CatmullRomCurve3(points.map(([x, y, z]) => new Vector3(x, y, z)));
    return new TubeGeometry(curve, Math.min(400, points.length * 3), radius, 10, false);
  }, [points, radius]);
  useEffect(() => () => geometry?.dispose(), [geometry]);
  if (!geometry) return null;
  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial
        color={color}
        roughness={0.5}
        metalness={0.03}
        emissive={color}
        emissiveIntensity={focus === 'active' ? 0.3 : 0.08}
      />
    </mesh>
  );
}

/** Studio focus device: the selected object glows slightly, everything else recedes. */
export type SceneFocus = 'active' | 'dimmed' | undefined;

export interface SceneAtomProps {
  position?: [number, number, number];
  radius?: number;
  color: string;
  detail?: 'low' | 'standard';
  roughness?: number;
  focus?: SceneFocus;
}

export function SceneAtom({
  position = [0, 0, 0],
  radius = 0.25,
  color,
  detail = 'standard',
  roughness = 0.42,
  focus,
}: SceneAtomProps): ReactNode {
  const segments = detail === 'low' ? ([16, 10] as const) : ([28, 18] as const);
  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[radius, ...segments]} />
        <meshStandardMaterial
          color={color}
          roughness={roughness}
          metalness={0.03}
          emissive={color}
          emissiveIntensity={focus === 'active' ? 0.34 : 0}
          transparent={focus === 'dimmed'}
          opacity={focus === 'dimmed' ? 0.18 : 1}
        />
      </mesh>
      {focus !== 'dimmed' && (
        <mesh scale={1.08}>
          <sphereGeometry args={[radius, ...segments]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={focus === 'active' ? 0.22 : 0.12}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  );
}

export interface SceneBondProps {
  from?: [number, number, number];
  to: [number, number, number];
  color: string;
  radius?: number;
  radialSegments?: number;
  focus?: SceneFocus;
}

export function SceneBond({
  from = [0, 0, 0],
  to,
  color,
  radius = 0.05,
  radialSegments = 14,
  focus,
}: SceneBondProps): ReactNode {
  const transform = useMemo(() => {
    const start = new Vector3(...from),
      end = new Vector3(...to),
      direction = end.clone().sub(start);
    return {
      position: start.add(end).multiplyScalar(0.5).toArray() as [number, number, number],
      quaternion: new Quaternion()
        .setFromUnitVectors(new Vector3(0, 1, 0), direction.clone().normalize())
        .toArray() as [number, number, number, number],
      length: direction.length(),
    };
  }, [from, to]);
  return (
    <mesh position={transform.position} quaternion={transform.quaternion}>
      <cylinderGeometry args={[radius, radius, transform.length, radialSegments]} />
      <meshStandardMaterial
        color={color}
        roughness={0.52}
        metalness={0.03}
        emissive={color}
        emissiveIntensity={focus === 'active' ? 0.34 : 0}
        transparent={focus === 'dimmed'}
        opacity={focus === 'dimmed' ? 0.18 : 1}
      />
    </mesh>
  );
}

export interface SceneVectorProps {
  from?: [number, number, number];
  to: [number, number, number];
  color: string;
  /** Shaft radius; the head scales from it. */
  radius?: number;
  focus?: SceneFocus;
  /** Draw the arrowhead (off gives a plain lit rod). */
  head?: boolean;
  /** Below 1 the vector recedes: for the MEDIUM (a field lattice) behind the subject. */
  opacity?: number;
}

/**
 * A vector that reads as a vector: a lit shaft with a cone head, not a `<line>`. WebGL ignores
 * `lineWidth`, so a `<line>` arrow is a 1px hairline that vanishes in a large frame — the reason
 * a Bloch state vector looked like a stray dot at the origin.
 */
export function SceneVector({
  from = [0, 0, 0],
  to,
  color,
  radius = 0.028,
  focus,
  head = true,
  opacity = 1,
}: SceneVectorProps): ReactNode {
  const transform = useMemo(() => {
    const start = new Vector3(...from);
    const end = new Vector3(...to);
    const direction = end.clone().sub(start);
    const length = direction.length();
    const quaternion = new Quaternion().setFromUnitVectors(
      new Vector3(0, 1, 0),
      length > 1e-6 ? direction.clone().normalize() : new Vector3(0, 1, 0),
    );
    const headLength = head ? Math.min(length * 0.34, radius * 9) : 0;
    const shaft = Math.max(1e-4, length - headLength);
    const mid = start.clone().addScaledVector(direction, shaft / 2 / (length || 1));
    const headMid = start.clone().addScaledVector(direction, (shaft + headLength / 2) / (length || 1));
    return {
      quaternion: quaternion.toArray() as [number, number, number, number],
      position: mid.toArray() as [number, number, number],
      headPosition: headMid.toArray() as [number, number, number],
      shaft,
      headLength,
      length,
    };
  }, [from, to, radius, head]);
  if (transform.length < 1e-4) return null;
  const alpha = focus === 'dimmed' ? Math.min(opacity, 0.2) : opacity;
  const material = (
    <meshStandardMaterial
      color={color}
      roughness={0.42}
      metalness={0.04}
      emissive={color}
      emissiveIntensity={focus === 'active' ? 0.35 : 0.12}
      transparent={alpha < 1}
      opacity={alpha}
      depthWrite={alpha >= 1}
    />
  );
  return (
    <group>
      <mesh position={transform.position} quaternion={transform.quaternion}>
        <cylinderGeometry args={[radius, radius, transform.shaft, 14]} />
        {material}
      </mesh>
      {transform.headLength > 0 && (
        <mesh position={transform.headPosition} quaternion={transform.quaternion}>
          <coneGeometry args={[radius * 2.6, transform.headLength, 16]} />
          {material}
        </mesh>
      )}
    </group>
  );
}

export interface SceneRingProps {
  radius: number;
  color: string;
  /** Tube thickness. */
  thickness?: number;
  rotation?: [number, number, number];
  opacity?: number;
}

/**
 * A crisp great-circle ring. This is what gives a translucent sphere its readable geometry
 * (equator, meridians) in place of a dense wireframe, which renders as grey noise.
 */
export function SceneRing({
  radius,
  color,
  thickness = 0.012,
  rotation = [0, 0, 0],
  opacity = 0.75,
}: SceneRingProps): ReactNode {
  return (
    <mesh rotation={rotation}>
      <torusGeometry args={[radius, thickness, 8, 96]} />
      <meshStandardMaterial
        color={color}
        roughness={0.5}
        transparent={opacity < 1}
        opacity={opacity}
        depthWrite={opacity >= 1}
      />
    </mesh>
  );
}

export interface SceneLabelProps {
  position: [number, number, number];
  children: string;
  color?: string;
  /** World height of the text; the sprite widens to fit the string. */
  size?: number;
  /** Paper colour painted behind the glyphs so a label stays legible over geometry. */
  halo?: string;
  opacity?: number;
}

/**
 * Text in 3D, drawn as a canvas texture on a camera-facing sprite (no drei, no font loading).
 * A 3D scene that names nothing teaches nothing: a Bloch sphere without |0⟩ and |1⟩ is just a
 * ball. Sprites always face the viewer, so labels stay readable through an orbit.
 */
export function SceneLabel({
  position,
  children,
  color = '#172033',
  size = 0.24,
  halo,
  opacity = 1,
}: SceneLabelProps): ReactNode {
  const text = children;
  const made = useMemo(() => {
    if (typeof document === 'undefined') return null;
    const px = 128; // glyph height in texture space
    const pad = Math.round(px * 0.32);
    const canvas = document.createElement('canvas');
    const measure = canvas.getContext('2d');
    if (!measure) return null;
    const font = `700 ${px}px ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif`;
    measure.font = font;
    const width = Math.ceil(measure.measureText(text).width) + pad * 2;
    const height = px + pad * 2;
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) return null;
    context.font = font;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    if (halo) {
      context.strokeStyle = halo;
      context.lineWidth = px * 0.13;
      context.lineJoin = 'round';
      context.strokeText(text, width / 2, height / 2);
    }
    context.fillStyle = color;
    context.fillText(text, width / 2, height / 2);
    const texture = new CanvasTexture(canvas);
    return { texture, aspect: width / height };
  }, [text, color, halo]);
  useEffect(() => () => made?.texture.dispose(), [made]);
  if (!made) return null;
  return (
    <sprite position={position} scale={[size * made.aspect, size, 1]}>
      <spriteMaterial map={made.texture} transparent opacity={opacity} depthWrite={false} />
    </sprite>
  );
}

/**
 * Gives a model its authored resting angle. Camera interaction belongs to
 * ThreeSceneSurface, so dragging empty space and dragging geometry behave identically.
 */
export function SceneOrbit({
  children,
  initial = [-0.12, 0.28, 0],
}: {
  children: ReactNode;
  initial?: [number, number, number];
}): ReactNode {
  return <group rotation={initial}>{children}</group>;
}
