'use client';

import type { ReactNode, RefObject } from 'react';
import { Pause, Play, RotateCcw } from 'lucide-react';
import { ActionButton, IconButton } from '../../kit/controls.js';
import { AuthoredActivityRuntime, AuthoredMetricGate } from '../../kit/authored-activity-runtime.js';
import { withAuthoredObjectives, type AuthoredActivity } from '../../kit/activity-authoring.js';
import { SceneSurface } from '../mechanics/presentation.js';
import { waveActivity } from './activity-plan.js';

interface WaveActivityProps {
  title: string;
  prompt?: string;
  mode: string;
  figure: ReactNode;
  instruments: ReactNode;
  controls: ReactNode;
  objectives?: string[];
  footer?: ReactNode;
  visibleRef?: RefObject<HTMLDivElement | null>;
  playing: boolean;
  setPlaying: (value: boolean) => void;
  reset: () => void;
  status: ReactNode;
  observation: ReactNode;
  activity?: string | AuthoredActivity;
  activityId?: string;
  transcript?: ReactNode;
}

/** Responsive shell shared by animated wave experiments. */
export function WaveActivity(props: WaveActivityProps): ReactNode {
  const {
    title,
    prompt,
    mode,
    figure,
    instruments,
    controls,
    objectives,
    footer,
    visibleRef,
    playing,
    setPlaying,
    reset,
    status,
    observation,
    activity = 'wave-activity',
    activityId = 'wave-activity',
    transcript,
  } = props;
  const authoredActivity = typeof activity === 'string' ? waveActivity : activity;
  const resolvedId = typeof activity === 'string' ? activity : activityId;
  const waveControls = (
    <>
      {/* Transport actions, not a mode choice: a primary Play/Pause and an icon Reset. */}
      <div className="lab-field-row">
        <ActionButton className="lab-primary-action" onClick={() => setPlaying(!playing)} pressed={playing}>
          {playing ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
          {playing ? 'Pause' : 'Play'}
        </ActionButton>
        <IconButton label="Reset wave" onClick={reset}>
          <RotateCcw aria-hidden="true" />
        </IconButton>
      </div>
      {controls}
    </>
  );
  return (
    <AuthoredActivityRuntime
      className="physics-wave"
      focusLayout="immersive"
      activity={withAuthoredObjectives(authoredActivity, objectives)}
      activityId={resolvedId}
      eyebrow="Waves"
      title={title}
      description={prompt}
      status={
        <>
          <span>{mode}</span>
          {status}
        </>
      }
      evidence={instruments}
      controls={waveControls}
      observation={observation}
      transcript={transcript ?? <p>{`${mode} wave experiment with accessible live measurements.`}</p>}
      support={footer}
    >
      {({ complete }) => (
        <>
          <AuthoredMetricGate conditionId="played" met={playing} complete={complete} />
          <SceneSurface ref={visibleRef} tone="grid" className="physics-wave-scene">
            {figure}
          </SceneSurface>
        </>
      )}
    </AuthoredActivityRuntime>
  );
}
