'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { RotateCcw } from 'lucide-react';
import { guaranteedOccupancy, minForOccupancy } from '../core/pigeonhole.js';
import { Activity } from '../../kit/activity.js';
import { ActionButton, IconButton, Stepper } from '../../kit/controls.js';
import { Field } from '../../kit/frame.js';
import { useCheckpoint } from '../../kit/pedagogy.js';
import { PigeonholePackingScene } from '../visuals/index.js';

export interface PigeonholeAdversaryProps {
  holes?: number;
  targetOccupancy?: number;
  labels?: string[];
  title?: string;
  prompt?: string;
}

export function PigeonholeAdversaryLab({
  holes: initialHoles = 4,
  targetOccupancy: initialTarget = 2,
  labels,
  title = 'Can the adversary avoid a match?',
  prompt = 'Place one item at a time. The adversary spreads them as evenly as possible until a crowded category is unavoidable.',
}: PigeonholeAdversaryProps): ReactNode {
  const [holes, setHoles] = useState(Math.max(2, initialHoles));
  const [target, setTarget] = useState(Math.max(2, initialTarget));
  const [dealt, setDealt] = useState(0);
  const threshold = minForOccupancy(holes, target);
  const occupancy = useMemo(
    () =>
      Array.from(
        { length: holes },
        (_, index) => Math.floor(dealt / holes) + (index < dealt % holes ? 1 : 0),
      ),
    [dealt, holes],
  );
  const forced = guaranteedOccupancy(dealt, holes) >= target;
  useCheckpoint({ solved: forced, activity: `pigeonhole:${holes}:${target}` });

  const reset = (): void => setDealt(0);
  const changeHoles = (value: number): void => {
    setHoles(value);
    setDealt(0);
  };
  const changeTarget = (value: number): void => {
    setTarget(value);
    setDealt(0);
  };

  return (
    <Activity.Root className="discrete-pigeonhole-activity" focusLayout="compact">
      <Activity.Header>
        <Activity.Heading eyebrow="Extremal reasoning" title={title} description={prompt} />
        <Activity.FocusButton />
      </Activity.Header>
      <Activity.Status>
        <strong>{forced ? 'Collision forced' : 'Adversary can still avoid it'}</strong>
        <span>{dealt} placed</span>
        <span>guarantee at {threshold}</span>
      </Activity.Status>
      <Activity.Workspace>
        <Activity.Canvas label="Items distributed among categories">
          <PigeonholePackingScene occupancy={occupancy} target={target} labels={labels} />
        </Activity.Canvas>
        <Activity.Inspector label="Guarantee controls">
          <Activity.InspectorSection>
            <div className="lab-activity-fields">
              <Field label="categories">
                <Stepper value={holes} onChange={changeHoles} min={2} max={8} />
              </Field>
              <Field label="force at least">
                <Stepper value={target} onChange={changeTarget} min={2} max={5} />
              </Field>
              <div className="proof-law">
                <span className="lab-field-label">worst-case threshold</span>
                <strong>
                  {holes} × ({target} − 1) + 1 = {threshold}
                </strong>
                <span>Every category can hold {target - 1} first. The next item removes every escape.</span>
              </div>
            </div>
          </Activity.InspectorSection>
        </Activity.Inspector>
      </Activity.Workspace>
      <Activity.Feedback>
        <span>{forced ? 'Forced' : 'Notice'}</span>
        <div>
          {forced
            ? `At ${dealt}, some category must contain at least ${target}.`
            : `Balanced placement is the adversary’s best defence; likelihood is irrelevant to this guarantee.`}
        </div>
      </Activity.Feedback>
      <Activity.Transport>
        <IconButton label="Reset distribution" onClick={reset}>
          <RotateCcw aria-hidden="true" />
        </IconButton>
        <div className="lab-transport-state">
          <strong>{forced ? 'Guarantee proved' : `${threshold - dealt} until forced`}</strong>
          <span>
            {dealt} of {threshold}
          </span>
        </div>
        <ActionButton onClick={() => setDealt((value) => Math.min(threshold, value + 1))} disabled={forced}>
          Place next item
        </ActionButton>
      </Activity.Transport>
      <Activity.LiveRegion>
        {forced
          ? `A group of ${target} is now guaranteed.`
          : `${dealt} items distributed as evenly as possible.`}
      </Activity.LiveRegion>
    </Activity.Root>
  );
}
