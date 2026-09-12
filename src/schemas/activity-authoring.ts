import { z } from 'zod';

const scalar = z.union([z.string(), z.number(), z.boolean()]);
const authoredText = z.string().trim().min(1);
export const activityPatternSchema = z.enum([
  'optimization',
  'diagnosis',
  'allocation',
  'scenario',
  'forecast',
  'investigation',
  'construction',
]);
export const authoredChoiceSchema = z.object({
  value: authoredText,
  label: authoredText,
  feedback: authoredText.optional(),
});
const choiceQuestionSchema = z
  .object({
    kind: z.literal('choice').optional(),
    id: authoredText,
    prompt: authoredText,
    choices: z.array(authoredChoiceSchema).min(2),
    answer: authoredText,
    explain: authoredText.optional(),
    tryAgain: authoredText.optional(),
  })
  .superRefine((question, context) => {
    if (!question.choices.some((choice) => choice.value === question.answer))
      context.addIssue({ code: 'custom', path: ['answer'], message: 'answer must match a choice value' });
  });
const numericQuestionSchema = z.object({
  kind: z.literal('numeric'),
  id: authoredText,
  prompt: authoredText,
  answer: z.number(),
  tolerance: z.number().nonnegative().default(0),
  unit: authoredText.optional(),
  explain: authoredText.optional(),
  tryAgain: authoredText.optional(),
});
const textQuestionSchema = z.object({
  kind: z.literal('text'),
  id: authoredText,
  prompt: authoredText,
  answers: z.array(authoredText).min(1),
  caseSensitive: z.boolean().default(false),
  explain: authoredText.optional(),
  tryAgain: authoredText.optional(),
});
const orderingQuestionSchema = z
  .object({
    kind: z.literal('ordering'),
    id: authoredText,
    prompt: authoredText,
    items: z.array(authoredChoiceSchema).min(2),
    answer: z.array(authoredText).min(2),
    explain: authoredText.optional(),
    tryAgain: authoredText.optional(),
  })
  .superRefine((question, context) => {
    const values = new Set(question.items.map((item) => item.value));
    if (
      question.answer.length !== values.size ||
      question.answer.some((value) => !values.has(value)) ||
      new Set(question.answer).size !== question.answer.length
    )
      context.addIssue({
        code: 'custom',
        path: ['answer'],
        message: 'answer must order every item exactly once',
      });
  });
