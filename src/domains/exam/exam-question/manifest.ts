import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';
import { commonLabProps } from '../../../shared/fields.js';
import { DEFAULT_EXAM_PARTS, DEFAULT_EXAM_STEM } from '../../../exam/exam-question/default-question.js';

const markPoint = z.object({
  text: z.string().trim().min(1).max(300),
  marks: z.number().int().min(1).max(6).optional(),
});

const commonError = z.object({
  answer: z.string().trim().min(1).max(60),
  why: z.string().trim().min(1).max(300),
  equivalent: z
    .boolean()
    .optional()
    .describe('set when this equals the right answer but is not in the form the question demands'),
});

const answerSpec = z.union([
  z.object({ kind: z.literal('number'), value: z.number().finite(), tol: z.number().optional() }),
  z.object({
    kind: z.literal('expression'),
    value: z.string().trim().min(1),
    vars: z.array(z.string()).optional(),
    domain: z.tuple([z.number(), z.number()]).optional(),
    tol: z.number().optional(),
  }),
]);

export default defineLab({
  id: 'exam-question',
  tag: 'ExamQuestion',
  domain: 'exam',
  group: 'Exam practice',
  title: 'Structured exam question (free response, with mark scheme)',
  description:
    'A stem with several parts, marks against each, and a box with no options in it. The learner produces the answer rather than recognising one, a wrong answer that matches an anticipated mistake is told which mistake it is, and the mark scheme is revealed once they have committed. This is the assessment surface a multiple-choice quiz cannot be.',
  schema: z.object({
    reference: z.string().trim().max(120).optional().describe('what this imitates, e.g. "9702 Paper 2"'),
    stem: z
      .string()
      .trim()
      .min(1)
      .max(1200)
      .default(DEFAULT_EXAM_STEM)
      .describe('the scenario, shared by every part'),
    parts: z
      .array(
        z.object({
          label: z.string().trim().min(1).max(8).describe('the part label as a paper prints it: a, b(i)'),
          prompt: z.string().trim().min(1).max(600),
          marks: z.number().int().min(1).max(10),
          command: z
            .enum([
              'state',
              'describe',
              'explain',
              'calculate',
              'determine',
              'show that',
              'estimate',
              'suggest',
              'deduce',
              'evaluate',
            ])
            .optional()
            .describe('the command word, which decides what an answer must contain'),
          answer: answerSpec.optional().describe('omit for a part marked by the scheme alone'),
          unit: z.string().trim().max(20).optional(),
          markScheme: z.array(markPoint).min(1).max(10),
          commonErrors: z.array(commonError).max(6).optional(),
        }),
      )
      .min(1)
      .max(8)
      // A blank insert has to produce a working question, not an empty frame the author stares at.
      .default(DEFAULT_EXAM_PARTS),
    ...commonLabProps,
  }),
  experience: {
    objectives: [
      'Produce an answer without options in front of you',
      'Read a mark scheme and see where the marks actually are',
      'Recognise your own mistake by name rather than only being told it is wrong',
    ],
    phases: ['predict', 'act', 'observe', 'explain', 'transfer'],
    responses: ['numeric', 'text'],
    accessibility: { keyboard: true, textAlternative: true, reducedMotion: true },
  },
  taxonomy: {
    grades: ['9', '10', '11', '12'],
    outcomes: ['exam-technique', 'assessment'],
    durationMinutes: 12,
    interaction: 'guided',
    authorability: 'advanced',
  },
  loadRuntime: () => import('./runtime.js'),
});
