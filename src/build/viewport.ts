'use client';

/**
 * useCanvasViewport — the pan / zoom / infinite-canvas transform shared by the circuit
 * and logic editors. It is the one piece worth borrowing from tools like Excalidraw /
 * Figma: a {x, y, zoom} view state expressed through the SVG `viewBox`, so the browser
 * does the transform and every node/wire/pin stays in plain scene coordinates.
 *
 *   • scene point → screen: the SVG's own viewBox maps it (no per-element maths).
 *   • screen point → scene: `toScene(clientX, clientY)` (safe inside window handlers,
 *     it reads live refs, not stale render state).
 *   • pixel drag delta → scene delta: divide by `zoom` (see `scale()`).
 *
 * Interaction (kept deliberately non-conflicting with the editors' own click/drag model):
 *   • wheel / trackpad two-finger  → pan
 *   • ctrl|⌘ + wheel               → zoom about the cursor
 *   • Space-drag or middle-drag    → pan
 *   • zoomIn / zoomOut / fit / reset controls for the toolbar
 *
 * The editor never caps the canvas width any more: the world is unbounded, the learner
 * zooms and pans instead of running out of a fixed 640×360 box.
 */

import type * as React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

export interface Viewport {
  /** scene x at the canvas's left edge. */ x: number;
  /** scene y at the canvas's top edge. */ y: number;
  /** pixels per scene unit (uniform, so circles stay circles). */ zoom: number;
}

export interface SceneBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface CanvasViewport {
  hostRef: React.RefObject<HTMLDivElement | null>;
  /** the SVG viewBox string for the current pan/zoom. */
  viewBox: string;
  /** measured canvas size in px (0 until first layout). */
  size: { w: number; h: number };
  zoom: number;
  panning: boolean;
  /** screen (client) coords → scene coords; live-ref based, safe in window handlers. */
  toScene: (clientX: number, clientY: number) => { x: number; y: number };
  /** convert a pixel distance to a scene distance at the current zoom. */
  scale: () => number;
  /** pointerdown handler for the host: starts a pan on Space-drag or middle button. */
  onHostPointerDown: (e: React.PointerEvent) => void;
  /** style for the host (touch-action + pan cursor). */
  hostStyle: React.CSSProperties;
  /** an infinite dot-grid background that pans/zooms with the content. */
  gridStyle: React.CSSProperties;
  zoomIn: () => void;
  zoomOut: () => void;
  /** frame a scene rectangle (with padding); falls back to the world if empty. */
  fit: (bounds?: SceneBounds) => void;
  /** reset to 1:1 at the origin. */
  reset: () => void;
}

const clampZoom = (z: number, min: number, max: number): number => Math.min(max, Math.max(min, z));

