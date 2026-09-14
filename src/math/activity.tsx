import type { ReactNode } from 'react';
import { RotateCcw } from 'lucide-react';
import { Activity, RunTransport, type ActivityRootProps } from '../kit/activity.js';
import { ControlPolicy, type ControlConfig } from '../kit/frame.js';
import { IconButton } from '../kit/controls.js';

export interface MathActivityProps {
  className: string;
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  status: ReactNode;
  figure: ReactNode;
  measurements: ReactNode;
  controls?: ReactNode;
  conclusion: ReactNode;
  transport: ReactNode;
  details?: ReactNode;
  graphLabel: string;
  inspectorLabel?: string;
  controlConfig?: ControlConfig;
  focusLayout?: ActivityRootProps['focusLayout'];
}

export function MathExpressionError({
  title,
  expression,
  error,
}: {
  title: ReactNode;
  expression?: string;
  error: ReactNode;
}): ReactNode {
  return (
    <div className="not-prose math-expression-error" role="alert">
      <strong>{title}</strong>
      <p>
        {expression ? <>“{expression}”, </> : null}
        {error}
      </p>
    </div>
  );
}

/** Canvas-first composition for graphs, constructions, and symbolic experiments. */
export function MathActivity({
  className,
  eyebrow = 'Mathematics',
  title,
  description,
  status,
  figure,
  measurements,
  controls,
  conclusion,
  transport,
  details,
  graphLabel,
  inspectorLabel = 'Values and controls',
  controlConfig,
  focusLayout = 'standard',
}: MathActivityProps): ReactNode {
  return (
    <ControlPolicy config={controlConfig}>
      <Activity.Root className={`math-activity ${className}`} focusLayout={focusLayout}>
        <Activity.Header>
          <Activity.Heading eyebrow={eyebrow} title={title} description={description} />
          <Activity.FocusButton />
        </Activity.Header>
        <Activity.Status>{status}</Activity.Status>
        <Activity.Workspace>
          <Activity.Canvas label={graphLabel}>
            <div className="math-scene">{figure}</div>
          </Activity.Canvas>
          <Activity.Inspector label={inspectorLabel}>
            <div className="lab-activity-inspector-section">
              <div className="math-measurements">{measurements}</div>
              {controls ? <div className="lab-activity-fields math-controls">{controls}</div> : null}
            </div>
          </Activity.Inspector>
        </Activity.Workspace>
        <Activity.Feedback>
          <span>Conclusion</span>
          <p>{conclusion}</p>
        </Activity.Feedback>
        <Activity.Transport>{transport}</Activity.Transport>
        {details ? <Activity.Transcript label="Calculation details">{details}</Activity.Transcript> : null}
      </Activity.Root>
    </ControlPolicy>
  );
}

export function MathResetTransport({
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
      <IconButton label="Reset experiment" onClick={onReset}>
        <RotateCcw aria-hidden="true" />
      </IconButton>
      <div className="lab-transport-state" aria-live="polite">
        <strong>{state}</strong>
        {detail ? <span>{detail}</span> : null}
      </div>
    </>
  );
}

export interface MathRunTransportProps {
  running: boolean;
  onReset: () => void;
  onStep: () => void;
  onToggle: () => void;
  state: ReactNode;
  detail?: ReactNode;
  disabled?: boolean;
  resetLabel?: string;
  stepLabel?: string;
  runLabel?: string;
}

/** Shared numerical-method transport: reset, single-step, live state, and run/pause. */
export function MathRunTransport({
  running,
  onReset,
  onStep,
  onToggle,
  state,
  detail,
  disabled,
  resetLabel = 'Reset',
  stepLabel = 'Take one step',
  runLabel = 'Run',
}: MathRunTransportProps): ReactNode {
  return (
    <RunTransport
      running={running}
      onReset={onReset}
      onStep={onStep}
      onToggle={onToggle}
      state={state}
      detail={detail}
      disabled={disabled}
      resetLabel={resetLabel}
      stepLabel={stepLabel}
      runLabel={runLabel}
    />
  );
}
