import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { authoredActivitySchema } from '../../../schemas/activity-authoring.js';

export default defineLab({
  id: 'electric-flux',
  domain: 'physics',
  group: 'Physics',
  title: 'Electric flux Φ = E·A·cosθ (line-counting)',
  description:
    'Flux made literal: how many field lines thread your area. Rotate the area (edge-on Φ = 0, face-on Φ = E·A), resize it, or change the medium (permittivity εr weakens E). The lines that pass through light up: that count is the flux.',
  schema: z.object({
    field: z.number().finite().min(1).max(12).default(6),
    area: z.number().finite().min(1).max(6).default(3),
    angleDeg: z.number().finite().min(-90).max(90).default(0),
    height: z.number().int().min(240).max(720).optional(),
    activity: z.union([z.string().trim().min(1), authoredActivitySchema]).optional(),
    title: z.string().trim().min(1).optional(),
    prompt: z.string().trim().min(1).optional(),
    objectives: z.array(z.string().trim().min(1)).min(1).optional(),
  }),
  taxonomy: {
    grades: ['11', '12'],
    outcomes: ['electrostatics', 'flux'],
    durationMinutes: 12,
    interaction: 'explorer',
    authorability: 'moderate',
  },
  experience: {
    objectives: [
      'Interpret flux as field through projected area',
      'Relate orientation to the cosine factor',
      'Compare field strength, area, and medium',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['reflection'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
