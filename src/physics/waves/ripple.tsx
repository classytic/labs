'use client';

/**
 * RippleTankLab, two-source interference in 2-D, the famous ripple tank. Two point
 * sources send out circular waves; where crests meet crests the water heaves
 * (CONSTRUCTIVE, a bright antinodal line, path difference = nλ) and where a crest
 * meets a trough it goes flat (DESTRUCTIVE, a dark nodal line, Δ = (n+½)λ). Drag the
 * sources, change the wavelength, and the fan of interference fringes opens and
 * closes. Two views: "ripples" (the live animated field) and "fringes" (the static
 * interference amplitude, crisp bright/dark hyperbolas).
 *
 * A genuine per-cell field → CanvasLayer heatmap. Physics stays in normalized world
 * coordinates; canvas size only changes sampling density. Honours reduced-motion.
 */

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { CanvasLayer, type CoordinateSystem } from '@classytic/stage';
import { useFrameTick } from '../../kit/anim.js';
import { Segmented, Slider } from '../../kit/controls.js';
import { Field } from '../../kit/frame.js';
import { useHints, HintLadder } from '../../kit/pedagogy.js';
import { useControlSurface } from '@classytic/stage';
import { usePlayGate } from '../../kit/play.js';
import { WaveActivity } from './wave-activity.js';
import { Tex } from '../../core/tex.js';
import type { AuthoredActivity } from '../../kit/activity-authoring.js';

export type RippleView = 'ripples' | 'fringes';
export interface RippleTankProps {
  wavelength?: number; // as a fraction of width (0.05–0.2)
  view?: RippleView;
  title?: string;
  prompt?: string;
  objectives?: string[];
  hints?: string[];
  controlId?: string;
  height?: number;
  activity?: string | AuthoredActivity;
}

const VIEW = { xMin: 0, xMax: 1, yMin: 0, yMax: 1 };

