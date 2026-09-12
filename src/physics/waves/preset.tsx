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
import {
  waveY,
  sumY,
  standingY,
  speed,
  period,
  harmonicWavelength,
  nodes,
  antinodes,
  beatFreq,
  waveOmega,
  type WaveSpec,
} from './core.js';
import { Chip, Segmented, Slider } from '../../kit/controls.js';
import { Field } from '../../kit/frame.js';
import { useHints, HintLadder } from '../../kit/pedagogy.js';
import { useControlSurface } from '@classytic/stage';
import { usePlayGate } from '../../kit/play.js';
import { WaveActivity } from './wave-activity.js';
import { Tex } from '../../core/tex.js';
import type { AuthoredActivity } from '../../kit/activity-authoring.js';

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
  activity?: string | AuthoredActivity;
}

const L = 10; // visible length (units)
const view = { xMin: 0, xMax: L, yMin: -6, yMax: 6 };
const ACC = '--stage-accent',
  GOOD = '--stage-good',
  WARN = '--stage-warn',
  MUT = '--stage-muted',
  FG = '--stage-fg';

export function WaveLab({
  mode: mode0 = 'travelling',
  amplitude = 2,
  wavelength = 4,
  frequency = 1,
  title = 'Waves',
  prompt,
  objectives,
  hints: hintList,
  controlId,
  height = 300,
  activity = 'wave-lab',
}: WaveLabProps): ReactNode {
  const [mode, setMode] = useState<WaveMode>(mode0);
  const [A, setA] = useState(amplitude);
  const [lam, setLam] = useState(wavelength);
  const [f, setF] = useState(frequency);
  const [f2, setF2] = useState(frequency); // superpose: second-wave frequency
  const [phase, setPhase] = useState(0); // superpose: second-wave phase (×π)
  const [nH, setNH] = useState(3); // standing: harmonic
  const [sound, setSound] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [tick, setTick] = useState(0);
  const t = useRef(0);
  const hints = useHints(hintList);
  const gate = usePlayGate();

  useEffect(() => {
    setMounted(true);
  }, []);

  // ── Web Audio (created on first play; freqs mapped to the audible range) ──
  const audio = useRef<{ ctx: AudioContext; gain: GainNode; osc: OscillatorNode[] } | null>(null);
  const hz = (fr: number): number => 180 + fr * 130;
  const stopAudio = useCallback(() => {
    audio.current?.osc.forEach((o) => {
      try {
        o.stop();
      } catch {
        /* */
      }
    });
    audio.current?.ctx.close();
    audio.current = null;
  }, []);
  useEffect(() => () => stopAudio(), [stopAudio]);
  useEffect(() => {
    if (!sound) {
      stopAudio();
      return;
    }
    type AC = typeof AudioContext;
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: AC }).webkitAudioContext;
    const ctx = new Ctor();
    const gain = ctx.createGain();
    gain.gain.value = 0.08;
    gain.connect(ctx.destination);
    const freqs = mode === 'superpose' ? [f, f2] : [f];
    const osc = freqs.map((fr) => {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = hz(fr);
      o.connect(gain);
      o.start();
      return o;
    });
    audio.current = { ctx, gain, osc };
    return () => {
      osc.forEach((o) => {
        try {
          o.stop();
        } catch {
          /* */
        }
      });
      ctx.close();
      audio.current = null;
    };
  }, [sound, mode, f, f2, stopAudio]);

  useFrameLoop(
    (frame) => {
      t.current += frame.dtMs / 1000;
      setTick((x) => (x + 1) & 0xffffff);
    },
    { running: gate.running && mounted },
  );

  const primary: WaveSpec = { amp: A, wavelength: lam, freq: f };
  const lamStanding = harmonicWavelength(L, nH);
  const v = mode === 'standing' ? f * lamStanding : speed(primary);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, c: CoordinateSystem) => {
      const css = getComputedStyle(ctx.canvas);
      const tok = (n: string, fb: string): string => css.getPropertyValue(n).trim() || fb;
      const fg = tok(FG, '#222'),
        acc = tok(ACC, '#1c7ed6'),
        good = tok(GOOD, '#2f9e44'),
        warn = tok(WARN, '#e8a020'),
        mut = tok(MUT, '#888');
      const W = ctx.canvas.clientWidth || 640,
        Hh = height;
      ctx.clearRect(0, 0, W, Hh);
      const [, y0] = c.toPx(0, 0);
      const [plotLeft] = c.toPx(0, 0);
      const [plotRight] = c.toPx(L, 0);
      const amplitudeTop = c.toPx(0, A)[1];
      const amplitudeBottom = c.toPx(0, -A)[1];
      ctx.fillStyle = acc;
      ctx.globalAlpha = 0.035;
      ctx.fillRect(plotLeft, amplitudeTop, plotRight - plotLeft, amplitudeBottom - amplitudeTop);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = mut;
      ctx.globalAlpha = 0.5;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(c.toPx(0, 0)[0], y0);
      ctx.lineTo(c.toPx(L, 0)[0], y0);
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.fillStyle = mut;
      ctx.font = '11px ui-sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('equilibrium', plotLeft + 8, y0 - 8);
      const tnow = t.current;
      const curve = (fn: (x: number) => number, color: string, width: number, alpha = 1): void => {
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        for (let i = 0; i <= 320; i++) {
          const x = (i / 320) * L;
          const [px, py] = c.toPx(x, fn(x));
          i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
      };

      if (mode === 'travelling') {
        curve((x) => waveY(primary, x, tnow), acc, 3);
        // λ marker (between two crests) + A marker
        const crest = (Math.PI / 2 + waveOmega(f) * tnow) / ((2 * Math.PI) / lam); // x of a crest
        let x0 = crest % lam;
        if (x0 < 0.6) x0 += lam;
        const x1 = x0 + lam;
        if (x1 <= L) {
          const yTop = c.toPx(0, A + 0.8)[1];
          ctx.strokeStyle = warn;
          ctx.lineWidth = 1.5;
          ctx.setLineDash([5, 4]);
          ctx.beginPath();
          ctx.moveTo(c.toPx(x0, 0)[0], yTop);
          ctx.lineTo(c.toPx(x1, 0)[0], yTop);
          ctx.stroke();
          ctx.setLineDash([]);
          for (const xx of [x0, x1]) {
            ctx.beginPath();
            ctx.moveTo(c.toPx(xx, 0)[0], yTop - 5);
            ctx.lineTo(c.toPx(xx, 0)[0], yTop + 5);
            ctx.stroke();
          }
          ctx.fillStyle = warn;
          ctx.font = 'bold 12px ui-sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('λ', c.toPx((x0 + x1) / 2, 0)[0], yTop - 4);
        }
        const ax = 0.6;
        ctx.strokeStyle = good;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(c.toPx(ax, 0)[0], y0);
        ctx.lineTo(c.toPx(ax, A)[0], c.toPx(ax, A)[1]);
        ctx.stroke();
        ctx.fillStyle = good;
        ctx.textAlign = 'left';
        ctx.fillText('A', c.toPx(ax, A / 2)[0] + 4, c.toPx(ax, A / 2)[1]);
        const phaseX = Math.max(0, Math.min(L, x0));
        const [phasePx, phasePy] = c.toPx(phaseX, waveY(primary, phaseX, tnow));
        ctx.fillStyle = acc;
        ctx.beginPath();
        ctx.arc(phasePx, phasePy, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = fg;
        ctx.textAlign = 'left';
        ctx.fillText('tracked crest', phasePx + 9, phasePy - 8);
      } else if (mode === 'superpose') {
        const w1 = primary,
          w2: WaveSpec = { amp: A, wavelength: lam, freq: f2, phase: phase * Math.PI };
        curve((x) => waveY(w1, x, tnow), acc, 1.5, 0.62);
        curve((x) => waveY(w2, x, tnow), warn, 1.5, 0.62);
        curve((x) => sumY([w1, w2], x, tnow), good, 3);
        ctx.font = '11px ui-sans-serif';
        ctx.textAlign = 'right';
        ctx.fillStyle = acc;
        ctx.fillText('wave 1', plotRight - 8, 18);
        ctx.fillStyle = warn;
        ctx.fillText('wave 2', plotRight - 8, 34);
        ctx.fillStyle = good;
        ctx.fillText('result', plotRight - 8, 50);
      } else {
        const kk = (nH * Math.PI) / L;
        const env = (x: number): number => 2 * A * Math.sin(kk * x);
        curve((x) => env(x), mut, 1, 0.4);
        curve((x) => -env(x), mut, 1, 0.4);
        curve((x) => standingY(A, L, nH, f, x, tnow), acc, 3);
        // nodes (always 0) + antinodes
        for (const xn of nodes(L, nH)) {
          const [px] = c.toPx(xn, 0);
          ctx.fillStyle = warn;
          ctx.beginPath();
          ctx.arc(px, y0, 4, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = good;
        ctx.font = '10px ui-sans-serif';
        ctx.textAlign = 'center';
        for (const xa of antinodes(L, nH)) {
          const [px] = c.toPx(xa, 0);
          ctx.beginPath();
          ctx.arc(px, y0, 3, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = warn;
        ctx.font = '11px ui-sans-serif';
        ctx.fillText('nodes ▼', c.toPx(nodes(L, nH)[1] ?? 1, 0)[0], y0 + 18);
      }
    },
    [mode, A, lam, f, f2, phase, nH, height, tick],
  );

  useControlSurface(controlId, {
    mode: {
      type: 'enum',
      label: 'mode',
      options: ['travelling', 'superpose', 'standing'],
      get: () => mode,
      set: (m) => setMode(m as WaveMode),
    },
    amplitude: { type: 'number', label: 'amplitude', min: 0.5, max: 2.5, step: 0.1, get: () => A, set: setA },
    wavelength: {
      type: 'number',
      label: 'wavelength',
      min: 1,
      max: 8,
      step: 0.1,
      get: () => lam,
      set: setLam,
    },
    frequency: { type: 'number', label: 'frequency', min: 0.2, max: 3, step: 0.1, get: () => f, set: setF },
    run: {
      type: 'action',
      label: gate.playing ? 'pause' : 'play',
      invoke: () => gate.setPlaying(!gate.playing),
    },
    sound: { type: 'boolean', label: 'sound', get: () => sound, set: setSound },
  });

  const figure = (
    <CanvasLayer view={view} height={height} draw={draw} ariaLabel={`${mode} wave, v=fλ=${v.toFixed(2)}`} />
  );

  const aside = (
    <>
      <div className="physics-probe">
        <span>
          wave speed · <Tex tex="v = f\lambda" />
        </span>
        <strong>{v.toFixed(2)}</strong>
        <small>
          {mode === 'standing'
            ? `${f.toFixed(1)} · ${lamStanding.toFixed(2)} · T=${period(f).toFixed(2)}`
            : `${f.toFixed(1)} · ${lam.toFixed(1)} · T=${period(f).toFixed(2)}`}
        </small>
      </div>
      {mode === 'superpose' && (
        <p className="physics-explain">
          {Math.abs(f - f2) < 0.05 ? (
            Math.abs(phase % 2) < 0.05 ? (
              'In phase → constructive (amplitude doubles).'
            ) : Math.abs(Math.abs(phase % 2) - 1) < 0.05 ? (
              'Opposite phase → destructive (they cancel).'
            ) : (
              'Partly in phase.'
            )
          ) : (
            <>
              Detuned → <b>beats</b> at <Tex tex="|f_1 - f_2|" /> = {beatFreq(f, f2).toFixed(2)} (the
              throbbing envelope).
            </>
          )}
        </p>
      )}
      {mode === 'standing' && (
        <p className="physics-explain">
          Harmonic n={nH}: {nH} antinode{nH === 1 ? '' : 's'}, {nH + 1} nodes,{' '}
          <Tex tex="\lambda = \tfrac{2L}{n}" /> = {lamStanding.toFixed(2)}. Nodes never move; antinodes swing
          hardest.
        </p>
      )}
    </>
  );

  const controls = (
    <>
      <Field label="view">
        <Segmented<WaveMode>
          ariaLabel="view"
          value={mode}
          onChange={setMode}
          options={(['travelling', 'superpose', 'standing'] as const).map((m) => ({
            value: m,
            label: m,
          }))}
        />
      </Field>
      <Field label="amplitude" value={A.toFixed(1)}>
        <Slider value={A} min={0.5} max={2.5} step={0.1} onChange={setA} ariaLabel="amplitude" />
      </Field>
      {mode !== 'standing' && (
        <Field label="wavelength" value={lam.toFixed(1)}>
          <Slider value={lam} min={1} max={8} step={0.1} onChange={setLam} ariaLabel="wavelength" />
        </Field>
      )}
      <Field label="frequency" value={f.toFixed(1)}>
        <Slider value={f} min={0.2} max={3} step={0.1} onChange={setF} ariaLabel="frequency" />
      </Field>
      {mode === 'superpose' && (
        <>
          <Field label="wave 2 freq" value={f2.toFixed(1)}>
            <Slider value={f2} min={0.2} max={3} step={0.1} onChange={setF2} ariaLabel="second frequency" />
          </Field>
          <Field label="wave 2 phase" value={`${phase.toFixed(1)}π`}>
            <Slider value={phase} min={0} max={2} step={0.1} onChange={setPhase} ariaLabel="phase" />
          </Field>
        </>
      )}
      {mode === 'standing' && (
        <Field label="harmonic n" value={nH}>
          <Slider value={nH} min={1} max={6} step={1} onChange={setNH} ariaLabel="harmonic" />
        </Field>
      )}
      <Chip
        selected={sound}
        onClick={() => setSound((s) => !s)}
        aria-label={sound ? 'Mute wave sound' : 'Hear wave sound'}
      >
        {sound ? 'Sound on' : 'Sound off'}
      </Chip>
    </>
  );

  const observation =
    mode === 'travelling'
      ? 'A complete shape advances one wavelength every period, so v = fλ.'
      : mode === 'superpose'
        ? Math.abs(f - f2) < 0.05
          ? 'The two displacements add point by point; phase decides reinforcement or cancellation.'
          : `Nearby frequencies produce ${beatFreq(f, f2).toFixed(2)} beats per second.`
        : `Harmonic ${nH} keeps ${nH + 1} nodes fixed while the antinodes oscillate.`;
  const reset = () => {
    t.current = 0;
    gate.setPlaying(false);
    setTick((x) => x + 1);
  };
  return (
    <WaveActivity
      activity={activity}
      activityId="wave-lab"
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
          <span>v {v.toFixed(2)}</span>
          <span>f {f.toFixed(1)} Hz</span>
          <span>λ {(mode === 'standing' ? lamStanding : lam).toFixed(2)}</span>
        </>
      }
      observation={observation}
    />
  );
}
