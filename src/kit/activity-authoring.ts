import type { LearningPhase, LearningSequenceStep } from './learning-sequence.js';

export type ActivityPattern =
  'optimization' | 'diagnosis' | 'allocation' | 'scenario' | 'forecast' | 'investigation' | 'construction';
export type SuccessOperator = 'eq' | 'neq' | 'gte' | 'lte' | 'between' | 'contains';
export interface AuthoredChoice {
  value: string;
  label: string;
  feedback?: string;
}
interface AuthoredQuestionBase {
  id: string;
  prompt: string;
  explain?: string;
  tryAgain?: string;
}
export interface AuthoredChoiceQuestion extends AuthoredQuestionBase {
  kind?: 'choice';
  choices: AuthoredChoice[];
  answer: string;
}
export interface AuthoredNumericQuestion extends AuthoredQuestionBase {
  kind: 'numeric';
  answer: number;
  tolerance?: number;
  unit?: string;
}
export interface AuthoredTextQuestion extends AuthoredQuestionBase {
  kind: 'text';
  answers: string[];
  caseSensitive?: boolean;
}
export interface AuthoredOrderingQuestion extends AuthoredQuestionBase {
  kind: 'ordering';
  items: AuthoredChoice[];
  answer: string[];
}
export interface AuthoredReflectionQuestion extends Omit<AuthoredQuestionBase, 'tryAgain'> {
  kind: 'reflection';
  rubric: string[];
  placeholder?: string;
}
export type AuthoredQuestion =
  | AuthoredChoiceQuestion
  | AuthoredNumericQuestion
  | AuthoredTextQuestion
  | AuthoredOrderingQuestion
  | AuthoredReflectionQuestion;
export interface AuthoredSuccessCondition {
  id: string;
  source: 'answer' | 'action' | 'metric' | 'reflection';
  key: string;
  operator?: SuccessOperator;
  value?: string | number | boolean;
  min?: number;
  max?: number;
  pendingLabel?: string;
}
export interface AuthoredDataset {
  id: string;
  label: string;
  description?: string;
  records: Record<string, string | number | boolean>[];
}
export interface AuthoredActivityStep {
  id: string;
  phase: LearningPhase;
  title: string;
  lead?: string;
  reveal?: string[];
  controls?: boolean;
  success?: string;
  next?: string;
}
export interface AuthoredTransferCase {
  id: string;
  title: string;
  prompt: string;
  dataset?: string;
  overrides?: Record<string, string | number | boolean>;
}
/** Serializable teaching contract. Domain engines continue to own their scene and model. */
export interface AuthoredActivity {
  pattern: ActivityPattern;
  title?: string;
  objectives: string[];
  steps: AuthoredActivityStep[];
  questions?: AuthoredQuestion[];
  success?: AuthoredSuccessCondition[];
  datasets?: AuthoredDataset[];
  transfer?: AuthoredTransferCase[];
}

/**
 * Serializable execution plan derived from author-facing activity data.
 *
 * The source remains readable and portable while runtime-only lookups are
 * compiled once. Numeric indexes avoid duplicating question and condition
 * objects when a plan is serialized by an authoring or build tool.
 */
export interface CompiledAuthoredActivity {
  readonly kind: 'classytic.activity-plan';
  readonly version: 1;
  readonly source: AuthoredActivity;
  readonly steps: readonly LearningSequenceStep[];
  readonly successIndex: Readonly<Record<string, number>>;
  readonly questionIndex: Readonly<Record<string, number>>;
}

/** Compile author data into runtime steps; condition evaluation remains domain-owned. */
export function activitySteps(activity: Pick<AuthoredActivity, 'steps' | 'success'>): LearningSequenceStep[] {
  const conditions = new Map((activity.success ?? []).map((condition) => [condition.id, condition]));
  return activity.steps.map((step) => {
    const condition = step.success ? conditions.get(step.success) : undefined;
    return {
      id: step.id,
      phase: step.phase,
      title: step.title,
      ...(step.lead ? { lead: step.lead } : {}),
      ...(step.reveal ? { reveal: step.reveal } : {}),
      ...(step.controls != null ? { controls: step.controls } : {}),
      ...(step.next ? { next: step.next } : {}),
      ...(condition
        ? {
            gate: {
              kind: condition.source === 'metric' ? 'state' : condition.source,
              id: condition.id,
              ...(condition.pendingLabel ? { pendingLabel: condition.pendingLabel } : {}),
            },
          }
        : {}),
    };
  });
}

export function isCompiledAuthoredActivity(
  value: AuthoredActivity | CompiledAuthoredActivity,
): value is CompiledAuthoredActivity {
  return 'kind' in value && value.kind === 'classytic.activity-plan' && value.version === 1;
}

/**
 * Compile validated author data outside React's render path. This function is
 * intentionally independent of Zod so learner bundles do not pay for the
 * authoring validator. Use `authoredActivitySchema` at author/build boundaries.
 */
export function compileAuthoredActivity(
  activity: AuthoredActivity | CompiledAuthoredActivity,
): CompiledAuthoredActivity {
  if (isCompiledAuthoredActivity(activity)) return activity;
  const successIndex = Object.fromEntries(
    (activity.success ?? []).map((condition, index) => [condition.id, index]),
  );
  const questionIndex = Object.fromEntries(
    (activity.questions ?? []).map((question, index) => [question.id, index]),
  );
  return Object.freeze({
    kind: 'classytic.activity-plan' as const,
    version: 1 as const,
    source: activity,
    steps: Object.freeze(activitySteps(activity).map((step) => Object.freeze(step))),
    successIndex: Object.freeze(successIndex),
    questionIndex: Object.freeze(questionIndex),
  });
}

/** Apply host objectives without mutating a shared plan or leaving compiled source stale. */
export function withAuthoredObjectives(
  activity: AuthoredActivity | CompiledAuthoredActivity,
  objectives?: string[],
): AuthoredActivity | CompiledAuthoredActivity {
  if (!objectives) return activity;
  const source = isCompiledAuthoredActivity(activity) ? activity.source : activity;
  return { ...source, objectives };
}

/** Define and precompile a static activity next to its domain model. */
export const defineAuthoredActivity = compileAuthoredActivity;
