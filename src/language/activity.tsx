'use client';

import type { ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';
import { Activity } from '../kit/activity.js';
import { ActionButton } from '../kit/controls.js';
import { Objectives } from '../kit/pedagogy.js';

export interface LanguageActivityProps {
  title: ReactNode;
  prompt?: ReactNode;
  objectives?: string[];
  progress?: ReactNode;
  children: ReactNode;
  aside?: ReactNode;
  controls?: ReactNode;
  footer?: ReactNode;
  canvasLabel?: string;
}

/** One compact anatomy for vocabulary, listening, grammar, and reading activities. */
export function LanguageActivity({
  title,
  prompt,
  objectives,
  progress,
  children,
  aside,
  controls,
  footer,
  canvasLabel = 'Language practice',
}: LanguageActivityProps): ReactNode {
  return (
    <Activity.Root className="language-activity" focusLayout="compact">
      <Activity.Header>
        <Activity.Heading eyebrow="Language practice" title={title} description={prompt} />
        <Activity.FocusButton />
      </Activity.Header>
      {progress ? <Activity.Status>{progress}</Activity.Status> : null}
      <Activity.Workspace>
        <Activity.Canvas label={canvasLabel}>{children}</Activity.Canvas>
        {aside ? (
          <Activity.Inspector label="Result">
            <div className="lab-activity-inspector-section">{aside}</div>
          </Activity.Inspector>
        ) : null}
      </Activity.Workspace>
      <Objectives items={objectives} />
      {footer ? <div className="language-activity-support">{footer}</div> : null}
      {controls ? <Activity.Transport>{controls}</Activity.Transport> : null}
    </Activity.Root>
  );
}

/** Consistent finite-deck progression: context stays beside the forward action. */
export function LanguageAdvance({
  current,
  total,
  onNext,
  label = 'Next item',
}: {
  current: number;
  total: number;
  onNext: () => void;
  label?: string;
}): ReactNode {
  return (
    <>
      <div className="lab-transport-state" aria-live="polite">
        <strong>Correct</strong>
        <span>
          {current} of {total} complete
        </span>
      </div>
      <ActionButton className="lab-primary-action" onClick={onNext}>
        {label}
        <ArrowRight aria-hidden="true" />
      </ActionButton>
    </>
  );
}
