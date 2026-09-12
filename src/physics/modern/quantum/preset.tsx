'use client';
import { useState, type ReactNode } from 'react';
import type { AuthoredActivity } from '../../../kit/activity-authoring.js';
import { AuthoredActivityRuntime } from '../../../kit/authored-activity-runtime.js';
import { ActivitySelect, Slider } from '../../../kit/controls.js';
import { Field, Readout } from '../../../kit/frame.js';
import { Ball, Block, FigText, Figure, Glass, HUE, Particle, Ray, Track } from '../../../kit/figure/index.js';
import { photoelectricActivity } from './activity.js';
import { METALS, photoelectricState, type PhotoMetalId } from './photoelectric-core.js';
const IDS = Object.keys(METALS) as PhotoMetalId[];
export interface PhotoelectricEffectLabProps {
  metal?: PhotoMetalId;
  wavelengthNm?: number;
  intensity?: number;
  title?: string;
  prompt?: string;
  objectives?: string[];
  activity?: AuthoredActivity;
}

const W = 720;
const H = 296;
const BEAM_Y = 156;
const TUBE = { x: 280, y: 56, w: 360, h: 200 };
const EMITTER = { x: 300, y: 76, w: 22, h: 160 };
const COLLECTOR = { x: 596, y: 76, w: 14, h: 160 };
const ELECTRON_ROWS = [100, 130, 160, 190, 220];
const LABEL_Y = 282;

