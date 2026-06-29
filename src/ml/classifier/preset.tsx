'use client';

/**
 * ClassifierThresholdLab, the precision/recall trade-off you can drag. Positive
 * and negative examples sit along a score axis (they OVERLAP, like any real
 * classifier). Drag the threshold: everything to its right is predicted positive.
 * The 2×2 confusion matrix and precision / recall / accuracy / F1 update live , 
 * slide right and precision climbs while recall falls; there's no setting that
 * maxes both. Misclassified points get a red ring.
 *
 * A data-analytics instrument from pure primitives: Dot + a horizontal MovableDot
 * threshold + a live HTML confusion matrix.
 */

import { useState, type ReactNode } from 'react';
import { Stage, Segment, Polygon, Dot, Circle, Label, MovableDot, type Vec2 } from '@classytic/stage';
import { StatusPill } from '../../kit/controls.js';
import { LabFrame, LiveRegion } from '../../kit/frame.js';
import { useCheckpoint, useChallenge, ChallengeCard, type ChallengeQuestion } from '../../kit/pedagogy.js';
import { clamp } from '../../core/util.js';

export interface ClassifierProps {
  positives?: number[];          // scores of the positive class
  negatives?: number[];          // scores of the negative class
  threshold?: number;
  span?: number;
  title?: string;
  prompt?: string;
  objectives?: string[];
  height?: number;
}

const POS = 'var(--stage-good)';
const NEG = 'var(--stage-muted)';
const DEFAULT_POS = [4, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9];
const DEFAULT_NEG = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 6];

const PREDICT_Q: ChallengeQuestion[] = [
  {
    id: 'recall-vs-threshold',
    prompt: 'As you RAISE the threshold (label fewer things positive), what happens to RECALL — the share of true positives you catch?',
    choices: [
      { value: 'down', label: 'recall falls' },
      { value: 'up', label: 'recall rises' },
      { value: 'same', label: 'unchanged' },
    ],
    answer: 'down',
    explain:
      'Raising the threshold means fewer points clear the bar, so you catch fewer of the real positives (more false negatives): recall falls. Precision usually rises in return, since the ones you do call positive are more likely correct. That is the trade-off, no single threshold maxes both.',
  },
];

