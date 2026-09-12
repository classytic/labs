import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';

/** A construction element, discriminated on `type` (mirrors GeoElement in
 *  src/geometry/board/preset.tsx). Built via the custom GeometryBuilder (loadAuthoring).*
 *  `hidden` exists because classical constructions need scaffolding: the circle on
 *  diameter OP that locates the tangent points, the ray that pins a point to a rim.
 *  It must resolve so the dependent points move, and it must not be drawn, or the
 *  learner reads the machinery as part of the theorem. */
const idRef = z.string();
const geoElementSchema = z
  .discriminatedUnion('type', [
    z.object({
      type: z.literal('point'),
      id: z.string(),
      x: z.number(),
      y: z.number(),
      draggable: z.boolean().optional(),
      label: z.string().optional(),
      color: z.string().optional(),
      hidden: z.boolean().optional().describe('keep it in the construction but off the drawing'),
    }),
    z.object({
      type: z.literal('circle'),
      id: z.string(),
      center: idRef,
      radius: z.number().optional(),
      through: idRef.optional(),
      color: z.string().optional(),
      hidden: z.boolean().optional().describe('keep it in the construction but off the drawing'),
    }),
    z.object({
      type: z.literal('line'),
      id: z.string().optional(),
      through: z.tuple([idRef, idRef]),
      color: z.string().optional(),
      hidden: z.boolean().optional().describe('keep it in the construction but off the drawing'),
      dashed: z.boolean().optional(),
    }),
    z.object({
      type: z.literal('segment'),
      id: z.string().optional(),
      from: idRef,
      to: idRef,
      color: z.string().optional(),
      hidden: z.boolean().optional().describe('keep it in the construction but off the drawing'),
      label: z.string().optional(),
      dashed: z.boolean().optional(),
    }),
    z.object({
      type: z.literal('intersect'),
      id: z.string(),
      of: z.tuple([idRef, idRef]),
      pick: z.union([z.literal(0), z.literal(1)]).optional(),
      label: z.string().optional(),
      color: z.string().optional(),
      hidden: z.boolean().optional().describe('keep it in the construction but off the drawing'),
    }),
    z.object({
      type: z.literal('midpoint'),
      id: z.string(),
      of: z.tuple([idRef, idRef]),
      label: z.string().optional(),
      color: z.string().optional(),
      hidden: z.boolean().optional().describe('keep it in the construction but off the drawing'),
    }),
    // A measure reads a NUMBER off the construction, which is what lets a learner
    // verify an invariant instead of eyeballing it. `angle` takes three refs and
    // the MIDDLE one is the vertex, so of: ['A','B','C'] is angle ABC.
    z.object({
      type: z.literal('measure'),
      kind: z.enum(['distance', 'angle']).default('distance'),
      of: z.union([z.tuple([idRef, idRef]), z.tuple([idRef, idRef, idRef])]),
      label: z.string().optional(),
    }),
  ])
  .refine((el) => el.type !== 'measure' || (el.kind === 'angle' ? el.of.length === 3 : el.of.length === 2), {
    message: 'a distance measure needs two points, an angle measure needs three (vertex in the middle)',
  });

/** Geometry board — has a CUSTOM visual authoring editor (GeometryBuilder), so the manifest
 *  declares loadAuthoring; the schema-driven form can't express a click-to-build construction. */
export default defineLab({
  id: 'geometry-board',
  domain: 'geometry',
  group: 'Geometry',
  title: 'Geometry board',
  description: 'Build a construction, points, circles, lines & computed intersections. Drag points live.',
  // The component has always accepted prompt/view/subtitle/height, but the schema
  // declared only scene and title, so an author writing the "what to watch" line
  // the lab renders got "unknown prop" from check:props. Same divergence class as
  // the transform lab's hard-coded answer tiles: the implementation and the
  // contract disagreed and only the contract was checked.
  schema: z.object({
    scene: z.array(geoElementSchema).optional(),
    title: z.string().optional(),
    prompt: z.string().optional().describe('what to do and what to watch'),
    subtitle: z.string().optional(),
    height: z.number().min(200).max(640).optional().describe('figure height in pixels'),
    view: z
      .object({
        xMin: z.number(),
        xMax: z.number(),
        yMin: z.number(),
        yMax: z.number(),
      })
      .optional()
      .describe('visible window; defaults to x -1..11, y -5..5'),
  }),
  experience: {
    objectives: [
      'Construct dependent points, lines, circles and intersections from authored constraints',
      'Drag free points while preserving construction relationships',
      'Use measurements and invariants to justify a geometric claim',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['reflection'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  taxonomy: {
    grades: ['9', '10', '11'],
    outcomes: ['geometry', 'construction'],
    durationMinutes: 15,
    interaction: 'build',
    authorability: 'advanced',
  },
  loadRuntime: () => import('./runtime.js'),
  loadAuthoring: () => import('./authoring.js'),
});
