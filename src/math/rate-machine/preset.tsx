'use client';

/**
 * RateMachineLab, the COUNT-driven member of the concrete → graph family (sibling of
 * the reading-driven LinearModelLab). Here the learner drives the INPUT: drag the
 * count up and down (or step it) and watch one quantity scale with it in three
 * linked views at once:
 *   • discrete objects drop INTO / out of the vessel as the count changes;
 *   • the liquid level rises and falls by the same rate each step;
 *   • a point rides up the line on the graph, leaving a dot at every whole step so
 *     the equal-step pattern of a proportional/linear rule builds before your eyes.
 *
 * Proportionality becomes something you scrub, not a table you read. Built entirely
 * on the shared primitives (Vessel + scene registry, CoordPlane + MovableDot, the
 * kit Stepper / LabFrame / useCheckpoint), so it stays consistent with every other
 * lab and an author skins it (battery, jar, savings, charge) by swapping props.
 */

import { useState, type ReactNode } from 'react';
import { Point, Segment, Polyline, Label, MovableDot, type Vec2 } from '@classytic/stage';
import { CoordPlane } from '../../kit/coords.js';
import { LabFrame, ControlBar, Field, Callout } from '../../kit/frame.js';
import { Stepper } from '../../kit/controls.js';
import { useCheckpoint } from '../../kit/pedagogy.js';
import { Vessel, type GuessTone } from '../../kit/vessel.js';
import { getScene } from '../../kit/scenes.js';

export interface RateMachineProps {
  /** Hidden rule: total = rate·count + base. */
  rate?: number;
  base?: number;
  /** Largest count the learner can dial up to. */
  maxCount?: number;
  /** Where the count starts. */
  startCount?: number;
  yMax?: number;
  yStep?: number;
  xLabel?: string;
  yLabel?: string;
  unit?: string;
  /** Word for one unit of the count (default: singular of xLabel). */
  itemLabel?: string;
  /** The concrete twin skin: 'vessel' (drops objects) or any registered level scene. */
  scene?: string;
  extraScenes?: string[];
  /** Drop discrete objects (marbles) as the count = the input. Default true. */
  showObjects?: boolean;
  liquidColor?: string;
  objectColor?: string;
  /** Optional graded goal: "set it to N". Omit for a free explore. */
  target?: number;
  height?: number;
  title?: string;
  prompt?: string;
  activity?: string;
}

const num = (n: number): string => String(Math.round(n * 100) / 100);
const singular = (s: string): string => s.replace(/s$/, '');

