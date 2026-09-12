import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';

export default defineLab({
  id: 'enzyme-rate',
  domain: 'biology',
  group: 'Biology',
  title: 'Enzyme rate (optimum & denaturation)',
  description:
    "Drag temperature (or pH); the rate climbs to an optimum then crashes as the lock-and-key active site is mangled, irreversibly for temperature (cooling won't fix it), reversibly for pH. The bell is built from plotted points.",
  schema: z
    .object({
      factor: z.enum(['temperature', 'pH']).default('temperature'),
      optimum: z.number().finite().min(0.1).max(100).default(40),
      factorMin: z.number().finite().min(0).max(90).default(0),
      factorMax: z.number().finite().min(1).max(120).default(80),
      ...commonLabProps,
    })
    .superRefine((props, context) => {
      if (props.factorMin >= props.optimum || props.optimum >= props.factorMax)
        context.addIssue({
          code: 'custom',
          path: ['optimum'],
          message: 'The optimum must sit strictly inside the factor range',
        });
      if (props.factor === 'pH' && props.factorMax > 14)
        context.addIssue({ code: 'custom', path: ['factorMax'], message: 'pH cannot exceed 14' });
    }),
  taxonomy: {
    grades: ['9', '10', '11'],
    outcomes: ['biology', 'enzymes', 'denaturation'],
    durationMinutes: 12,
    interaction: 'explorer',
    authorability: 'moderate',
  },
  experience: {
    objectives: [
      'Predict how enzyme rate changes around an optimum',
      'Compare reversible pH disruption with irreversible thermal denaturation',
      'Explain why cooling a denatured enzyme does not restore its active site',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
