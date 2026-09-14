import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';

export default defineLab({
  id: 'cone-frustum',
  tag: 'ConeFrustum',
  domain: 'math',
  group: 'Geometry and measurement',
  title: 'Frustum: a cone with its top cut off',
  description:
    'Slide the cut and hunt for the height that carries away a given share of the volume. The small cone is similar, so the share is k³ and halfway up removes only an eighth.',
  schema: z.object({
    radius: z.number().min(1).max(6).default(3).describe('base radius of the whole cone'),
    height: z.number().min(2).max(10).default(6).describe('vertical height of the whole cone'),
    cut: z.number().min(0).max(10).optional().describe('starting height of the cut above the base'),
    targetShare: z
      .number()
      .min(0.02)
      .max(0.98)
      .default(0.5)
      .describe('share of the VOLUME the learner must carry away in the top piece'),
    unit: z.string().max(6).default('cm'),
    ...commonLabProps,
  }),
  experience: {
    objectives: [
      'Treat a frustum as the whole cone minus the similar cone removed from its top',
      'Use one ratio k for every length of the smaller cone, and k³ for its volume',
      'Predict where a cut must fall to remove a stated share of the volume',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['reflection'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  taxonomy: {
    grades: ['9', '10', '11'],
    outcomes: ['mensuration', 'volume', 'cone', 'frustum', 'similar-solids', 'scale-factor'],
    durationMinutes: 10,
    interaction: 'predict',
    authorability: 'simple',
    prerequisites: ['solid-net'],
    related: ['measurement', 'solid-net', 'geometry-foundations'],
  },
  loadRuntime: () => import('./runtime.js'),
});
