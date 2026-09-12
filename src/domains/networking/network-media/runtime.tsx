'use client';

/**
 * NetworkMediaLab — choosing a medium by ruling things out, not by comparing feature lists.
 *
 * The usual presentation is a table of speeds and distances, which produces students who can
 * recite that fibre is faster and still reach for copper across a factory. Real choices are made
 * by ELIMINATION: distance kills copper across a campus, interference kills it beside machinery,
 * and anything that moves kills every cable at once, before speed or price are even discussed.
 *
 * So the lab is scenario-first. Each medium reports whether it is ruled out and by what, and the
 * drawing shows the mechanism responsible rather than restating the verdict.
 */

import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { Chip } from '../../../kit/controls.js';
import { LiveRegion } from '../../../kit/frame.js';
import {
  AuthoredActivityRuntime,
  type AuthoredActivityContext,
} from '../../../kit/authored-activity-runtime.js';
import type { AuthoredActivity } from '../../../kit/activity-authoring.js';
import { MediaScene } from '../../../networking/MediaScene.js';
import { MEDIA, SCENARIOS, ruleOut, type MediumId } from '../../../networking/media.js';

export interface NetworkMediaProps {
  scenario?: string;
  medium?: MediumId;
  title?: string;
  prompt?: string;
}

const MEDIA_ACTIVITY: AuthoredActivity = {
  pattern: 'diagnosis',
  title: 'Pick the medium the situation allows',
  objectives: [
    'Name what physically carries the signal in copper, fibre and radio',
    'Rule copper out on distance, and separately on electrical interference',
    'Explain why light is unaffected by interference that ruins a voltage',
    'Explain what is given up by using a shared, overhearable medium',
  ],
  success: [
    {
      id: 'noise-prediction',
      source: 'answer',
      key: 'why-fibre',
      pendingLabel: 'Predict why fibre survives beside heavy machinery.',
    },
    { id: 'compared', source: 'action', key: 'switch-medium', pendingLabel: 'Look at all three media.' },
    {
      id: 'shared',
      source: 'answer',
      key: 'radio-cost',
      pendingLabel: 'Say what a shared medium costs you.',
    },
  ],
  questions: [
    {
      id: 'why-fibre',
      prompt:
        'A 60 m run passes close to large motors. Copper would reach that far easily, yet fibre is chosen. Why?',
      choices: [
        {
          value: 'faster',
          label: 'Fibre is faster',
          feedback: 'True in general and not the reason here: 60 m of copper carries this link comfortably.',
        },
        { value: 'light', label: 'Light carries no current, so the motors cannot induce anything into it' },
        { value: 'thinner', label: 'Fibre is thinner and easier to install' },
      ],
      answer: 'light',
      explain:
        'Motors radiate changing magnetic fields, which induce a voltage in nearby copper and corrupt the signal. A glass core carries photons, and there is nothing for that field to push on.',
    },
    {
      id: 'radio-cost',
      prompt: 'Radio needs no cable at all. What is given up in exchange?',
      choices: [
        { value: 'speed', label: 'Nothing important, it is simply more convenient' },
        {
          value: 'shared',
          label: 'The medium is shared and public: everyone in range competes for it and can hear it',
        },
        { value: 'distance', label: 'Only distance' },
      ],
      answer: 'shared',
      explain:
        'A cable is a private channel between two ends. Air is not: every device in range shares the capacity and receives every transmission, which is why wireless needs encryption where a cable does not.',
    },
  ],
  steps: [
    {
      id: 'predict',
      phase: 'predict',
      title: 'Why does fibre win here?',
      lead: 'The factory run is well within copper’s reach, and fibre is still the answer. Decide why first.',
      success: 'noise-prediction',
    },
    {
      id: 'act',
      phase: 'act',
      title: 'Look at all three',
      lead: 'Switch between the media and watch what actually carries the signal in each.',
      controls: true,
      success: 'compared',
    },
    {
      id: 'observe',
      phase: 'observe',
      title: 'Change the situation',
      lead: 'Move through the scenarios. Watch which media get ruled out, and by what.',
      controls: true,
    },
    {
      id: 'explain',
      phase: 'explain',
      title: 'Elimination, not comparison',
      lead: 'Distance, interference and movement each rule things out before speed is ever considered.',
      controls: true,
    },
    {
      id: 'transfer',
      phase: 'transfer',
      title: 'The cost of no cable',
      lead: 'Radio removes the cable. Decide what it removes along with it.',
      controls: true,
      success: 'shared',
    },
  ],
};

