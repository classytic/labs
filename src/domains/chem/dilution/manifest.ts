import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';

export default defineLab({
  id: 'dilution',
  domain: 'chem',
  group: 'Chemistry',
  title: 'Dilution (C₁V₁ = C₂V₂)',
  description:
    'Two beakers show the SAME solute dots, concentrated in the aliquot, spread in the final volume, so C₁V₁=C₂V₂ is seen as conservation of moles: same dots, bigger box, lower concentration.',
  schema: z.object({
    // Runtime clamps: c1 = clamp(stockConcentration, 0.5, maxMolarity=4) — no slider, a fixed
    // tint scale; aliquot/final volumes are the two sliders (0.1–0.5 L and 0.5–1.5 L).
    stockConcentration: z.number().min(0.5).max(4).default(2),
    aliquotVolume: z.number().min(0.1).max(0.5).default(0.25),
    finalVolume: z.number().min(0.5).max(1.5).default(1),
    title: z.string().optional(),
    prompt: z.string().optional(),
  }),
  experience: {
    objectives: [
      'Interpret dilution as conservation of solute amount',
      'Connect particle density to concentration before and after adding solvent',
      'Use C₁V₁ = C₂V₂ to design an authored dilution',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['reflection'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  taxonomy: {
    grades: ['9', '10', '11'],
    outcomes: ['chemistry', 'dilution', 'solutions'],
    durationMinutes: 10,
    interaction: 'explorer',
    authorability: 'moderate',
  },
  loadRuntime: () => import('./runtime.js'),
});
