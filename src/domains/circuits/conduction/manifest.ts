import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { authoredActivitySchema } from '../../../schemas/activity-authoring.js';

export default defineLab({
  id: 'conduction',
  domain: 'circuits',
  group: 'Circuits',
  title: "Why current flows (drift + Ohm's law)",
  description:
    "Free electrons drift through a field among fixed ion cores: the field-driven drift IS the current, and current ∝ voltage is Ohm's law from the inside.",
  schema: z.object({
    title: z.string().trim().min(1).optional(),
    prompt: z.string().trim().min(1).optional(),
    activity: z.union([z.string().trim().min(1), authoredActivitySchema]).optional(),
  }),
  taxonomy: {
    grades: ['10', '11', '12'],
    outcomes: ['electronics', 'conduction', 'ohms-law'],
    durationMinutes: 8,
    interaction: 'explorer',
    authorability: 'simple',
    representation: 'carrier',
  },
  experience: {
    objectives: [
      'Distinguish random thermal motion from field-driven electron drift',
      'Connect voltage, electric field and current in an ohmic conductor',
      'Transfer proportional reasoning to a changed applied voltage',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
