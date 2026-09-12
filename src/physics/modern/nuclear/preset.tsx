'use client';
import { useState, type ReactNode } from 'react';
import type { AuthoredActivity } from '../../../kit/activity-authoring.js';
import { AuthoredActivityRuntime } from '../../../kit/authored-activity-runtime.js';
import { ActivitySelect } from '../../../kit/controls.js';
import { Field, Readout } from '../../../kit/frame.js';
import { Ball, Curve, FigText, Figure, HUE, PlotFrame, scale } from '../../../kit/figure/index.js';
import { bindingEnergyActivity } from './activity.js';
import { bindingState, NUCLIDES, type NuclideId } from './core.js';
const IDS = Object.keys(NUCLIDES) as NuclideId[];
export interface NuclearBindingEnergyLabProps {
  nuclide?: NuclideId;
  title?: string;
  prompt?: string;
  objectives?: string[];
  activity?: AuthoredActivity;
}

const W = 720;
const H = 312;
const PLOT = { x: 64, y: 40, w: 620, h: 230 };
const A_MAX = 250;
const E_MAX = 9.5;

/** Smooth B/A trend (liquid-drop terms along the valley of stability), scaled through Fe-56. */
function trendPerNucleon(A: number): number {
  const Z = A / (2 + 0.015 * Math.cbrt(A) ** 2);
  const B =
    15.75 * A -
    17.8 * Math.cbrt(A) ** 2 -
    (0.711 * Z * (Z - 1)) / Math.cbrt(A) -
    (23.7 * (A - 2 * Z) ** 2) / A;
  return B / A;
}
const TREND_SCALE = bindingState(NUCLIDES.iron56).perNucleonMeV / trendPerNucleon(56);

export function NuclearBindingEnergyLab({
  nuclide: initial = 'iron56',
  title = 'The missing mass that binds a nucleus',
  prompt = 'Compare a nucleus with its separated protons and neutrons. The tiny missing mass is the energy released when the nucleus formed.',
  objectives,
  activity,
}: NuclearBindingEnergyLabProps = {}): ReactNode {
  const [id, setId] = useState<NuclideId>(initial),
    s = bindingState(NUCLIDES[id]),
    runtime =
      activity ?? (objectives ? { ...bindingEnergyActivity.source, objectives } : bindingEnergyActivity);
  const sc = scale(PLOT, [0, A_MAX], [0, E_MAX]);
  const points = IDS.map((k) => {
    const b = bindingState(NUCLIDES[k]);
    return { id: k, A: b.nuclide.A, e: b.perNucleonMeV, symbol: b.nuclide.symbol };
  });
  // light nuclei point to point (the trend formula is not valid there), then the smooth trend
  const light = points.filter((p) => p.A <= 12).sort((a, b) => a.A - b.A);
  const curve: Array<[number, number]> = [
    ...light.map((p): [number, number] => [sc.x(p.A), sc.y(p.e)]),
    ...Array.from({ length: 119 }, (_, i): [number, number] => {
      const A = 14 + i * 2;
      return [sc.x(A), sc.y(trendPerNucleon(A) * TREND_SCALE)];
    }),
  ];
  const sel = points.find((p) => p.id === id)!;
  const selX = sc.x(sel.A);
  const selY = sc.y(sel.e);
  const heavy = sel.A > 120;
  const controls = (
      <Field label="nucleus">
        <ActivitySelect
          ariaLabel="nucleus"
          value={id}
          onChange={setId}
          options={IDS.map((k) => ({ value: k, label: NUCLIDES[k].symbol }))}
        />
      </Field>
    ),
    evidence = (
      <>
        <Readout
          value={`${s.perNucleonMeV.toFixed(2)} MeV / nucleon`}
          sub={`${s.bindingEnergyMeV.toFixed(1)} MeV total binding`}
        />
        <div className="lab-metric-list">
          <div>
            <span>separated atoms + neutrons</span>
            <strong>{s.separatedMassU.toFixed(6)} u</strong>
          </div>
          <div>
            <span>bound atom</span>
            <strong>{s.nuclide.atomicMassU.toFixed(6)} u</strong>
          </div>
          <div>
            <span>mass defect Δm</span>
            <strong>{s.massDefectU.toFixed(6)} u</strong>
          </div>
        </div>
      </>
    );
  return (
    <AuthoredActivityRuntime
      focusLayout="immersive"
      activity={runtime}
      activityId="nuclear-binding-energy"
      eyebrow="Modern physics · nuclear structure"
      title={title}
      description={prompt}
      status={
        <>
          <span>{s.nuclide.symbol}</span>
          <span>{s.nuclide.Z} p</span>
          <span>{s.neutrons} n</span>
        </>
      }
      controls={controls}
      evidence={evidence}
      observation={`${s.nuclide.name} retains ${s.massRetainedPercent.toFixed(3)}% of the separated rest mass. Its ${(100 - s.massRetainedPercent).toFixed(3)}% mass defect corresponds to ${s.bindingEnergyMeV.toFixed(1)} MeV of binding energy.`}
    >
      <Figure
        viewBox={[W, H]}
        domain="physics"
        label={`Binding-energy curve with ${s.nuclide.name} selected`}
      >
        <PlotFrame
          {...PLOT}
          title="binding energy per nucleon"
          xLabel="mass number A"
          yLabel="MeV per nucleon"
          arrows={false}
          xTicks={[0, 60, 120, 180, 240].map((A) => ({ at: sc.x(A), label: String(A) }))}
          yTicks={[0, 3, 6, 9].map((e) => ({ at: sc.y(e), label: String(e) }))}
        >
          <Curve points={curve} color={HUE[1]} />
          {/* names the peak it points at (Fe-56), not empty space to its right */}
          <FigText x={sc.x(56)} y={sc.y(9.2)} anchor="middle" size="note" tone="soft">
            iron ridge
          </FigText>
          <FigText x={sc.x(22)} y={sc.y(4.2)} size="note" tone="soft">
            fusion →
          </FigText>
          <FigText x={sc.x(150)} y={sc.y(6.3)} size="note" tone="soft">
            ← fission
          </FigText>
          {points.map((p) =>
            p.id === id ? null : <Ball key={p.id} cx={sc.x(p.A)} cy={sc.y(p.e)} r={4} color={HUE[1]} />,
          )}
          <Ball cx={selX} cy={selY} r={7} color={HUE[2]} active />
          <FigText
            x={selX + (heavy ? -12 : 12)}
            y={selY + (heavy ? 18 : 4)}
            anchor={heavy ? 'end' : 'start'}
            tone="hue-2"
          >
            {sel.symbol}
          </FigText>
        </PlotFrame>
      </Figure>
    </AuthoredActivityRuntime>
  );
}