export function RateMachineLab(props: RateMachineProps = {}): ReactNode {
  const {
    rate = 5, base = 0, maxCount = 6, startCount = 1,
    yMax = 40, yStep = 5,
    xLabel = 'Items', yLabel = 'Cost', unit = '$', itemLabel,
    scene = 'vessel', extraScenes = [], showObjects = true,
    liquidColor = 'var(--stage-accent)', objectColor = '#e85aa6',
    target, height = 340,
    title = `Build it up: ${rate} ${unit} per ${singular((itemLabel ?? xLabel).toLowerCase())}`,
    prompt, activity = 'rate-machine',
  } = props;

  const totalOf = (k: number): number => rate * k + base;
  const [count, setCount] = useState(() => Math.max(0, Math.min(maxCount, startCount)));
  const total = totalOf(count);
  const one = singular((itemLabel ?? xLabel).toLowerCase());

  const solved = target != null && count === target;
  const tone: GuessTone = solved ? 'ok' : 'idle';
  // grades only when the author set a goal; otherwise it is a free explore
  useCheckpoint({ solved, activity, response: `${count} ${one} → ${num(total)} ${unit}` });

  const setK = (k: number): void => setCount(Math.max(0, Math.min(maxCount, Math.round(k))));

  // ── graph: a dot at every whole step up to the count, the current one draggable ──
  const view = { xMin: -maxCount * 0.04, xMax: maxCount * 1.06, yMin: -yMax * 0.06, yMax: yMax * 1.06 };
  const handle: Vec2 = { x: count, y: total };
  const accent = solved ? 'var(--stage-good)' : 'var(--stage-accent)';

  const dots: ReactNode[] = [];
  for (let k = 0; k <= count; k++) {
    if (k === count) continue; // the current step is the draggable handle, drawn last
    dots.push(<Point key={`d${k}`} x={k} y={totalOf(k)} r={5} color="var(--stage-fg)" />);
  }

  const figure = (
    <CoordPlane view={view} height={height} preserveAspect={false} stepX={1} stepY={yStep}
      ariaLabel={`Graph of ${yLabel} against ${xLabel}; ${count} ${count === 1 ? one : (itemLabel ?? xLabel).toLowerCase()} so far`}>
      <Label x={0} y={view.yMax} text={yLabel} dx={6} dy={-2} anchor="start" size={12} weight={700} />
      <Label x={view.xMax} y={0} text={xLabel} dx={-2} dy={16} anchor="end" size={12} weight={700} />

      {/* the line forming through the steps (0,base) → current */}
      {count > 0 && (
        <Polyline points={[{ x: 0, y: base }, ...Array.from({ length: count }, (_, i) => ({ x: i + 1, y: totalOf(i + 1) }))]}
          color={accent} weight={2} opacity={0.55} />
      )}

      {/* crosshair reading the current total off the y-axis */}
      <Segment from={{ x: count, y: total }} to={{ x: 0, y: total }} color={accent} weight={1.5} dashed opacity={0.8} />
      <Label x={0} y={total} text={num(total)} dx={-8} anchor="end" size={11} weight={700} color={accent} />

      {dots}
      <MovableDot
        value={handle}
        onMove={(p) => setK(p.x)}
        constrain="horizontal"
        range={{ min: 0, max: maxCount }}
        step={1}
        color={accent}
        r={8}
        ariaLabel={`drag right to add ${(itemLabel ?? xLabel).toLowerCase()}, left to remove; now ${count}`}
      />
      <Label x={count} y={total} text={`${count} ${count === 1 ? one : (itemLabel ?? xLabel).toLowerCase()}`} dx={10} dy={-8} anchor="start" size={11} weight={700} color={accent} />
    </CoordPlane>
  );

  // ── concrete twins (same registry path as LinearModel) ──
  const fillFrac = total / yMax;
  const levelColor = solved ? 'var(--stage-good)' : liquidColor;
  const sceneLabel = `${count} ${count === 1 ? one : (itemLabel ?? xLabel).toLowerCase()}`;
  const names = scene === 'none' ? [] : [scene, ...extraScenes];
  const multi = names.length > 1;
  const dim = multi ? Math.round((height - 8) / names.length) - 6 : height - 8;
  const twins = names.map((name, i) => {
    const node = name === 'vessel'
      ? <Vessel width={multi ? 110 : 132} height={dim} fillFrac={fillFrac} guessTone={tone} objects={showObjects ? count : 0} liquidColor={levelColor} objectColor={objectColor} label={multi ? undefined : sceneLabel} scaleMax={multi ? undefined : yMax} scaleStep={yStep * 2} unit={unit} />
      : getScene(name)?.render({ frac: fillFrac, guessTone: tone, color: levelColor, label: multi ? undefined : sceneLabel, width: multi ? 118 : 138, height: dim });
    return <div key={i}>{node}</div>;
  }).filter((t) => t.props.children);

  const readout = (
    <Callout tone="result">
      <div style={{ display: 'grid', gap: 6, fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>
        <span style={{ fontWeight: 700 }}>
          {count} × {num(rate)}{base ? ` + ${num(base)}` : ''} = <strong style={{ color: `var(--stage-${solved ? 'good' : 'fg'})` }}>{num(total)} {unit}</strong>
        </span>
        <span style={{ color: 'var(--stage-muted)' }}>Each {one} adds <strong>{num(rate)} {unit}</strong>: the same step every time.</span>
        {target != null && (solved
          ? <span style={{ color: 'var(--stage-good)', fontWeight: 700 }}>✓ {target} {target === 1 ? one : (itemLabel ?? xLabel).toLowerCase()}.</span>
          : <span style={{ color: 'var(--stage-muted)' }}>Goal: set it to {target}.</span>)}
      </div>
    </Callout>
  );

  const aside = twins.length
    ? <div style={{ display: 'grid', gap: 10, justifyItems: 'center' }}>{twins}{readout}</div>
    : readout;

  const controls = (
    <ControlBar>
      <Field label={xLabel} name="count" value={`${count}`}>
        <Stepper label={xLabel} value={count} min={0} max={maxCount} step={1} onChange={setK} />
      </Field>
    </ControlBar>
  );

  const realPrompt = prompt ?? `Drag the point right to add ${(itemLabel ?? xLabel).toLowerCase()}. Watch the ${unit === '$' ? yLabel.toLowerCase() : 'level'} grow by ${num(rate)} ${unit} each time.`;

  return <LabFrame title={title} prompt={realPrompt} aside={aside} controls={controls}>{figure}</LabFrame>;
}
