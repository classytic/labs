import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { labAskSchema } from '../schemas.js';

/** The optional graded `ask` (typed-or-MCQ union) and the internal `activity` id are hidden from
 *  the auto-form; every scalar + scene field authors cleanly via LabConfig. */
export default defineLab({
  id: 'linear-model',
  tag: 'LinearModel',
  domain: 'math',
  group: 'Math',
  title: 'Proportion / rate (marbles → volume)',
  description:
    'A concrete scene (a beaker filling with marbles) linked to a graph: drag the point to predict the value at the next input. Discover y = rate·x + base from data. Optional graded follow-up.',
  schema: z.object({
    slope: z.number().default(5),
    intercept: z.number().default(10),
    given: z.array(z.number()).default([0, 1]),
    predictX: z.number().default(2),
    xMax: z.number().default(6),
    yMax: z.number().default(40),
    xStep: z.number().default(1),
    yStep: z.number().default(5),
    tolerance: z.number().positive().optional(),
    xLabel: z.string().default('Marbles'),
    yLabel: z.string().default('Volume'),
    unit: z.string().default('mL'),
    scene: z.string().default('vessel'),
    extraScenes: z.array(z.string()).default([]),
    vesselObjects: z.boolean().default(true),
    vesselBinds: z.enum(['guess', 'truth']).default('guess'),
    objectLabel: z.string().optional(),
    liquidColor: z.string().optional(),
    objectColor: z.string().optional(),
    height: z.number().min(220).max(640).optional(),
    title: z.string().optional(),
    prompt: z.string().optional(),
    ask: labAskSchema.optional(),
    activity: z.string().optional(),
  }),
  omit: ['ask', 'activity'],
  experience: {
    objectives: [
      'Predict an output from a constant rate and starting value',
      'Keep a concrete scene, graph point and numeric reading synchronized',
      'Infer a linear rule from authored input-output evidence',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice', 'reflection'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  taxonomy: {
    grades: ['6', '7', '8'],
    outcomes: ['math', 'proportion', 'linear-model'],
    durationMinutes: 12,
    interaction: 'predict',
    authorability: 'moderate',
  },
  loadRuntime: () => import('./runtime.js'),
});