export function NetworkMediaLab({
  scenario = 'factory',
  medium = 'copper',
  title,
  prompt,
}: NetworkMediaProps = {}): ReactNode {
  const [situation, setSituation] = useState(
    () => SCENARIOS.find((item) => item.id === scenario) ?? SCENARIOS[0]!,
  );
  const [current, setCurrent] = useState<MediumId>(medium);
  const [seen, setSeen] = useState<Set<MediumId>>(() => new Set([medium]));

  const active = MEDIA.find((item) => item.id === current)!;
  const verdict = useMemo(() => ruleOut(active, situation), [active, situation]);

  const pick = useCallback((id: MediumId, context: AuthoredActivityContext) => {
    setCurrent(id);
    setSeen((current) => {
      const next = new Set(current).add(id);
      if (next.size === MEDIA.length) context.complete('compared');
      return next;
    });
  }, []);

  const headline = verdict
    ? `${active.label} is ruled out here: ${verdict}.`
    : `${active.label} works here. It carries ${active.carrier}.`;

  return (
    <AuthoredActivityRuntime
      activity={MEDIA_ACTIVITY}
      activityId="network-media"
      eyebrow="Physical layer"
      title={title ?? 'Copper, glass, or air'}
      description={
        prompt ??
        'Three ways to move a signal, and three different things that stop them. The choice is made by elimination long before anyone compares speeds.'
      }
      status={
        <>
          <span>
            <strong>{active.label}</strong>
          </span>
          <span>
            {situation.metres} m{situation.noisy ? ' · noisy' : ''}
            {situation.mustMove ? ' · moving' : ''}
          </span>
          <span data-delivered={!verdict || undefined}>{verdict ? 'ruled out' : 'usable'}</span>
        </>
      }
      inspector={(context) => (
        <>
          <div className="network-inspector-heading">
            <div>
              <span>The situation</span>
              <strong>{situation.need}</strong>
            </div>
            <span>{situation.metres} m</span>
          </div>
          <div className="lab-activity-fields">
            {SCENARIOS.map((item) => (
              <Chip key={item.id} selected={situation.id === item.id} onClick={() => setSituation(item)}>
                {item.need}
              </Chip>
            ))}
          </div>
          <ul className="lab-metric-list">
            {MEDIA.map((item) => {
              const why = ruleOut(item, situation);
              return (
                <li key={item.id}>
                  <span>{item.label}</span>
                  <strong data-delivered={!why || undefined}>{why ? `no: ${why}` : 'usable'}</strong>
                </li>
              );
            })}
          </ul>
          <div className="lab-activity-fields">
            {MEDIA.map((item) => (
              <Chip key={item.id} selected={current === item.id} onClick={() => pick(item.id, context)}>
                {item.label}
              </Chip>
            ))}
          </div>
          <p className="lab-note">{active.note}</p>
          <LiveRegion>{headline}</LiveRegion>
        </>
      )}
      observation={situation.best === current ? `${headline} ${situation.why}` : headline}
    >
      <MediaScene
        medium={current}
        noisy={situation.noisy}
        label={`${active.label}: the signal is ${active.carrier}. ${headline}`}
      />
    </AuthoredActivityRuntime>
  );
}

export default NetworkMediaLab;
