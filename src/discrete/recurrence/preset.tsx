'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { RotateCcw } from 'lucide-react';
import { Activity } from '../../kit/activity.js';
import { ActionButton, IconButton, Stepper } from '../../kit/controls.js';
import { Field } from '../../kit/frame.js';
import { useCheckpoint } from '../../kit/pedagogy.js';
import { recurrenceDependencies, recurrenceTerms } from './core.js';
import { RecurrenceDependencyScene } from '../visuals/index.js';

export interface RecurrenceBuilderProps {
  base?: number[];
  coefficients?: number[];
  count?: number;
  title?: string;
  prompt?: string;
}

export function RecurrenceBuilderLab({
  base = [1, 1],
  coefficients = [1, 1],
  count: initialCount = 9,
  title = 'Build the next term from solved smaller cases',
  prompt = 'Reveal dependencies one term at a time and see how base cases anchor the whole recurrence.',
}: RecurrenceBuilderProps): ReactNode {
  const [count, setCount] = useState(initialCount);
  const [revealed, setRevealed] = useState(base.length);
  const terms = useMemo(() => recurrenceTerms({ base, coefficients }, count), [base, coefficients, count]);
  const complete = revealed >= count;
  useCheckpoint({ solved: complete, activity: `recurrence:${base.join(',')}:${coefficients.join(',')}` });
  const active = Math.min(revealed, count - 1);
  const dependencies = new Set(recurrenceDependencies(active, coefficients.length));
  return (
    <Activity.Root className="discrete-recurrence-activity" focusLayout="compact">
      <Activity.Header>
        <Activity.Heading eyebrow="Recurrences" title={title} description={prompt} />
        <Activity.FocusButton />
      </Activity.Header>
      <Activity.Status>
        <strong>{complete ? 'Sequence constructed' : `Find a${active}`}</strong>
        <span>{base.length} base cases</span>
        <span>order {coefficients.length}</span>
      </Activity.Status>
      <Activity.Workspace>
        <Activity.Canvas label="Recurrence dependency strip">
          <RecurrenceDependencyScene
            terms={terms}
            revealed={revealed}
            active={active}
            dependencies={dependencies}
          />
          <div className="recurrence-rule">
            <span className="lab-field-label">rule</span>
            <strong>
              aₙ ={' '}
              {coefficients
                .map((coefficient, index) => `${coefficient === 1 ? '' : coefficient + '·'}aₙ₋${index + 1}`)
                .join(' + ')}
            </strong>
            <span>Highlighted cells are the already-solved subproblems needed next.</span>
          </div>
        </Activity.Canvas>
        <Activity.Inspector label="Recurrence controls">
          <Activity.InspectorSection>
            <div className="lab-activity-fields">
              <Field label="terms">
                <Stepper
                  value={count}
                  onChange={(value) => {
                    setCount(value);
                    setRevealed(Math.min(base.length, value));
                  }}
                  min={base.length + 1}
                  max={14}
                />
              </Field>
              <div className="proof-law">
                <span className="lab-field-label">base cases</span>
                <strong>{base.map((value, index) => `a${index}=${value}`).join(', ')}</strong>
                <span>Without these, the recurrence only points backward forever.</span>
              </div>
            </div>
          </Activity.InspectorSection>
        </Activity.Inspector>
      </Activity.Workspace>
      <Activity.Feedback>
        <span>Observe</span>
        <div>
          {complete
            ? 'The recurrence and its base cases uniquely determine every displayed term.'
            : `a${active} depends on ${[...dependencies].map((index) => `a${index}`).join(' and ')}.`}
        </div>
      </Activity.Feedback>
      <Activity.Transport>
        <IconButton label="Reset recurrence" onClick={() => setRevealed(base.length)}>
          <RotateCcw aria-hidden="true" />
        </IconButton>
        <div className="lab-transport-state">
          <strong>{complete ? 'Construction complete' : `${revealed} terms known`}</strong>
          <span>{count} total</span>
        </div>
        <ActionButton onClick={() => setRevealed((value) => Math.min(count, value + 1))} disabled={complete}>
          Build next term
        </ActionButton>
      </Activity.Transport>
    </Activity.Root>
  );
}
