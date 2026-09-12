import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';

export default defineLab({
  id: 'rate-machine',
  domain: 'math',
  group: 'Math',
  title: 'Proportion machine (drag the count, it scales)',
  description:
    'Count-driven concrete → graph: drag the input up and down; objects drop into a vessel, the liquid level rises by the same rate each step, and a point rides up the line leaving a dot at every whole step. Proportionality you scrub. Skinnable (battery, jar, savings) and an optional "set it to N" goal.',
  schema: z.object({
    rate: z.number().default(5),
    base: z.number().default(0),
    maxCount: z.number().default(6),
    startCount: z.number().default(1),
    yMax: z.number().default(40),
    yStep: z.number().default(5),
    xLabel: z.string().default('Items'),
    yLabel: z.string().default('Cost'),
    unit: z.string().default('$'),
    itemLabel: z.string().optional(),
    scene: z.string().default('vessel'),
    extraScenes: z.array(z.string()).default([]),
    showObjects: z.boolean().default(true),
    liquidColor: z.string().optional(),
    objectColor: z.string().optional(),
    target: z.number().optional(),
    height: z.number().min(220).max(640).optional(),
    title: z.string().optional(),
    prompt: z.string().optional(),
    activity: z.string().optional(),
  }),
  omit: ['activity'],
  experience: {
    objectives: [
      'Connect repeated equal changes to a constant rate',
      'Track one quantity across a graph, scene and numeric representation',
      'Distinguish the rate from the starting value in an authored context',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['reflection'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  taxonomy: {
    grades: ['6', '7', '8'],
    outcomes: ['math', 'proportion', 'rate'],
    durationMinutes: 10,
    interaction: 'explorer',
    authorability: 'moderate',
  },
  loadRuntime: () => import('./runtime.js'),
});
