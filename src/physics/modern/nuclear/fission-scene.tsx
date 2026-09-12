import type { ReactNode } from 'react';
import {
  Ball,
  Block,
  Curve,
  FigText,
  Figure,
  Guide,
  HUE,
  Particle,
  PlotFrame,
  Region,
  Track,
  scale,
} from '../../../kit/figure/index.js';
import {
  DEFAULT_MAX_CONTROL_CAPTURE,
  type FissionChainState,
  type FissionGeneration,
} from './fission-core.js';

const W = 720;
const H = 340;
const CORE = { x: 20, y: 36, w: 420, h: 272 };
const NUCLEUS_R = 9;
const COLS = 5;
const ROWS = 4;
const nucleusAt = (index: number): { cx: number; cy: number } => ({
  cx: 70 + (index % COLS) * 64,
  cy: 106 + Math.floor(index / COLS) * 50,
});
const ROD_X = [102, 230, 358];
const ROD_W = 14;
const ROD_MAX = 250;
const PLOT = { x: 490, y: 60, w: 200, h: 210 };
const LEGEND_Y = 326;

type Outcome = 'fission' | 'fuel' | 'captured' | 'leaked';

function GenerationLedger({ generation }: { generation: FissionGeneration }): ReactNode {
  return (
    <div className="modern-fission-ledger" aria-label={`Generation ${generation.generation} neutron ledger`}>
      <div>
        <span>entered</span>
        <strong>{generation.sourceNeutrons.toFixed(2)}</strong>
      </div>
      <div>
        <span>caused fission</span>
        <strong>{generation.fissions.toFixed(2)}</strong>
      </div>
      <div>
        <span>control capture</span>
        <strong>{generation.controlCaptured.toFixed(2)}</strong>
      </div>
      <div>
        <span>fuel capture</span>
        <strong>{generation.fuelCaptured.toFixed(2)}</strong>
      </div>
      <div>
        <span>leaked</span>
        <strong>{generation.leaked.toFixed(2)}</strong>
      </div>
      <div>
        <span>next generation</span>
        <strong>{generation.emittedNeutrons.toFixed(2)}</strong>
      </div>
    </div>
  );
}

