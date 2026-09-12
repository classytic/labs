// @classytic/labs/geometry, interactive geometry constructions.

// ── On the @classytic/stage scene model (SceneDoc + resolver). No canvas legacy. ──
export { GeometryBoard, geoSceneToDoc, type GeometryBoardProps, type GeoElement } from './board/index.js';
export { IntersectingCircles, type IntersectingCirclesProps } from './intersecting-circles.js';
// The click-to-build construction editor, now renders via stage's resolver +
// renderElements (SVG, accessible, real draggable points), emits GeoElement[].
export { GeometryBuilder, type GeometryBuilderProps } from './builder.js';