export function RippleTankLab({
  wavelength = 0.1,
  view: view0 = 'ripples',
  title = 'Ripple tank: two-source interference',
  prompt,
  objectives,
  hints: hintList,
  controlId,
  height = 320,
  activity = 'ripple-tank',
}: RippleTankProps): ReactNode {
  const [lam, setLam] = useState(wavelength); // fraction of width
  const [view, setView] = useState<RippleView>(view0);
  const [mounted, setMounted] = useState(false);
  const t = useRef(0);
  const hints = useHints(hintList);
  const gate = usePlayGate();
  // sources in math coords (view 0..1, y up)
  const s1 = useRef({ x: 0.35, y: 0.5 });
  const s2 = useRef({ x: 0.65, y: 0.5 });
  const drag = useRef<0 | 1 | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);
  // CanvasLayer's onPointerMath has no "up", release the grabbed source globally so
  // the next press re-picks the nearest one.
  useEffect(() => {
    const up = (): void => {
      drag.current = null;
    };
    window.addEventListener('pointerup', up);
    return () => window.removeEventListener('pointerup', up);
  }, []);
  // Animate while the (single) play gate is on. `draw` is intentionally NOT memoized:
  // useFrameTick re-renders each frame → a fresh `draw` → CanvasLayer repaints (it only
  // redraws when draw's identity changes). Not gated on reduced-motion: the lab starts
  // PAUSED (PlayWrap), so pressing ▶ is explicit consent to animate.
  const repaint = useFrameTick(gate.running && mounted && view === 'ripples', (frame) => {
    t.current += frame.dtMs / 1000;
  });

  const draw = (ctx: CanvasRenderingContext2D, _c: CoordinateSystem): void => {
    const W = ctx.canvas.clientWidth || 640,
      H = height,
      CELL = Math.max(4, Math.ceil(W / 180));
    const k = (2 * Math.PI) / lam,
      om = 2 * Math.PI * 0.7,
      tt = t.current;
    const p1 = { x: s1.current.x * W, y: (1 - s1.current.y) * H };
    const p2 = { x: s2.current.x * W, y: (1 - s2.current.y) * H };
    for (let px = 0; px < W; px += CELL)
      for (let py = 0; py < H; py += CELL) {
        const wx = px / W,
          wy = 1 - py / H;
        const r1 = Math.hypot(wx - s1.current.x, wy - s1.current.y),
          r2 = Math.hypot(wx - s2.current.x, wy - s2.current.y);
        let L: number;
        if (view === 'ripples') {
          const v = Math.sin(k * r1 - om * tt) + Math.sin(k * r2 - om * tt);
          L = 50 + (v / 2) * 40;
        } else {
          const env = Math.abs(Math.cos((k * (r1 - r2)) / 2));
          L = 8 + env * 82;
        }
        ctx.fillStyle = `hsl(205 68% ${L.toFixed(0)}%)`;
        ctx.fillRect(px, py, CELL + 1, CELL + 1);
      }
    // source markers
    for (const p of [p1, p2]) {
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = '#111';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  };

  const pick = (m: [number, number]): void => {
    const d1 = Math.hypot(m[0] - s1.current.x, m[1] - s1.current.y),
      d2 = Math.hypot(m[0] - s2.current.x, m[1] - s2.current.y);
    drag.current = d1 <= d2 ? 0 : 1;
    move(m);
  };
  const move = (m: [number, number]): void => {
    const s = drag.current === 0 ? s1 : s2;
    s.current = { x: Math.max(0.04, Math.min(0.96, m[0])), y: Math.max(0.06, Math.min(0.94, m[1])) };
    repaint();
  };

  useControlSurface(controlId, {
    wavelength: {
      type: 'number',
      label: 'wavelength',
      min: 0.05,
      max: 0.2,
      step: 0.005,
      get: () => lam,
      set: setLam,
    },
    view: {
      type: 'enum',
      label: 'view',
      options: ['ripples', 'fringes'],
      get: () => view,
      set: (v) => setView(v as RippleView),
    },
    run: {
      type: 'action',
      label: gate.playing ? 'pause' : 'play',
      invoke: () => gate.setPlaying(!gate.playing),
    },
  });

  const figure = (
    <CanvasLayer
      view={VIEW}
      height={height}
      draw={draw}
      onPointerMath={(m) => {
        if (drag.current == null) pick(m);
        else move(m);
      }}
      ariaLabel="Ripple tank with two movable coherent sources"
    />
  );

  const aside = (
    <>
      <div className="physics-probe physics-wave-relations">
        <span>interference</span>
        <div>
          <span>
            <span className="physics-wave-constructive">bright</span>, crests meet ·{' '}
            <Tex tex="\Delta = n\lambda" />
          </span>
          <span>
            <span className="physics-wave-destructive">dark</span>, crest + trough ·{' '}
            <Tex tex="\Delta = \left(n + \tfrac12\right)\lambda" />
          </span>
        </div>
      </div>
      <p className="physics-explain">
        {view === 'fringes'
          ? 'Static interference pattern: the bright hyperbolas are where the two waves always reinforce; the dark ones where they always cancel.'
          : 'Live ripples, watch crests collide. The still (grey) lines between the churn are where the waves cancel.'}{' '}
        Shorter wavelength or wider sources → more, tighter fringes.
      </p>
    </>
  );

  const controls = (
    <>
      <Field label="view">
        <Segmented
          ariaLabel="view"
          value={view}
          onChange={setView}
          options={[
            { value: 'ripples', label: 'ripples' },
            { value: 'fringes', label: 'fringes' },
          ]}
        />
      </Field>
      <Field label="wavelength" value={lam.toFixed(3)}>
        <Slider value={lam} min={0.05} max={0.2} step={0.005} onChange={setLam} ariaLabel="wavelength" />
      </Field>
      <Field label="source separation" value={(s2.current.x - s1.current.x).toFixed(2)}>
        <Slider
          value={s2.current.x - s1.current.x}
          min={0.12}
          max={0.76}
          step={0.02}
          onChange={(d) => {
            s1.current.x = 0.5 - d / 2;
            s2.current.x = 0.5 + d / 2;
            repaint();
          }}
          ariaLabel="distance between the two sources"
        />
      </Field>
      <p className="physics-control-hint">
        Drag either source, or use source separation with keyboard or touch.
      </p>
    </>
  );

  const reset = () => {
    t.current = 0;
    s1.current = { x: 0.35, y: 0.5 };
    s2.current = { x: 0.65, y: 0.5 };
    drag.current = null;
    gate.setPlaying(false);
    repaint();
  };
  return (
    <WaveActivity
      activity={activity}
      activityId="ripple-tank"
      title={title}
      prompt={prompt}
      mode={view === 'ripples' ? 'Live ripples' : 'Interference fringes'}
      figure={figure}
      instruments={aside}
      controls={controls}
      objectives={objectives}
      footer={<HintLadder hints={hints} />}
      visibleRef={gate.ref}
      playing={gate.playing}
      setPlaying={gate.setPlaying}
      reset={reset}
      status={
        <>
          <span>λ {lam.toFixed(3)}</span>
          <span>spacing {(s2.current.x - s1.current.x).toFixed(2)}</span>
        </>
      }
      observation={
        view === 'fringes'
          ? 'Bright bands have whole-wavelength path difference; dark bands have half-wavelength offset.'
          : 'Where two crests meet they reinforce; where a crest meets a trough they cancel.'
      }
    />
  );
}