export function ClassifierThresholdLab({
  positives = DEFAULT_POS,
  negatives = DEFAULT_NEG,
  threshold = 5,
  span = 10,
  title = 'The precision–recall trade-off',
  prompt = 'Drag the threshold: everything to its right is called positive. Watch the confusion matrix, pushing precision up costs you recall.',
  objectives,
  height = 300,
}: ClassifierProps): ReactNode {
  const view = { xMin: 0, xMax: span, yMin: -4, yMax: 4 };
  const [t, setT] = useState(threshold);
  const [moved, setMoved] = useState(false);
  const ch = useChallenge(PREDICT_Q);
  useCheckpoint({ solved: moved && ch.allCorrect, activity: 'classifier-threshold' });

  const TP = positives.filter((s) => s >= t).length;
  const FN = positives.length - TP;
  const FP = negatives.filter((s) => s >= t).length;
  const TN = negatives.length - FP;
  const total = positives.length + negatives.length;
  const precision = TP + FP === 0 ? 0 : TP / (TP + FP);
  const recall = TP + FN === 0 ? 0 : TP / (TP + FN);
  const accuracy = (TP + TN) / total;
  const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);

  const dragT = (p: Vec2): void => {
    setT(clamp(p.x, view.xMin, view.xMax));
    if (!moved) setMoved(true);
  };

  const yOf = (i: number): number => (i % 3) - 1; // -1,0,1 spread to avoid overlap
  const dot = (s: number, i: number, posClass: boolean): ReactNode => {
    const predictedPos = s >= t;
    const wrong = predictedPos !== posClass;
    const cy = (posClass ? 2 : -2) + yOf(i) * 0.5;
    return (
      <g key={`${posClass ? 'p' : 'n'}${i}`}>
        {wrong && <Circle center={{ x: s, y: cy }} r={0.42} color="var(--stage-danger)" fill="none" weight={2} />}
        <Dot x={s} y={cy} r={5.5} color={posClass ? POS : NEG} />
      </g>
    );
  };

  const Cell = ({ label, n, tone }: { label: string; n: number; tone: string }): ReactNode => (
    <div style={{ padding: '8px 10px', borderRadius: 8, background: `color-mix(in oklab, ${tone} 14%, var(--stage-bg))`, border: `1px solid color-mix(in oklab, ${tone} 40%, var(--stage-grid))`, textAlign: 'center', minWidth: 78 }}>
      <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--stage-muted)' }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: tone }}>{n}</div>
    </div>
  );
  const Metric = ({ label, v }: { label: string; v: number }): ReactNode => (
    <div style={{ flex: 1, minWidth: 90 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--stage-muted)' }}>{label} {(v * 100).toFixed(0)}%</div>
      <div style={{ height: 8, borderRadius: 999, background: 'color-mix(in oklab, var(--stage-fg) 10%, transparent)', overflow: 'hidden' }}>
        <div style={{ width: `${v * 100}%`, height: '100%', background: 'var(--stage-accent)', transition: 'width .1s' }} />
      </div>
    </div>
  );

  const figure = (
    <Stage view={view} height={height} preserveAspect={false} ariaLabel={`Score axis with a threshold at ${t.toFixed(1)}; precision ${(precision * 100).toFixed(0)}%, recall ${(recall * 100).toFixed(0)}%`}>
      <Polygon points={[{ x: t, y: view.yMin }, { x: span, y: view.yMin }, { x: span, y: view.yMax }, { x: t, y: view.yMax }]} color="transparent" fill="var(--stage-accent)" fillOpacity={0.08} weight={0} />
      <Segment from={{ x: 0, y: 0 }} to={{ x: span, y: 0 }} color="var(--stage-grid)" weight={1} />
      <Label x={1.2} y={3.5} text="positives ●" size={11} color={POS} />
      <Label x={1.2} y={-3.5} text="negatives ●" size={11} color={NEG} />
      <Label x={span - 1.3} y={3.5} text="→ called +" size={11} color="var(--stage-accent)" />
      {positives.map((s, i) => dot(s, i, true))}
      {negatives.map((s, i) => dot(s, i, false))}
      <Segment from={{ x: t, y: view.yMin }} to={{ x: t, y: view.yMax }} color="var(--stage-accent)" weight={2.5} dashed />
      <MovableDot value={{ x: t, y: 0 }} onMove={dragT} constrain="horizontal" range={{ min: view.xMin, max: view.xMax }} r={9} color="var(--stage-accent)" ariaLabel="decision threshold" />
    </Stage>
  );

  const aside = (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
        <Cell label="true +" n={TP} tone={POS} />
        <Cell label="false −" n={FN} tone="var(--stage-warn)" />
        <Cell label="false +" n={FP} tone="var(--stage-danger)" />
        <Cell label="true −" n={TN} tone={NEG} />
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignContent: 'flex-start' }}>
        <Metric label="precision" v={precision} />
        <Metric label="recall" v={recall} />
        <Metric label="accuracy" v={accuracy} />
        <Metric label="F1" v={f1} />
        <StatusPill ok>threshold {t.toFixed(1)}</StatusPill>
      </div>
    </>
  );

  const footer = (
    <>
      <ChallengeCard questions={PREDICT_Q} state={ch} title="Predict first" />
      <LiveRegion>
        {`Threshold ${t.toFixed(1)}. Precision ${(precision * 100).toFixed(0)} percent, recall ${(recall * 100).toFixed(0)} percent.`}
      </LiveRegion>
    </>
  );

  return (
    <LabFrame title={title} prompt={prompt} objectives={objectives} aside={aside} footer={footer}>
      {figure}
    </LabFrame>
  );
}
