'use client';

import type { ReactNode } from 'react';
import { Chip, Slider } from '../../kit/controls.js';
import type { AuthoredActivity } from '../../kit/activity-authoring.js';
import { Field } from '../../kit/frame.js';
import { OpticsActivity } from './activity.js';

interface ImagingActivityProps {
  kind: 'lens' | 'mirror';
  title: string;
  prompt: string;
  figure: ReactNode;
  instruments: ReactNode;
  controls: ReactNode;
  objectives: string[];
  challenge: ReactNode;
  objectDistance: number;
  setObjectDistance: (value: number) => void;
  minDistance: number;
  maxDistance: number;
  state: string;
  equation: string;
  activity?: string | AuthoredActivity;
  activityId: string;
}

/** One responsive learner composition shared by lens and mirror ray diagrams. */
export function ImagingActivity(props: ImagingActivityProps): ReactNode {
  const {
    kind,
    title,
    prompt,
    figure,
    instruments,
    controls,
    objectives,
    challenge,
    objectDistance: u,
    setObjectDistance: setU,
    minDistance,
    maxDistance,
    state,
    equation,
    activity,
    activityId,
  } = props;
  const distance = (
    <Field label="object distance" value={`${u.toFixed(0)} cm`}>
      <Slider
        min={minDistance}
        max={maxDistance}
        step={1}
        value={u}
        onChange={setU}
        ariaLabel="Object distance"
      />
    </Field>
  );
  return (
    <OpticsActivity
      focusLayout="compact"
      activity={activity}
      activityId={activityId}
      eyebrow={`${kind} imaging`}
      title={title}
      prompt={prompt}
      status={
        <>
          <strong>{state}</strong>
          <span>u {u.toFixed(0)} cm</span>
          <span>{equation}</span>
        </>
      }
      figure={figure}
      evidence={instruments}
      controls={
        <>
          <div className="lab-activity-fields physics-controls">
            {controls}
            {distance}
          </div>
          <span className="lab-field-row">
            <Chip selected={false} onClick={() => setU(Math.max(minDistance, u - 1))}>
              Closer
            </Chip>
            <Chip selected={false} onClick={() => setU(Math.min(maxDistance, u + 1))}>
              Farther
            </Chip>
          </span>
        </>
      }
      observation={`${state}. Move the object across the focal landmarks and watch where the principal rays meet.`}
      transcript={challenge}
      objectives={objectives}
    />
  );
}
