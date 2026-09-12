'use client';

/**
 * AcDcLab, "AC or DC?", now the STANDARD data-driven way: a SceneDoc with one
 * `wave` sim (meta.sims) and one `ac-dc` asset that reads the sim live via simBind.
 * `<Scene>` steps the sim each frame and the pure resolver re-evaluates, so the
 * whole lab is data, the glowing lamp, flowing electrons, water-pipe analogy and
 * live scope are all one sim → three synced skins (see ./asset). Controls write the
 * sim's params; the runtime merges them without restarting the wave (time persists).
 */

import { useMemo, useState, type ReactNode } from 'react';
import { Scene, registerAsset, type SceneDoc } from '@classytic/stage';
import { Slider, Segmented } from '../../kit/controls.js';
import { Field } from '../../kit/frame.js';
import { AuthoredActivityRuntime, AuthoredMetricGate } from '../../kit/authored-activity-runtime.js';
import type { AuthoredActivity } from '../../kit/activity-authoring.js';
import { AC_DC_ASSET } from './asset.js';
import { acDcActivity } from './activity-plan.js';

// Register here (a USED import, so the side-effect module is never tree-shaken, the
// circuit-network lab does the same). asset.js also self-registers; Map.set is idempotent.
registerAsset('ac-dc', AC_DC_ASSET);

export type WaveMode = 'ac' | 'dc';

export interface AcDcProps {
  startMode?: WaveMode;
  volts?: number;
  freqHz?: number;
  title?: string;
  prompt?: string;
  activity?: string | AuthoredActivity;
}

export function AcDcLab({
  startMode = 'dc',
  volts: volts0 = 9,
  freqHz: freq0 = 1,
  title = 'AC or DC?',
  prompt = 'Compare a steady source with one that reverses. The circuit, carrier motion, water analogy and scope stay synchronized.',
  activity = 'ac-dc',
}: AcDcProps = {}): ReactNode {
  const activityId = typeof activity === 'string' ? activity : 'ac-dc';
  const authoredActivity = typeof activity === 'string' ? acDcActivity : activity;
  const [mode, setMode] = useState<WaveMode>(startMode);
  const [volts, setVolts] = useState(volts0);
  const [freqHz, setFreqHz] = useState(freq0);

  const doc = useMemo<SceneDoc>(
    () => ({
      schemaVersion: 2,
      type: 'stage-scene',
      view: { xMin: 0, xMax: 720, yMin: 0, yMax: 540 },
      elements: [
        {
          id: 'fig',
          kind: 'asset',
          def: {
            op: 'asset',
            asset: 'ac-dc',
            params: {},
            bind: {},
            simBind: {
              v: { sim: 'src', field: 'v' },
              charge: { sim: 'src', field: 'charge' },
              samples: { sim: 'src', field: 'samples' },
              mode: { sim: 'src', field: 'mode' },
              volts: { sim: 'src', field: 'volts' },
            },
          },
        },
      ],
      bindings: [],
      meta: { sims: [{ id: 'src', core: 'wave', params: { mode, volts, freqHz }, drives: {} }] },
    }),
    [mode, volts, freqHz],
  );

  const controls = (
    <>
      <Field label="source">
        <Segmented
          ariaLabel="source"
          value={mode}
          onChange={setMode}
          options={[
            { value: 'dc', label: 'DC' },
            { value: 'ac', label: 'AC' },
          ]}
        />
      </Field>
      <Field label="voltage" value={`${volts} V`}>
        <Slider value={volts} min={1} max={12} step={1} onChange={setVolts} ariaLabel="Voltage" />
      </Field>
      {mode === 'ac' && (
        <Field label="frequency" value={`${freqHz.toFixed(1)} Hz`}>
          <Slider value={freqHz} min={0.2} max={5} step={0.1} onChange={setFreqHz} ariaLabel="Frequency" />
        </Field>
      )}
    </>
  );

  return (
    <AuthoredActivityRuntime
      focusLayout="immersive"
      activity={authoredActivity}
      activityId={activityId}
      eyebrow="Electricity and signals"
      title={title}
      description={prompt}
      status={
        <>
          <span>{mode.toUpperCase()}</span>
          <span>{volts} V</span>
          {mode === 'ac' && <span>{freqHz.toFixed(1)} Hz</span>}
        </>
      }
      controls={controls}
      observation={
        mode === 'ac'
          ? 'The source changes sign, so charge oscillates and the scope repeats above and below zero.'
          : 'The source keeps one polarity, so the scope settles to a steady level and charge drifts one way.'
      }
      transcript={
        <p>
          {mode.toUpperCase()} source at {volts} volts{mode === 'ac' ? ` and ${freqHz.toFixed(1)} hertz` : ''}
          . All linked views are driven by this same signal.
        </p>
      }
    >
      {({ complete }) => (
        <>
          <AuthoredMetricGate
            conditionId="ac-tested"
            met={mode === 'ac'}
            complete={complete}
            outcome={mode.toUpperCase()}
          />
          <Scene
            doc={doc}
            interactive={false}
            showGrid={false}
            showAxes={false}
            ariaLabel="AC versus DC: source, wire, lamp, water analogy and a live scope, all driven by one signal"
          />
        </>
      )}
    </AuthoredActivityRuntime>
  );
}
