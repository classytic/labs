/**
 * @classytic/labs/blocks — machine-learning / data-analytics lab block specs.
 *
 * `defineBlock` editor adapters for the ML labs. REFERENCE for the schema-driven
 * authoring panel: the editor config is just `<LabConfig schema={…}>` — one
 * Zod-driven panel renders every prop, so there's no hand-built ConfigRow list to
 * maintain. Hoist each block's schema to a const so it backs BOTH `defineBlock`
 * and the panel. One domain per file; exported at `@classytic/labs/blocks/ml`.
 */

import { z } from 'zod';
import { defineBlock } from '@classytic/cms-ui/contract';
import { LabConfig } from './lab-config.js';
import { RegressionLab, KMeansLab, ClassifierThresholdLab } from '../ml/index.js';

const regressionSchema = z.object({
  data: z.array(z.object({ x: z.number(), y: z.number() })).optional(),
  showSquares: z.boolean().default(true),
  learnRate: z.number().default(0.006),
  m0: z.number().default(0.3),
  b0: z.number().default(3.2),
  span: z.number().default(10),
  title: z.string().optional(),
  prompt: z.string().optional(),
});

export const RegressionBlock = defineBlock({
  key: 'regression',
  tag: 'Regression',
  void: true,
  label: 'Linear regression / gradient descent',
  description: 'Least squares made tactile: drag the line’s ends and each point grows a square of its squared error while the MSE updates live; press Descend to watch gradient descent fit it automatically (a learning-rate slider can make it diverge). Author the dataset + starting line.',
  category: 'interactive',
  schema: regressionSchema,
  Component: ({ attributes, mode, updateAttributes }) => {
    const widget = <RegressionLab data={attributes.data} showSquares={attributes.showSquares} learnRate={attributes.learnRate} m0={attributes.m0} b0={attributes.b0} span={attributes.span} title={attributes.title} prompt={attributes.prompt} />;
    if (mode !== 'editing' || !updateAttributes) return widget;
    return <div><LabConfig schema={regressionSchema} value={attributes} onChange={updateAttributes} />{widget}</div>;
  },
});

const kmeansSchema = z.object({
  points: z.array(z.object({ x: z.number(), y: z.number() })).optional(),
  k: z.number().int().min(1).max(5).default(3),
  seeds: z.array(z.object({ x: z.number(), y: z.number() })).optional(),
  span: z.number().default(10),
  showLines: z.boolean().default(true),
  title: z.string().optional(),
  prompt: z.string().optional(),
});

export const KMeansBlock = defineBlock({
  key: 'kmeans',
  tag: 'KMeans',
  void: true,
  label: 'k-means clustering',
  description: 'Unsupervised clustering you watch converge: drag the k centroids to seed them, Step or Run Lloyd’s algorithm (points recolour to nearest centroid, centroids jump to their cluster mean), and the inertia drops. Bad seeds → a worse local minimum. Author the points + k.',
  category: 'interactive',
  schema: kmeansSchema,
  Component: ({ attributes, mode, updateAttributes }) => {
    const widget = <KMeansLab points={attributes.points} k={attributes.k} seeds={attributes.seeds} span={attributes.span} showLines={attributes.showLines} title={attributes.title} prompt={attributes.prompt} />;
    if (mode !== 'editing' || !updateAttributes) return widget;
    return <div><LabConfig schema={kmeansSchema} value={attributes} onChange={updateAttributes} />{widget}</div>;
  },
});

const classifierSchema = z.object({
  positives: z.array(z.number()).optional(),
  negatives: z.array(z.number()).optional(),
  threshold: z.number().default(5),
  span: z.number().default(10),
  title: z.string().optional(),
  prompt: z.string().optional(),
});

export const ClassifierThresholdBlock = defineBlock({
  key: 'classifier-threshold',
  tag: 'ClassifierThreshold',
  void: true,
  label: 'Classification threshold (precision/recall)',
  description: 'The precision–recall trade-off, draggable: positive and negative examples overlap on a score axis; slide the threshold and the 2×2 confusion matrix + precision/recall/accuracy/F1 update live — pushing precision up costs recall. Author the two score sets.',
  category: 'interactive',
  schema: classifierSchema,
  Component: ({ attributes, mode, updateAttributes }) => {
    const widget = <ClassifierThresholdLab positives={attributes.positives} negatives={attributes.negatives} threshold={attributes.threshold} span={attributes.span} title={attributes.title} prompt={attributes.prompt} />;
    if (mode !== 'editing' || !updateAttributes) return widget;
    return <div><LabConfig schema={classifierSchema} value={attributes} onChange={updateAttributes} />{widget}</div>;
  },
});

/** This domain's block specs + tag→component render map. */
export const mlBlocks = [RegressionBlock, KMeansBlock, ClassifierThresholdBlock] as const;
export const mlComponents = {
  Regression: RegressionLab,
  KMeans: KMeansLab,
  ClassifierThreshold: ClassifierThresholdLab,
} as const;