export function PhotoelectricEffectLab({
  metal: initialMetal = 'sodium',
  wavelengthNm: initialWave = 400,
  intensity: initialIntensity = 0.6,
  title = 'One photon, one electron: the photoelectric effect',
  prompt = 'Shine monochromatic light on a metal and use a reverse voltage to stop the fastest electrons. Test what colour and brightness actually control.',
  objectives,
  activity,
}: PhotoelectricEffectLabProps = {}): ReactNode {
  const [metal, setMetal] = useState<PhotoMetalId>(initialMetal),
    [wave, setWave] = useState(initialWave),
    [intensity, setIntensity] = useState(initialIntensity),
    [bias, setBias] = useState(0),
    m = METALS[metal],
    s = photoelectricState(wave, m.workFunctionEv, intensity, bias),
    runtime =
      activity ?? (objectives ? { ...photoelectricActivity.source, objectives } : photoelectricActivity),
    emittedCount = s.emits ? Math.max(1, Math.round(intensity * 5)) : 0;
  const controls = (
      <>
        <Field label="metal">
          <ActivitySelect
            ariaLabel="metal"
            value={metal}
            onChange={setMetal}
            options={IDS.map((id) => ({ value: id, label: METALS[id].symbol }))}
          />
        </Field>
        <Field label="wavelength λ" value={`${wave.toFixed(0)} nm`}>
          <Slider
            value={wave}
            min={180}
            max={750}
            step={1}
            onChange={setWave}
            ariaLabel="light wavelength in nanometres"
          />
        </Field>
        <Field label="intensity" value={`${Math.round(intensity * 100)}%`}>
          <Slider
            value={intensity}
            min={0.05}
            max={1}
            step={0.05}
            onChange={setIntensity}
            ariaLabel="light intensity"
          />
        </Field>
        <Field label="collector bias" value={`${bias.toFixed(2)} V`}>
          <Slider
            value={bias}
            min={-5}
            max={2}
            step={0.05}
            onChange={setBias}
            ariaLabel="collector voltage"
          />
        </Field>
      </>
    ),
    evidence = (
      <>
        <Readout
          value={s.emits ? `${s.maxKineticEnergyEv.toFixed(2)} eV maximum KE` : 'No photoelectrons'}
          sub={
            s.emits
              ? `stopping potential ${s.stoppingPotentialV.toFixed(2)} V`
              : `threshold λ ≤ ${s.thresholdWavelengthNm.toFixed(0)} nm`
          }
        />
        <div className="lab-metric-list">
          <div>
            <span>photon energy hf</span>
            <strong>{s.photonEnergyEv.toFixed(2)} eV</strong>
          </div>
          <div>
            <span>work function φ</span>
            <strong>{s.workFunctionEv.toFixed(2)} eV</strong>
          </div>
          <div>
            <span>relative photocurrent</span>
            <strong>{(s.relativeCurrent * 100).toFixed(0)}%</strong>
          </div>
        </div>
      </>
    );
  return (
    <AuthoredActivityRuntime
      focusLayout="immersive"
      activity={runtime}
      activityId="photoelectric-effect"
      eyebrow="Modern physics · quantum evidence"
      title={title}
      description={prompt}
      status={
        <>
          <span>{m.symbol}</span>
          <span>{wave.toFixed(0)} nm</span>
          <span>{s.emits ? 'emitting' : 'below threshold'}</span>
        </>
      }
      controls={controls}
      evidence={evidence}
      observation={
        s.emits
          ? `Each photon supplies ${s.photonEnergyEv.toFixed(2)} eV: ${s.workFunctionEv.toFixed(2)} eV frees the electron and ${s.maxKineticEnergyEv.toFixed(2)} eV remains. Intensity changes current, not this energy.`
          : `Even at ${Math.round(intensity * 100)}% intensity, each photon has only ${s.photonEnergyEv.toFixed(2)} eV—less than ${m.symbol}'s ${s.workFunctionEv.toFixed(2)} eV work function.`
      }
    >
      <Figure
        viewBox={[W, H]}
        domain="physics"
        label={`${wave.toFixed(0)} nanometre light on ${m.name}; ${s.emits ? 'electrons emitted' : 'no electrons emitted'}`}
      >
        <FigText x={TUBE.x + TUBE.w / 2} y={44} anchor="middle" size="title">
          vacuum phototube
        </FigText>

        {/* incoming light: brighter means a wider beam, never a more energetic photon */}
        <FigText x={36} y={BEAM_Y - 22 - intensity * 6} size="note" tone="soft">
          incoming light
        </FigText>
        <Ray
          x1={36}
          y1={BEAM_Y}
          x2={EMITTER.x - 6}
          y2={BEAM_Y}
          color={HUE[2]}
          width={5 + intensity * 9}
          opacity={0.85}
        />
        {[70, 130, 190, 250].map((x) => (
          <Ball key={x} cx={x} cy={BEAM_Y} r={4} color={HUE[2]} />
        ))}

        <Glass {...TUBE} shape="box" rim={false}>
          <Block {...EMITTER} color={HUE.metal} radius={5} />
          <Block {...COLLECTOR} color={HUE.metal} radius={4} />
          {/* bound electrons at the metal surface */}
          {ELECTRON_ROWS.map((y) => (
            <Particle key={y} x={EMITTER.x + EMITTER.w - 3} y={y} r={4} color={HUE[1]} />
          ))}
          {/* emitted electrons travel toward the collector as far as the bias allows */}
          {ELECTRON_ROWS.slice(0, emittedCount).map((y, i) => {
            const x = EMITTER.x + EMITTER.w + 14 + i * 46 * s.relativeCurrent;
            return (
              <g key={y}>
                <Track
                  points={[
                    [EMITTER.x + EMITTER.w + 2, y],
                    [x - 8, y],
                  ]}
                  color={HUE[1]}
                  weight="hair"
                  opacity={0.6}
                />
                <Ball cx={x} cy={y} r={6} color={HUE[1]} />
              </g>
            );
          })}
        </Glass>

        <FigText x={EMITTER.x + EMITTER.w / 2} y={LABEL_Y} anchor="middle" size="note" tone="soft">
          {m.symbol} emitter
        </FigText>
        <FigText x={COLLECTOR.x + COLLECTOR.w / 2} y={LABEL_Y} anchor="middle" size="note" tone="soft">
          collector ({bias < 0 ? '−' : '+'})
        </FigText>
      </Figure>
    </AuthoredActivityRuntime>
  );
}
