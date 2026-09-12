import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';

export default defineLab({
  id: 'periodic-trends',
  domain: 'chem',
  group: 'Chemistry',
  title: 'Periodic trends (heatmap)',
  description:
    'The periodic table (H–Xe) coloured by a property, atomic radius, ionisation energy or electronegativity, so the trend reads as a gradient: radius grows down/left, ionisation energy & electronegativity grow up/right. Hover an element for its value. Pick the default property and a highlighted element; ships a predict-first question.',
  schema: z.object({
    property: z.enum(['radius', 'ie', 'en']).optional().describe('which property to colour by'),
    highlight: z.string().optional().describe('element symbol to highlight, e.g. Cl'),
    ...commonLabProps,
  }),
  taxonomy: {
    grades: ['10', '11', '12'],
    outcomes: ['chemistry', 'periodic-table', 'trends'],
    durationMinutes: 12,
    interaction: 'predict',
    authorability: 'moderate',
  },
  experience: {
    objectives: [
      'Predict the direction of an across-period trend',
      'Compare size and energy gradients',
      'Transfer the trend to an unfamiliar element',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
