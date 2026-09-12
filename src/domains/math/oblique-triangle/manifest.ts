import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';

export default defineLab({
  id: 'oblique-triangle',
  tag: 'ObliqueTriangle',
  domain: 'math',
  group: 'Trigonometry',
  title: 'Sine rule, cosine rule and the ambiguous case',
  description:
    'A triangle with no right angle, solved. Picks the rule from whether a matching pair is present, colours the given parts against the found ones, and draws BOTH triangles when two sides and a non-included angle admit two, with the swinging side that produces them.',
  schema: z.object({
    given: z
      .enum(['sss', 'sas', 'aas', 'ssa'])
      .optional()
      .describe('which parts are given: sss and sas need the cosine rule, aas and ssa the sine rule'),
    cases: z
      .array(z.enum(['sss', 'sas', 'aas', 'ssa']))
      .min(1)
      .max(4)
      .optional()
      .describe('restrict the selector, for a lesson that teaches one rule at a time'),
    ...commonLabProps,
  }),
  experience: {
    objectives: [
      'Choose between the sine and cosine rules by looking for a matching side and angle',
      'Find a missing side or angle in a triangle with no right angle',
      'Recognise when two sides and a non-included angle give two triangles, one, or none',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['reflection'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  taxonomy: {
    grades: ['9', '10', '11'],
    outcomes: ['trigonometry', 'sine-rule', 'cosine-rule'],
    durationMinutes: 12,
    interaction: 'explorer',
    authorability: 'moderate',
  },
  loadRuntime: () => import('./runtime.js'),
});
