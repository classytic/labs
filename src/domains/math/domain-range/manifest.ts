import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { labAskSchema } from '../schemas.js';

export default defineLab({
  id: 'domain-range',
  tag: 'DomainRange',
  domain: 'math',
  group: 'Math',
  title: 'Domain & range (the two shadows)',
  description:
    'Type any f(x); the curve casts a domain shadow (x-axis) and range shadow (y-axis). Drag the input probe: green = accepted, red = undefined. Teaches every domain type.',
  schema: z.object({
    equation: z.string().optional(),
    xRange: z.tuple([z.number(), z.number()]).optional(),
    restrict: z.tuple([z.number(), z.number()]).optional(),
    probe: z.number().optional(),
    title: z.string().optional(),
    prompt: z.string().optional(),
    ask: labAskSchema.optional(),
    activity: z.string().optional(),
  }),
  experience: {
    objectives: [
      'Read domain and range as projections of a relation onto the axes',
      'Probe inputs to distinguish defined and undefined values',
      'Explain restrictions caused by an authored expression or interval',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice', 'reflection'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  taxonomy: {
    grades: ['10', '11', '12'],
    outcomes: ['math', 'functions', 'domain-range'],
    durationMinutes: 12,
    interaction: 'build',
    authorability: 'advanced',
  },
  loadRuntime: () => import('./runtime.js'),
  loadAuthoring: () => import('./authoring.js'),
});
