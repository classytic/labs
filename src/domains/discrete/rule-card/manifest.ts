import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { RULE_PRESET_IDS } from './presets.js';
import { commonLabProps } from '../../../shared/fields.js';

export default defineLab({
  id: 'rule-card',
  tag: 'RuleCard',
  domain: 'discrete',
  group: 'Discrete',
  title: 'Rule card (concept)',
  description:
    'A formula taught through a prediction, visual model, live working, derivation, and useful patterns. Pick a built-in counting, trigonometry, or complex-number rule, or author a custom concept as data.',
  schema: z
    .object({
      preset: z.enum(RULE_PRESET_IDS).default('rule-of-product'),
      name: z.string().trim().min(1).max(80).default('My rule'),
      formula: z.string().trim().min(1).max(240).default('a^2 + b^2 = c^2'),
      analogy: z.string().trim().min(1).max(300).optional(),
      tricks: z.array(z.string().trim().min(1).max(200)).max(8).optional(),
      derivation: z
        .array(
          z.object({
            title: z.string().optional(),
            prompt: z.string().optional(),
            tex: z.string().trim().min(1).max(240),
            note: z.string().trim().min(1).max(200).optional(),
          }),
        )
        .max(12)
        .optional(),
      challenge: z
        .object({
          prompt: z.string().trim().min(1).max(240),
          choices: z
            .array(
              z.object({ value: z.string().trim().min(1).max(60), label: z.string().trim().min(1).max(160) }),
            )
            .min(2)
            .max(5)
            .refine(
              (choices) => new Set(choices.map((choice) => choice.value)).size === choices.length,
              'Choice values must be unique',
            ),
          answer: z.string().trim().min(1).max(60),
          explain: z.string().trim().min(1).max(300).optional(),
        })
        .optional(),
      ...commonLabProps,
    })
    .superRefine((props, context) => {
      if (props.preset === 'none' && !props.challenge)
        context.addIssue({
          code: 'custom',
          path: ['challenge'],
          message: 'Custom rules need a prediction challenge',
        });
      if (
        props.challenge &&
        !props.challenge.choices.some((choice) => choice.value === props.challenge!.answer)
      )
        context.addIssue({
          code: 'custom',
          path: ['challenge', 'answer'],
          message: 'The answer must match a choice value',
        });
    }),
  taxonomy: {
    grades: ['10', '11', '12'],
    outcomes: ['concept', 'visual-rule'],
    durationMinutes: 10,
    interaction: 'explorer',
    authorability: 'advanced',
  },
  experience: {
    objectives: [
      'Commit to a prediction before viewing a concept model',
      'Connect a formula to a visual or worked calculation',
      'Use derivation and useful patterns to explain the rule',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['choice'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  loadRuntime: () => import('./runtime.js'),
});
