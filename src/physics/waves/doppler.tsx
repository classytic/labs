'use client';

/**
 * DopplerLab, why a passing siren drops in pitch. A source glides across the tank
 * emitting wavefronts at a steady rate; because it CHASES its own waves, the fronts
 * bunch up ahead (shorter λ → higher pitch) and spread out behind (longer λ → lower
 * pitch). Crank the speed past the wave speed (Mach > 1) and the fronts pile into a
 * shock CONE, the sonic boom. A fixed listener hears the classic high→low sweep as
 * the source approaches then recedes; 🔊 plays that Doppler-shifted tone for real.
 *
 *   f_observed = f_source · c / (c − v_radial)
 *
 * Animated wavefront field on <CanvasLayer>; play-gated; honours reduced-motion.
 */

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { CanvasLayer, type CoordinateSystem } from '@classytic/stage';
import { useFrameTick } from '../../kit/anim.js';
import { Chip, Slider } from '../../kit/controls.js';
import { Field } from '../../kit/frame.js';
import { useHints, HintLadder } from '../../kit/pedagogy.js';
import { usePlayGate } from '../../kit/play.js';
import { WaveActivity } from './wave-activity.js';
import { useControlSurface } from '@classytic/stage';
import { Tex } from '../../core/tex.js';
import type { AuthoredActivity } from '../../kit/activity-authoring.js';

export interface DopplerProps {
  mach?: number; // source speed ÷ wave speed
  title?: string;
  prompt?: string;
  objectives?: string[];
  hints?: string[];
  controlId?: string;
  height?: number;
  activity?: string | AuthoredActivity;
}

const VIEW = { xMin: 0, xMax: 1, yMin: 0, yMax: 1 };
const C = 0.25; // wave speed in normalized world units / second
const FEMIT = 1.6; // wavefronts per second
const REST_X = 0.3; // source x at rest — in frame, left of the listener
/** Fronts "already emitted" at t = 0, so a paused scene shows concentric rings. */
const restFronts = (): Front[] => [1, 2, 3, 4].map((k) => ({ x: REST_X, y: 0.4, t: -k / FEMIT }));

interface Front {
  x: number;
  y: number;
  t: number;
}

