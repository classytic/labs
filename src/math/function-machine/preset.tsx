'use client';

/**
 * Function machine, a "predict the rule" interactive (Brilliant-style), built
 * on @classytic/stage: inputs → outputs with index-matched connectors, a rule
 * chip, multiple-choice rules, and a Check that reports to the learner seam. A
 * GENERAL tool: a creator passes any inputs/outputs/choices/answer.
 */

import { useState, type ReactNode } from 'react';
import { Stage, Label, Segment, Polygon, type Vec2 } from '@classytic/stage';
import { Chip, CheckButton, StatusPill } from '../../kit/controls.js';
import { Activity } from '../../kit/activity.js';
import { useCheckpoint } from '../../kit/pedagogy.js';

export interface FunctionMachineProps {
  prompt?: string;
  inputs: (string | number)[];
  outputs: (string | number)[];
  choices: string[];
  answer: string;
  height?: number;
}

function rect(x0: number, y0: number, x1: number, y1: number): Vec2[] {
  return [
    { x: x0, y: y0 },
    { x: x1, y: y0 },
    { x: x1, y: y1 },
    { x: x0, y: y1 },
  ];
}

export function FunctionMachineLab({
  prompt = 'Which rule produces these outputs?',
  inputs,
  outputs,
  choices,
  answer,
  height = 340,
}: FunctionMachineProps): ReactNode {
  const [sel, setSel] = useState<string | null>(null);
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null);

  useCheckpoint({ solved: result === 'correct', activity: `predict-rule-${answer}`, response: sel ?? '' });

  const n = Math.max(inputs.length, outputs.length);
  const ys = n === 1 ? [0] : Array.from({ length: n }, (_, i) => 2.3 - (4.6 * i) / (n - 1));
  const glow =
    result === 'correct'
      ? 'var(--stage-good)'
      : result === 'wrong'
        ? 'var(--stage-danger)'
        : 'var(--stage-accent)';

  const check = (): void => {
    const ok = sel === answer;
    setResult(ok ? 'correct' : 'wrong');
  };

  const figure = (
    <>
      <Stage view={{ xMin: -7, xMax: 7, yMin: -3.6, yMax: 4.4 }} height={height} ariaLabel={prompt}>
        <Polygon
          points={rect(-3.2, -3, 3.2, 3)}
          color="transparent"
          fill={glow}
          fillOpacity={0.14}
          weight={0}
        />
        <Polygon
          points={rect(-1.5, 3.3, 1.5, 4.2)}
          color={glow}
          fill={glow}
          fillOpacity={0.28}
          weight={1.5}
        />
        <Label x={0} y={3.75} text={sel ?? '?'} size={14} color="var(--stage-fg)" />
        <Polygon
          points={rect(-6, -3, -3.4, 3)}
          color="var(--stage-muted)"
          fill="var(--stage-bg)"
          fillOpacity={0.5}
          weight={1.5}
        />
        <Polygon
          points={rect(3.4, -3, 6, 3)}
          color="var(--stage-muted)"
          fill="var(--stage-bg)"
          fillOpacity={0.5}
          weight={1.5}
        />
        <Label x={-4.7} y={3.35} text="inputs" size={11} color="var(--stage-muted)" />
        <Label x={4.7} y={3.35} text="outputs" size={11} color="var(--stage-muted)" />
        {ys.map((y, i) => (
          <g key={i}>
            {inputs[i] != null && <Label x={-4.7} y={y} text={String(inputs[i])} size={15} />}
            {outputs[i] != null && <Label x={4.7} y={y} text={String(outputs[i])} size={15} />}
            {inputs[i] != null && outputs[i] != null && (
              <Segment from={{ x: -3.4, y }} to={{ x: 3.4, y }} color={glow} weight={2} dashed />
            )}
          </g>
        ))}
      </Stage>
    </>
  );

  const controls = (
    <div className="lab-activity-fields">
      <div className="lab-choice-grid">
        {choices.map((ch) => (
          <Chip
            key={ch}
            selected={sel === ch}
            onClick={() => {
              setSel(ch);
              setResult(null);
            }}
          >
            {ch}
          </Chip>
        ))}
      </div>
      <CheckButton onClick={check} disabled={!sel}>
        Check
      </CheckButton>
      {result === 'correct' && <StatusPill ok>✓ Correct!</StatusPill>}
      {result === 'wrong' && <StatusPill ok={false}>Not quite, try another rule</StatusPill>}
    </div>
  );

  return (
    <Activity.Root className="math-function-machine-activity" focusLayout="compact">
      <Activity.Header>
        <Activity.Heading eyebrow="Functions" title="Discover the rule" description={prompt} />
        <Activity.FocusButton />
      </Activity.Header>
      <Activity.Status>
        <strong>
          {result === 'correct'
            ? 'Rule found'
            : result === 'wrong'
              ? 'Try another rule'
              : 'Compare the pairs'}
        </strong>
        <span>{n} input–output pairs</span>
      </Activity.Status>
      <Activity.Workspace>
        <Activity.Canvas label="Function machine mapping">{figure}</Activity.Canvas>
        <Activity.Inspector label="Rule choices">{controls}</Activity.Inspector>
      </Activity.Workspace>
      <Activity.Feedback>
        <span>Observe</span>
        <div>A valid function rule must transform every shown input into its paired output.</div>
      </Activity.Feedback>
      <Activity.LiveRegion>
        {result === 'correct'
          ? 'Correct.'
          : result === 'wrong'
            ? 'Incorrect, try again.'
            : 'Choose a rule, then check it.'}
      </Activity.LiveRegion>
      <Activity.Transport>
        <div className="lab-transport-state">
          <strong>{result === 'correct' ? 'Rule confirmed' : 'Test one rule'}</strong>
          <span>{sel ?? 'No rule selected'}</span>
        </div>
      </Activity.Transport>
    </Activity.Root>
  );
}
