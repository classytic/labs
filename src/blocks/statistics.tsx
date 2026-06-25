/**
 * @classytic/labs/blocks — statistics & sequences lab block specs.
 *
 * `defineBlock` editor adapters for the statistics labs (centre/spread, sequences,
 * Galton/CLT, histogram & box plot, normal + z-scores, z-table, sampling/CI). Same
 * compact LabConfig + attribute-spread pattern as the other domains. Exported at
 * `@classytic/labs/blocks/statistics`.
 */

import type { ReactNode } from 'react';
import { z } from 'zod';
import { defineBlock } from '@classytic/cms-ui/contract';
import { LabConfig } from './lab-config.js';
import {
  CenterSpreadLab, SequenceLab, GaltonBoardLab, HistogramBoxLab, NormalDistributionLab,
  ZTableLab, SamplingDistributionLab,
} from '../statistics/index.js';

const common = { title: z.string().optional(), prompt: z.string().optional(), objectives: z.array(z.string()).optional(), hints: z.array(z.string()).optional(), controlId: z.string().optional() };

/* eslint-disable @typescript-eslint/no-explicit-any */
type Defd = ReturnType<typeof defineBlock>;
function lab(key: string, tag: string, label: string, description: string, schema: z.ZodObject<any>, Comp: (a: any) => ReactNode): Defd {
  return defineBlock({
    key, tag, void: true, label, description, category: 'interactive', schema,
    Component: ({ attributes, mode, updateAttributes }) => {
      const widget = Comp(attributes);
      if (mode !== 'editing' || !updateAttributes) return widget;
      return <div><LabConfig schema={schema} value={attributes} onChange={updateAttributes} />{widget}</div>;
    },
  });
}

const centerSchema = z.object({ data: z.array(z.number()).optional(), min: z.number().optional(), max: z.number().optional(), step: z.number().optional(), showSigma: z.boolean().optional(), challenge: z.object({ stat: z.enum(['mean', 'median']), target: z.number() }).optional(), ...common });
export const CenterSpreadBlock = lab('center-spread', 'CenterSpread', 'Centre & spread (mean as balance point)', 'Drag data points on a number line: the mean rides as a balance-point fulcrum, the median holds, the mode lights up, and a σ band breathes. Outliers move the mean, not the median.', centerSchema, (a) => <CenterSpreadLab {...a} />);

const seqSchema = z.object({ kind: z.enum(['arithmetic', 'geometric']).optional(), first: z.number().optional(), step: z.number().optional(), count: z.number().optional(), ...common });
// tag 'Series' (not 'Sequence' — biology already owns that for its DNA SequenceLab)
export const SeriesBlock = lab('series', 'Series', 'Sequences & series', 'Arithmetic / geometric sequences as bars with a running-total line; for |r|<1 the total converges onto the dashed S∞ guide.', seqSchema, (a) => <SequenceLab {...a} />);

const galtonSchema = z.object({ rows: z.number().optional(), seed: z.number().optional(), showCurve: z.boolean().optional(), ...common });
export const GaltonBlock = lab('galton', 'GaltonBoard', 'Galton board (central limit theorem)', 'Balls bounce through pegs (each a coin-flip) and pile into a bell curve hugging the theoretical normal — the CLT made visible.', galtonSchema, (a) => <GaltonBoardLab {...a} />);

const histoSchema = z.object({ data: z.array(z.number()).optional(), bins: z.number().optional(), min: z.number().optional(), max: z.number().optional(), ...common });
export const HistogramBlock = lab('histogram', 'HistogramBox', 'Histogram & box plot', 'The shape of data: a binned histogram + a box-and-whisker on a shared axis. Click to drop points; symmetric/skewed/bimodal presets; outliers beyond 1.5·IQR.', histoSchema, (a) => <HistogramBoxLab {...a} />);

const normalSchema = z.object({ mu: z.number().optional(), sigma: z.number().optional(), a: z.number().optional(), b: z.number().optional(), mode: z.enum(['area', 'rule']).optional(), ...common });
export const NormalBlock = lab('normal', 'NormalDistribution', 'Normal curve, area & z-scores', 'Drag the shaded bounds → P(a≤X≤b) as area, with z-scores; or the 68-95-99.7 rule view. Slide μ and σ to reshape it.', normalSchema, (a) => <NormalDistributionLab {...a} />);

const ztableSchema = z.object({ x: z.number().optional(), mu: z.number().optional(), sigma: z.number().optional(), tail: z.enum(['left', 'right']).optional(), ...common });
export const ZTableBlock = lab('z-table', 'ZTable', 'z-table (standardize & look up)', 'Standardize x → z, and the live Φ(z) grid highlights the row/column/cell (auto-scrolled) while a mini curve shades the tail. Negative z via symmetry.', ztableSchema, (a) => <ZTableLab {...a} />);

const samplingSchema = z.object({ mu: z.number().optional(), sigma: z.number().optional(), n: z.number().optional(), confidence: z.number().optional(), mode: z.enum(['sampling', 'ci']).optional(), ...common });
export const SamplingBlock = lab('sampling', 'SamplingDistribution', 'Sampling distribution & confidence intervals', 'Stack confidence intervals → ~C% capture μ (what "95% confident" means), or watch sample means pile into Normal(μ, σ/√n).', samplingSchema, (a) => <SamplingDistributionLab {...a} />);

export const statisticsBlocks = [CenterSpreadBlock, SeriesBlock, GaltonBlock, HistogramBlock, NormalBlock, ZTableBlock, SamplingBlock] as const;
export const statisticsComponents = {
  CenterSpread: CenterSpreadLab, Series: SequenceLab, GaltonBoard: GaltonBoardLab, HistogramBox: HistogramBoxLab,
  NormalDistribution: NormalDistributionLab, ZTable: ZTableLab, SamplingDistribution: SamplingDistributionLab,
} as const;
