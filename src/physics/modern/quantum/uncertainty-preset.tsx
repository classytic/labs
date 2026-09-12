'use client';
import { useState, type ReactNode } from 'react';
import type { AuthoredActivity } from '../../../kit/activity-authoring.js';
import { AuthoredActivityRuntime } from '../../../kit/authored-activity-runtime.js';
import { Slider } from '../../../kit/controls.js';
import { Field, Readout } from '../../../kit/frame.js';
import { Area, Arrow, Curve, Figure, Guide, HUE, PlotFrame, scale } from '../../../kit/figure/index.js';
import { uncertaintyActivity } from './uncertainty-activity.js';
import { gaussianProbability, minimumUncertaintyPacket } from './uncertainty-core.js';
export interface UncertaintyWavePacketLabProps {
  positionSpread?: number;
  title?: string;
  prompt?: string;
  objectives?: string[];
  activity?: AuthoredActivity;
}

const W = 720;
const H = 292;
const PLOTS = {
  x: { x: 44, y: 52, w: 300, h: 200 },
  p: { x: 404, y: 52, w: 300, h: 200 },
} as const;
const X_DOMAIN = [-6, 6] as const;
const Y_DOMAIN = [0, 1.15] as const;
const SIGMA_HEIGHT = Math.exp(-0.5);

function packetCurve(sigma: number, sc: ReturnType<typeof scale>): Array<[number, number]> {
  return Array.from({ length: 101 }, (_, i) => {
    const v = (i / 100) * 12 - 6;
    return [sc.x(v), sc.y(gaussianProbability(v, sigma))];
  });
}

export function UncertaintyWavePacketLab({
  positionSpread: initialSpread = 1.25,
  title = 'Uncertainty: squeeze one view, spread the other',
  prompt = 'Prepare a minimum-uncertainty Gaussian packet. Localize its position and watch the momentum distribution broaden—even before any individual measurement is made.',
  objectives,
  activity,
}: UncertaintyWavePacketLabProps = {}): ReactNode {
  const [sigmaX, setSigmaX] = useState(initialSpread),
    packet = minimumUncertaintyPacket(sigmaX),
    runtime = activity ?? (objectives ? { ...uncertaintyActivity.source, objectives } : uncertaintyActivity),
    controls = (
      <Field label="position spread Δx" value={`${packet.sigmaX.toFixed(2)} units`}>
        <Slider
          value={sigmaX}
          min={0.25}
          max={3}
          step={0.05}
          onChange={setSigmaX}
          ariaLabel="position uncertainty"
        />
      </Field>
    ),
    evidence = (
      <>
        <Readout
          value={`Δx Δp = ${packet.product.toFixed(2)} ℏ`}
          sub="minimum-uncertainty Gaussian: the product remains ℏ/2"
        />
        <div className="lab-metric-list">
          <div>
            <span>position spread Δx</span>
            <strong>{packet.sigmaX.toFixed(2)}</strong>
          </div>
          <div>
            <span>momentum spread Δp</span>
            <strong>{packet.sigmaP.toFixed(2)} ℏ/unit</strong>
          </div>
          <div>
            <span>prepared state</span>
            <strong>Gaussian</strong>
          </div>
        </div>
      </>
    );
  const panels = [
    {
      key: 'x',
      box: PLOTS.x,
      sigma: packet.sigmaX,
      color: HUE[1],
      title: 'position |ψ(x)|²',
      axis: 'x',
      spread: 'Δx',
    },
    {
      key: 'p',
      box: PLOTS.p,
      sigma: packet.sigmaP,
      color: HUE[2],
      title: 'momentum |φ(p)|²',
      axis: 'p',
      spread: 'Δp',
    },
  ] as const;
  return (
    <AuthoredActivityRuntime
      focusLayout="immersive"
      activity={runtime}
      activityId="uncertainty-wave-packet"
      eyebrow="Modern physics · quantum evidence"
      title={title}
      description={prompt}
      status={
        <>
          <span>Δx {packet.sigmaX.toFixed(2)}</span>
          <span>Δp {packet.sigmaP.toFixed(2)}</span>
          <span>product ℏ/2</span>
        </>
      }
      controls={controls}
      evidence={evidence}
      observation="Squeezing the packet in position widens the spread of momentum components it is built from, and the product stays at ℏ/2. This is a property of the prepared state, not measurement error."
    >
      <Figure
        viewBox={[W, H]}
        domain="physics"
        label={`Position spread ${packet.sigmaX.toFixed(2)} and momentum spread ${packet.sigmaP.toFixed(2)}`}
      >
        {panels.map((panel) => {
          const sc = scale(panel.box, X_DOMAIN, Y_DOMAIN);
          const pts = packetCurve(panel.sigma, sc);
          const bottom = panel.box.y + panel.box.h;
          const widthY = sc.y(SIGMA_HEIGHT);
          return (
            <PlotFrame
              key={panel.key}
              {...panel.box}
              title={panel.title}
              xLabel={panel.axis}
              arrows={false}
              xTicks={[-4, 0, 4].map((v) => ({ at: sc.x(v), label: v < 0 ? `−${-v}` : String(v) }))}
            >
              <Guide x1={sc.x(0)} y1={bottom} x2={sc.x(0)} y2={panel.box.y + 6} color={HUE.soft} />
              <Area points={pts} baseY={bottom} color={panel.color} opacity={14} />
              <Curve points={pts} color={panel.color} />
              <Arrow
                x1={sc.x(-panel.sigma)}
                y1={widthY}
                x2={sc.x(panel.sigma)}
                y2={widthY}
                color={panel.color}
                weight="line"
                head={6}
                double
                label={panel.spread}
              />
            </PlotFrame>
          );
        })}
      </Figure>
    </AuthoredActivityRuntime>
  );
}