const reflectionQuestionSchema = z.object({
  kind: z.literal('reflection'),
  id: authoredText,
  prompt: authoredText,
  rubric: z.array(authoredText).min(1),
  placeholder: authoredText.optional(),
  explain: authoredText.optional(),
});
/** Backward-compatible choice questions plus richer community-authorable response shapes. */
export const authoredQuestionSchema = z.union([
  choiceQuestionSchema,
  numericQuestionSchema,
  textQuestionSchema,
  orderingQuestionSchema,
  reflectionQuestionSchema,
]);
export const authoredSuccessSchema = z.object({
  id: authoredText,
  source: z.enum(['answer', 'action', 'metric', 'reflection']),
  key: authoredText,
  operator: z.enum(['eq', 'neq', 'gte', 'lte', 'between', 'contains']).optional(),
  value: scalar.optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  pendingLabel: authoredText.optional(),
});
export const authoredDatasetSchema = z.object({
  id: authoredText,
  label: authoredText,
  description: authoredText.optional(),
  records: z.array(z.record(z.string(), scalar)),
});
export const authoredActivityStepSchema = z.object({
  id: authoredText,
  phase: z.enum(['predict', 'act', 'observe', 'explain', 'transfer']),
  title: authoredText,
  lead: authoredText.optional(),
  reveal: z.array(authoredText).optional(),
  controls: z.boolean().optional(),
  success: authoredText.optional(),
  next: authoredText.optional(),
});
export const authoredTransferCaseSchema = z.object({
  id: authoredText,
  title: authoredText,
  prompt: authoredText,
  dataset: authoredText.optional(),
  overrides: z.record(z.string(), scalar).optional(),
});
export const authoredActivitySchema = z
  .object({
    pattern: activityPatternSchema,
    title: authoredText.optional(),
    objectives: z.array(authoredText).min(1),
    steps: z.array(authoredActivityStepSchema).min(1),
    questions: z.array(authoredQuestionSchema).optional(),
    success: z.array(authoredSuccessSchema).optional(),
    datasets: z.array(authoredDatasetSchema).optional(),
    transfer: z.array(authoredTransferCaseSchema).optional(),
  })
  .superRefine((activity, context) => {
    const requireUniqueIds = (
      items: { id: string }[] | undefined,
      path: 'steps' | 'questions' | 'success' | 'datasets' | 'transfer',
    ): void => {
      const seen = new Set<string>();
      (items ?? []).forEach((item, index) => {
        if (seen.has(item.id))
          context.addIssue({
            code: 'custom',
            path: [path, index, 'id'],
            message: `${path} ids must be unique`,
          });
        seen.add(item.id);
      });
    };
    requireUniqueIds(activity.steps, 'steps');
    requireUniqueIds(activity.questions, 'questions');
    requireUniqueIds(activity.success, 'success');
    requireUniqueIds(activity.datasets, 'datasets');
    requireUniqueIds(activity.transfer, 'transfer');
    const requireUniqueText = (items: string[], path: 'objectives'): void => {
      const seen = new Set<string>();
      items.forEach((item, index) => {
        const key = item.toLocaleLowerCase();
        if (seen.has(key))
          context.addIssue({
            code: 'custom',
            path: [path, index],
            message: `${path} must not repeat the same text`,
          });
        seen.add(key);
      });
    };
    requireUniqueText(activity.objectives, 'objectives');
    const prompts = new Set<string>();
    (activity.questions ?? []).forEach((question, index) => {
      const prompt = question.prompt.toLocaleLowerCase();
      if (prompts.has(prompt))
        context.addIssue({
          code: 'custom',
          path: ['questions', index, 'prompt'],
          message: 'question prompts must not repeat',
        });
      prompts.add(prompt);
    });
    const ids = new Set(activity.steps.map((step) => step.id));
    const success = new Set((activity.success ?? []).map((condition) => condition.id));
    const datasets = new Set((activity.datasets ?? []).map((dataset) => dataset.id));
    const questions = new Map((activity.questions ?? []).map((question) => [question.id, question]));
    activity.steps.forEach((step, index) => {
      if (step.next && !ids.has(step.next))
        context.addIssue({
          code: 'custom',
          path: ['steps', index, 'next'],
          message: 'next must reference a step id',
        });
      if (step.success && !success.has(step.success))
        context.addIssue({
          code: 'custom',
          path: ['steps', index, 'success'],
          message: 'success must reference a condition id',
        });
    });
    const referencedSuccess = new Set(activity.steps.flatMap((step) => (step.success ? [step.success] : [])));
    (activity.success ?? []).forEach((condition, index) => {
      if (!referencedSuccess.has(condition.id))
        context.addIssue({
          code: 'custom',
          path: ['success', index, 'id'],
          message: 'success condition must be used by a step',
        });
    });
    (activity.success ?? []).forEach((condition, index) => {
      if (condition.source !== 'answer' && condition.source !== 'reflection') return;
      const question = questions.get(condition.key);
      if (!question) {
        context.addIssue({
          code: 'custom',
          path: ['success', index, 'key'],
          message: `${condition.source} must reference a question id`,
        });
        return;
      }
      const reflection = question.kind === 'reflection';
      if (condition.source === 'reflection' && !reflection)
        context.addIssue({
          code: 'custom',
          path: ['success', index, 'key'],
          message: 'reflection must reference a reflection question',
        });
      if (condition.source === 'answer' && reflection)
        context.addIssue({
          code: 'custom',
          path: ['success', index, 'key'],
          message: 'answer must reference a scored question',
        });
    });
    const referencedQuestions = new Set(
      (activity.success ?? []).flatMap((condition) =>
        condition.source === 'answer' || condition.source === 'reflection' ? [condition.key] : [],
      ),
    );
    (activity.questions ?? []).forEach((question, index) => {
      if (!referencedQuestions.has(question.id))
        context.addIssue({
          code: 'custom',
          path: ['questions', index, 'id'],
          message: 'question must be connected to an answer or reflection success condition',
        });
    });
    if (activity.steps.length > 0) {
      const byId = new Map(activity.steps.map((step, index) => [step.id, index]));
      const reachable = new Set<number>();
      let position: number | undefined = 0;
      while (position != null && !reachable.has(position)) {
        reachable.add(position);
        const step: { next?: string } = activity.steps[position]!;
        position = step.next
          ? byId.get(step.next)
          : position + 1 < activity.steps.length
            ? position + 1
            : undefined;
      }
      activity.steps.forEach((_step, index) => {
        if (!reachable.has(index))
          context.addIssue({
            code: 'custom',
            path: ['steps', index, 'id'],
            message: 'step is unreachable from the first step',
          });
      });
    }
    (activity.transfer ?? []).forEach((item, index) => {
      if (item.dataset && !datasets.has(item.dataset))
        context.addIssue({
          code: 'custom',
          path: ['transfer', index, 'dataset'],
          message: 'dataset must reference a dataset id',
        });
    });
  });
