'use client';

import type { ReactNode } from 'react';
import { AuthoredActivityRuntime } from '../../kit/authored-activity-runtime.js';
import { withAuthoredObjectives, type AuthoredActivity } from '../../kit/activity-authoring.js';
import type { ControlConfig } from '../../kit/frame.js';
import { thermalActivity } from './activity-plan.js';

export interface ThermalActivityProps {
  activity?: string | AuthoredActivity;
  activityId?: string;
  className?: string;
  eyebrow?: ReactNode;
  title: ReactNode;
  prompt?: ReactNode;
  status: ReactNode;
  figure: ReactNode;
  instruments: ReactNode;
  controls: ReactNode;
  feedback: ReactNode;
  objectives?: string[];
  transport?: ReactNode;
  footer?: ReactNode;
  controlConfig?: ControlConfig;
  canvasLabel?: string;
  inspectorLabel?: string;
}

/** Canonical authored composition for thermal and thermodynamic investigations. */
export function ThermalActivity({
  activity,
  activityId,
  className,
  eyebrow = 'Thermal physics',
  title,
  prompt,
  status,
  figure,
  instruments,
  controls,
  feedback,
  objectives,
  transport,
  footer,
  controlConfig,
}: ThermalActivityProps): ReactNode {
  const authoredActivity = typeof activity === 'object' ? activity : thermalActivity;
  const resolvedId =
    typeof activity === 'string'
      ? activity
      : (activityId ?? className?.replace(/^physics-/, '') ?? 'thermal-activity');
  return (
    <AuthoredActivityRuntime
      className={className}
      focusLayout="immersive"
      activity={withAuthoredObjectives(authoredActivity, objectives)}
      activityId={resolvedId}
      eyebrow={eyebrow}
      title={title}
      description={prompt}
      status={status}
      evidence={instruments}
      controls={
        <>
          {controls}
          {transport}
        </>
      }
      observation={feedback}
      transcript={footer}
      controlConfig={controlConfig}
    >
      {figure}
    </AuthoredActivityRuntime>
  );
}
