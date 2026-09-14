'use client';

import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { Activity } from './activity.js';
import {
  compileAuthoredActivity,
  type AuthoredActivity,
  type CompiledAuthoredActivity,
} from './activity-authoring.js';
import { AuthoredResponse, type AuthoredResponseResult } from './authored-response.js';
import {
  LearningSequenceNav,
  useLearningSequence,
  type LearningSequence,
  type LearningSequenceStep,
} from './learning-sequence.js';
import { useCheckpoint } from './pedagogy.js';
import { ControlPolicy, type ControlConfig } from './frame.js';

export interface AuthoredActivityContext {
  sequence: LearningSequence;
  complete: (conditionId: string, outcome?: string) => void;
}

export interface AuthoredActivityRuntimeProps {
  /** Optional domain hook for narrowly scoped scene and control composition. */
  className?: string;
  activity: AuthoredActivity | CompiledAuthoredActivity;
  activityId: string;
  eyebrow?: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  status?: ReactNode | ((context: AuthoredActivityContext) => ReactNode);
  /** Learner-facing task or prediction prompt shown before the model workspace. */
  task?: ReactNode | ((context: AuthoredActivityContext) => ReactNode);
  /** Domain-owned interactive model. The learning runtime never owns scientific state. */
  children: ReactNode | ((context: AuthoredActivityContext) => ReactNode);
  /** Authorable controls and evidence associated with the model. */
  inspector?: ReactNode | ((context: AuthoredActivityContext) => ReactNode);
  /** Measurements, results, or other evidence used to interpret the model. */
  evidence?: ReactNode | ((context: AuthoredActivityContext) => ReactNode);
  /** Named learner controls, subject to controlConfig, placed after evidence. */
  controls?: ReactNode | ((context: AuthoredActivityContext) => ReactNode);
  /** Optional interpretation shown after the workspace. */
  observation?: ReactNode | ((context: AuthoredActivityContext) => ReactNode);
  /** Accessible account of scene state and changes. */
  transcript?: ReactNode | ((context: AuthoredActivityContext) => ReactNode);
  /** Optional hints, worked support, or solution-reveal affordances. */
  support?: ReactNode | ((context: AuthoredActivityContext) => ReactNode);
  /** Creator policy for hiding or locking named Field/Control descendants. */
  controlConfig?: ControlConfig;
  onResponse?: (result: AuthoredResponseResult) => void;
  onComplete?: () => void;
  /** Optional authored checkpoint used to resume a known sequence step. */
  initialStepId?: string;
  /** Keeps domain scene state synchronized with Back, Continue, and authored branching. */
  onStepChange?: (step: LearningSequenceStep, index: number) => void;
  /** Side inspectors are opt-in; stacked keeps the learning model legible. */
  inspectorLayout?: 'stacked' | 'side';
  /** Controls how the activity uses a large focused viewport. */
  focusLayout?: 'compact' | 'standard' | 'immersive';
}

const renderSlot = (
  slot: ReactNode | ((context: AuthoredActivityContext) => ReactNode) | undefined,
  context: AuthoredActivityContext,
): ReactNode => (typeof slot === 'function' ? slot(context) : slot);

/** Completes a domain-evaluated authored metric gate once per satisfied transition. */
export function AuthoredMetricGate({
  conditionId,
  met,
  complete,
  outcome,
}: {
  conditionId: string;
  met: boolean;
  complete: AuthoredActivityContext['complete'];
  outcome?: string;
}): null {
  const fired = useRef(false);
  useEffect(() => {
    if (!met) {
      fired.current = false;
      return;
    }
    if (!fired.current) {
      fired.current = true;
      complete(conditionId, outcome);
    }
  }, [complete, conditionId, met, outcome]);
  return null;
}

/**
 * Canonical learner shell for a serializable AuthoredActivity. It owns progression,
 * assessment wiring, feedback placement, responsive anatomy, and completion reporting;
 * domain packages provide only their model, controls/evidence, and transcript.
 */
