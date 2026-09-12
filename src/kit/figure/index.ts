// ── the figure kit: one visual language for every hand-drawn scene ─────────────
//   Figure     the <svg> root: tokens, domain palette, shared defs
//   FigText    every word in a figure (size/tone roles, halo)
//   Ball/Particle/Block   bodies that move
//   Glass/Region/Bubbles  containers and media
//   Arrow/Ray/Track/Ground lines with meaning
//   PlotFrame/Curve/Area/Guide/Marker/SegmentBar  the plot beside the scene
//   Illustration  the slot for host-supplied artwork (docs/ILLUSTRATIONS.md)
export {
  Figure,
  useFigureId,
  figUrl,
  STROKE,
  HUE,
  tint,
  shade,
  alpha,
  fmt,
  type FigureProps,
  type FigDomain,
  type StrokeRole,
} from './figure.js';
export { FigText, FigTag, type FigTextProps, type FigTextSize, type FigTextTone } from './text.js';
export { Ball, Particle, Block, type BallProps, type BlockProps } from './body.js';
export { Glass, glassInner, Bubbles, Region, type GlassProps, type GlassShape } from './container.js';
export { Arrow, Ray, Track, Ground, type ArrowProps } from './beam.js';
export {
  PlotFrame,
  scale,
  Curve,
  Area,
  Guide,
  Marker,
  SegmentBar,
  type PlotBox,
  type PlotFrameProps,
} from './plot.js';
export { Illustration, type IllustrationProps } from './illustration.js';
