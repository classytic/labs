'use client';

import { Canvas, useThree, type RootState } from '@react-three/fiber';
import {
  Component,
  useEffect,
  useRef,
  useState,
  type ErrorInfo,
  type ReactNode,
  type RefObject,
} from 'react';
import { ACESFilmicToneMapping, SRGBColorSpace } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export interface ThreeSceneSurfaceProps {
  label: string;
  fallback: ReactNode;
  children: ReactNode;
  camera?: { position?: [number, number, number]; zoom?: number };
  orthographic?: boolean;
  frameloop?: 'always' | 'demand';
  legend?: ReactNode;
  interactionHint?: string | false;
  tools?: ReactNode;
  inspector?: ReactNode;
  layout?: 'scene' | 'explorer';
}

interface BoundaryProps {
  fallback: ReactNode;
  children: ReactNode;
  onError: () => void;
}
interface BoundaryState {
  failed: boolean;
}

function SceneCameraControls(): null {
  const camera = useThree((state) => state.camera);
  const gl = useThree((state) => state.gl);
  const invalidate = useThree((state) => state.invalidate);
  useEffect(() => {
    const controls = new OrbitControls(camera, gl.domElement);
    // Demand-rendered teaching scenes must settle in one frame. Damping requires a
    // perpetual update loop and otherwise makes the camera appear to lag or jump.
    controls.enableDamping = false;
    controls.enablePan = false;
    controls.minDistance = 3.5;
    controls.maxDistance = 11;
    controls.minPolarAngle = Math.PI * 0.18;
    controls.maxPolarAngle = Math.PI * 0.82;
    controls.rotateSpeed = 0.65;
    controls.zoomSpeed = 0.7;
    controls.target.set(0, 0, 0);
    const render = (): void => invalidate();
    controls.addEventListener('change', render);
    controls.update();
    return () => {
      controls.removeEventListener('change', render);
      controls.dispose();
    };
  }, [camera, gl, invalidate]);
  return null;
}

class ThreeSceneErrorBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { failed: false };
  static getDerivedStateFromError(): BoundaryState {
    return { failed: true };
  }
  componentDidCatch(_error: Error, _info: ErrorInfo): void {
    this.props.onError();
  }
  render(): ReactNode {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/** A cheap capability probe. The temporary context is explicitly released. */
export function supportsWebGL(): boolean {
  if (typeof document === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    // A capability probe must answer whether WebGL works, not whether the browser
    // selected a discrete GPU. Chromium/ANGLE commonly reports a performance
    // caveat for valid integrated and software-backed contexts.
    const context = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
    if (!context) return false;
    context.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof matchMedia === 'undefined') return;
    const query = matchMedia('(prefers-reduced-motion: reduce)');
    const update = (): void => setReduced(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return reduced;
}

function useDeferredMount(ref: RefObject<HTMLElement | null>): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const target = ref.current;
    if (!target || typeof IntersectionObserver === 'undefined') {
      setMounted(true);
      return;
    }
    let release: ReturnType<typeof setTimeout> | undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          if (release) clearTimeout(release);
          setMounted(true);
        } else release = setTimeout(() => setMounted(false), 120_000);
      },
      { rootMargin: '600px 0px' },
    );
    observer.observe(target);
    return () => {
      observer.disconnect();
      if (release) clearTimeout(release);
    };
  }, [ref]);
  return mounted;
}

export function ThreeSceneSurface({
  label,
  fallback,
  children,
  camera,
  orthographic = false,
  frameloop = 'demand',
  legend,
  interactionHint = 'Drag to orbit · scroll to zoom',
  tools,
  inspector,
  layout = 'scene',
}: ThreeSceneSurfaceProps): ReactNode {
  const hostRef = useRef<HTMLDivElement>(null);
  const nearViewport = useDeferredMount(hostRef);
  const reducedMotion = useReducedMotion();
  const [available, setAvailable] = useState<boolean | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (nearViewport && available === null) setAvailable(supportsWebGL());
  }, [available, nearViewport]);
  const onCreated = (state: RootState): void => {
    state.gl.domElement.addEventListener(
      'webglcontextlost',
      (event) => {
        event.preventDefault();
        setFailed(true);
      },
      { once: true },
    );
  };
  const renderWebGL = nearViewport && available === true && !failed;
  return (
    <div
      ref={hostRef}
      className="lab-three-scene"
      data-layout={layout}
      // Without this the fallback — a short text summary — is stranded inside a container still
      // holding the 3D scene's min-height and gradient, which reads as a broken empty panel.
      // In fallback mode the container collapses to its content instead.
      data-mode={renderWebGL ? 'webgl' : 'fallback'}
      aria-busy={nearViewport && available === null ? true : undefined}
    >
      {renderWebGL ? (
        <ThreeSceneErrorBoundary fallback={fallback} onError={() => setFailed(true)}>
          <div role="img" aria-label={label} className="lab-three-canvas">
            <Canvas
              frameloop={reducedMotion ? 'demand' : frameloop}
              dpr={[1, 1.5]}
              orthographic={orthographic}
              camera={camera}
              gl={{
                alpha: true,
                antialias: true,
                powerPreference: 'high-performance',
                toneMapping: ACESFilmicToneMapping,
                outputColorSpace: SRGBColorSpace,
              }}
              onCreated={onCreated}
            >
              <SceneCameraControls />
              {children}
            </Canvas>
            <div className="lab-three-depth" aria-hidden="true" />
            {legend && (
              <div className="lab-three-legend" aria-hidden="true">
                {legend}
              </div>
            )}
            {tools && (
              <div className="lab-three-tools" aria-label="Scene tools">
                {tools}
              </div>
            )}
            {inspector && (
              <aside className="lab-three-inspector" aria-label="Selected object details">
                {inspector}
              </aside>
            )}
            {interactionHint && (
              <div className="lab-three-hint" aria-hidden="true">
                <span className="lab-three-hint-icon">↔</span>
                {interactionHint}
              </div>
            )}
          </div>
        </ThreeSceneErrorBoundary>
      ) : (
        fallback
      )}
    </div>
  );
}
