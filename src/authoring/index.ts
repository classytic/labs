/**
 * Public, host-neutral authoring contract.
 *
 * This subpath contains no lab runtime, renderer, editor, or domain barrel. Community
 * tools can define and validate labs without downloading the learner experience.
 */
import { compileAuthoredActivity, type CompiledAuthoredActivity } from '../kit/activity-authoring.js';
import { authoredActivitySchema } from '../schemas/activity-authoring.js';

/** Validate unknown CMS data and compile it into the learner runtime plan. */
export function parseAuthoredActivity(input: unknown): CompiledAuthoredActivity {
  return compileAuthoredActivity(authoredActivitySchema.parse(input));
}

export {
  defineLab,
  labTag,
  type LabManifest,
  type LabTaxonomy,
  type LabRepresentation,
  type LabLearningExperience,
  type LabRuntimeComponent,
  type LabAuthoringComponent,
} from '../lab-def/define-lab.js';

export {
  activityPatternSchema,
  authoredChoiceSchema,
  authoredQuestionSchema,
  authoredSuccessSchema,
  authoredDatasetSchema,
  authoredActivityStepSchema,
  authoredTransferCaseSchema,
  authoredActivitySchema,
} from '../schemas/activity-authoring.js';

export type {
  ActivityPattern,
  SuccessOperator,
  AuthoredChoice,
  AuthoredQuestion,
  AuthoredChoiceQuestion,
  AuthoredNumericQuestion,
  AuthoredTextQuestion,
  AuthoredOrderingQuestion,
  AuthoredReflectionQuestion,
  AuthoredSuccessCondition,
  AuthoredDataset,
  AuthoredActivityStep,
  AuthoredTransferCase,
  AuthoredActivity,
  CompiledAuthoredActivity,
} from '../kit/activity-authoring.js';

export {
  compileAuthoredActivity,
  defineAuthoredActivity,
  isCompiledAuthoredActivity,
  withAuthoredObjectives,
} from '../kit/activity-authoring.js';

export {
  assessLabExperience,
  deriveActivityExperience,
  type LabAccessibilityEvidence,
  type LabExperienceAssessment,
} from './quality.js';
export {
  createLabQualityReport,
  type LabQualityStatus,
  type LabQualityEntry,
  type LabQualityReport,
} from './report.js';
