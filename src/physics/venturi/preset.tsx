'use client';

/**
 * Where the pipe narrows: Bernoulli's equation made visible.
 *
 * Three open tubes stand on a pipe that narrows in the middle. Before the water flows, the
 * learner predicts which tube's water stands lowest. Almost everyone picks the wide parts, or
 * says "the same", because squeezing sounds like pressing. The narrow part is lowest: the water
 * there is fast, and fast water is low-pressure water.
 *
 * The streaks carry the other half of the argument. They are spaced at equal TIME intervals, so
 * where they spread apart the water is moving faster, which even a still picture shows. Tighten
 * the throat far enough and its column falls below zero: the tube would pull air in, which is how
 * a perfume spray and a carburettor draw liquid up. Arithmetic in ./core.ts.
 */

import { useMemo, useRef, useState, type ReactNode } from 'react';
import { useFrameLoop, useInView } from '@classytic/stage';
import { Segmented, Slider } from '../../kit/controls.js';
import { Field, LiveRegion, Readout } from '../../kit/frame.js';
import { useCheckpoint } from '../../kit/pedagogy.js';
import { Activity, RunTransport } from '../../kit/activity.js';
import { FigText, Figure, HUE, STROKE, tint } from '../../kit/figure/index.js';
import { PIPE, headAt, radiusAt, speedAt, throat, type VenturiFlow } from './core.js';

type Guess = 'wide' | 'throat' | 'same' | 'none';

export interface VenturiProps {
  /** Water speed in the wide pipe, m/s. */
  inletSpeed?: number;
  /** Throat radius as a fraction of the wide radius. */
  throatRatio?: number;
  /** Water height in the first tube, m. */
  inletHead?: number;
  /** Hide the water columns until the learner predicts. */
  predict?: boolean;
  title?: string;
  prompt?: string;
  activity?: string;
}

const W = 640;
const H = 360;
const K = 190; // px per metre along the pipe and up the tubes: one honest scale
const LEFT = 35;
const AXIS_Y = 285; // pipe centre line
const R1 = 0.2; // wide radius, m
const TUBES = [0.4, 1.5, 2.6];
const ROWS = [-0.62, -0.22, 0.22, 0.62];
/** Streaks move in slow motion so a 4 m/s throat is still watchable. */
const SLOW = 0.3;

/**
 * Where a drop of water is τ seconds after entering, found by stepping through the flow. The
 * streaks use this table, so their spacing is equal in TIME and therefore wider where faster.
 */
function travelTable(f: VenturiFlow): { tau: number[]; x: number[]; total: number } {
  const tau = [0],
    x = [0];
  const dt = 0.002;
  let t = 0,
    p = 0;
  while (p < PIPE.length) {
    p += speedAt(f, p) * dt;
    t += dt;
    tau.push(t);
    x.push(Math.min(p, PIPE.length));
  }
  return { tau, x, total: t };
}

function positionAt(table: { tau: number[]; x: number[]; total: number }, tau: number): number {
  const t = ((tau % table.total) + table.total) % table.total;
  const i = Math.min(table.tau.length - 2, Math.floor(t / 0.002));
  const f = (t - table.tau[i]!) / 0.002;
  return table.x[i]! + (table.x[i + 1]! - table.x[i]!) * f;
}

