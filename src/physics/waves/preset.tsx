'use client';

/**
 * WaveLab, one playground for the whole of waves, animated on <CanvasLayer>.
 *   • travelling, a wave you SHAPE (amplitude, wavelength, frequency); v = fλ falls
 *     out live, with λ and A marked right on the wave.
 *   • superpose , two waves add; line them up (constructive, 2A) or oppose them
 *     (destructive, flat), or detune the second → BEATS (a throbbing envelope).
 *   • standing  , two opposite waves lock into a standing wave: fixed NODES (never
 *     move) and ANTINODES (max swing), with a harmonic selector (λ = 2L/n).
 * Optional 🔊 maps the frequency into the audible range (two tones in beats mode, so
 * you HEAR the wah-wah). All maths from the wave kernel; honours reduced-motion.
 */

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { CanvasLayer, useFrameLoop, type CoordinateSystem } from '@classytic/stage';
import { waveY, sumY, standingY, speed, period, harmonicWavelength, nodes, antinodes, beatFreq, waveOmega, type WaveSpec } from './core.js';
import { Chip, Slider } from '../../kit/controls.js';
import { LabFrame, ControlBar, Field, Callout } from '../../kit/frame.js';
import { useHints, HintLadder, useChallenge, ChallengeCard, useCheckpoint, type ChallengeQuestion } from '../../kit/pedagogy.js';
import { useControlSurface } from '@classytic/stage';
import { usePlayGate, PlayWrap } from '../../kit/play.js';
import { Tex } from '../../core/tex.js';

export type WaveMode = 'travelling' | 'superpose' | 'standing';
export interface WaveLabProps {
  mode?: WaveMode;
  amplitude?: number;
  wavelength?: number;
  frequency?: number;
  title?: string;
  prompt?: string;
  objectives?: string[];
  hints?: string[];
  controlId?: string;
  height?: number;
}

const L = 10;                       // visible length (units)
const view = { xMin: 0, xMax: L, yMin: -6, yMax: 6 };
const ACC = '--stage-accent', GOOD = '--stage-good', WARN = '--stage-warn', MUT = '--stage-muted', FG = '--stage-fg';

const WAVES_CHALLENGE: ChallengeQuestion[] = [
  {
    id: 'speed',
    prompt: 'Double the frequency f while keeping the wavelength λ fixed. The wave speed v…',
    choices: [
      { value: 'double', label: 'doubles' },
      { value: 'same', label: 'is unchanged' },
      { value: 'half', label: 'halves' },
    ],
    answer: 'double',
    explain: 'v = fλ, so at fixed λ doubling f doubles the speed.',
  },
  {
    id: 'destructive',
    prompt: 'Two equal waves exactly out of phase (offset ½λ) add up to…',
    choices: [
      { value: 'cancel', label: 'a flat line (cancel)' },
      { value: 'double', label: 'double the amplitude' },
      { value: 'same', label: 'one unchanged wave' },
    ],
    answer: 'cancel',
    explain: 'Crest meets trough everywhere → destructive interference, so they cancel to flat.',
  },
];

