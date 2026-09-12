import type { LabLearningExperience, LabManifest } from '../lab-def/define-lab.js';
import {
  isCompiledAuthoredActivity,
  type AuthoredActivity,
  type AuthoredQuestion,
  type CompiledAuthoredActivity,
} from '../kit/activity-authoring.js';

const PHASES: LabLearningExperience['phases'] = ['predict', 'act', 'observe', 'explain', 'transfer'];

export interface LabExperienceAssessment {
  ready: boolean;
  issues: string[];
}

export type LabAccessibilityEvidence = LabLearningExperience['accessibility'];

const responseKind = (question: AuthoredQuestion): LabLearningExperience['responses'][number] =>
  question.kind ?? 'choice';
const sameMembers = <T extends string>(left: readonly T[], right: readonly T[]): boolean =>
  left.length === right.length && left.every((item) => right.includes(item));
const normalizedText = (items: readonly string[]): string[] =>
  items.map((item) => item.trim()).filter(Boolean);

/** Derive only what activity data proves; access capabilities require explicit evidence. */
export function deriveActivityExperience(
  activity: AuthoredActivity | CompiledAuthoredActivity,
  accessibility: LabAccessibilityEvidence,
): LabLearningExperience {
  const source = isCompiledAuthoredActivity(activity) ? activity.source : activity;
  return {
    objectives: [...source.objectives],
    phases: [...new Set(source.steps.map((step) => step.phase))],
    responses: [...new Set((source.questions ?? []).map(responseKind))],
    accessibility: { ...accessibility },
  };
}

/**
 * Host-neutral quality gate for a showcase learning experience. It checks declared
 * teaching and access capabilities without importing or rendering the runtime.
 */
export function assessLabExperience(
  manifest: Pick<LabManifest, 'experience'>,
  activity?: AuthoredActivity | CompiledAuthoredActivity,
): LabExperienceAssessment {
  const experience = manifest.experience;
  if (!experience) return { ready: false, issues: ['Declare an experience contract.'] };
  const issues: string[] = [];
  if (experience.objectives.length === 0) issues.push('Add at least one observable learning objective.');
  for (const phase of PHASES) if (!experience.phases.includes(phase)) issues.push(`Add the ${phase} phase.`);
  if (experience.responses.length === 0) issues.push('Add at least one learner response type.');
  if (!experience.accessibility.keyboard) issues.push('Provide a keyboard-complete interaction path.');
  if (!experience.accessibility.textAlternative)
    issues.push('Provide a text alternative or transcript for the scene.');
  if (!experience.accessibility.reducedMotion) issues.push('Provide a reduced-motion behavior.');
  if (activity) {
    const derived = deriveActivityExperience(activity, experience.accessibility);
    if (!sameMembers(normalizedText(experience.objectives), normalizedText(derived.objectives)))
      issues.push('Manifest objectives do not match the authored activity.');
    if (!sameMembers(experience.phases, derived.phases))
      issues.push('Manifest phases do not match the authored activity.');
    if (!sameMembers(experience.responses, derived.responses))
      issues.push('Manifest response types do not match the authored activity.');
  }
  return { ready: issues.length === 0, issues };
}
