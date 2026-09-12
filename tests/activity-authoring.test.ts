import { describe, expect, it } from 'vitest';
import { authoredActivitySchema, authoredQuestionSchema } from '../src/schemas/activity-authoring.js';
import {
  activitySteps,
  compileAuthoredActivity,
  defineAuthoredActivity,
  withAuthoredObjectives,
  type AuthoredActivity,
} from '../src/kit/activity-authoring.js';
import { parseAuthoredActivity } from '../src/authoring/index.js';

const activity: AuthoredActivity = {
  pattern: 'diagnosis',
  objectives: ['Use evidence to diagnose the case'],
  success: [
    {
      id: 'diagnosed',
      source: 'answer',
      key: 'risk',
      value: 'liquidity',
      pendingLabel: 'Choose the strongest evidence.',
    },
  ],
  steps: [
    { id: 'predict', phase: 'predict', title: 'Diagnose', success: 'diagnosed', reveal: ['case'] },
    { id: 'transfer', phase: 'transfer', title: 'Transfer', controls: true },
  ],
  questions: [
    {
      id: 'risk',
      prompt: 'What is the risk?',
      choices: [
        { value: 'liquidity', label: 'Liquidity' },
        { value: 'growth', label: 'Growth', feedback: 'Look at near-term bills.' },
      ],
      answer: 'liquidity',
    },
  ],
  datasets: [{ id: 'firm-b', label: 'Firm B', records: [{ currentAssets: 80, currentLiabilities: 120 }] }],
  transfer: [{ id: 'new-firm', title: 'New firm', prompt: 'Diagnose again.', dataset: 'firm-b' }],
};

