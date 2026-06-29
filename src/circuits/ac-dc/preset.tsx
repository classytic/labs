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
import { Slider, Chip } from '../../kit/controls.js';
import { LabFrame, ControlBar, Field } from '../../kit/frame.js';
import { AC_DC_ASSET } from './asset.js';

// Register here (a USED import, so the side-effect module is never tree-shaken, the
// circuit-network lab does the same). asset.js also self-registers; Map.set is idempotent.
registerAsset('ac-dc', AC_DC_ASSET);

export type WaveMode = 'ac' | 'dc';

export interface AcDcProps {
  startMode?: WaveMode;
  volts?: number;
  freqHz?: number;
}

export function AcDcLab({ startMode = 'dc', volts: volts0 = 9, freqHz: freq0 = 1 }: AcDcProps = {}): ReactNode {
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
    <ControlBar>
      <Field label="source">
        <span className="lab-field-row">
          <Chip selected={mode === 'dc'} onClick={() => setMode('dc')}>DC</Chip>
          <Chip selected={mode === 'ac'} onClick={() => setMode('ac')}>AC</Chip>
        </span>
      </Field>
      <Field label="voltage" value={`${volts} V`}>
        <Slider value={volts} min={1} max={12} step={1} onChange={setVolts} ariaLabel="Voltage" />
      </Field>
      {mode === 'ac' && (
        <Field label="frequency" value={`${freqHz.toFixed(1)} Hz`}>
          <Slider value={freqHz} min={0.2} max={5} step={0.1} onChange={setFreqHz} ariaLabel="Frequency" />
        </Field>
      )}
    </ControlBar>
  );

  return (
    <LabFrame controls={controls}>
      <Scene doc={doc} interactive={false} showGrid={false} showAxes={false} ariaLabel="AC versus DC: source, wire, lamp, water analogy and a live scope, all driven by one signal" />
    </LabFrame>
  );
}
