/**
 * A pathway is a COURSE expressed as metadata: an ordered spine of labs a learner walks
 * through, with no React, no lab runtime, and no bundler weight. Hosts read it to build a
 * syllabus page, a lesson plan, or MDX.
 *
 * A course-length pathway groups its steps into `modules` (a chapter each). A step may be
 * `planned`, which lets one file hold BOTH the finished syllabus and the build backlog:
 * the outline shows the whole course, while generated MDX contains only labs that exist.
 */

/** Whether the lab behind a step is built yet. */
export type LabPathwayStatus = 'ready' | 'planned';

/** One chapter of a course-length pathway. */
export interface LabPathwayModule {
  id: string;
  title: string;
  /** One sentence on what this chapter is for. */
  summary: string;
  /** What a learner can DO at the end, written as actions rather than topic labels. */
  outcomes: readonly string[];
}

export interface LabPathwayStep {
  id: string;
  /** The lab's MDX tag. This is what identifies the runtime, so it must match a manifest. */
  tag: string;
  title: string;
  purpose: string;
  defaultAttributes?: Readonly<Record<string, string | number | boolean | readonly number[]>>;
  /** The `LabPathwayModule` id this step belongs to. Omitted on single-arc pathways. */
  module?: string;
  /** Defaults to 'ready'. A 'planned' step is designed but unbuilt: it appears in the
   *  outline and the backlog, and is left out of generated MDX so nothing renders blank. */
  status?: LabPathwayStatus;
}

export interface LabPathway {
  id: string;
  title: string;
  description: string;
  domain: string;
  grades: readonly string[];
  estimatedMinutes: number;
  /** Ordered chapters. Absent on the short single-arc pathways. */
  modules?: readonly LabPathwayModule[];
  steps: readonly LabPathwayStep[];
}

const encode = (value: string | number | boolean | readonly number[]): string =>
  typeof value === 'string' ? JSON.stringify(value) : `{${JSON.stringify(value)}}`;

/** Steps whose lab exists. A step is ready unless it explicitly says otherwise. */
export const readySteps = (pathway: LabPathway): readonly LabPathwayStep[] =>
  pathway.steps.filter((step) => (step.status ?? 'ready') === 'ready');

/** Steps still to build, in teaching order: the course's backlog. */
export const plannedSteps = (pathway: LabPathway): readonly LabPathwayStep[] =>
  pathway.steps.filter((step) => step.status === 'planned');

/** The steps of one chapter, in order. */
export const moduleSteps = (pathway: LabPathway, moduleId: string): readonly LabPathwayStep[] =>
  pathway.steps.filter((step) => step.module === moduleId);

/**
 * Generate portable MDX for a pathway without importing any lab runtime. Planned steps are
 * skipped: emitting a tag with no manifest behind it would render an empty lesson.
 */
export function pathwayToMdx(pathway: LabPathway): string {
  return readySteps(pathway)
    .map((step) => {
      const attributes = Object.entries(step.defaultAttributes ?? {})
        .map(([key, value]) => ` ${key}=${encode(value)}`)
        .join('');
      return `<${step.tag}${attributes} />`;
    })
    .join('\n\n');
}
