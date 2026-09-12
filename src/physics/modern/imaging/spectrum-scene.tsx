import type { ReactNode } from 'react';
import {
  Area,
  Ball,
  Block,
  Curve,
  FigText,
  Figure,
  Guide,
  HUE,
  Particle,
  PlotFrame,
  Ray,
  Track,
  scale,
  tint,
} from '../../../kit/figure/index.js';
import type { XraySpectrumExposure, XraySpectrumState } from './xray-spectrum-core.js';

const W = 720;
const H = 404;
// apparatus row
const BEAM_Y = 92;
const CATHODE = { x: 28, y: 64, w: 30, h: 56 };
const TARGET = { x: 160, y: 54, w: 30, h: 76 };
const FILTER = { x: 420, y: 48, w: 18, h: 88 };
const DETECTOR = { x: 612, y: 42, w: 36, h: 100 };
const PHOTON_START = TARGET.x + TARGET.w + 4;
const LABEL_Y = 160;
// plot
const PLOT = { x: 64, y: 196, w: 626, h: 150 };
const LEGEND_Y = 392;

export function XraySpectrumExperimentScene({
  state,
  exposure,
}: {
  state: XraySpectrumState;
  exposure: XraySpectrumExposure;
}): ReactNode {
  const active = exposure.photons.slice(0, exposure.emitted);
  const binCount = exposure.detectedBins.length;
  const endpoint = state.endpointKev;

  // The y scale is fixed to the FINAL detector histogram (the cohort is deterministic), so bars
  // grow into place instead of the axis rescaling every frame, and the modeled spectrum can be
  // drawn on the same scale before a single photon has left the tube.
  const finalBins = Array.from({ length: binCount }, () => 0);
  for (const photon of exposure.photons) {
    if (!photon.transmitted) continue;
    const index = Math.min(binCount - 1, Math.floor((photon.energyKev / endpoint) * binCount));
    finalBins[index]! += 1;
  }
  const yMax = Math.max(1, ...finalBins);
  const sc = scale(PLOT, [0, endpoint], [0, yMax * 1.12]);
  const modelMax = Math.max(1e-9, ...state.bins.map((bin) => bin.filtered));
  const modelPts: Array<[number, number]> = state.bins.map((bin) => [
    sc.x(bin.energyKev),
    sc.y((bin.filtered / modelMax) * yMax),
  ]);
  const barW = PLOT.w / binCount;
  // round tick step so the axis reads 0 · 20 · 40 … rather than thirds of the endpoint
  const step = [10, 20, 25, 50].find((s) => endpoint / s <= 6) ?? 50;
  const xTicks = Array.from({ length: Math.floor((endpoint - 1e-9) / step) + 1 }, (_, i) => ({
    at: sc.x(step * i),
    label: String(step * i),
  }));

  return (
    <Figure
      viewBox={[W, H]}
      domain="physics"
      label={`${exposure.emitted} photons emitted, ${exposure.filteredOut} filtered out, and ${exposure.detected} detected`}
    >
      <FigText x={24} y={20} size="eyebrow" tone="soft">
        electrons → target → filter → detector
      </FigText>

      {/* electron beam: cathode → target */}
      <Ray
        x1={CATHODE.x + CATHODE.w + 4}
        y1={BEAM_Y}
        x2={TARGET.x - 4}
        y2={BEAM_Y}
        color={HUE[1]}
        width={5}
        opacity={0.5}
      />
      {[0, 1, 2, 3, 4].map((i) => {
        const fr = (i * 0.2 + exposure.progress * 2.4) % 1;
        return (
          <Particle key={i} x={CATHODE.x + CATHODE.w + 10 + fr * 84} y={BEAM_Y} r={3.5} color={HUE[1]} />
        );
      })}
      <Block {...CATHODE} color={HUE.metal} />
      <Block {...TARGET} color={HUE.metal} />

      {/* photon beam: target → filter → detector, dimmer past the filter */}
      <Ray
        x1={PHOTON_START}
        y1={BEAM_Y}
        x2={FILTER.x - 2}
        y2={BEAM_Y}
        color={HUE[2]}
        width={6}
        opacity={0.35}
      />
      <Ray
        x1={FILTER.x + FILTER.w + 2}
        y1={BEAM_Y}
        x2={DETECTOR.x - 2}
        y2={BEAM_Y}
        color={HUE[2]}
        width={6}
        opacity={0.18}
      />
      <Block {...FILTER} color={HUE.metal} />
      <Block {...DETECTOR} color={tint(HUE[3], 45)} />

      {active.map((photon) => {
        const phase = exposure.progress * exposure.photons.length - photon.id;
        const travel = Math.max(0, Math.min(1, phase));
        const endX = photon.transmitted ? DETECTOR.x : FILTER.x + FILTER.w / 2;
        const x = PHOTON_START + travel * (endX - PHOTON_START);
        const y = BEAM_Y + (((photon.id * 17) % 15) - 7) * 4;
        const color = photon.characteristic ? HUE.warn : HUE[2];
        if (!photon.transmitted && x >= FILTER.x - 4) {
          // absorbed in the aluminium: a faded pulse resting on the filter face
          return <Particle key={photon.id} x={FILTER.x - 2} y={y} r={4} color={color} opacity={0.35} />;
        }
        return <Ball key={photon.id} cx={x} cy={y} r={photon.characteristic ? 5 : 4} color={color} />;
      })}

      <FigText x={CATHODE.x + CATHODE.w / 2} y={LABEL_Y} anchor="middle" size="note" tone="soft">
        cathode
      </FigText>
      <FigText x={TARGET.x + TARGET.w / 2} y={LABEL_Y} anchor="middle" size="note" tone="soft">
        target
      </FigText>
      <FigText x={FILTER.x + FILTER.w / 2} y={LABEL_Y} anchor="middle" size="note" tone="soft">
        Al filter
      </FigText>
      <FigText x={DETECTOR.x + DETECTOR.w / 2} y={LABEL_Y} anchor="middle" size="note" tone="soft">
        detector
      </FigText>

      {/* detected spectrum on the modeled curve */}
      <PlotFrame
        {...PLOT}
        title="detected energy spectrum"
        xLabel="photon energy (keV)"
        yLabel="photons"
        arrows={false}
        xTicks={xTicks}
      >
        <Area points={modelPts} baseY={PLOT.y + PLOT.h} color={HUE[1]} opacity={10} />
        <Curve points={modelPts} color={HUE[1]} weight="line" dashed opacity={0.6} />
        {exposure.detectedBins.map((value, index) =>
          value > 0 ? (
            <Block
              key={index}
              x={PLOT.x + index * barW + 3}
              y={sc.y(value)}
              w={Math.max(2, barW - 6)}
              h={PLOT.y + PLOT.h - sc.y(value)}
              color={HUE[2]}
              radius={3}
            />
          ) : null,
        )}
        <Guide
          x1={sc.x(endpoint)}
          y1={PLOT.y + PLOT.h}
          x2={sc.x(endpoint)}
          y2={PLOT.y}
          color={HUE.hot}
          label={`endpoint ${endpoint.toFixed(0)} keV`}
          labelAnchor="end"
        />
      </PlotFrame>

      {/* legend */}
      <Particle x={PLOT.x + 4} y={LEGEND_Y} r={4} color={HUE[2]} />
      <FigText x={PLOT.x + 14} y={LEGEND_Y} baseline="middle" size="note" tone="soft">
        bremsstrahlung photon
      </FigText>
      <Particle x={PLOT.x + 176} y={LEGEND_Y} r={4} color={HUE.warn} />
      <FigText x={PLOT.x + 186} y={LEGEND_Y} baseline="middle" size="note" tone="soft">
        characteristic line
      </FigText>
      <Track
        points={[
          [PLOT.x + 336, LEGEND_Y],
          [PLOT.x + 364, LEGEND_Y],
        ]}
        color={HUE[1]}
        weight="line"
      />
      <FigText x={PLOT.x + 372} y={LEGEND_Y} baseline="middle" size="note" tone="soft">
        modeled spectrum
      </FigText>
    </Figure>
  );
}
