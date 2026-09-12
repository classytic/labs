'use client';

/**
 * DiffusionLab, two gases, one box: the `particles` core made tangible. The two
 * particle populations start on opposite sides; press Play and they random-walk into a
 * uniform mix, diffusion, and why it never spontaneously un-mixes. Hotter (faster)
 * particles mix sooner. SceneDoc + particles sim + the diffusion asset (sim ≠ render).
 */

import { useMemo, useState, type ReactNode } from 'react';
import { Scene, registerAsset, type SceneDoc } from '@classytic/stage';
import { Field } from '../../kit/frame.js';
import { Slider } from '../../kit/controls.js';
import { AuthoredActivityRuntime } from '../../kit/authored-activity-runtime.js';
import { Button } from '@/components/ui/button';
import type { AuthoredActivity } from '../../kit/activity-authoring.js';
import { DIFFUSION_ASSET } from './asset.js';

registerAsset('diffusion', DIFFUSION_ASSET);

const W = 12,
  H = 6;

const QUESTIONS: NonNullable<AuthoredActivity['questions']> = [
  {
    id: 'unmix',
    prompt:
      'Once the two gases are fully mixed, can they spontaneously separate back to opposite sides on their own?',
    kind: 'choice',
    choices: [
      { value: 'no', label: 'No: mixing is one-way' },
      { value: 'wait', label: 'Yes, if you wait long enough' },
      { value: 'cool', label: 'Only if you cool it' },
    ],
    answer: 'no',
    explain:
      'There are overwhelmingly more mixed arrangements than separated ones, so random motion never un-mixes by itself (entropy increases).',
  },
  {
    id: 'temp',
    prompt: 'Raising the temperature (particle speed) makes the gases mix…',
    kind: 'choice',
    choices: [
      { value: 'faster', label: 'faster' },
      { value: 'slower', label: 'slower' },
      { value: 'same', label: 'no change' },
    ],
    answer: 'faster',
    explain: 'Faster particles travel and collide more, so the uniform mix is reached sooner.',
  },
];
const ACTIVITY: AuthoredActivity = {
  pattern: 'investigation',
  title: 'Diffusion: why things mix',
  objectives: ['Explain diffusion as random motion', 'Relate particle speed to mixing time'],
  steps: [
    {
      id: 'predict',
      phase: 'predict',
      title: 'Predict whether gases unmix',
      lead: 'Commit before running the particle model.',
      success: 'unmix',
    },
    {
      id: 'act',
      phase: 'act',
      title: 'Mix the gases',
      lead: 'Run the scene and compare temperatures and particle counts.',
      controls: true,
      reveal: ['model'],
    },
    {
      id: 'explain',
      phase: 'explain',
      title: 'Explain temperature',
      lead: 'Connect particle speed to mixing time.',
      success: 'temperature',
    },
  ],
  questions: QUESTIONS,
  success: [
    { id: 'unmix', source: 'answer', key: 'unmix', operator: 'eq', value: 'no' },
    { id: 'temperature', source: 'answer', key: 'temp', operator: 'eq', value: 'faster' },
  ],
};

export interface DiffusionProps {
  title?: string;
  prompt?: string;
  objectives?: string[];
  activity?: AuthoredActivity;
}

export function DiffusionLab({
  title = 'Diffusion: why things mix',
  prompt = 'Two gases start on opposite sides of a box. Press Play: random collisions spread them into a uniform mix, and it never un-mixes on its own.',
  objectives = [
    'See diffusion as random motion, not a force',
    'Watch two gases mix to uniform (the "mixed %" climbs)',
    'Hotter (faster) particles mix sooner',
  ],
  activity = ACTIVITY,
}: DiffusionProps = {}): ReactNode {
  const runtimeActivity = activity === ACTIVITY ? { ...activity, objectives } : activity;
  const [speed, setSpeed] = useState(3);
  const [n, setN] = useState(120);
  const [resetN, setResetN] = useState(0);

  const doc = useMemo<SceneDoc>(
    () => ({
      schemaVersion: 2,
      type: 'stage-scene',
      // crop to the box plus a margin, with a band under it for the legend + mixed readout
      view: { xMin: -0.25, xMax: W + 0.25, yMin: -1.15, yMax: H + 0.3 },
      elements: [
        {
          id: 'fig',
          kind: 'asset',
          def: {
            op: 'asset',
            asset: 'diffusion',
            params: { w: W, h: H },
            bind: {},
            simBind: {
              px: { sim: 'g', field: 'px' },
              py: { sim: 'g', field: 'py' },
              group: { sim: 'g', field: 'group' },
              mixed: { sim: 'g', field: 'mixed' },
            },
          },
        },
      ],
      bindings: [],
      meta: {
        sims: [
          {
            id: 'g',
            core: 'particles',
            params: { n, box: { w: W, h: H }, speed, split: true, seed: 1 + resetN },
            drives: {},
          },
        ],
      },
    }),
    [n, speed, resetN],
  );

  const controls = (
    <>
      <Field label="temperature (speed)" value={`${speed.toFixed(1)}`}>
        <Slider value={speed} min={1} max={6} step={0.5} onChange={setSpeed} ariaLabel="temperature" />
      </Field>
      <Field label="particles" value={`${n}`}>
        <Slider value={n} min={40} max={200} step={20} onChange={setN} ariaLabel="particle count" />
      </Field>
      <Field label="reset">
        <Button type="button" variant="outline" size="sm" onClick={() => setResetN((k) => k + 1)}>
          ↻ re-separate
        </Button>
      </Field>
    </>
  );

  return (
    <AuthoredActivityRuntime
      focusLayout="immersive"
      activity={runtimeActivity}
      activityId="diffusion"
      eyebrow="Particles and matter"
      title={title}
      description={prompt}
      status={
        <>
          <span>speed {speed.toFixed(1)}</span>
          <span>{n} particles</span>
        </>
      }
      controls={controls}
      observation={
        <>Random motion spreads both gases through the available volume; faster particles mix sooner.</>
      }
      transcript={
        <p>
          Two groups of {n} total particles diffuse in one box at speed setting {speed.toFixed(1)}.
        </p>
      }
    >
      <Scene
        key={`${n}:${speed}:${resetN}`}
        doc={doc}
        interactive={false}
        showGrid={false}
        showAxes={false}
        ariaLabel="Two gases diffusing and mixing in a box"
      />
    </AuthoredActivityRuntime>
  );
}
