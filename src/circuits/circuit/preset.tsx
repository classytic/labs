'use client';

/**
 * Circuit network — a SceneDoc FACTORY on @classytic/stage. A creator declares a
 * battery + parallel BRANCHES (each a series chain of resistor/bulb/switch); the
 * learner closes switches and tunes the battery to hit a goal (light a bulb /
 * reach a target current / light them all). EMF + each switch are FREE scalars
 * driven through the editor command stack, so a voice/agent ("close switch 1",
 * "set battery to 9") drives the same path. The stage-based successor to the
 * legacy canvas CircuitBuilder.
 */

import { useMemo, type ReactNode } from 'react';
import {
  Scene, resolve, useEditor, controlsFromScene, useControlSurface, registerAsset, isAssetGeom,
  type SceneDoc, type SceneElement, type Ref,
} from '@classytic/stage';
import { CIRCUIT_NETWORK_ASSET } from './asset.js';
import { LabStyles, Chip, Slider, StatusPill } from '../../kit/controls.js';
import { LabFrame, ControlBar, Field, Callout, LiveRegion } from '../../kit/frame.js';
import { useCheckpoint } from '../../kit/pedagogy.js';

registerAsset('circuit-network', CIRCUIT_NETWORK_ASSET);
export { CIRCUIT_NETWORK_ASSET };

const TYPE_CODE = { resistor: 1, bulb: 2, switch: 3 } as const;

export type CircuitComponentSpec =
  | { type: 'resistor'; ohms: number; label?: string }
  | { type: 'bulb'; ohms: number; label?: string }
  | { type: 'switch'; closed?: boolean; label?: string };

export interface CircuitGoal {
  kind: 'lightBulb' | 'targetCurrent' | 'allLit';
  /** flat component index (across all branches in declaration order); omit for "total"/first bulb */
  comp?: number;
  value?: number;
  tol?: number;
}

export interface CircuitNetworkProps {
  emf?: number;
  emfRange?: [number, number, number];
  internalR?: number;
  /** each inner array is a series chain; multiple arrays are in PARALLEL */
  branches?: CircuitComponentSpec[][];
  goal?: CircuitGoal;
  prompt?: string;
  controlId?: string;
  height?: number;
}

const DEFAULT_BRANCHES: CircuitComponentSpec[][] = [[{ type: 'switch', closed: false }, { type: 'bulb', ohms: 6 }]];

interface SwitchInfo { id: string; label: string }

function flatten(branches: CircuitComponentSpec[][]): { comps: { c: CircuitComponentSpec; b: number; p: number }[]; switches: SwitchInfo[] } {
  const comps: { c: CircuitComponentSpec; b: number; p: number }[] = [];
  const switches: SwitchInfo[] = [];
  branches.forEach((chain, b) => chain.forEach((c, p) => {
    comps.push({ c, b, p });
    if (c.type === 'switch') switches.push({ id: `sw${switches.length}`, label: c.label ?? `switch ${switches.length + 1}` });
  }));
  return { comps, switches };
}

export function circuitDoc({ emf = 6, emfRange = [1, 12, 1], internalR = 0, branches = DEFAULT_BRANCHES, goal = { kind: 'lightBulb' } }: CircuitNetworkProps): SceneDoc {
  const { comps, switches } = flatten(branches);
  const nBranch = branches.length;
  const [emfMin, emfMax, emfStep] = emfRange;

  const elements: SceneElement[] = [
    { id: 'emf', kind: 'scalar', label: 'battery', a11y: { label: 'battery voltage' }, free: { value: emf, min: emfMin, max: emfMax, step: emfStep } },
  ];
  switches.forEach((s, j) => elements.push({ id: s.id, kind: 'scalar', a11y: { label: s.label }, free: { value: (branches.flat().filter((c) => c.type === 'switch')[j] as { closed?: boolean }).closed ? 1 : 0, min: 0, max: 1, step: 1 } }));

  const params: Record<string, number> = {
    nComp: comps.length, nBranch, internalR, emf,
    goalType: goal.kind === 'lightBulb' ? 0 : goal.kind === 'targetCurrent' ? 1 : 2,
    goalComp: goal.comp ?? -1,
    goalVal: goal.value ?? (goal.kind === 'targetCurrent' ? 1 : 0.1),
    goalTol: goal.tol ?? 0.05,
  };
  const bind: Record<string, Ref> = { emf: { ref: 'emf' } };
  let swIdx = 0;
  comps.forEach(({ c, b, p }, i) => {
    params[`t${i}`] = TYPE_CODE[c.type];
    params[`o${i}`] = c.type === 'switch' ? 0 : c.ohms;
    params[`b${i}`] = b;
    params[`p${i}`] = p;
    if (c.type === 'switch') { params[`sw${i}`] = swIdx; bind[`k${swIdx}`] = { ref: `sw${swIdx}` }; swIdx++; }
    else params[`sw${i}`] = -1;
  });

  elements.push({ id: 'circuit', kind: 'asset', def: { op: 'asset', asset: 'circuit-network', params, bind } });

  // View bounds the closed loop the asset draws (loopH = (nBranch-1)*ROW_GAP +
  // RETURN_DROP, centered on 0; ROW_GAP=1.5, RETURN_DROP=2.2). Tight x so the
  // 6.4-wide loop fills the card instead of floating in dead space.
  const loopH = (nBranch - 1) * 1.5 + 2.2;
  const vy = loopH / 2 + 1.0;
  return { schemaVersion: 2, type: 'stage-scene', view: { xMin: -4.6, xMax: 4.6, yMin: -vy, yMax: vy }, elements, bindings: [] };
}

