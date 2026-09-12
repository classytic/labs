import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';
import { authoredActivitySchema } from '../../../schemas/activity-authoring.js';

export default defineLab({
  id: 'stress-strain',
  domain: 'physics',
  group: 'Physics',
  title: 'Stress, strain and the Young modulus',
  tag: 'StressStrainLab',
  description:
    'Deformation of solids (A Level 9702 chapter 6). A wire under load, paired with one graph that has two modes. Force against extension has gradient k = A E / L, so it swings whenever the learner changes the diameter or the original length: it describes THIS wire. Stress against strain has gradient E and does not move, because dividing by the area and by the original length removes the size of the wire: it describes the MATERIAL. Marks the limit of proportionality, shades the elastic potential energy as the area under the force-extension graph, and includes a brittle material (glass) that snaps instead of yielding.',
  schema: z.object({
    material: z
      .enum(['steel', 'copper', 'aluminium', 'glass'])
      .optional()
      .describe('what the wire is made of; glass is brittle and snaps at its limit'),
    diameterMm: z.number().finite().min(0.1).max(2).optional().describe('wire diameter, mm'),
    lengthM: z.number().finite().min(0.5).max(3).optional().describe('original unstretched length, m'),
    loadN: z.number().finite().min(0).max(300).optional().describe('load hung on the wire, N'),
    graph: z.enum(['force-extension', 'stress-strain']).optional().describe('which graph opens first'),
    loadAxisN: z
      .number()
      .finite()
      .min(10)
      .max(300)
      .optional()
      .describe('top of the force axis, N; also the largest load the learner can hang'),
    extensionAxisMm: z
      .number()
      .finite()
      .min(1)
      .max(20)
      .optional()
      .describe('right-hand end of the extension axis, mm'),
    ...commonLabProps,
    activity: z.union([z.string().trim().min(1), authoredActivitySchema]).optional(),
  }),
  taxonomy: {
    grades: ['11', '12'],
    outcomes: ['deformation-of-solids', 'young-modulus', 'hookes-law', 'elastic-potential-energy'],
    durationMinutes: 12,
    interaction: 'explorer',
    authorability: 'moderate',
    representation: 'graph',
    related: ['work-energy', 'power'],
  },
  experience: {
    objectives: [
      'Read the spring constant k as the gradient of a force against extension graph',
      'Read the Young modulus E as the gradient of a stress against strain graph',
      'Explain why changing the diameter or the original length moves one graph and not the other',
      'Read the elastic potential energy as the area under the force against extension graph',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
