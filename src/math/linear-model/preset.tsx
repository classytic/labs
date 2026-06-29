'use client';

/**
 * LinearModelLab, the "concrete → graph" proportion/rate lab. A quantity rises in a
 * vessel on one side and is a point on the graph on the other; the learner PLOTS the
 * value for the next input by dragging a point. Discover the rule y = slope·x + intercept
 * from data, then (optionally) answer a follow-up.
 *
 * It is NOT the marble lab wearing different hats: the concrete scene is configurable so a
 * creator builds their OWN idea. `scene='vessel'` is a glass that fills (water pours in on
 * load, the level rises smoothly as you read it); `vesselObjects` decides whether discrete
 * things drop in (marbles for "marbles → volume") or it's just liquid (a bottle filling at
 * a steady rate, savings growing, charge over time). `scene='none'` drops the twin entirely.
 * Swap the labels, units, colours and objects and the same engine is a dozen different labs.
 */

import { useEffect, useState, type ReactNode } from 'react';
import type { Vec2 } from '@classytic/stage';
import { LabFrame, Callout } from '../../kit/frame.js';
import { LabAsk, type LabAskSpec } from '../../kit/ask.js';
import { Feedback, useCheckpoint } from '../../kit/pedagogy.js';
import { useReducedMotion } from '../../kit/anim.js';
import { PredictPlot } from '../../kit/predict.js';
import { Vessel, type GuessTone } from '../../kit/vessel.js';
import { getScene } from '../../kit/scenes.js';

export interface LinearModelProps {
  /** Hidden rule: y = slope·x + intercept. */
  slope?: number;
  intercept?: number;
  /** Inputs already shown as data points (e.g. [0, 1]). */
  given?: number[];
  /** The input the learner predicts (e.g. 2). */
  predictX?: number;
  xMax?: number;
  yMax?: number;
  xStep?: number;
  yStep?: number;
  /** How close (in y units) counts as correct. Default ½ a y-step. */
  tolerance?: number;
  xLabel?: string;
  yLabel?: string;
  unit?: string;
  /** The concrete twin beside the graph: 'none', 'vessel' (supports objects), or any
   *  registered level scene ('tank' | 'bar' | 'battery' | 'jar' | 'pie' | 'balloon' |
   *  'thermometer' | …). Author picks the skin; new scenes come from registerScene. */
  scene?: string;
  /** Extra concrete twins shown alongside `scene` (multi-representation): the same
   *  quantity as a balloon AND a battery AND the graph, all live-linked. */
  extraScenes?: string[];
  /** Drop discrete objects (marbles) into the vessel = the input count. Off → just liquid. */
  vesselObjects?: boolean;
  /**
   * What the concrete twin's LEVEL tracks:
   *   'guess' (default) the liquid rises/falls live as you drag the point, so the
   *           quantity is something you feel increase and decrease; it turns green
   *           when your reading is right.
   *   'truth' the twin sits at the real measured level (poured on load) and your
   *           reading is a dashed line you match to it ("the real lab result").
   */
  vesselBinds?: 'guess' | 'truth';
  /** Word for one object/scene caption (default: the x label). */
  objectLabel?: string;
  liquidColor?: string;
  objectColor?: string;
  height?: number;
  title?: string;
  prompt?: string;
  activity?: string;
  /** Optional graded follow-up (typed or multiple choice). */
  ask?: LabAskSpec;
}

const num = (n: number): string => String(Math.round(n * 100) / 100);

