import type { ReactNode } from 'react';
import { RotateCcw } from 'lucide-react';
import { Activity, RunTransport } from '../../kit/activity.js';
import { IconButton } from '../../kit/controls.js';
import { ControlPolicy, type ControlConfig } from '../../kit/frame.js';

export interface MLActivityProps {
  className: string;
  eyebrow?: ReactNode;
  title: ReactNode;
  prompt?: ReactNode;
  status: ReactNode;
  figure: ReactNode;
  instruments: ReactNode;
  controls?: ReactNode;
  feedback: ReactNode;
  objectives?: string[];
  transport: ReactNode;
  challenge?: ReactNode;
  support?: ReactNode;
  controlConfig?: ControlConfig;
  canvasLabel: string;
  inspectorLabel?: string;
}

/** One predictable learning anatomy for every ML lab; algorithms keep their own scenes. */
export function MLActivity({
  className,
  eyebrow = 'Machine learning',
  title,
  prompt,
  status,
  figure,
  instruments,
  controls,
  feedback,
  transport,
  challenge,
  support,
  controlConfig,
  canvasLabel,
  inspectorLabel = 'Evidence and controls',
}: MLActivityProps): ReactNode {
  return (
    <ControlPolicy config={controlConfig}>
      <Activity.Root className={`ml-activity ${className}`}>
        <Activity.Header>
          <Activity.Heading eyebrow={eyebrow} title={title} description={prompt} />
          <Activity.FocusButton />
        </Activity.Header>
        <Activity.Status>{status}</Activity.Status>
        {challenge ? (
          <Activity.Transcript label="Prediction challenge" defaultOpen>
            {challenge}
          </Activity.Transcript>
        ) : null}
        <Activity.Workspace>
          <Activity.Canvas label={canvasLabel}>{figure}</Activity.Canvas>
          <Activity.Inspector label={inspectorLabel}>
            <div className="lab-activity-inspector-section">
              <div className="ml-instrument-stack">{instruments}</div>
              {controls ? <div className="lab-activity-fields ml-controls">{controls}</div> : null}
            </div>
          </Activity.Inspector>
        </Activity.Workspace>
        <Activity.Feedback>
          <span>Observe</span>
          <p>{feedback}</p>
        </Activity.Feedback>
        {support ? (
          <Activity.Transcript label="Optional help">
            <div className="ml-lesson-support">
              <section>{support}</section>
            </div>
          </Activity.Transcript>
        ) : null}
        <Activity.Transport>{transport}</Activity.Transport>
      </Activity.Root>
    </ControlPolicy>
  );
}

export function MLRunTransport({
  running,
  onReset,
  onToggle,
  onStep,
  state,
  detail,
  disabled,
  runLabel = 'Run',
}: {
  running: boolean;
  onReset: () => void;
  onToggle: () => void;
  onStep?: () => void;
  state: ReactNode;
  detail?: ReactNode;
  disabled?: boolean;
  runLabel?: string;
}): ReactNode {
  return (
    <RunTransport
      running={running}
      onReset={onReset}
      onToggle={onToggle}
      onStep={onStep}
      state={state}
      detail={detail}
      disabled={disabled}
      runLabel={runLabel}
    />
  );
}

export function MLResetTransport({
  onReset,
  state,
  detail,
}: {
  onReset: () => void;
  state: ReactNode;
  detail?: ReactNode;
}): ReactNode {
  return (
    <>
      <IconButton label="Reset activity" onClick={onReset}>
        <RotateCcw aria-hidden="true" />
      </IconButton>
      <div className="lab-transport-state" aria-live="polite">
        <strong>{state}</strong>
        {detail ? <span>{detail}</span> : null}
      </div>
    </>
  );
}
