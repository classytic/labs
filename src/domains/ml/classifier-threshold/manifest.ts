import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';

const scores = z.array(z.number().finite()).min(2).max(100);

export default defineLab({
  id: 'classifier-threshold',
  domain: 'ml',
  group: 'Machine learning',
  title: 'Classification threshold (precision/recall)',
  description:
    'The precision–recall trade-off, draggable: positive and negative examples overlap on a score axis; slide the threshold and the 2×2 confusion matrix + precision/recall/accuracy/F1 update live, pushing precision up costs recall. Author the two score sets.',
  schema: z
    .object({
      positives: scores.optional(),
      negatives: scores.optional(),
      threshold: z.number().finite().default(5),
      span: z.number().finite().min(1).max(100).default(10),
      ...commonLabProps,
    })
    .superRefine((props, context) => {
      if (props.threshold < 0 || props.threshold > props.span)
        context.addIssue({
          code: 'custom',
          path: ['threshold'],
          message: 'Threshold must sit inside the score span',
        });
      for (const key of ['positives', 'negatives'] as const)
        props[key]?.forEach((score, index) => {
          if (score < 0 || score > props.span)
            context.addIssue({
              code: 'custom',
              path: [key, index],
              message: 'Scores must sit inside the score span',
            });
        });
    }),
  taxonomy: {
    grades: ['11', '12'],
    outcomes: ['machine-learning', 'classification', 'precision-recall'],
    durationMinutes: 12,
    interaction: 'explorer',
    authorability: 'moderate',
  },
  experience: {
    objectives: [
      'Predict how raising a decision threshold changes recall',
      'Connect threshold movement to confusion-matrix counts and classification metrics',
      'Explain the precision–recall trade-off for an unfamiliar operating point',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
