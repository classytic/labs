'use client';

/**
 * StringReflectionLab, where standing waves COME FROM. Two lessons in one string:
 *   • pulse, send a single bump down the string and watch it bounce off the end.
 *     A FIXED end flips it (inverts); a FREE end sends it back upright. The string
 *     itself is always incident + reflected added together (both shown faint).
 *   • resonance, send a continuous wave; it reflects and superposes with itself.
 *     At most frequencies the ends won't sit still, but at the special resonant
 *     frequencies fₙ = n·c/2L the reflection locks in and a clean STANDING wave (the
 *     nth harmonic) appears, nodes pinned to both ends. That's how a string sings.
 *
 * Exact boundary behaviour via the image method; animated on <CanvasLayer>,
 * play-gated, reduced-motion aware. The standing-wave maths matches the wave kernel.
 */

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { CanvasLayer, type CoordinateSystem } from '@classytic/stage';
import { useFrameTick } from '../../kit/anim.js';
import { Chip, Segmented, Slider } from '../../kit/controls.js';
import { Field } from '../../kit/frame.js';
import { useHints, HintLadder } from '../../kit/pedagogy.js';
import { usePlayGate } from '../../kit/play.js';
import { WaveActivity } from './wave-activity.js';
import { useControlSurface } from '@classytic/stage';
import { Tex } from '../../core/tex.js';
import type { AuthoredActivity } from '../../kit/activity-authoring.js';

export type StringMode = 'pulse' | 'resonance';
export type EndType = 'fixed' | 'free';
export interface StringReflectionProps {
  mode?: StringMode;
  end?: EndType;
  frequency?: number;
  title?: string;
  prompt?: string;
  objectives?: string[];
  hints?: string[];
  controlId?: string;
  height?: number;
  activity?: string | AuthoredActivity;
}

const L = 10,
  C = 4,
  A = 1.5;
const view = { xMin: -0.4, xMax: L + 0.4, yMin: -4, yMax: 4 };
const pulse = (u: number, sig = 0.7): number => A * Math.exp(-(u * u) / (2 * sig * sig));

