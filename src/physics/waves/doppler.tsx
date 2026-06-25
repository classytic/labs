'use client';

/**
 * DopplerLab — why a passing siren drops in pitch. A source glides across the tank
 * emitting wavefronts at a steady rate; because it CHASES its own waves, the fronts
 * bunch up ahead (shorter λ → higher pitch) and spread out behind (longer λ → lower
 * pitch). Crank the speed past the wave speed (Mach > 1) and the fronts pile into a
 * shock CONE — the sonic boom. A fixed listener hears the classic high→low sweep as
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
import { LabFrame, ControlBar, Field, Callout } from '../../kit/frame.js';
import { useHints, HintLadder } from '../../kit/pedagogy.js';
import { usePlayGate, PlayWrap } from '../../kit/play.js';
import { useControlSurface } from '@classytic/stage';
import { Tex } from '../../core/tex.js';

export interface DopplerProps {
  mach?: number;            // source speed ÷ wave speed
  title?: string;
  prompt?: string;
  objectives?: string[];
  hints?: string[];
  controlId?: string;
  height?: number;
}

const VIEW = { xMin: 0, xMax: 1, yMin: 0, yMax: 1 };
const C = 150;              // wave speed (px/s)
const FEMIT = 1.6;          // wavefronts per second

interface Front { x: number; y: number; t: number }

export function DopplerLab({ mach = 0.6, title = 'Doppler effect', prompt, objectives, hints: hintList, controlId, height = 320 }: DopplerProps): ReactNode {
  const [M, setM] = useState(mach);
  const [sound, setSound] = useState(false);
  const [mounted, setMounted] = useState(false);
  const hints = useHints(hintList);
  const gate = usePlayGate();

  const sim = useRef(0);                 // sim time (s)
  const sx = useRef(-0.05);              // source x as fraction
  const emitAcc = useRef(0);
  const fronts = useRef<Front[]>([]);
  const obs = useRef({ x: 0.5, y: 0.82 });   // listener (fraction)
  const fObs = useRef(1);                     // observed/source frequency ratio at listener
  const audio = useRef<{ ctx: AudioContext; osc: OscillatorNode; gain: GainNode } | null>(null);

  useEffect(() => { setMounted(true); }, []);
  const stopAudio = useCallback(() => { try { audio.current?.osc.stop(); } catch { /* */ } audio.current?.ctx.close(); audio.current = null; }, []);
  useEffect(() => stopAudio, [stopAudio]);
  useEffect(() => {
    if (!sound) { stopAudio(); return; }
    type AC = typeof AudioContext;
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: AC }).webkitAudioContext;
    const ctx = new Ctor(); const gain = ctx.createGain(); gain.gain.value = 0.07; gain.connect(ctx.destination);
    const osc = ctx.createOscillator(); osc.type = 'sine'; osc.frequency.value = 420; osc.connect(gain); osc.start();
    audio.current = { ctx, osc, gain };
    return () => { try { osc.stop(); } catch { /* */ } ctx.close(); audio.current = null; };
  }, [sound, stopAudio]);

  useFrameTick(gate.running && mounted, (frame) => {
    const dt = Math.min(0.04, frame.dtMs / 1000);
    sim.current += dt;
    const vfrac = (M * C) / 600;                       // source speed in fraction/s (600 ≈ ref width)
    sx.current += vfrac * dt;
    if (sx.current > 1.08) { sx.current = -0.08; fronts.current = []; }
    // emit wavefronts at a steady rate
    emitAcc.current += dt;
    while (emitAcc.current >= 1 / FEMIT) { emitAcc.current -= 1 / FEMIT; fronts.current.push({ x: sx.current, y: 0.4, t: sim.current }); }
    if (fronts.current.length > 40) fronts.current.splice(0, fronts.current.length - 40);
    // observed frequency at the listener: f·c/(c − v_radial)
    const W = 600;
    const dx = (obs.current.x - sx.current) * W, dy = (obs.current.y - 0.4) * height, d = Math.hypot(dx, dy) || 1;
    const vr = (M * C) * (dx / d);                      // source velocity (→x) projected toward listener
    fObs.current = C / Math.max(40, C - vr);
    if (sound && audio.current) audio.current.osc.frequency.value = 420 * fObs.current;
  });

  // NOT memoized: useFrameTick re-renders each frame → fresh draw → CanvasLayer repaints.
  const draw = (ctx: CanvasRenderingContext2D, _c: CoordinateSystem): void => {
    const css = getComputedStyle(ctx.canvas);
    const tok = (n: string, fb: string): string => css.getPropertyValue(n).trim() || fb;
    const acc = tok('--stage-accent', '#1c7ed6'), warn = tok('--stage-warn', '#e8a020'), good = tok('--stage-good', '#2f9e44'), fg = tok('--stage-fg', '#222'), mut = tok('--stage-grid', '#bbb');
    const W = ctx.canvas.clientWidth || 640, H = height; ctx.clearRect(0, 0, W, H);
    const now = sim.current, sourceY = 0.4 * H;
    // wavefronts (expanding circles from each emission point)
    for (const fr of fronts.current) {
      const r = C * (now - fr.t); if (r < 4 || r > Math.hypot(W, H)) continue;
      ctx.strokeStyle = acc; ctx.globalAlpha = Math.max(0.12, 1 - r / Math.hypot(W, H)); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(fr.x * W, fr.y * H, r, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    // Mach cone when supersonic
    if (M > 1) {
      const sxp = sx.current * W; const ang = Math.asin(1 / M);
      ctx.strokeStyle = warn; ctx.lineWidth = 2; ctx.setLineDash([6, 4]);
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sxp, sourceY); ctx.lineTo(sxp - Math.cos(ang) * W, sourceY + s * Math.sin(ang) * W); ctx.stroke(); }
      ctx.setLineDash([]);
    }
    // source (a little vehicle dot) + listener (ear)
    ctx.fillStyle = warn; ctx.beginPath(); ctx.arc(sx.current * W, sourceY, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = good; ctx.beginPath(); ctx.arc(obs.current.x * W, obs.current.y * H, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = fg; ctx.font = '11px ui-sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('🔊 source', sx.current * W, sourceY - 12); ctx.fillText('👂 listener', obs.current.x * W, obs.current.y * H + 20);
  };

  useControlSurface(controlId, {
    mach: { type: 'number', label: 'speed (Mach)', min: 0, max: 1.6, step: 0.05, get: () => M, set: setM },
    sound: { type: 'boolean', label: 'sound', get: () => sound, set: setSound },
  });

  const ahead = M < 1 ? 1 / (1 - M) : Infinity, behind = 1 / (1 + M);
  const figure = (
    <PlayWrap gate={gate}>
      <div style={{ borderRadius: 14, overflow: 'hidden', background: 'var(--stage-bg)', border: '1px solid var(--stage-grid)' }}>
        <CanvasLayer view={VIEW} height={height} draw={draw} ariaLabel={`Doppler, Mach ${M.toFixed(2)}`} />
      </div>
    </PlayWrap>
  );

  const aside = (
    <>
      <Callout tone="result">
        <div className="lab-field-label">Mach <Tex tex="= v_\text{source} / c" /></div>
        <span className="lab-callout-big">{M.toFixed(2)}</span>
        <div style={{ fontSize: 12, fontWeight: 700, color: M >= 1 ? 'var(--stage-warn)' : 'var(--stage-muted)' }}>{M >= 1 ? '💥 shock cone (sonic boom)' : 'subsonic'}</div>
      </Callout>
      <div style={{ fontSize: 13, display: 'grid', gap: 3 }}>
        <span>ahead (approaching): pitch ×<b style={{ color: 'var(--stage-warn)' }}>{M < 1 ? ahead.toFixed(2) : '∞'}</b></span>
        <span>behind (receding): pitch ×<b style={{ color: 'var(--stage-accent)' }}>{behind.toFixed(2)}</b></span>
        <span style={{ color: 'var(--stage-muted)' }}>at the listener now: ×{fObs.current.toFixed(2)}</span>
      </div>
    </>
  );

  const controls = (
    <ControlBar>
      <Field label="speed (Mach)" value={M.toFixed(2)}><Slider value={M} min={0} max={1.6} step={0.05} onChange={setM} ariaLabel="source speed" /></Field>
      <Chip selected={sound} onClick={() => setSound((s) => !s)}>🔊 hear the pass-by</Chip>
    </ControlBar>
  );

  return <LabFrame title={title} prompt={prompt} objectives={objectives} aside={aside} controls={controls} footer={<HintLadder hints={hints} />}>{figure}</LabFrame>;
}
