import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';

const point = z.object({ x: z.number().finite(), y: z.number().finite() });

export default defineLab({
  id: 'regression',
  domain: 'ml',
  group: 'Machine learning',
  title: 'Linear regression / gradient descent',
  description:
    'Least squares made tactile: drag the line’s ends and each point grows a square of its squared error while the MSE updates live; press Descend to watch gradient descent fit it automatically (a learning-rate slider can make it diverge). Author the dataset + starting line.',
  schema: z
    .object({
      data: z.array(point).min(3).max(80).optional(),
      showSquares: z.boolean().default(true),
      learnRate: z.number().finite().min(0.001).max(0.03).default(0.006),
      m0: z.number().finite().min(-20).max(20).default(0.3),
      b0: z.number().finite().min(-100).max(100).default(3.2),
      span: z.number().finite().min(2).max(100).default(10),
      ...commonLabProps,
    })
    .superRefine((props, context) => {
      props.data?.forEach((value, index) => {
        if (value.x < 0 || value.x > props.span || value.y < 0 || value.y > props.span)
          context.addIssue({
            code: 'custom',
            path: ['data', index],
            message: 'Data points must sit inside the square plotting span',
          });
      });
      if (props.data && new Set(props.data.map((value) => value.x)).size < 2)
        context.addIssue({
          code: 'custom',
          path: ['data'],
          message: 'Regression data needs at least two distinct x-values',
        });
    }),
  taxonomy: {
    grades: ['11', '12'],
    outcomes: ['machine-learning', 'linear-regression', 'gradient-descent'],
    durationMinutes: 15,
    interaction: 'explorer',
    authorability: 'moderate',
  },
  experience: {
    objectives: [
      'Predict the direction of a best-fit line from a data cloud',
      'Relate residual-square area to mean squared error',
      'Compare manual fitting with gradient descent and explain the effect of learning rate',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
