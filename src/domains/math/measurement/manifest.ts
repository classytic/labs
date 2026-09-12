import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';
import { authoredActivitySchema } from '../../../schemas/activity-authoring.js';
export default defineLab({
  id: 'measurement',
  tag: 'MeasurementLab',
  domain: 'math',
  group: 'Geometry and measurement',
  title: 'Applied shape measurement',
  description:
    'Discover pi, connect wheel turns to distance, unwrap cylinders, subtract walking paths, and estimate irregular area.',
  schema: z.object({
    mode: z
      .enum(['pi-roll', 'wheel-distance', 'cylinder', 'walking-path', 'irregular-area'])
      .default('pi-roll'),
    radius: z.number().min(0.5).max(5).default(2),
    height: z.number().min(1).max(10).default(5),
    turns: z.number().min(0.25).max(5).default(1),
    length: z.number().min(4).max(20).default(12),
    width: z.number().min(3).max(14).default(8),
    pathWidth: z.number().min(0.5).max(3).default(1),
    // gridSize drives no control: it is the metre-size of one counted cell, so it only scales area.
    gridSize: z.number().positive().default(1),
    coveredCells: z.number().int().min(0).max(60).default(24),
    partialCells: z.number().int().min(0).max(30).default(10),
    activity: authoredActivitySchema.optional(),
    ...commonLabProps,
  }),
  taxonomy: {
    grades: ['6', '7', '8', '9', '10'],
    outcomes: ['geometry', 'measurement', 'pi', 'circumference', 'area', 'volume', 'estimation'],
    durationMinutes: 20,
    interaction: 'guided',
    authorability: 'moderate',
    prerequisites: [],
    related: ['area-model', 'circle-geometry'],
  },
  experience: {
    objectives: [
      'Connect circular motion to circumference and π',
      'Build area and volume formulas from decomposed regions',
      'Estimate irregular area and describe approximation error',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