export function VenturiLab({
  inletSpeed: initialSpeed = 1,
  throatRatio: initialRatio = 0.5,
  inletHead = 0.9,
  predict = true,
  title,
  prompt,
  activity = 'venturi',
}: VenturiProps = {}): ReactNode {
  const [speed, setSpeed] = useState(initialSpeed);
  const [ratio, setRatio] = useState(initialRatio);
  const [guess, setGuess] = useState<Guess>('none');
  const [running, setRunning] = useState(false);
  const [clock, setClock] = useState(0);
  const lastRef = useRef<number | null>(null);
  const { ref: viewRef, inView } = useInView<HTMLDivElement>();

  const flow: VenturiFlow = { inletSpeed: speed, throatRatio: ratio, inletHead };
  const table = useMemo(
    () => travelTable({ inletSpeed: speed, throatRatio: ratio, inletHead }),
    [speed, ratio, inletHead],
  );
  const th = throat(flow);
  const revealed = !predict || guess !== 'none';

  useFrameLoop(
    (f) => {
      if (lastRef.current !== null) setClock((c) => c + ((f.timeMs - lastRef.current!) / 1000) * SLOW);
      lastRef.current = f.timeMs;
    },
    { running: running && inView },
  );

  const correct: Guess = th.headDrop > 1e-6 ? 'throat' : 'same';
  useCheckpoint({ solved: revealed && (!predict || guess === correct), activity, response: guess });

  // ── the figure ─────────────────────────────────────────────────────────────────
  const X = (x: number): number => LEFT + x * K;
  const wall = (sign: 1 | -1): string => {
    const pts: string[] = [];
    for (let i = 0; i <= 120; i++) {
      const x = (PIPE.length * i) / 120;
      pts.push(
        `${i ? 'L' : 'M'} ${X(x).toFixed(1)} ${(AXIS_Y + sign * radiusAt(x, ratio) * R1 * K).toFixed(1)}`,
      );
    }
    return pts.join(' ');
  };
  const top = wall(-1),
    bottom = wall(1);
  // The water inside: along the top wall, then back along the bottom one.
  const fill = (() => {
    const pts: string[] = [];
    for (let i = 0; i <= 120; i++) {
      const x = (PIPE.length * i) / 120;
      pts.push(`${i ? 'L' : 'M'} ${X(x).toFixed(1)} ${(AXIS_Y - radiusAt(x, ratio) * R1 * K).toFixed(1)}`);
    }
    for (let i = 120; i >= 0; i--) {
      const x = (PIPE.length * i) / 120;
      pts.push(`L ${X(x).toFixed(1)} ${(AXIS_Y + radiusAt(x, ratio) * R1 * K).toFixed(1)}`);
    }
    return `${pts.join(' ')} Z`;
  })();

  const streaks: ReactNode[] = [];
  const perRow = 18;
  ROWS.forEach((row, ri) => {
    for (let i = 0; i < perRow; i++) {
      const tau = clock + (table.total * (i + ri * 0.37)) / perRow;
      const x = positionAt(table, tau);
      const v = speedAt(flow, x);
      const y = AXIS_Y + row * radiusAt(x, ratio) * R1 * K;
      // A streak's length is its speed: the same exposure time for every drop.
      const len = Math.min(26, 3 + v * 5);
      streaks.push(
        <line
          key={`${ri}-${i}`}
          x1={X(x) - len}
          y1={y}
          x2={X(x)}
          y2={y}
          stroke={HUE.paper}
          strokeWidth={STROKE.line}
          strokeLinecap="round"
          opacity={0.9}
        />,
      );
    }
  });

  const tubes = TUBES.map((x, i) => {
    const pipeTop = AXIS_Y - radiusAt(x, ratio) * R1 * K;
    const tubeTop = 28;
    const h = headAt(flow, x);
    const level = Math.max(tubeTop, pipeTop - Math.max(0, h) * K);
    return (
      <g key={x}>
        <rect
          x={X(x) - 9}
          y={tubeTop}
          width={18}
          height={pipeTop - tubeTop}
          fill={tint(HUE.glass, 40)}
          stroke={HUE.soft}
          strokeWidth={STROKE.hair}
        />
        {revealed && h > 0 && (
          <rect x={X(x) - 8} y={level} width={16} height={pipeTop - level} fill={tint(HUE.liquid, 70)} />
        )}
        {revealed ? (
          // Beside the tube, never across it: a label straddling the glass wall was struck through
          // by the tube's own edge.
          <FigText x={X(x) + 15} y={h > 0 ? level : pipeTop - 12} baseline="middle" size="note">
            {h > 0 ? `${h.toFixed(2)} m` : 'sucks air'}
          </FigText>
        ) : (
          <FigText x={X(x)} y={pipeTop - 60} anchor="middle" size="measure" tone="soft">
            ?
          </FigText>
        )}
        <FigText x={X(x)} y={AXIS_Y + R1 * K + 26} anchor="middle" size="note" tone="soft">
          {i === 1 ? `${speedAt(flow, x).toFixed(1)} m/s` : `${speed.toFixed(1)} m/s`}
        </FigText>
      </g>
    );
  });

  const figure = (
    <div ref={viewRef}>
      <Figure
        viewBox={[W, H]}
        domain="physics"
        label={`Water flowing through a pipe that narrows to ${Math.round(ratio * 100)} percent of its width.${revealed ? ` The water column over the narrow part is ${th.headDrop.toFixed(2)} metres lower.` : ''}`}
      >
        <path d={fill} fill={tint(HUE.liquid, 45)} />
        {streaks}
        <path d={top} fill="none" stroke={HUE.ink} strokeWidth={STROKE.edge} />
        <path d={bottom} fill="none" stroke={HUE.ink} strokeWidth={STROKE.edge} />
        {tubes}
        <FigText x={X(0.05)} y={AXIS_Y + 4} size="note" tone="soft" baseline="middle">
          flow →
        </FigText>
      </Figure>
    </div>
  );

  const readout = !revealed ? (
    <Readout value="Which column stands lowest?" sub="Predict before the water flows" />
  ) : th.headDrop < 1e-6 ? (
    <Readout value="All three columns level" sub="the pipe does not narrow" />
  ) : (
    <Readout
      value={`The narrow part is ${th.headDrop.toFixed(2)} m lower`}
      sub={`the water there moves at ${th.speed.toFixed(1)} m/s`}
    />
  );
  const metrics = revealed ? (
    <div className="lab-metric-list">
      <div>
        <span>pressure drop</span>
        <strong>{Math.round(th.pressureDrop)} Pa</strong>
      </div>
      <div>
        <span>area of the throat</span>
        <strong>{Math.round(ratio * ratio * 100)}% of the pipe</strong>
      </div>
    </div>
  ) : null;
  const suction = headAt(flow, (PIPE.converge[1] + PIPE.diverge[0]) / 2) < 0;
  const observation = !revealed
    ? 'The white streaks are drops of water photographed for the same short time. Longer streaks mean faster water.'
    : suction
      ? 'The throat’s pressure has fallen below the air’s, so that tube would pull air in. A perfume spray works this way.'
      : 'The water speeds up in the narrow part, and only a push can speed it up: higher pressure behind, lower ahead.';

  return (
    <Activity.Root className="physics-venturi">
      <Activity.Header>
        <Activity.Heading
          eyebrow="Fluids"
          title={title ?? 'Where the pipe narrows'}
          description={
            prompt ??
            'Water flows through a pipe that narrows in the middle. Three open tubes show the pressure at three places. Predict which tube’s water stands lowest.'
          }
        />
        <Activity.FocusButton />
      </Activity.Header>
      <Activity.Status>
        <span>throat {Math.round(ratio * 100)}% wide</span>
        <span>inlet {speed.toFixed(1)} m/s</span>
      </Activity.Status>
      <Activity.Workspace>
        <Activity.Canvas label="The pipe">{figure}</Activity.Canvas>
        <Activity.Dock>
          {predict && (
            <Segmented<Guess>
              value={guess}
              onChange={setGuess}
              options={[
                { value: 'wide', label: 'Over the wide part' },
                { value: 'throat', label: 'Over the narrow part' },
                { value: 'same', label: 'All the same' },
              ]}
              ariaLabel="your prediction"
            />
          )}
          <Field label="throat width" value={`${Math.round(ratio * 100)}%`}>
            <Slider
              value={ratio}
              min={0.3}
              max={1}
              step={0.05}
              onChange={setRatio}
              ariaLabel="throat width as a fraction of the pipe"
            />
          </Field>
          <Field label="inlet speed" value={`${speed.toFixed(1)} m/s`}>
            <Slider
              value={speed}
              min={0.2}
              max={1.6}
              step={0.1}
              onChange={setSpeed}
              ariaLabel="water speed in the wide pipe"
            />
          </Field>
        </Activity.Dock>
        {readout}
        {metrics}
      </Activity.Workspace>
      <Activity.Transport>
        <RunTransport
          running={running}
          onReset={() => {
            setRunning(false);
            lastRef.current = null;
            setClock(0);
          }}
          onToggle={() => {
            lastRef.current = null;
            setRunning((r) => !r);
          }}
          state={running ? 'Flowing' : 'Still'}
          runLabel="Let it flow"
          resetLabel="Stop the water"
        />
      </Activity.Transport>
      <Activity.Feedback>
        <span>What to notice</span>
        <div>{observation}</div>
      </Activity.Feedback>
      <LiveRegion>{revealed ? `Narrow part ${th.headDrop.toFixed(2)} metres lower.` : ''}</LiveRegion>
    </Activity.Root>
  );
}
