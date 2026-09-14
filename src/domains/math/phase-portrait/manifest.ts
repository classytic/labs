import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { calculusExpressionSchema, calculusRangeSchema } from '../schemas.js';

export default defineLab({
  id: 'phase-portrait',
  tag: 'PhasePortrait',
  domain: 'math',
  group: 'Math',
  title: 'Phase portrait explorer',
  description:
    'Explore author-defined two-variable dynamical systems through a vector field and guarded Euler/RK4 trajectories.',
  schema: z.object({
    prompt: z.string().optional(),
    dx: calculusExpressionSchema.optional(),
    dy: calculusExpressionSchema.optional(),
    xRange: calculusRangeSchema.optional(),
    yRange: calculusRangeSchema.optional(),
    // initial is snapped into the AUTHORED xRange/yRange; the sliders are duration and stepSize.
    initial: z.tuple([z.number().finite(), z.number().finite()]).optional(),
    duration: z.number().finite().min(1).max(40).optional(),
    stepSize: z.number().finite().min(0.02).max(1).optional(),
    title: z.string().optional(),
  }),
  experience: {
    objectives: [
      'Read the direction of change from a two-variable vector field',
      'Trace how an initial state evolves through phase space',
      'Classify equilibria and long-run behavior from nearby trajectories',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['reflection'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  taxonomy: {
    grades: ['11', '12'],
    outcomes: ['math', 'calculus', 'differential-equations', 'dynamical-systems', 'phase-portrait'],
    durationMinutes: 18,
    interaction: 'explorer',
    authorability: 'moderate',
    representation: 'graph',
    prerequisites: ['differential-equation'],
    related: ['gradient-descent', 'harmonic-form'],
  },
  loadRuntime: () => import('./runtime.js'),
  loadAuthoring: () => import('./authoring.js'),
});
