import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';
import { authoredActivitySchema } from '../../../schemas/activity-authoring.js';

export default defineLab({
  id: 'xray-attenuation',
  tag: 'XrayAttenuationLab',
  domain: 'physics',
  group: 'Modern Physics',
  title: 'X-ray attenuation and image contrast',
  description:
    'Trace an X-ray beam through layered matter and connect Beer–Lambert transmission to detector contrast.',
  schema: z.object({
    energyKev: z.number().min(20).max(200).default(60),
    tissueThicknessCm: z.number().min(0).max(50).default(12),
    boneThicknessCm: z.number().min(0).max(10).default(1),
    activity: authoredActivitySchema.optional(),
    ...commonLabProps,
  }),
  taxonomy: {
    grades: ['11', '12'],
    outcomes: ['physics', 'modern-physics', 'x-ray', 'attenuation', 'medical-imaging', 'beer-lambert'],
    durationMinutes: 16,
    interaction: 'explorer',
    authorability: 'moderate',
    prerequisites: [],
    related: ['photoelectric-effect'],
  },
  experience: {
    objectives: [
      'Model attenuation through layered matter',
      'Connect detector exposure to radiograph brightness',
      'Test how thickness and photon energy change contrast',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