export function StringReflectionLab({
  mode: mode0 = 'pulse',
  end: end0 = 'fixed',
  frequency = 0.4,
  title = 'Reflection & standing waves',
  prompt,
  objectives,
  hints: hintList,
  controlId,
  height = 300,
  activity = 'string-reflection',
}: StringReflectionProps): ReactNode {
  const [mode, setMode] = useState<StringMode>(mode0);
  const [end, setEnd] = useState<EndType>(end0);
  const [f, setF] = useState(frequency);
  const [mounted, setMounted] = useState(false);
  const t = useRef(0);
  const hints = useHints(hintList);
  const gate = usePlayGate();

  useEffect(() => {
    setMounted(true);
  }, []);
  // not gated on reduced-motion: starts PAUSED (PlayWrap), so ▶ is explicit consent.
  useFrameTick(gate.running && mounted, (frame) => {
    t.current += frame.dtMs / 1000;
    if (mode === 'pulse' && C * t.current > 2 * L + 4) t.current = 0; // loop one round trip
  });

  // resonance bookkeeping
  const k = (2 * Math.PI * f) / C;
  const nNear = Math.max(1, Math.round((k * L) / Math.PI));
  const fRes = (nNear * C) / (2 * L);
  const resonant = Math.abs(f - fRes) < 0.012;

  // NOT memoized: useFrameTick re-renders each frame → fresh draw → CanvasLayer repaints.
  const draw = (ctx: CanvasRenderingContext2D, c: CoordinateSystem): void => {
    const css = getComputedStyle(ctx.canvas);
    const tok = (n: string, fb: string): string => css.getPropertyValue(n).trim() || fb;
    const acc = tok('--stage-accent', '#1c7ed6'),
      warn = tok('--stage-warn', '#e8a020'),
      good = tok('--stage-good', '#2f9e44'),
      mut = tok('--stage-muted', '#888'),
      fg = tok('--stage-fg', '#222');
    const W = ctx.canvas.clientWidth || 640,
      H = height;
    ctx.clearRect(0, 0, W, H);
    const [, y0] = c.toPx(0, 0);
    const tt = t.current;
    ctx.strokeStyle = mut;
    ctx.globalAlpha = 0.4;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(c.toPx(0, 0)[0], y0);
    ctx.lineTo(c.toPx(L, 0)[0], y0);
    ctx.stroke();
    ctx.globalAlpha = 1;
    const plot = (fn: (x: number) => number, color: string, w: number, alpha = 1): void => {
      ctx.strokeStyle = color;
      ctx.lineWidth = w;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      for (let i = 0; i <= 300; i++) {
        const x = (i / 300) * L;
        const [px, py] = c.toPx(x, fn(x));
        i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
    };
    let inc: (x: number) => number, ref: (x: number) => number;
    if (mode === 'pulse') {
      const s = end === 'fixed' ? -1 : 1;
      inc = (x) => pulse(x - 1 - C * tt);
      ref = (x) => s * pulse(2 * L - x - 1 - C * tt);
    } else {
      const om = 2 * Math.PI * f;
      inc = (x) => A * Math.sin(k * x - om * tt);
      ref = (x) => A * Math.sin(k * x + om * tt);
    }
    plot(inc, acc, 1.5, 0.4);
    plot(ref, warn, 1.5, 0.4);
    plot((x) => inc(x) + ref(x), good, 3);
    // end posts
    const wall = (xx: number): void => {
      const [px] = c.toPx(xx, 0);
      ctx.strokeStyle = fg;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(px, c.toPx(xx, 2.6)[1]);
      ctx.lineTo(px, c.toPx(xx, -2.6)[1]);
      ctx.stroke();
    };
    const ring = (xx: number): void => {
      const [px] = c.toPx(xx, 0);
      ctx.strokeStyle = fg;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(px, y0, 7, 0, Math.PI * 2);
      ctx.stroke();
    };
    if (mode === 'pulse') {
      ring(0);
      end === 'fixed' ? wall(L) : ring(L);
    } else {
      wall(0);
      wall(L);
    }
    // resonance: mark nodes
    if (mode === 'resonance' && resonant) {
      for (let m = 0; m <= nNear; m++) {
        const xn = (m * L) / nNear;
        const [px] = c.toPx(xn, 0);
        ctx.fillStyle = warn;
        ctx.beginPath();
        ctx.arc(px, y0, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };

  useControlSurface(controlId, {
    mode: {
      type: 'enum',
      label: 'mode',
      options: ['pulse', 'resonance'],
      get: () => mode,
      set: (m) => setMode(m as StringMode),
    },
    end: {
      type: 'enum',
      label: 'end (pulse)',
      options: ['fixed', 'free'],
      get: () => end,
      set: (e) => setEnd(e as EndType),
    },
    frequency: {
      type: 'number',
      label: 'frequency',
      min: 0.1,
      max: 1.6,
      step: 0.01,
      get: () => f,
      set: setF,
    },
    snap: { type: 'action', label: 'snap to resonance', invoke: () => setF(fRes) },
  });

  const figure = <CanvasLayer view={view} height={height} draw={draw} ariaLabel={`${mode} on a string`} />;

  const aside =
    mode === 'pulse' ? (
      <div className="physics-probe">
        <span>{end} end</span>
        <strong>{end === 'fixed' ? 'Reflects inverted' : 'Reflects upright'}</strong>
        <small>green = incident + reflected</small>
      </div>
    ) : (
      <>
        <div className="physics-probe">
          <span>
            resonance · <Tex tex="f_n = \tfrac{n c}{2L}" />
          </span>
          <strong>{resonant ? `Harmonic ${nNear}` : 'Tune frequency'}</strong>
          <small>
            nearest f{nNear} = {fRes.toFixed(2)} Hz
          </small>
        </div>
        <p className="physics-explain">
          {resonant
            ? `The reflection locks into a clean ${nNear}-loop standing wave with nodes on both ends.`
            : 'Nudge frequency toward a harmonic, or snap to the nearest one, until the pattern locks.'}
        </p>
      </>
    );

  const controls = (
    <>
      <Field label="mode">
        <Segmented
          ariaLabel="mode"
          value={mode}
          onChange={setMode}
          options={[
            { value: 'pulse', label: 'pulse + reflect' },
            { value: 'resonance', label: 'standing / resonance' },
          ]}
        />
      </Field>
      {mode === 'pulse' ? (
        <Field label="end">
          <Segmented
            ariaLabel="end"
            value={end}
            onChange={setEnd}
            options={[
              { value: 'fixed', label: 'fixed' },
              { value: 'free', label: 'free' },
            ]}
          />
        </Field>
      ) : (
        <>
          <Field label="frequency" value={f.toFixed(2)}>
            <Slider value={f} min={0.1} max={1.6} step={0.01} onChange={setF} ariaLabel="frequency" />
          </Field>
          <Chip selected={false} onClick={() => setF(fRes)}>
            snap to f{nNear}
          </Chip>
        </>
      )}
    </>
  );

  const reset = () => {
    t.current = 0;
    gate.setPlaying(false);
  };
  const observation =
    mode === 'pulse'
      ? `${end === 'fixed' ? 'A fixed end inverts the reflected pulse.' : 'A free end returns the pulse upright.'} The green string is the sum of incident and reflected displacements.`
      : resonant
        ? `Harmonic ${nNear} is resonant: both ends remain nodes and a stable standing pattern forms.`
        : `The current frequency is off resonance; tune toward ${fRes.toFixed(2)} Hz.`;
  return (
    <WaveActivity
      activity={activity}
      activityId="string-reflection"
      title={title}
      prompt={prompt}
      mode={mode}
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
          {mode === 'pulse' ? (
            <span>{end} end</span>
          ) : (
            <>
              <span>f {f.toFixed(2)} Hz</span>
              <span>{resonant ? `harmonic ${nNear}` : `target ${fRes.toFixed(2)} Hz`}</span>
            </>
          )}
        </>
      }
      observation={observation}
    />
  );
}