export function DopplerLab({
  mach = 0.6,
  title = 'Doppler effect',
  prompt,
  objectives,
  hints: hintList,
  controlId,
  height = 320,
  activity = 'doppler',
}: DopplerProps): ReactNode {
  const [M, setM] = useState(mach);
  const [sound, setSound] = useState(false);
  const [mounted, setMounted] = useState(false);
  const hints = useHints(hintList);
  const gate = usePlayGate();

  const sim = useRef(0); // sim time (s)
  const sx = useRef(REST_X); // source x as fraction
  const emitAcc = useRef(0);
  // Seeded so the PAUSED figure already shows the stationary-source case (evenly spaced
  // concentric circles) — the comparison the Doppler shift is read against. An empty frame
  // before the learner presses Play teaches nothing.
  const fronts = useRef<Front[]>(restFronts());
  const obs = useRef({ x: 0.5, y: 0.82 }); // listener (fraction)
  const fObs = useRef(1); // observed/source frequency ratio at listener
  const audio = useRef<{ ctx: AudioContext; osc: OscillatorNode; gain: GainNode } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);
  const stopAudio = useCallback(() => {
    try {
      audio.current?.osc.stop();
    } catch {
      /* */
    }
    audio.current?.ctx.close();
    audio.current = null;
  }, []);
  useEffect(() => stopAudio, [stopAudio]);
  useEffect(() => {
    if (!sound) {
      stopAudio();
      return;
    }
    type AC = typeof AudioContext;
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: AC }).webkitAudioContext;
    const ctx = new Ctor();
    const gain = ctx.createGain();
    gain.gain.value = 0.07;
    gain.connect(ctx.destination);
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 420;
    osc.connect(gain);
    osc.start();
    audio.current = { ctx, osc, gain };
    return () => {
      try {
        osc.stop();
      } catch {
        /* */
      }
      ctx.close();
      audio.current = null;
    };
  }, [sound, stopAudio]);

  useFrameTick(gate.running && mounted, (frame) => {
    const dt = Math.min(0.04, frame.dtMs / 1000);
    sim.current += dt;
    sx.current += M * C * dt;
    if (sx.current > 1.08) {
      sx.current = -0.08;
      fronts.current = [];
    }
    // emit wavefronts at a steady rate
    emitAcc.current += dt;
    while (emitAcc.current >= 1 / FEMIT) {
      emitAcc.current -= 1 / FEMIT;
      fronts.current.push({ x: sx.current, y: 0.4, t: sim.current });
    }
    if (fronts.current.length > 40) fronts.current.splice(0, fronts.current.length - 40);
    // observed frequency at the listener: f·c/(c − v_radial)
    const dx = obs.current.x - sx.current,
      dy = obs.current.y - 0.4,
      d = Math.hypot(dx, dy) || 1;
    const vr = M * C * (dx / d); // source velocity (→x) projected toward listener
    fObs.current = C / Math.max(C * 0.08, C - vr);
    if (sound && audio.current) audio.current.osc.frequency.value = 420 * fObs.current;
  });

  // NOT memoized: useFrameTick re-renders each frame → fresh draw → CanvasLayer repaints.
  const draw = (ctx: CanvasRenderingContext2D, _c: CoordinateSystem): void => {
    const css = getComputedStyle(ctx.canvas);
    const tok = (n: string, fb: string): string => css.getPropertyValue(n).trim() || fb;
    const acc = tok('--stage-accent', '#1c7ed6'),
      warn = tok('--stage-warn', '#e8a020'),
      good = tok('--stage-good', '#2f9e44'),
      fg = tok('--stage-fg', '#222'),
      mut = tok('--stage-grid', '#bbb');
    const W = ctx.canvas.clientWidth || 640,
      H = height;
    ctx.clearRect(0, 0, W, H);
    const now = sim.current,
      sourceY = 0.4 * H;
    // wavefronts (expanding circles from each emission point)
    for (const fr of fronts.current) {
      const rw = C * (now - fr.t);
      const r = rw * W;
      if (r < 4 || rw > 1.5) continue;
      ctx.strokeStyle = acc;
      ctx.globalAlpha = Math.max(0.12, 1 - rw / 1.45);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(fr.x * W, fr.y * H, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    // Mach cone when supersonic
    if (M > 1) {
      const sxp = sx.current * W;
      const ang = Math.asin(1 / M);
      ctx.strokeStyle = warn;
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(sxp, sourceY);
        ctx.lineTo(sxp - Math.cos(ang) * W, sourceY + s * Math.sin(ang) * W);
        ctx.stroke();
      }
      ctx.setLineDash([]);
    }
    // source (a little vehicle dot) + listener (ear)
    ctx.fillStyle = warn;
    ctx.beginPath();
    ctx.arc(sx.current * W, sourceY, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = good;
    ctx.beginPath();
    ctx.arc(obs.current.x * W, obs.current.y * H, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = fg;
    ctx.font = '11px ui-sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🔊 source', sx.current * W, sourceY - 12);
    ctx.fillText('👂 listener', obs.current.x * W, obs.current.y * H + 20);
  };

  useControlSurface(controlId, {
    mach: { type: 'number', label: 'speed (Mach)', min: 0, max: 1.6, step: 0.05, get: () => M, set: setM },
    sound: { type: 'boolean', label: 'sound', get: () => sound, set: setSound },
  });

  const ahead = M < 1 ? 1 / (1 - M) : Infinity,
    behind = 1 / (1 + M);
  const figure = (
    <CanvasLayer
      view={VIEW}
      height={height}
      draw={draw}
      ariaLabel={`Doppler effect, source speed Mach ${M.toFixed(2)}`}
    />
  );

  const aside = (
    <>
      <div className="physics-probe">
        <span>
          Mach · <Tex tex="v_\text{source} / c" />
        </span>
        <strong>{M.toFixed(2)}</strong>
        <small>{M >= 1 ? 'Shock cone · sonic boom' : 'Subsonic source'}</small>
      </div>
      <div className="physics-wave-readings">
        <div>
          <span>Approaching</span>
          <strong>×{M < 1 ? ahead.toFixed(2) : '∞'}</strong>
        </div>
        <div>
          <span>Receding</span>
          <strong>×{behind.toFixed(2)}</strong>
        </div>
        <div>
          <span>Listener now</span>
          <strong>×{fObs.current.toFixed(2)}</strong>
        </div>
      </div>
    </>
  );

  const controls = (
    <>
      <Field label="speed (Mach)" value={M.toFixed(2)}>
        <Slider value={M} min={0} max={1.6} step={0.05} onChange={setM} ariaLabel="source speed" />
      </Field>
      <Chip selected={sound} onClick={() => setSound((s) => !s)}>
        {sound ? 'Sound on' : 'Hear pass-by'}
      </Chip>
    </>
  );

  const reset = () => {
    sim.current = 0;
    sx.current = REST_X;
    fronts.current = restFronts();
    emitAcc.current = 0;
    gate.setPlaying(false);
  };
  const state =
    M >= 1
      ? 'Supersonic · shock cone'
      : M > 0
        ? 'Moving source · Doppler shift'
        : 'Stationary source · even spacing';
  return (
    <WaveActivity
      activity={activity}
      activityId="doppler"
      title={title}
      prompt={prompt}
      mode="Doppler"
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
          <span>Mach {M.toFixed(2)}</span>
          <span>listener ×{fObs.current.toFixed(2)}</span>
        </>
      }
      observation={
        M >= 1
          ? 'The source outruns its own wavefronts, which collect along a shock cone.'
          : `${state}. Fronts bunch ahead and spread behind; the listener hears a continuously changing pitch.`
      }
    />
  );
}
