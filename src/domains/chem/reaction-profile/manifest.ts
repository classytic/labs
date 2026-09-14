import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';

export default defineLab({
  id: 'reaction-profile',
  domain: 'chem',
  group: 'Chemistry',
  title: 'Reaction profile',
  description: 'Energy diagram, activation energy, ΔH (exo/endothermic), catalyst toggle.',
  schema: z.object({
    prompt: z.string().optional(),
    deltaH: z.number().min(-80).max(80).optional(),
    activationEnergy: z.number().min(5).max(120).optional(),
    catalyst: z.boolean().optional(),
    title: z.string().optional(),
  }),
  experience: {
    objectives: [
      'Read activation energy and enthalpy change from a reaction profile',
      'Classify an authored reaction as exothermic or endothermic',
      'Explain why a catalyst changes activation energy but not ΔH',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  taxonomy: {
    grades: ['10', '11', '12'],
    outcomes: ['chemistry', 'energetics', 'activation-energy'],
    durationMinutes: 10,
    interaction: 'explorer',
    authorability: 'moderate',
  },
  loadRuntime: () => import('./runtime.js'),
});