describe('authored activity contract', () => {
  it('validates a complete activity and compiles its gate into runtime steps', () => {
    expect(authoredActivitySchema.parse(activity)).toEqual(activity);
    expect(activitySteps(activity)).toEqual([
      {
        id: 'predict',
        phase: 'predict',
        title: 'Diagnose',
        reveal: ['case'],
        gate: { kind: 'answer', id: 'diagnosed', pendingLabel: 'Choose the strongest evidence.' },
      },
      { id: 'transfer', phase: 'transfer', title: 'Transfer', controls: true },
    ]);
  });

  it('compiles stable serializable runtime indexes once', () => {
    const plan = defineAuthoredActivity(activity);
    expect(plan).toMatchObject({
      kind: 'classytic.activity-plan',
      version: 1,
      successIndex: { diagnosed: 0 },
      questionIndex: { risk: 0 },
    });
    expect(plan.steps[0]?.gate).toEqual({
      kind: 'answer',
      id: 'diagnosed',
      pendingLabel: 'Choose the strongest evidence.',
    });
    expect(compileAuthoredActivity(plan)).toBe(plan);
    expect(JSON.parse(JSON.stringify(plan))).toMatchObject({ kind: 'classytic.activity-plan', version: 1 });
  });

  it('validates unknown CMS input before producing a runtime plan', () => {
    expect(parseAuthoredActivity(structuredClone(activity))).toMatchObject({
      kind: 'classytic.activity-plan',
      successIndex: { diagnosed: 0 },
    });
    expect(() => parseAuthoredActivity({ ...activity, steps: [] })).toThrow();
  });

  it('applies objective overrides to compiled source without mutating the shared plan', () => {
    const plan = defineAuthoredActivity(activity);
    const overridden = withAuthoredObjectives(plan, ['Compare two diagnoses']);
    expect(overridden).toMatchObject({ objectives: ['Compare two diagnoses'] });
    expect(plan.source.objectives).toEqual(['Use evidence to diagnose the case']);
    expect(withAuthoredObjectives(plan)).toBe(plan);
  });

  it('rejects dangling step, condition, dataset, and answer references', () => {
    const broken = structuredClone(activity);
    broken.steps[0]!.next = 'missing-step';
    broken.steps[0]!.success = 'missing-condition';
    broken.transfer![0]!.dataset = 'missing-dataset';
    broken.questions![0]!.answer = 'missing-choice';
    const result = authoredActivitySchema.safeParse(broken);
    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.error.issues.map((issue) => issue.path.join('.'))).toEqual(
        expect.arrayContaining([
          'steps.0.next',
          'steps.0.success',
          'transfer.0.dataset',
          'questions.0.answer',
        ]),
      );
  });

  it('rejects ambiguous duplicate ids before they reach the runtime', () => {
    const broken = structuredClone(activity);
    broken.steps.push({ ...broken.steps[0]! });
    broken.questions!.push({ ...broken.questions![0]! });
    broken.success!.push({ ...broken.success![0]! });
    broken.datasets!.push({ ...broken.datasets![0]! });
    broken.transfer!.push({ ...broken.transfer![0]! });
    const result = authoredActivitySchema.safeParse(broken);
    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.error.issues.map((issue) => issue.path.join('.'))).toEqual(
        expect.arrayContaining([
          'steps.2.id',
          'questions.1.id',
          'success.1.id',
          'datasets.1.id',
          'transfer.1.id',
        ]),
      );
  });

  it('rejects answer and reflection gates that cannot render a matching response', () => {
    const missing = structuredClone(activity);
    missing.success![0]!.key = 'missing-question';
    const missingResult = authoredActivitySchema.safeParse(missing);
    expect(missingResult.success).toBe(false);
    if (!missingResult.success)
      expect(missingResult.error.issues.map((issue) => issue.path.join('.'))).toContain('success.0.key');

    const mismatched = structuredClone(activity);
    mismatched.success![0]!.source = 'reflection';
    const mismatchResult = authoredActivitySchema.safeParse(mismatched);
    expect(mismatchResult.success).toBe(false);
    if (!mismatchResult.success)
      expect(mismatchResult.error.issues.map((issue) => issue.path.join('.'))).toContain('success.0.key');
  });

  it('rejects dead questions, unused conditions, and unreachable steps', () => {
    const deadQuestion = structuredClone(activity);
    deadQuestion.questions!.push({
      id: 'dead',
      prompt: 'This would never render.',
      choices: [
        { value: 'a', label: 'A' },
        { value: 'b', label: 'B' },
      ],
      answer: 'a',
    });
    const questionResult = authoredActivitySchema.safeParse(deadQuestion);
    expect(questionResult.success).toBe(false);
    if (!questionResult.success)
      expect(questionResult.error.issues.map((issue) => issue.path.join('.'))).toContain('questions.1.id');

    const unusedCondition = structuredClone(activity);
    unusedCondition.success!.push({ id: 'unused', source: 'metric', key: 'value' });
    const conditionResult = authoredActivitySchema.safeParse(unusedCondition);
    expect(conditionResult.success).toBe(false);
    if (!conditionResult.success)
      expect(conditionResult.error.issues.map((issue) => issue.path.join('.'))).toContain('success.1.id');

    const unreachable = structuredClone(activity);
    unreachable.steps[0]!.next = 'predict';
    const stepResult = authoredActivitySchema.safeParse(unreachable);
    expect(stepResult.success).toBe(false);
    if (!stepResult.success)
      expect(stepResult.error.issues.map((issue) => issue.path.join('.'))).toContain('steps.1.id');
  });

  it('rejects blank and repeated learning text', () => {
    expect(authoredActivitySchema.safeParse({ ...activity, objectives: ['   '] }).success).toBe(false);
    expect(
      authoredActivitySchema.safeParse({
        ...activity,
        objectives: ['Use evidence to diagnose the case', ' use evidence to diagnose the case '],
      }).success,
    ).toBe(false);
    expect(
      authoredQuestionSchema.safeParse({
        id: 'blank',
        prompt: ' ',
        choices: [
          { value: 'a', label: 'A' },
          { value: 'b', label: 'B' },
        ],
        answer: 'a',
      }).success,
    ).toBe(false);
  });

  it('supports numeric, text, ordering, and reflection responses', () => {
    const questions = [
      { kind: 'numeric', id: 'speed', prompt: 'Final speed?', answer: 12, tolerance: 0.1, unit: 'm/s' },
      { kind: 'text', id: 'claim', prompt: 'Name the layer.', answers: ['transport'], caseSensitive: false },
      {
        kind: 'ordering',
        id: 'route',
        prompt: 'Order the hops.',
        items: [
          { value: 'a', label: 'A' },
          { value: 'b', label: 'B' },
        ],
        answer: ['a', 'b'],
      },
      {
        kind: 'reflection',
        id: 'why',
        prompt: 'Explain the change.',
        rubric: ['Names the changed variable'],
      },
    ];
    for (const question of questions) expect(authoredQuestionSchema.safeParse(question).success).toBe(true);
  });

  it('rejects incomplete ordering answers', () => {
    const broken = {
      kind: 'ordering',
      id: 'route',
      prompt: 'Order the hops.',
      items: [
        { value: 'a', label: 'A' },
        { value: 'b', label: 'B' },
      ],
      answer: ['a', 'a'],
    };
    expect(authoredQuestionSchema.safeParse(broken).success).toBe(false);
  });
});