export function WaveLab({ mode: mode0 = 'travelling', amplitude = 2, wavelength = 4, frequency = 1, title = 'Waves', prompt, objectives, hints: hintList, controlId, height = 300 }: WaveLabProps): ReactNode {
  const [mode, setMode] = useState<WaveMode>(mode0);
  const [A, setA] = useState(amplitude);
  const [lam, setLam] = useState(wavelength);
  const [f, setF] = useState(frequency);
  const [f2, setF2] = useState(frequency);      // superpose: second-wave frequency
  const [phase, setPhase] = useState(0);        // superpose: second-wave phase (×π)
  const [nH, setNH] = useState(3);              // standing: harmonic
  const [sound, setSound] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [tick, setTick] = useState(0);
  const t = useRef(0);
  const hints = useHints(hintList);
  const gate = usePlayGate();
  const challenge = useChallenge(WAVES_CHALLENGE);
  useCheckpoint({ solved: challenge.allCorrect, activity: 'waves' });

  useEffect(() => { setMounted(true); }, []);

  // ── Web Audio (created on first play; freqs mapped to the audible range) ──
  const audio = useRef<{ ctx: AudioContext; gain: GainNode; osc: OscillatorNode[] } | null>(null);
  const hz = (fr: number): number => 180 + fr * 130;
  const stopAudio = useCallback(() => { audio.current?.osc.forEach((o) => { try { o.stop(); } catch { /* */ } }); audio.current?.ctx.close(); audio.current = null; }, []);
  useEffect(() => () => stopAudio(), [stopAudio]);
  useEffect(() => {
    if (!sound) { stopAudio(); return; }
    type AC = typeof AudioContext;
    const Ctor = (window.AudioContext || (window as unknown as { webkitAudioContext: AC }).webkitAudioContext);
    const ctx = new Ctor();
    const gain = ctx.createGain(); gain.gain.value = 0.08; gain.connect(ctx.destination);
    const freqs = mode === 'superpose' ? [f, f2] : [f];
    const osc = freqs.map((fr) => { const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = hz(fr); o.connect(gain); o.start(); return o; });
    audio.current = { ctx, gain, osc };
    return () => { osc.forEach((o) => { try { o.stop(); } catch { /* */ } }); ctx.close(); audio.current = null; };
  }, [sound, mode, f, f2, stopAudio]);

  useFrameLoop((frame) => { t.current += frame.dtMs / 1000; setTick((x) => (x + 1) & 0xffffff); }, { running: gate.running && mounted });

  const primary: WaveSpec = { amp: A, wavelength: lam, freq: f };
  const lamStanding = harmonicWavelength(L, nH);
  const v = mode === 'standing' ? f * lamStanding : speed(primary);

  const draw = useCallback((ctx: CanvasRenderingContext2D, c: CoordinateSystem) => {
    const css = getComputedStyle(ctx.canvas);
    const tok = (n: string, fb: string): string => css.getPropertyValue(n).trim() || fb;
    const fg = tok(FG, '#222'), acc = tok(ACC, '#1c7ed6'), good = tok(GOOD, '#2f9e44'), warn = tok(WARN, '#e8a020'), mut = tok(MUT, '#888');
    const W = ctx.canvas.clientWidth || 640, Hh = height;
    ctx.clearRect(0, 0, W, Hh);
    const [, y0] = c.toPx(0, 0);
    ctx.strokeStyle = mut; ctx.globalAlpha = 0.5; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(c.toPx(0, 0)[0], y0); ctx.lineTo(c.toPx(L, 0)[0], y0); ctx.stroke(); ctx.globalAlpha = 1;
    const tnow = t.current;
    const curve = (fn: (x: number) => number, color: string, width: number, alpha = 1): void => {
      ctx.strokeStyle = color; ctx.lineWidth = width; ctx.globalAlpha = alpha; ctx.beginPath();
      for (let i = 0; i <= 320; i++) { const x = (i / 320) * L; const [px, py] = c.toPx(x, fn(x)); i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
      ctx.stroke(); ctx.globalAlpha = 1;
    };

    if (mode === 'travelling') {
      curve((x) => waveY(primary, x, tnow), acc, 3);
      // λ marker (between two crests) + A marker
      const crest = ((Math.PI / 2 + waveOmega(f) * tnow) / (2 * Math.PI / lam)); // x of a crest
      let x0 = crest % lam; if (x0 < 0.6) x0 += lam; const x1 = x0 + lam;
      if (x1 <= L) {
        const yTop = c.toPx(0, A + 0.8)[1];
        ctx.strokeStyle = warn; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(c.toPx(x0, 0)[0], yTop); ctx.lineTo(c.toPx(x1, 0)[0], yTop); ctx.stroke();
        ctx.fillStyle = warn; ctx.font = 'bold 12px ui-sans-serif'; ctx.textAlign = 'center'; ctx.fillText('λ', c.toPx((x0 + x1) / 2, 0)[0], yTop - 4);
      }
      const ax = 0.6; ctx.strokeStyle = good; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(c.toPx(ax, 0)[0], y0); ctx.lineTo(c.toPx(ax, A)[0], c.toPx(ax, A)[1]); ctx.stroke();
      ctx.fillStyle = good; ctx.textAlign = 'left'; ctx.fillText('A', c.toPx(ax, A / 2)[0] + 4, c.toPx(ax, A / 2)[1]);
    } else if (mode === 'superpose') {
      const w1 = primary, w2: WaveSpec = { amp: A, wavelength: lam, freq: f2, phase: phase * Math.PI };
      curve((x) => waveY(w1, x, tnow), acc, 1.5, 0.45);
      curve((x) => waveY(w2, x, tnow), warn, 1.5, 0.45);
      curve((x) => sumY([w1, w2], x, tnow), good, 3);
    } else {
      const kk = (nH * Math.PI) / L;
      const env = (x: number): number => 2 * A * Math.sin(kk * x);
      curve((x) => env(x), mut, 1, 0.4); curve((x) => -env(x), mut, 1, 0.4);
      curve((x) => standingY(A, L, nH, f, x, tnow), acc, 3);
      // nodes (always 0) + antinodes
      for (const xn of nodes(L, nH)) { const [px] = c.toPx(xn, 0); ctx.fillStyle = warn; ctx.beginPath(); ctx.arc(px, y0, 4, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = good; ctx.font = '10px ui-sans-serif'; ctx.textAlign = 'center';
      for (const xa of antinodes(L, nH)) ctx.fillText('●', c.toPx(xa, 0)[0], y0);
      ctx.fillStyle = warn; ctx.font = '11px ui-sans-serif'; ctx.fillText('nodes ▼', c.toPx(nodes(L, nH)[1] ?? 1, 0)[0], y0 + 18);
    }
  }, [mode, A, lam, f, f2, phase, nH, height, tick]);

  useControlSurface(controlId, {
    mode: { type: 'enum', label: 'mode', options: ['travelling', 'superpose', 'standing'], get: () => mode, set: (m) => setMode(m as WaveMode) },
    amplitude: { type: 'number', label: 'amplitude', min: 0.5, max: 2.5, step: 0.1, get: () => A, set: setA },
    wavelength: { type: 'number', label: 'wavelength', min: 1, max: 8, step: 0.1, get: () => lam, set: setLam },
    frequency: { type: 'number', label: 'frequency', min: 0.2, max: 3, step: 0.1, get: () => f, set: setF },
    run: { type: 'action', label: gate.playing ? 'pause' : 'play', invoke: () => gate.setPlaying(!gate.playing) },
    sound: { type: 'boolean', label: 'sound', get: () => sound, set: setSound },
  });

  const figure = (
    <PlayWrap gate={gate}>
      <div style={{ borderRadius: 14, overflow: 'hidden', background: 'var(--stage-bg)', border: '1px solid var(--stage-grid)' }}>
        <CanvasLayer view={view} height={height} draw={draw} ariaLabel={`${mode} wave, v=fλ=${v.toFixed(2)}`} />
      </div>
    </PlayWrap>
  );

  const aside = (
    <>
      <Callout tone="result">
        <div className="lab-field-label">wave speed <Tex tex="v = f\lambda" /></div>
        <span className="lab-callout-big">{v.toFixed(2)}</span>
        <span style={{ fontSize: 12, color: 'var(--stage-muted)' }}>
          {mode === 'standing' ? `${f.toFixed(1)} · ${lamStanding.toFixed(2)} · T=${period(f).toFixed(2)}` : `${f.toFixed(1)} · ${lam.toFixed(1)} · T=${period(f).toFixed(2)}`}
        </span>
      </Callout>
      {mode === 'superpose' && (
        <p className="lab-prompt" style={{ fontSize: 13 }}>
          {Math.abs(f - f2) < 0.05
            ? (Math.abs(phase % 2) < 0.05 ? 'In phase → constructive (amplitude doubles).' : Math.abs(Math.abs(phase % 2) - 1) < 0.05 ? 'Opposite phase → destructive (they cancel).' : 'Partly in phase.')
            : <>Detuned → <b>beats</b> at <Tex tex="|f_1 - f_2|" /> = {beatFreq(f, f2).toFixed(2)} (the throbbing envelope).</>}
        </p>
      )}
      {mode === 'standing' && <p className="lab-prompt" style={{ fontSize: 13 }}>Harmonic n={nH}: {nH} antinode{nH === 1 ? '' : 's'}, {nH + 1} nodes, <Tex tex="\lambda = \tfrac{2L}{n}" /> = {lamStanding.toFixed(2)}. Nodes never move; antinodes swing hardest.</p>}
    </>
  );

  const controls = (
    <ControlBar>
      <Field label="view"><span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {(['travelling', 'superpose', 'standing'] as const).map((m) => <Chip key={m} selected={mode === m} onClick={() => setMode(m)}>{m}</Chip>)}
      </span></Field>
      <Field label="amplitude" value={A.toFixed(1)}><Slider value={A} min={0.5} max={2.5} step={0.1} onChange={setA} ariaLabel="amplitude" /></Field>
      {mode !== 'standing' && <Field label="wavelength" value={lam.toFixed(1)}><Slider value={lam} min={1} max={8} step={0.1} onChange={setLam} ariaLabel="wavelength" /></Field>}
      <Field label="frequency" value={f.toFixed(1)}><Slider value={f} min={0.2} max={3} step={0.1} onChange={setF} ariaLabel="frequency" /></Field>
      {mode === 'superpose' && <>
        <Field label="wave 2 freq" value={f2.toFixed(1)}><Slider value={f2} min={0.2} max={3} step={0.1} onChange={setF2} ariaLabel="second frequency" /></Field>
        <Field label="wave 2 phase" value={`${phase.toFixed(1)}π`}><Slider value={phase} min={0} max={2} step={0.1} onChange={setPhase} ariaLabel="phase" /></Field>
      </>}
      {mode === 'standing' && <Field label="harmonic n" value={nH}><Slider value={nH} min={1} max={6} step={1} onChange={setNH} ariaLabel="harmonic" /></Field>}
      <Chip selected={sound} onClick={() => setSound((s) => !s)}>🔊 sound</Chip>
    </ControlBar>
  );

  return <LabFrame title={title} prompt={prompt} objectives={objectives} aside={aside} controls={controls} footer={<><HintLadder hints={hints} /><ChallengeCard questions={WAVES_CHALLENGE} state={challenge} title="Predict" /></>}>{figure}</LabFrame>;
}