export function AuthoredActivityRuntime({
  className,
  activity,
  activityId,
  eyebrow = 'Interactive lesson',
  title,
  description,
  status,
  task,
  children,
  inspector,
  evidence,
  controls,
  observation,
  transcript,
  support,
  controlConfig,
  onResponse,
  onComplete,
  initialStepId,
  onStepChange,
  inspectorLayout = 'stacked',
  focusLayout = 'standard',
}: AuthoredActivityRuntimeProps): ReactNode {
  const plan = useMemo(() => compileAuthoredActivity(activity), [activity]);
  const authored = plan.source;
  const sequence = useLearningSequence(plan.steps, {
    initialStepId,
    onStepChange,
  });
  const context: AuthoredActivityContext = {
    sequence,
    complete: sequence.complete,
  };
  const conditionPosition = sequence.current.gate ? plan.successIndex[sequence.current.gate.id] : undefined;
  const condition = conditionPosition == null ? undefined : authored.success?.[conditionPosition];
  const questionPosition =
    condition && (condition.source === 'answer' || condition.source === 'reflection')
      ? plan.questionIndex[condition.key]
      : undefined;
  const question = questionPosition == null ? undefined : authored.questions?.[questionPosition];
  const solved = sequence.index === sequence.total - 1 && sequence.canAdvance;
  /**
   * Whether the learner has earned the answer yet.
   *
   * A prediction is only a prediction if the evidence is not already on the page. The runtime has
   * always withheld `observation` on this rule and shown `evidence` regardless, which meant a lab
   * could ask "where is the speed greatest?" while the measured speed, the period and the finished
   * displacement trace sat two inches below the question. 116 labs declare a predict phase and
   * four of them hand-rolled this gate; the rest were asking questions they had already answered.
   *
   * `evidence` is the slot the runtime documents as "measurements, results, or other evidence used
   * to interpret the model", so it is exactly the thing a prediction must not see. `inspector`
   * stays put: it holds controls for exploring, not the answer.
   */
  const evidenceEarned = sequence.current.phase !== 'predict' || sequence.canAdvance;
  useCheckpoint({ solved, activity: activityId });
  useEffect(() => {
    if (solved) onComplete?.();
  }, [solved, onComplete]);

  const respond = (result: AuthoredResponseResult): void => {
    onResponse?.(result);
    if (!condition) return;
    if (result.correct === true || (condition.source === 'reflection' && result.correct === null))
      sequence.complete(
        condition.id,
        Array.isArray(result.response) ? result.response.join(',') : String(result.response),
      );
  };

  const renderedTask = renderSlot(task, context);
  const renderedModel = renderSlot(children, context);
  const renderedEvidence = renderSlot(evidence, context);
  const renderedInspector = renderSlot(inspector, context);
  const renderedControls = renderSlot(controls, context);
  const renderedObservation = renderSlot(observation, context);
  const renderedTranscript = renderSlot(transcript, context);
  const renderedSupport = renderSlot(support, context);

  return (
    <ControlPolicy config={controlConfig}>
      <Activity.Root
        className={['lab-authored-activity', className].filter(Boolean).join(' ')}
        data-inspector-layout={inspectorLayout}
        focusLayout={focusLayout}
      >
        <Activity.Header>
          {/* The description was briefly hidden while a question was on screen, to cut the stack
              of title, description, step lead and question down to something a learner could act
              on. It had to come back: some descriptions carry a definition the question depends
              on, and the Hall-effect lab states its V_H sign convention there and nowhere else,
              so hiding it asked for a polarity the learner had not been told. Shortening this
              stack has to happen per lab, in the writing, not by suppressing a slot wholesale. */}
          <Activity.Heading
            eyebrow={eyebrow}
            title={title ?? authored.title ?? sequence.current.title ?? 'Interactive activity'}
            description={description}
          />
          <Activity.FocusButton />
        </Activity.Header>
        <Activity.Status>
          {/* The phase is our word for the step, not the learner's, and beside a title like
              "Predict compression" the chip reading "predict" says the same thing twice in the
              same breath. Show it only when the title does not already carry it. */}
          {(sequence.current.title ?? '')
            .toLowerCase()
            .includes(sequence.current.phase.toLowerCase()) ? null : (
            <strong>{sequence.current.phase}</strong>
          )}
          <span>{sequence.current.title}</span>
          {renderSlot(status, context)}
        </Activity.Status>
        {renderedTask || question || sequence.current.lead ? (
          <section className="lab-authored-task" aria-label="Your task">
            {sequence.current.lead ? <p className="lab-authored-task-lead">{sequence.current.lead}</p> : null}
            {renderedTask}
            {question ? <AuthoredResponse key={question.id} question={question} onRespond={respond} /> : null}
          </section>
        ) : null}
        <Activity.Workspace>
          <Activity.Canvas label={`${String(title ?? authored.title ?? 'Interactive activity')} model`}>
            {renderedModel}
          </Activity.Canvas>
          {renderedControls ? (
            <Activity.Dock>
              <section className="lab-activity-fields lab-authored-controls" aria-label="Controls">
                {renderedControls}
              </section>
            </Activity.Dock>
          ) : null}
          {(renderedEvidence && evidenceEarned) || renderedInspector ? (
            <Activity.Inspector
              label="Explore evidence"
              defaultOpen={inspectorLayout === 'side'}
              responsive={false}
            >
              {renderedEvidence && evidenceEarned ? (
                <section className="lab-authored-evidence" aria-label="Evidence">
                  {renderedEvidence}
                </section>
              ) : null}
              {renderedInspector}
            </Activity.Inspector>
          ) : null}
        </Activity.Workspace>
        {renderedObservation && evidenceEarned ? (
          <Activity.Feedback>
            <span>Observe</span>
            <div>{renderedObservation}</div>
          </Activity.Feedback>
        ) : null}
        {renderedTranscript || renderedSupport ? (
          <Activity.Transcript label={renderedSupport ? 'Learning support' : 'Event transcript'}>
            {renderedTranscript ? (
              <section className="lab-authored-transcript" aria-label="Event transcript">
                {renderedTranscript}
              </section>
            ) : null}
            {renderedSupport ? <section className="lab-authored-support">{renderedSupport}</section> : null}
          </Activity.Transcript>
        ) : null}
        <Activity.Transport>
          <LearningSequenceNav sequence={sequence} />
        </Activity.Transport>
      </Activity.Root>
    </ControlPolicy>
  );
}
