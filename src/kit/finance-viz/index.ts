/**
 * Finance / operations visual primitives — the reusable pieces the finance labs
 * compose (the same way <Vessel> / <PredictPlot> serve the science labs). Each lives
 * in its own module so a lab that uses one never pulls the others; import from the
 * specific file (e.g. `finance-viz/stock-timeline.js`) for the cleanest tree-shaking,
 * or from this barrel for convenience.
 *
 *   PlotChart      : shared line-chart chrome (legend band, haloed labels, faint grid)
 *   ApportionBar   : split a pool across N segments by a weight (width = share)
 *   StockTimeline  : a level-vs-time chart with guide lines (the reorder sawtooth)
 *   TradeoffCurve  : two opposing costs → U-shaped total, sweet-spot minimum (EOQ)
 */

export {
  PlotChart,
  type PlotChartProps,
  type PlotGuide,
  type PlotLegendItem,
  type PlotGeom,
} from './plot-chart.js';
export { ApportionBar, type ApportionBarProps, type ApportionSegment } from './apportion-bar.js';
export { StockTimeline, type StockTimelineProps, type StockGuide } from './stock-timeline.js';
export { TradeoffCurve, type TradeoffCurveProps } from './tradeoff-curve.js';