export function useCanvasViewport(opts: {
  /** the seed world size (used to frame the initial view). */
  world: { w: number; h: number };
  minZoom?: number;
  maxZoom?: number;
}): CanvasViewport {
  const { world } = opts;
  const minZoom = opts.minZoom ?? 0.25;
  const maxZoom = opts.maxZoom ?? 4;

  const hostRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [vp, setVp] = useState<Viewport>({ x: 0, y: 0, zoom: 1 });
  const [panning, setPanning] = useState(false);

  const vpRef = useRef(vp);
  vpRef.current = vp;
  const sizeRef = useRef(size);
  sizeRef.current = size;
  const spaceRef = useRef(false);
  const worldRef = useRef(world);
  worldRef.current = world;
  const didInit = useRef(false);

  const toScene = useCallback((clientX: number, clientY: number): { x: number; y: number } => {
    const host = hostRef.current;
    const { x, y, zoom } = vpRef.current;
    if (!host) return { x, y };
    const r = host.getBoundingClientRect();
    return { x: x + (clientX - r.left) / zoom, y: y + (clientY - r.top) / zoom };
  }, []);

  const scale = useCallback((): number => vpRef.current.zoom, []);

  const fit = useCallback(
    (bounds?: SceneBounds) => {
      const { w, h } = sizeRef.current;
      if (!w || !h) return;
      const wd = worldRef.current;
      const b =
        bounds && Number.isFinite(bounds.minX) && bounds.maxX > bounds.minX
          ? bounds
          : { minX: 0, minY: 0, maxX: wd.w, maxY: wd.h };
      const pad = 32; // px of breathing room around the content
      const bw = Math.max(1, b.maxX - b.minX);
      const bh = Math.max(1, b.maxY - b.minY);
      const zoom = clampZoom(Math.min((w - pad * 2) / bw, (h - pad * 2) / bh), minZoom, maxZoom);
      // centre the content in the canvas
      const cx = (b.minX + b.maxX) / 2;
      const cy = (b.minY + b.maxY) / 2;
      setVp({ zoom, x: cx - w / 2 / zoom, y: cy - h / 2 / zoom });
    },
    [minZoom, maxZoom],
  );

  const reset = useCallback(() => setVp({ x: 0, y: 0, zoom: 1 }), []);

  const zoomAt = useCallback(
    (factor: number, sx: number, sy: number) => {
      setVp((cur) => {
        const z2 = clampZoom(cur.zoom * factor, minZoom, maxZoom);
        if (z2 === cur.zoom) return cur;
        // keep the scene point under (sx, sy) fixed on screen
        const sceneX = cur.x + sx / cur.zoom;
        const sceneY = cur.y + sy / cur.zoom;
        return { zoom: z2, x: sceneX - sx / z2, y: sceneY - sy / z2 };
      });
    },
    [minZoom, maxZoom],
  );

  const zoomCentre = useCallback(
    (factor: number) => {
      const { w, h } = sizeRef.current;
      zoomAt(factor, w / 2, h / 2);
    },
    [zoomAt],
  );

  const zoomIn = useCallback(() => zoomCentre(1.2), [zoomCentre]);
  const zoomOut = useCallback(() => zoomCentre(1 / 1.2), [zoomCentre]);

  // measure the host (viewBox aspect must match pixel aspect, else circles stretch)
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const ro = new ResizeObserver(() => {
      const r = host.getBoundingClientRect();
      setSize({ w: r.width, h: r.height });
    });
    ro.observe(host);
    return () => ro.disconnect();
  }, []);

  // frame the seeded content once, as soon as we know the canvas size
  useEffect(() => {
    if (didInit.current || !size.w || !size.h) return;
    didInit.current = true;
    fit();
  }, [size.w, size.h, fit]);

  // wheel: pan by default, ctrl|⌘ + wheel = zoom about the cursor. Attached non-passive
  // so we can preventDefault (stop the page scrolling / browser pinch-zoom).
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const onWheel = (e: WheelEvent): void => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        const r = host.getBoundingClientRect();
        const factor = Math.exp(-e.deltaY * 0.0015);
        zoomAt(factor, e.clientX - r.left, e.clientY - r.top);
      } else {
        const z = vpRef.current.zoom;
        setVp((cur) => ({ ...cur, x: cur.x + e.deltaX / z, y: cur.y + e.deltaY / z }));
      }
    };
    host.addEventListener('wheel', onWheel, { passive: false });
    return () => host.removeEventListener('wheel', onWheel);
  }, [zoomAt]);

  // Space held = pan mode (Excalidraw convention). Track it globally.
  useEffect(() => {
    const down = (e: KeyboardEvent): void => {
      if (e.code === 'Space' && !isTypingTarget(e.target)) {
        spaceRef.current = true;
        setPanning(true);
      }
    };
    const up = (e: KeyboardEvent): void => {
      if (e.code === 'Space') {
        spaceRef.current = false;
        setPanning(false);
      }
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  const onHostPointerDown = useCallback((e: React.PointerEvent) => {
    // pan only on Space-drag or middle button, so left-drag stays with the editor's
    // own node/wire/background handlers (no conflict).
    if (!spaceRef.current && e.button !== 1) return;
    e.preventDefault();
    const startX = e.clientX,
      startY = e.clientY;
    const origin = { ...vpRef.current };
    setPanning(true);
    const move = (ev: PointerEvent): void => {
      const z = origin.zoom;
      setVp({ zoom: z, x: origin.x - (ev.clientX - startX) / z, y: origin.y - (ev.clientY - startY) / z });
    };
    const up = (): void => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      if (!spaceRef.current) setPanning(false);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }, []);

  const vw = size.w && vp.zoom ? size.w / vp.zoom : world.w;
  const vh = size.h && vp.zoom ? size.h / vp.zoom : world.h;
  const viewBox = `${vp.x} ${vp.y} ${vw} ${vh}`;

  const hostStyle: React.CSSProperties = {
    touchAction: 'none',
    cursor: panning ? 'grab' : undefined,
  };

  // infinite dot grid: one dot per SPACING scene units, offset by the pan so the dots
  // track the content (Figma / Excalidraw feel). Fades out when zoomed far out.
  const SPACING = 20;
  const gpx = SPACING * vp.zoom;
  const dotR = Math.max(0.6, Math.min(1.5, 0.85 * vp.zoom));
  const gridStyle: React.CSSProperties =
    gpx >= 6
      ? {
          backgroundImage: `radial-gradient(circle, var(--stage-grid, #e4e4e7) ${dotR}px, transparent ${dotR}px)`,
          backgroundSize: `${gpx}px ${gpx}px`,
          backgroundPosition: `${-vp.x * vp.zoom}px ${-vp.y * vp.zoom}px`,
        }
      : {};

  return {
    hostRef,
    viewBox,
    size,
    zoom: vp.zoom,
    panning,
    toScene,
    scale,
    onHostPointerDown,
    hostStyle,
    gridStyle,
    zoomIn,
    zoomOut,
    fit,
    reset,
  };
}

function isTypingTarget(t: EventTarget | null): boolean {
  const el = t as HTMLElement | null;
  if (!el || !el.tagName) return false;
  const tag = el.tagName.toLowerCase();
  return tag === 'input' || tag === 'textarea' || el.isContentEditable === true;
}

/** Bounding box of every placed node in a doc (scene coords), or null if none/all unplaced. */
export function boundsOf(nodes: { x?: number; y?: number }[], nodeW = 60, nodeH = 40): SceneBounds | null {
  const placed = nodes.filter((n) => n.x != null && n.y != null);
  if (!placed.length) return null;
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const n of placed) {
    minX = Math.min(minX, n.x!);
    minY = Math.min(minY, n.y!);
    maxX = Math.max(maxX, n.x! + nodeW);
    maxY = Math.max(maxY, n.y! + nodeH);
  }
  return { minX, minY, maxX, maxY };
}
