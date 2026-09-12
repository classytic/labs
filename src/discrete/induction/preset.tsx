'use client';

import { useState, type ReactNode } from 'react';
import { RotateCcw } from 'lucide-react';
import { Activity } from '../../kit/activity.js';
import { ActionButton, IconButton, Segmented } from '../../kit/controls.js';
import { useCheckpoint } from '../../kit/pedagogy.js';
import { inductionComplete, inductionDiagnosis, inductionReach } from './core.js';
import { DominoInductionScene } from '../visuals/index.js';

export interface InductionLadderProps {
  first?: number;
  last?: number;
  title?: string;
  claim?: string;
}

export function InductionLadderLab({
  first = 1,
  last = 8,
  title = 'Make the claim reach every case',
  claim = '1 + 2 + … + n = n(n + 1)/2',
}: InductionLadderProps): ReactNode {
  const [base, setBase] = useState(false);
  const [bridge, setBridge] = useState(false);
  const [mode, setMode] = useState<'build' | 'sabotage'>('build');
  const model = { first, last, baseEstablished: base, bridgeEstablished: bridge };
  const reached = new Set(inductionReach(model));
  const complete = inductionComplete(model);
  useCheckpoint({ solved: complete, activity: `induction:${claim}` });
  const reset = (): void => {
    setBase(false);
    setBridge(false);
  };

  return (
    <Activity.Root className="discrete-induction-activity" focusLayout="compact">
      <Activity.Header>
        <Activity.Heading eyebrow="Proof by induction" title={title} description={claim} />
        <Activity.FocusButton />
      </Activity.Header>
      <Activity.Status>
        <strong>{complete ? 'All cases reached' : 'Proof incomplete'}</strong>
        <span>{base ? 'base ✓' : 'base missing'}</span>
        <span>{bridge ? 'bridge ✓' : 'bridge missing'}</span>
      </Activity.Status>
      <Activity.Workspace>
        <Activity.Canvas label="Induction domino chain">
          <DominoInductionScene first={first} last={last} reached={reached} base={base} bridge={bridge} />
        </Activity.Canvas>
        <Activity.Inspector label="Build the argument">
          <Activity.InspectorSection>
            <Segmented
              value={mode}
              onChange={setMode}
              ariaLabel="induction mode"
              options={[
                { value: 'build', label: 'Build proof' },
                { value: 'sabotage', label: 'Find the gap' },
              ]}
            />
            <div className="proof-step-actions">
              <ActionButton pressed={base} onClick={() => setBase((value) => !value)}>
                Base case P({first})
              </ActionButton>
              <ActionButton pressed={bridge} onClick={() => setBridge((value) => !value)}>
                General k → k + 1 bridge
              </ActionButton>
            </div>
            <p className="lab-muted-copy">
              {mode === 'sabotage'
                ? `Remove one part and diagnose what the remaining argument cannot establish. ${inductionDiagnosis(model)}`
                : inductionDiagnosis(model)}
            </p>
          </Activity.InspectorSection>
        </Activity.Inspector>
      </Activity.Workspace>
      <Activity.Feedback>
        <span>Reason</span>
        <div>{inductionDiagnosis(model)}</div>
      </Activity.Feedback>
      <Activity.Transport>
        <IconButton label="Reset induction proof" onClick={reset}>
          <RotateCcw aria-hidden="true" />
        </IconButton>
        <div className="lab-transport-state">
          <strong>{complete ? 'Induction complete' : 'Construct both obligations'}</strong>
          <span>
            {reached.size} of {last - first + 1} cases justified
          </span>
        </div>
      </Activity.Transport>
    </Activity.Root>
  );
}