export function CircuitNetworkLab(props: CircuitNetworkProps): ReactNode {
  const { branches = DEFAULT_BRANCHES, emfRange = [1, 12, 1], controlId, height = 360, prompt = 'Close the switch and power the circuit.' } = props;
  const initial = useMemo(() => circuitDoc(props), [JSON.stringify(props)]); // eslint-disable-line react-hooks/exhaustive-deps
  const { editor, doc } = useEditor(initial);
  const resolved = resolve(doc);
  const { switches } = useMemo(() => flatten(branches), [branches]);

  const geom = resolved.values.get('circuit');
  const meta = isAssetGeom(geom) ? (geom.meta as { solved: boolean; Itotal: number; emf: number }) : { solved: false, Itotal: 0, emf: 0 };
  const emf = Number(resolved.values.get('emf') ?? 0);

  const [emfMin, emfMax, emfStep] = emfRange;
  const controls = useMemo(() => controlsFromScene(editor, [{ id: 'emf', name: 'battery', min: emfMin, max: emfMax, step: emfStep }]), [editor, emfMin, emfMax, emfStep]);
  useControlSurface(controlId, controls);
  const setEmf = (v: number): void => { editor.dispatch({ op: 'mutate', id: 'emf', patch: { free: { value: v } } }); };
  const toggle = (id: string): void => {
    const cur = Number(resolved.values.get(id) ?? 0);
    editor.dispatch({ op: 'mutate', id, patch: { free: { value: cur >= 0.5 ? 0 : 1 } } });
  };

  useCheckpoint({ solved: meta.solved, activity: 'circuit-network' });

  const figure = (
    <>
      <LabStyles />
      <Scene doc={doc} interactive={false} showGrid={false} showAxes={false} height={height} ariaLabel={prompt} />
      <LiveRegion>
        {meta.solved ? 'Circuit powered, goal reached.' : `Current ${(meta.Itotal * 1000).toFixed(0)} milliamps.`}
      </LiveRegion>
    </>
  );

  const controlsUi = (
    <ControlBar>
      {switches.map((s) => {
        const closed = Number(resolved.values.get(s.id) ?? 0) >= 0.5;
        return <Chip key={s.id} selected={closed} onClick={() => toggle(s.id)}>{s.label}: {closed ? 'closed' : 'open'}</Chip>;
      })}
      <Field label="🔋 battery" value={`${emf} V`}>
        <Slider value={emf} min={emfMin} max={emfMax} step={emfStep} onChange={setEmf} ariaLabel="battery voltage" style={{ width: 120 }} />
      </Field>
    </ControlBar>
  );

  const aside = (
    <>
      <StatusPill ok={meta.solved}>{meta.solved ? '✓ Powered!' : 'Not yet'}</StatusPill>
      <Callout tone="result">I ≈ {(meta.Itotal * 1000).toFixed(0)} mA</Callout>
    </>
  );

  return (
    <LabFrame title="Power the circuit" prompt={prompt} aside={aside} controls={controlsUi}>
      {figure}
    </LabFrame>
  );
}