export function FissionExperimentScene({
  state,
  selectedGeneration,
}: {
  state: FissionChainState;
  selectedGeneration: number;
}): ReactNode {
  const selected = state.generations[Math.min(selectedGeneration, state.generations.length - 1)]!;
  const uncontrolledK = state.kEffective / Math.max(1e-9, 1 - state.controlCaptureFraction);
  const fixedMax = Math.max(1.25, uncontrolledK ** Math.max(1, state.generations.length - 1));
  const sc = scale(PLOT, [0, Math.max(1, state.generations.length - 1)], [0, fixedMax * 1.05]);
  const trend: Array<[number, number]> = state.generations.map((generation, index) => [
    sc.x(index),
    sc.y(generation.sourceNeutrons),
  ]);

  // A sample of this generation's neutrons, each following one ledger channel in proportion.
  const sampleCount = Math.min(12, Math.max(1, Math.round(selected.sourceNeutrons * 3)));
  const src = selected.sourceNeutrons || 1;
  const capturedRatio = selected.controlCaptured / src;
  const leakedRatio = selected.leaked / src;
  const fissionRatio = selected.fissions / src;
  const rodLen = 12 + ROD_MAX * Math.min(1, state.controlCaptureFraction / DEFAULT_MAX_CONTROL_CAPTURE);
  const rodTip = CORE.y + rodLen;
  const usedNuclei = new Set<number>();
  const claimNucleus = (seed: number): number => {
    let index = seed % (COLS * ROWS);
    while (usedNuclei.has(index)) index = (index + 1) % (COLS * ROWS);
    usedNuclei.add(index);
    return index;
  };
  const neutrons = Array.from({ length: sampleCount }, (_, index) => {
    const fraction = (index + 0.5) / sampleCount;
    const outcome: Outcome =
      fraction <= capturedRatio
        ? 'captured'
        : fraction <= capturedRatio + leakedRatio
          ? 'leaked'
          : fraction <= capturedRatio + leakedRatio + fissionRatio
            ? 'fission'
            : 'fuel';
    const y = 62 + ((index + 0.5) / sampleCount) * 232;
    let tx = CORE.x + CORE.w - 4;
    let ty = y;
    let nucleus: number | undefined;
    if (outcome === 'captured') {
      const rod = ROD_X[index % ROD_X.length]!;
      tx = rod - ROD_W / 2 - 4;
      ty = Math.min(y, rodTip - 4);
    } else if (outcome !== 'leaked') {
      nucleus = claimNucleus(index * 7 + 3);
      const at = nucleusAt(nucleus);
      tx = at.cx - NUCLEUS_R - 4;
      ty = at.cy;
    }
    return { index, outcome, sx: CORE.x + 14, sy: y, tx, ty, nucleus };
  });
  const fissioning = new Set(neutrons.filter((n) => n.outcome === 'fission').map((n) => n.nucleus));
  const absorbing = new Set(neutrons.filter((n) => n.outcome === 'fuel').map((n) => n.nucleus));
  const pathColor = (outcome: Outcome): string =>
    outcome === 'fission' || outcome === 'fuel' ? HUE[2] : HUE.soft;

  return (
    <div className="modern-fission-workspace">
      <Figure
        viewBox={[W, H]}
        domain="physics"
        label={`Generation ${selected.generation}. ${selected.sourceNeutrons.toFixed(2)} neutrons enter; ${selected.emittedNeutrons.toFixed(2)} continue.`}
      >
        <FigText x={CORE.x} y={26} size="title">
          reactor core
        </FigText>
        <Region {...CORE} color={HUE.soft} radius={12} />

        {/* control rods hang from the top edge; the dashed channel shows how far they can go */}
        {ROD_X.map((x) => (
          <g key={x}>
            <Track
              points={[
                [x, rodTip],
                [x, CORE.y + CORE.h - 8],
              ]}
              color={HUE.soft}
              weight="hair"
              opacity={0.6}
            />
            <Block x={x - ROD_W / 2} y={CORE.y} w={ROD_W} h={rodLen} radius={4} color={HUE.metal} />
          </g>
        ))}

        {/* neutron paths for this generation */}
        {neutrons.map((n) => (
          <g key={n.index}>
            <Track
              points={[
                [n.sx, n.sy],
                [n.tx, n.ty],
              ]}
              color={pathColor(n.outcome)}
              weight="hair"
              opacity={0.7}
            />
            <Particle
              x={n.tx}
              y={n.ty}
              r={4}
              color={pathColor(n.outcome)}
              opacity={n.outcome === 'leaked' ? 0.5 : 1}
            />
          </g>
        ))}

        {/* fuel nuclei; a fissioning one flashes and releases fresh neutrons */}
        {Array.from({ length: COLS * ROWS }, (_, index) => {
          const { cx, cy } = nucleusAt(index);
          const splits = fissioning.has(index);
          return (
            <g key={index}>
              <Ball
                cx={cx}
                cy={cy}
                r={NUCLEUS_R}
                color={HUE[1]}
                flash={splits ? 0.6 : 0}
                active={absorbing.has(index)}
              />
              {splits && (
                <>
                  <Particle x={cx + NUCLEUS_R + 8} y={cy - 7} r={3} color={HUE[2]} />
                  <Particle x={cx + NUCLEUS_R + 8} y={cy + 7} r={3} color={HUE[2]} />
                </>
              )}
            </g>
          );
        })}

        {/* generation trend */}
        <PlotFrame
          {...PLOT}
          title="neutrons per generation"
          xLabel="generation"
          arrows={false}
          xTicks={state.generations.map((generation, index) => ({
            at: sc.x(index),
            label: `G${generation.generation}`,
          }))}
          yTicks={[
            { at: sc.y(0), label: '0' },
            { at: sc.y(1), label: '1' },
            { at: sc.y(fixedMax), label: fixedMax.toFixed(1) },
          ]}
        >
          <Guide
            x1={PLOT.x}
            y1={sc.y(1)}
            x2={PLOT.x + PLOT.w}
            y2={sc.y(1)}
            color={HUE.good}
            label="steady"
            labelAnchor="end"
            labelDx={-2}
          />
          <Curve points={trend} color={HUE[2]} weight="line" />
          {trend.map(([x, y], index) => (
            <Ball
              key={index}
              cx={x}
              cy={y}
              r={index === selected.generation ? 7 : 4}
              color={HUE[2]}
              active={index === selected.generation}
            />
          ))}
        </PlotFrame>

        {/* legend */}
        <Ball cx={CORE.x + 8} cy={LEGEND_Y} r={6} color={HUE[1]} />
        <FigText x={CORE.x + 20} y={LEGEND_Y} baseline="middle" size="note" tone="soft">
          fuel nucleus
        </FigText>
        <Ball cx={CORE.x + 120} cy={LEGEND_Y} r={5} color={HUE[1]} flash={0.6} />
        <FigText x={CORE.x + 132} y={LEGEND_Y} baseline="middle" size="note" tone="soft">
          fission
        </FigText>
        <Particle x={CORE.x + 198} y={LEGEND_Y} r={4} color={HUE[2]} />
        <FigText x={CORE.x + 208} y={LEGEND_Y} baseline="middle" size="note" tone="soft">
          neutron
        </FigText>
        <Block x={CORE.x + 274} y={LEGEND_Y - 5} w={ROD_W} h={10} radius={3} color={HUE.metal} />
        <FigText x={CORE.x + 294} y={LEGEND_Y} baseline="middle" size="note" tone="soft">
          control rod
        </FigText>
        <Particle x={CORE.x + 384} y={LEGEND_Y} r={4} color={HUE.soft} />
        <FigText x={CORE.x + 394} y={LEGEND_Y} baseline="middle" size="note" tone="soft">
          captured / leaked
        </FigText>
      </Figure>
      <GenerationLedger generation={selected} />
    </div>
  );
}
