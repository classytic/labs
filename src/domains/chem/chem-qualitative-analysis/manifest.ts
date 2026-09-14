import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';

export default defineLab({
  id: 'chem-qualitative-analysis',
  tag: 'QualitativeAnalysisBench',
  domain: 'chem',
  group: 'Chemistry',
  title: 'Qualitative Analysis Bench',
  description:
    'Choose a reagent or gas test, record the diagnostic observation, then identify an unknown ion or gas.',
  schema: z.object({
    title: z.string().optional(),
    prompt: z.string().optional(),
    sample: z.enum(['copper-ii', 'ammonium', 'chloride', 'carbon-dioxide']).default('copper-ii'),
  }),
  taxonomy: {
    grades: ['9', '10'],
    outcomes: ['chemistry', 'qualitative-analysis', 'practical-skills'],
    durationMinutes: 10,
    interaction: 'guided',
    authorability: 'moderate',
  },
  experience: {
    objectives: [
      'Select a suitable reagent or gas test.',
      'Record the observation before drawing a conclusion.',
      'Identify an unknown ion or gas from qualitative-analysis evidence.',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
