'use client';

import type { ReactNode } from 'react';
import { RotateCcw } from 'lucide-react';
import { IconButton } from '../../kit/controls.js';
import { AuthoredActivityRuntime } from '../../kit/authored-activity-runtime.js';
import type { AuthoredActivity } from '../../kit/activity-authoring.js';

const FIELD_ACTIVITY: AuthoredActivity = {
  pattern: 'investigation',
  title: 'Probe a field and explain the evidence',
  objectives: [
    'Predict a field response',
    'Manipulate the field model',
    'Explain the evidence using field quantities',
  ],
  steps: [
    {
      id: 'predict',
      phase: 'predict',
      title: 'Predict the field response',
      lead: 'Commit to the direction or scaling before changing the model.',
    },
    {
      id: 'act',
      phase: 'act',
      title: 'Change the field',
      lead: 'Move a probe or change one source quantity.',
      controls: true,
      reveal: ['model'],
    },
    {
      id: 'observe',
      phase: 'observe',
      title: 'Read the evidence',
      lead: 'Compare the scene with the measured field quantity.',
      controls: true,
      reveal: ['model', 'evidence'],
    },
    {
      id: 'explain',
      phase: 'explain',
      title: 'Explain the field',
      lead: 'Connect the visible geometry to force, flux, or enclosed charge.',
    },
    {
      id: 'transfer',
      phase: 'transfer',
      title: 'Build a contrasting case',
      lead: 'Change sign, orientation, or boundary and compare.',
      controls: true,
      reveal: ['model', 'evidence'],
    },
  ],
};

export interface FieldActivityProps {
  className?: string;
  activity?: string | AuthoredActivity;
  activityId: string;
  title: ReactNode;
  prompt?: ReactNode;
  status: ReactNode;
  figure: ReactNode;
  evidence: ReactNode;
  controls?: ReactNode;
  observation: ReactNode;
  transcript: ReactNode;
  support?: ReactNode;
  objectives?: string[];
  onReset?: () => void;
}

/** Canonical authored composition for electrostatic field investigations. */
export function FieldActivity({
  className,
  activity,
  activityId,
  title,
  prompt,
  status,
  figure,
  evidence,
  controls,
  observation,
  transcript,
  support,
  objectives,
  onReset,
}: FieldActivityProps): ReactNode {
  const authoredActivity = typeof activity === 'object' ? activity : FIELD_ACTIVITY;
  const resolvedId = typeof activity === 'string' ? activity : activityId;
  return (
    <AuthoredActivityRuntime
      className={className}
      focusLayout="immersive"
      activity={{ ...authoredActivity, objectives: objectives ?? authoredActivity.objectives }}
      activityId={resolvedId}
      eyebrow="Fields and forces"
      title={title}
      description={prompt}
      status={status}
      evidence={evidence}
      controls={
        <>
          {onReset ? (
            <IconButton label="Reset field" onClick={onReset}>
              <RotateCcw aria-hidden="true" />
            </IconButton>
          ) : null}
          {controls}
        </>
      }
      observation={observation}
      transcript={transcript}
      support={support}
    >
      {figure}
    </AuthoredActivityRuntime>
  );
}
