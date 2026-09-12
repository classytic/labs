import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';

export default defineLab({
  id: 'respiration',
  domain: 'biology',
  group: 'Biology',
  title: 'Photosynthesis ⇌ Respiration (the mirror)',
  description:
    'Two reaction flows drawn with shared molecule glyphs: photosynthesis and respiration, where the products of one are the reactants of the other. A day/night toggle shows the net gas exchange.',
  schema: z.object({ mode: z.enum(['day', 'night']).default('day'), ...commonLabProps }),
  taxonomy: {
    grades: ['9', '10', '11'],
    outcomes: ['biology', 'respiration', 'photosynthesis'],
    durationMinutes: 10,
    interaction: 'explorer',
    authorability: 'simple',
  },
  experience: {
    objectives: [
      'Compare the reactants and products of photosynthesis and respiration',
      'Observe how net gas exchange changes between day and night',
      'Predict which gas a plant releases under a changed light condition',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
