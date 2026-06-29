/**
 * @classytic/labs/blocks, economics (commerce) lab block specs.
 *
 * `defineBlock` editor adapters for the economics labs. A creator/agent authors
 * the curve parameters + which controls are on. One domain per file; assembled in
 * `./index.ts` and exported at `@classytic/labs/blocks/economics`.
 */

import { z } from 'zod';
import { defineBlock } from '@classytic/cms-ui/contract';
import { ConfigPanel, ConfigRow, ChipToggle, TextField, NumField } from './authoring.js';
import { MarketEquilibriumLab, ElasticityRevenueLab, DemandShiftVsMoveLab } from '../commerce/index.js';

export const MarketEquilibriumBlock = defineBlock({
  key: 'market-equilibrium',
  tag: 'MarketEquilibrium',
  void: true,
  label: 'Supply & demand equilibrium',
  description: 'Drag the price across fixed demand + supply lines; the lab shades the surplus (amber, above eq) or shortage (red, below eq) gap and marks where the market clears. Shift sliders move both P* and Q*. Author the curve parameters.',
  category: 'interactive',
  schema: z.object({
    demandIntercept: z.number().default(9),
    demandSlope: z.number().default(0.8),
    supplyIntercept: z.number().default(1),
    supplySlope: z.number().default(0.7),
    shiftDemand: z.boolean().default(true),
    shiftSupply: z.boolean().default(true),
    goodLabel: z.string().optional(),
    title: z.string().optional(),
    prompt: z.string().optional(),
  }),
  Component: ({ attributes, mode, updateAttributes }) => {
    const widget = (
      <MarketEquilibriumLab
        demand={{ intercept: attributes.demandIntercept ?? 9, slope: attributes.demandSlope ?? 0.8 }}
        supply={{ intercept: attributes.supplyIntercept ?? 1, slope: attributes.supplySlope ?? 0.7 }}
        shiftControls={{ demand: attributes.shiftDemand, supply: attributes.shiftSupply }}
        goodLabel={attributes.goodLabel} title={attributes.title} prompt={attributes.prompt}
      />
    );
    if (mode !== 'editing' || !updateAttributes) return widget;
    return (
      <div>
        <ConfigPanel>
          <ConfigRow label="title"><TextField value={attributes.title ?? ''} onChange={(v) => updateAttributes({ title: v })} placeholder="Where the market clears" /></ConfigRow>
          <ConfigRow label="demand intercept"><NumField value={attributes.demandIntercept ?? 9} onChange={(v) => updateAttributes({ demandIntercept: v })} /></ConfigRow>
          <ConfigRow label="demand slope"><NumField value={attributes.demandSlope ?? 0.8} onChange={(v) => updateAttributes({ demandSlope: v })} /></ConfigRow>
          <ConfigRow label="supply intercept"><NumField value={attributes.supplyIntercept ?? 1} onChange={(v) => updateAttributes({ supplyIntercept: v })} /></ConfigRow>
          <ConfigRow label="supply slope"><NumField value={attributes.supplySlope ?? 0.7} onChange={(v) => updateAttributes({ supplySlope: v })} /></ConfigRow>
          <ConfigRow label="shift sliders"><ChipToggle active={attributes.shiftDemand !== false} onClick={() => updateAttributes({ shiftDemand: attributes.shiftDemand === false, shiftSupply: attributes.shiftDemand === false })}>on</ChipToggle></ConfigRow>
        </ConfigPanel>
        {widget}
      </div>
    );
  },
});

export const ElasticityRevenueBlock = defineBlock({
  key: 'elasticity-revenue',
  tag: 'ElasticityRevenue',
  void: true,
  label: 'Elasticity & total revenue',
  description: 'Rotate the demand line (substitutes) from steep (inelastic) to flat (elastic); drag the price and watch the total-revenue rectangle + the point-elasticity flip elastic→unit→inelastic down a single straight line.',
  category: 'interactive',
  schema: z.object({
    pivotP: z.number().default(5),
    pivotQ: z.number().default(5),
    title: z.string().optional(),
    prompt: z.string().optional(),
  }),
  Component: ({ attributes, mode, updateAttributes }) => {
    const widget = <ElasticityRevenueLab pivot={{ p: attributes.pivotP ?? 5, q: attributes.pivotQ ?? 5 }} title={attributes.title} prompt={attributes.prompt} />;
    if (mode !== 'editing' || !updateAttributes) return widget;
    return (
      <div>
        <ConfigPanel>
          <ConfigRow label="title"><TextField value={attributes.title ?? ''} onChange={(v) => updateAttributes({ title: v })} placeholder="The stretch test" /></ConfigRow>
          <ConfigRow label="pivot price"><NumField value={attributes.pivotP ?? 5} onChange={(v) => updateAttributes({ pivotP: v })} /></ConfigRow>
          <ConfigRow label="pivot quantity"><NumField value={attributes.pivotQ ?? 5} onChange={(v) => updateAttributes({ pivotQ: v })} /></ConfigRow>
        </ConfigPanel>
        {widget}
      </div>
    );
  },
});

export const DemandShiftVsMoveBlock = defineBlock({
  key: 'demand-shift-vs-move',
  tag: 'DemandShiftVsMove',
  void: true,
  label: 'Shift vs movement along (demand)',
  description: 'Dragging price slides a dot ALONG a fixed demand curve (Δ quantity demanded); clicking a non-price TRIBE factor SHIFTS the whole curve (Δ demand) → new equilibrium. Predict-then-check the P/Q direction.',
  category: 'interactive',
  schema: z.object({
    askPrediction: z.boolean().default(true),
    title: z.string().optional(),
    prompt: z.string().optional(),
  }),
  Component: ({ attributes, mode, updateAttributes }) => {
    const widget = <DemandShiftVsMoveLab askPrediction={attributes.askPrediction} title={attributes.title} prompt={attributes.prompt} />;
    if (mode !== 'editing' || !updateAttributes) return widget;
    return (
      <div>
        <ConfigPanel>
          <ConfigRow label="title"><TextField value={attributes.title ?? ''} onChange={(v) => updateAttributes({ title: v })} placeholder="Shift or move along?" /></ConfigRow>
          <ConfigRow label="ask prediction"><ChipToggle active={attributes.askPrediction !== false} onClick={() => updateAttributes({ askPrediction: attributes.askPrediction === false })}>predict-then-check</ChipToggle></ConfigRow>
        </ConfigPanel>
        {widget}
      </div>
    );
  },
});

/** This domain's block specs + tag→component render map. */
export const economicsBlocks = [MarketEquilibriumBlock, ElasticityRevenueBlock, DemandShiftVsMoveBlock] as const;
export const economicsComponents = {
  MarketEquilibrium: MarketEquilibriumLab,
  ElasticityRevenue: ElasticityRevenueLab,
  DemandShiftVsMove: DemandShiftVsMoveLab,
} as const;
