'use client';
import { useState, type ReactNode } from 'react';
import type { AuthoredActivity } from '../../../kit/activity-authoring.js';
import { AuthoredActivityRuntime } from '../../../kit/authored-activity-runtime.js';
import { ActivitySelect, Slider } from '../../../kit/controls.js';
import { Field, Readout } from '../../../kit/frame.js';
import {
  Ball,
  Block,
  Curve,
  FigText,
  Figure,
  HUE,
  Particle,
  PlotFrame,
  Ray,
  alpha,
  tint,
} from '../../../kit/figure/index.js';
import { doubleSlitActivity } from './double-slit-activity.js';
import { fringeSpacingMm, sampleSlitDetections, slitIntensity, type SlitSetup } from './double-slit-core.js';
export interface DoubleSlitLabProps {
  wavelengthNm?: number;
  slitSeparationUm?: number;
  detections?: number;
  whichPath?: boolean;
  title?: string;
  prompt?: string;
  activity?: AuthoredActivity;
}

const W = 720;
const H = 352;
const BINS = 101;
const SOURCE = { cx: 56, cy: 180, r: 10 };
const BARRIER = { x: 228, w: 14, top: 44, bottom: 316 };
const SLITS = [
  { y: 142, h: 18 },
  { y: 200, h: 18 },
] as const;
const SCREEN = { x: 556, y: 40, w: 44, h: 280 };
const PROFILE = { x: 612, y: 48, w: 84, h: 265 };
const ROW = PROFILE.h / (BINS - 1);
const MAX_DOTS = 400;
const LABEL_Y = 340;

