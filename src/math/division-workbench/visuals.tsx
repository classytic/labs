import type { ReactNode } from 'react';
import { FigTag, FigText, Figure, HUE, STROKE, tint } from '../../kit/figure/index.js';
import type { DivisionMode, DivisionModel } from './core.js';

const W = 700, H = 340;

function ShareScene({ model }: { model: DivisionModel }): ReactNode {
  const groups = Math.min(model.normalizedDivisor, 6);
  const hidden = Math.max(0, model.normalizedDivisor - groups);
  return <g aria-label={`${model.normalizedDividend} units shared into ${model.normalizedDivisor} equal groups`}>
    <FigText x={350} y={42} anchor="middle" size="title">{model.normalizedDividend} shared among {model.normalizedDivisor} groups</FigText>
    {Array.from({ length: groups }, (_, group) => {
      const gap = Math.min(96, 500 / Math.max(1, groups));
      const x = 350 + (group - (groups - 1) / 2) * gap;
      return <g key={group}>
        <rect x={x - 38} y={92} width={76} height={116} rx={18} fill={tint(HUE[1], 10)} stroke={HUE[1]} strokeWidth={STROKE.line} />
        <FigText x={x} y={131} anchor="middle" size="note" tone="soft">group {group + 1}</FigText>
        <FigText x={x} y={169} anchor="middle" baseline="middle" size="title">{model.integerQuotient}</FigText>
        <FigText x={x} y={194} anchor="middle" size="note" tone="soft">units</FigText>
      </g>;
    })}
    {hidden ? <FigText x={350} y={234} anchor="middle" size="note" tone="soft">+ {hidden} equivalent groups</FigText> : null}
    <FigTag x={350} y={292} anchor="middle" color={model.remainder ? HUE.warn : HUE.good}>{model.integerQuotient} each · {model.remainder} left to exchange</FigTag>
  </g>;
}

function WrittenScene({ model }: { model: DivisionModel }): ReactNode {
  const visible = model.steps.slice(-6);
  const gap = Math.min(78, 420 / Math.max(1, visible.length));
  const startX = 350 - ((visible.length - 1) * gap) / 2;
  return <g aria-label={`Written division of ${model.normalizedDividend} by ${model.normalizedDivisor}`}>
    <FigText x={350} y={34} anchor="middle" size="eyebrow" tone="soft">exchange one place, then bring down the next digit</FigText>
    <FigText x={138} y={90} anchor="end" size="title">{model.normalizedDivisor}</FigText>
    <path d="M 152 67 V 112 H 570" fill="none" stroke="var(--stage-ink)" strokeWidth={STROKE.edge} />
    <FigText x={startX} y={89} anchor="middle" baseline="middle" size="title" tone="hue-1">{visible.map(step => step.quotientDigit).join('')}</FigText>
    <FigText x={350} y={132} anchor="middle" size="title">{model.normalizedDividend}</FigText>
    {visible.map((step, index) => {
      const x = startX + index * gap;
      return <g key={step.place}>
        {index ? <path d={`M ${x-gap+18} 196 H ${x-18}`} stroke="var(--stage-border)" strokeDasharray="4 4" /> : null}
        <circle cx={x} cy={188} r={18} fill={tint(step.remainder ? HUE.warn : HUE.good, 13)} stroke={step.remainder ? HUE.warn : HUE.good} />
        <FigText x={x} y={188} anchor="middle" baseline="middle" size="label">{step.brought}</FigText>
        <FigText x={x} y={222} anchor="middle" size="note" tone="soft">− {step.product}</FigText>
        <line x1={x-19} y1={230} x2={x+19} y2={230} stroke="var(--stage-border)" />
        <FigText x={x} y={251} anchor="middle" size="label" tone={step.remainder ? 'hot' : 'good'}>{step.remainder}</FigText>
      </g>;
    })}
    <FigText x={350} y={286} anchor="middle" size="note" tone="soft">brought number → subtract product → carry remainder</FigText>
    <FigTag x={350} y={316} anchor="middle" color={model.remainder ? HUE.warn : HUE.good}>quotient {model.integerQuotient} · remainder {model.remainder}</FigTag>
  </g>;
}

function DecimalScene({ model }: { model: DivisionModel }): ReactNode {
  const shifted = model.scale > 1;
  const moves = Math.round(Math.log10(model.scale));
  return <g aria-label={`Decimal division normalized to ${model.normalizedDividend} divided by ${model.normalizedDivisor}`}>
    <FigText x={350} y={38} anchor="middle" size="eyebrow" tone="soft">move both place-value tracks by the same distance</FigText>
    <FigText x={96} y={105} anchor="start" size="label">dividend</FigText>
    <FigText x={96} y={190} anchor="start" size="label">divisor</FigText>
    {[105, 190].map(y => <g key={y}>
      <line x1={210} y1={y} x2={586} y2={y} stroke="var(--stage-border)" strokeWidth={STROKE.edge} />
      {Array.from({ length: 5 }, (_, index) => <line key={index} x1={258+index*70} y1={y-8} x2={258+index*70} y2={y+8} stroke="var(--stage-border)" />)}
    </g>)}
    <circle cx={260} cy={105} r={9} fill={HUE[1]} /><FigText x={260} y={82} anchor="middle" size="label">{model.dividend}</FigText>
    <circle cx={260} cy={190} r={9} fill={HUE[2]} /><FigText x={260} y={167} anchor="middle" size="label">{model.divisor}</FigText>
    <line x1={278} y1={68} x2={278+moves*70} y2={68} stroke={HUE.good} strokeWidth={STROKE.edge} />
    <path d={`M ${268+moves*70} 58 L ${280+moves*70} 68 L ${268+moves*70} 78`} fill="none" stroke={HUE.good} strokeWidth={STROKE.edge}/>
    <circle cx={260+moves*70} cy={105} r={9} fill={HUE.good} /><FigText x={260+moves*70} y={132} anchor="middle" size="label" tone="good">{model.normalizedDividend}</FigText>
    <circle cx={260+moves*70} cy={190} r={9} fill={HUE.good} /><FigText x={260+moves*70} y={217} anchor="middle" size="label" tone="good">{model.normalizedDivisor}</FigText>
    <FigText x={350} y={263} anchor="middle" size="label" tone="soft">{shifted ? `${moves} place${moves === 1 ? '' : 's'} right for both numbers · × ${model.scale}` : 'The divisor is already a whole number.'}</FigText>
    <FigTag x={350} y={304} anchor="middle" color={HUE.good}>{model.dividend} ÷ {model.divisor} = {model.normalizedDividend} ÷ {model.normalizedDivisor}</FigTag>
  </g>;
}

export function DivisionFigure({ mode, model }: { mode: DivisionMode; model: DivisionModel }): ReactNode {
  return <Figure viewBox={[W, H]} domain="math" label={`${mode} division model`}>
    {mode === 'share' ? <ShareScene model={model} /> : null}
    {mode === 'written' ? <WrittenScene model={model} /> : null}
    {mode === 'decimal' ? <DecimalScene model={model} /> : null}
  </Figure>;
}
