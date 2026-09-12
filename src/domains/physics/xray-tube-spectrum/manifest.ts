import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';
import { authoredActivitySchema } from '../../../schemas/activity-authoring.js';
export default defineLab({
  id: 'xray-tube-spectrum',
  tag: 'XrayTubeSpectrumLab',
  domain: 'physics',
  group: 'Modern Physics',
  title: 'X-ray tube and spectrum',
  description:
    'Connect accelerating voltage, target interactions, characteristic lines, and filtration to the emitted X-ray spectrum.',
  schema: z.object({
    voltageKvp: z.number().min(20).max(200).default(90),
    filtrationMmAl: z.number().min(0).max(10).default(2.5),
    target: z.enum(['tungsten', 'molybdenum']).default('tungsten'),
    activity: authoredActivitySchema.optional(),
    ...commonLabProps,
  }),
  taxonomy: {
    grades: ['11', '12'],
    outcomes: ['physics', 'modern-physics', 'x-ray', 'bremsstrahlung', 'spectrum', 'filtration'],
    durationMinutes: 18,
    interaction: 'explorer',
    authorability: 'moderate',
    prerequisites: [],
    related: ['photoelectric-effect', 'xray-attenuation'],
  },
  experience: {
    objectives: [
      'Connect tube voltage to maximum photon energy',
      'Distinguish bremsstrahlung from characteristic lines',
      'Explain beam hardening by filtration',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