export function DoubleSlitLab({
  wavelengthNm: initialWave = 550,
  slitSeparationUm: initialD = 120,
  detections: initialCount = 80,
  whichPath: initialPath = false,
  title = 'One dot at a time: the double slit',
  prompt = 'Send individual photons through two slits. No single impact draws a wave, yet accumulated impacts reveal an interference probability.',
  activity,
}: DoubleSlitLabProps = {}): ReactNode {
  const [wave, setWave] = useState(initialWave),
    [d, setD] = useState(initialD),
    [count, setCount] = useState(initialCount),
    [whichPath, setWhichPath] = useState(initialPath),
    setup: SlitSetup = {
      wavelengthNm: wave,
      slitSeparationUm: d,
      slitWidthUm: 28,
      screenDistanceM: 1,
      whichPath,
    },
    samples = sampleSlitDetections(count, setup),
    bins = Array(BINS).fill(0) as number[];
  samples.forEach((v) => {
    bins[v.bin] = (bins[v.bin] ?? 0) + 1;
  });
  // The expected count per bin on the same scale as the histogram, so the analytic profile is
  // already there before the first detection and the dots fill it in.
  const weights = Array.from({ length: BINS }, (_, i) => slitIntensity(-40 + (80 * i) / (BINS - 1), setup));
  const total = weights.reduce((a, b) => a + b, 0) || 1;
  const expected = weights.map((w) => (count * w) / total);
  const unit = (PROFILE.w * 0.92) / Math.max(1, ...bins, ...expected);
  const rowY = (i: number): number => PROFILE.y + i * ROW;
  const profile: Array<[number, number]> = expected.map((e, i) => [PROFILE.x + e * unit, rowY(i)]);
  const slitCenters = SLITS.map((s) => s.y + s.h / 2);
  const controls = (
      <>
        <Field label="path information">
          <ActivitySelect
            ariaLabel="path information"
            value={whichPath ? 'detector' : 'indistinguishable'}
            onChange={(next) => setWhichPath(next === 'detector')}
            options={[
              { value: 'indistinguishable', label: 'Interference visible' },
              { value: 'detector', label: 'Which-path detector' },
            ]}
          />
        </Field>
        <Field label="detections" value={String(count)}>
          <Slider
            value={count}
            min={1}
            max={1000}
            step={1}
            onChange={setCount}
            ariaLabel="number of photon detections"
          />
        </Field>
        <Field label="wavelength" value={`${wave} nm`}>
          <Slider
            value={wave}
            min={380}
            max={700}
            step={5}
            onChange={setWave}
            ariaLabel="photon wavelength"
          />
        </Field>
        <Field label="slit separation" value={`${d} μm`}>
          <Slider value={d} min={60} max={240} step={5} onChange={setD} ariaLabel="slit separation" />
        </Field>
      </>
    ),
    evidence = (
      <>
        <Readout
          value={whichPath ? 'No interference fringes' : 'Interference emerges'}
          sub={`${fringeSpacingMm(setup).toFixed(2)} mm predicted fringe spacing`}
        />
        <p>
          Each dot is one localized detection. The histogram estimates the probability distribution only after
          many repeated events.
        </p>
      </>
    );
  return (
    <AuthoredActivityRuntime
      focusLayout="immersive"
      activity={activity ?? doubleSlitActivity}
      activityId="double-slit"
      eyebrow="Modern physics · quantum probability"
      title={title}
      description={prompt}
      status={
        <>
          <span>{count} detections</span>
          <span>{wave} nm</span>
          <span>{whichPath ? 'path known' : 'paths indistinguishable'}</span>
        </>
      }
      controls={controls}
      evidence={evidence}
      observation={
        whichPath
          ? 'Path marking makes the alternatives distinguishable, so the interference cross term disappears.'
          : 'The exact next impact remains unpredictable, but repeated detections build stable bright and dark fringes.'
      }
    >
      <Figure
        viewBox={[W, H]}
        domain="physics"
        label={`${count} accumulated detections ${whichPath ? 'without' : 'with'} interference`}
      >
        {/* light: source → barrier, then a faint cone from each slit to the screen */}
        <Ray
          x1={SOURCE.cx + SOURCE.r + 2}
          y1={SOURCE.cy}
          x2={BARRIER.x - 2}
          y2={SOURCE.cy}
          color={HUE[2]}
          width={6}
          opacity={0.55}
        />
        {/* Each slit spreads a CONE, drawn as a filled wedge. (Two edge rays per slit read as an
            X of crossing lines, not as diffraction.) Where the wedges overlap the fill doubles,
            which is exactly the region that can interfere. */}
        {slitCenters.map((sy) => (
          <path
            key={sy}
            d={`M ${BARRIER.x + BARRIER.w} ${sy} L ${SCREEN.x} ${SCREEN.y + 12} L ${SCREEN.x} ${SCREEN.y + SCREEN.h - 12} Z`}
            fill={alpha(HUE[2], 9)}
          />
        ))}
        <Ball cx={SOURCE.cx} cy={SOURCE.cy} r={SOURCE.r} color={HUE[2]} />

        {/* the barrier with two slits */}
        <Block
          x={BARRIER.x}
          y={BARRIER.top}
          w={BARRIER.w}
          h={SLITS[0].y - BARRIER.top}
          radius={3}
          color={HUE.metal}
        />
        <Block
          x={BARRIER.x}
          y={SLITS[0].y + SLITS[0].h}
          w={BARRIER.w}
          h={SLITS[1].y - SLITS[0].y - SLITS[0].h}
          radius={3}
          color={HUE.metal}
        />
        <Block
          x={BARRIER.x}
          y={SLITS[1].y + SLITS[1].h}
          w={BARRIER.w}
          h={BARRIER.bottom - SLITS[1].y - SLITS[1].h}
          radius={3}
          color={HUE.metal}
        />
        {whichPath && (
          <>
            {SLITS.map((s) => (
              <Block
                key={s.y}
                x={BARRIER.x + BARRIER.w + 4}
                y={s.y + 4}
                w={10}
                h={10}
                radius={2}
                color={HUE.warn}
              />
            ))}
            <FigText
              x={BARRIER.x + BARRIER.w / 2}
              y={BARRIER.top - 12}
              anchor="middle"
              size="eyebrow"
              tone="soft"
            >
              path marked
            </FigText>
          </>
        )}

        {/* detection screen: every dot is one impact */}
        <Block {...SCREEN} radius={6} color={tint(HUE.soft, 30)} />
        {samples.slice(0, MAX_DOTS).map((v, i) => (
          <Particle
            key={i}
            x={SCREEN.x + 7 + ((i * 37) % (SCREEN.w - 14))}
            y={rowY(v.bin)}
            r={2.2}
            color={HUE[2]}
            opacity={0.85}
          />
        ))}

        {/* count profile beside the screen, on the modeled intensity */}
        <PlotFrame {...PROFILE} arrows={false} xLabel="counts">
          {bins.map((n, i) =>
            n ? (
              <Block
                key={i}
                x={PROFILE.x}
                y={rowY(i) - ROW / 2}
                w={n * unit}
                h={ROW}
                radius={1}
                color={HUE[2]}
              />
            ) : null,
          )}
          <Curve points={profile} color={HUE[1]} weight="line" dashed opacity={0.6} />
        </PlotFrame>

        <FigText x={SOURCE.cx} y={LABEL_Y} anchor="middle" size="note" tone="soft">
          source
        </FigText>
        <FigText x={BARRIER.x + BARRIER.w / 2} y={LABEL_Y} anchor="middle" size="note" tone="soft">
          two slits
        </FigText>
        <FigText x={SCREEN.x + SCREEN.w / 2} y={LABEL_Y} anchor="middle" size="note" tone="soft">
          screen
        </FigText>
      </Figure>
    </AuthoredActivityRuntime>
  );
}