export function LinearModelLab(props: LinearModelProps = {}): ReactNode {
  const {
    slope = 5, intercept = 10, given = [0, 1], predictX = 2,
    xMax = 6, yMax = 40, xStep = 1, yStep = 5,
    xLabel = 'Marbles', yLabel = 'Volume', unit = 'mL',
    scene = 'vessel', extraScenes = [], vesselObjects = false, vesselBinds = 'guess', objectLabel,
    liquidColor = 'var(--stage-accent)', objectColor = '#e85aa6',
    height = 340,
    title = 'Find the volume',
    prompt = `Each step adds the same amount. Drag the point to the ${yLabel.toLowerCase()} at ${predictX} ${(objectLabel ?? xLabel).toLowerCase()}.`,
    activity = 'linear-model', ask,
  } = props;

  const rule = (x: number): number => slope * x + intercept;
  const target = rule(predictX);
  const tol = props.tolerance ?? yStep * 0.5;

  const data: Vec2[] = given.map((x) => ({ x, y: rule(x) }));
  const [guess, setGuess] = useState<Vec2>({ x: predictX, y: 0 });

  const solved = Math.abs(guess.y - target) <= tol;
  const moved = guess.y > 0.001;
  const tone: GuessTone = solved ? 'ok' : moved ? 'no' : 'idle';

  // pour the true level in on mount (a bit of life), unless reduced motion
  const reduce = useReducedMotion();
  const [filled, setFilled] = useState(false);
  useEffect(() => { const t = setTimeout(() => setFilled(true), reduce ? 0 : 80); return () => clearTimeout(t); }, [reduce]);

  useCheckpoint({ solved, activity, response: `${xLabel}=${predictX} → ${num(guess.y)} ${unit}` });

  const figure = (
    <PredictPlot
      data={data}
      guess={guess}
      onGuess={(p) => setGuess(p)}
      tone={tone}
      xMax={xMax}
      yMax={yMax}
      xStep={xStep}
      yStep={yStep}
      xLabel={xLabel}
      yLabel={yLabel}
      height={height}
      rule={solved ? { slope, intercept } : null}
    />
  );

  const readout = (
    <Callout tone="result">
      <div style={{ display: 'grid', gap: 6, fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>
        <span>Your reading: <strong style={{ color: `var(--stage-${solved ? 'good' : moved ? 'warn' : 'fg'})` }}>{num(guess.y)} {unit}</strong></span>
        <Feedback ok={solved} okText={`Spot on, ${num(target)} ${unit}.`} tryText="Read the pattern off the given points." />
        {solved && <span>Rule: <strong>+{num(slope)} {unit}</strong> per {(objectLabel ?? xLabel).toLowerCase().replace(/s$/, '')}.</span>}
      </div>
    </Callout>
  );

  // the concrete twin lives in the narrow aside (beside the graph), not below it.
  // 'vessel' keeps the beaker (with optional dropped objects); any other registered
  // scene name binds the same quantity to that skin (battery, jar, pie, balloon, …).
  const sceneLabel = `${predictX} ${(objectLabel ?? xLabel).toLowerCase()}`;
  const truthFrac = (filled ? target : 0) / yMax;
  const guessFrac = guess.y / yMax;

  // 'guess' (default): the LEVEL itself follows the drag, so the learner watches the
  // quantity rise and fall (and it goes green when right), no separate reading line.
  // 'truth': the level is the real measurement and the dashed line is their reading.
  const live = vesselBinds === 'guess';
  const levelFrac = live ? guessFrac : truthFrac;
  const readingFrac = live ? undefined : guessFrac;
  const levelColor = solved ? 'var(--stage-good)' : liquidColor;

  // build every requested twin (primary scene + any extras); 'vessel' keeps the beaker
  // with optional objects, every other name is a registry level scene.
  const names = scene === 'none' ? [] : [scene, ...extraScenes];
  const multi = names.length > 1;
  const dim = multi ? Math.round((height - 8) / names.length) - 6 : height - 8;
  const twins = names.map((name, i) => {
    const node = name === 'vessel'
      ? <Vessel width={multi ? 110 : 132} height={dim} fillFrac={levelFrac} guessFrac={readingFrac} guessTone={tone} objects={vesselObjects ? predictX : 0} liquidColor={levelColor} objectColor={objectColor} label={multi ? undefined : sceneLabel} scaleMax={multi ? undefined : yMax} scaleStep={yStep * 2} unit={unit} />
      : getScene(name)?.render({ frac: levelFrac, guessFrac: readingFrac, guessTone: tone, color: levelColor, label: multi ? undefined : sceneLabel, width: multi ? 118 : 138, height: dim });
    return <div key={i}>{node}</div>;
  }).filter((t) => t.props.children);

  const aside = twins.length
    ? <div style={{ display: 'grid', gap: 10, justifyItems: 'center' }}>{twins}{readout}</div>
    : readout;

  const footer = ask ? <LabAsk ask={ask} activity={`${activity}-followup`} /> : undefined;

  return <LabFrame title={title} prompt={prompt} aside={aside} footer={footer}>{figure}</LabFrame>;
}
