'use client';

import { useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { RotateCcw } from 'lucide-react';
import { Activity } from '../../kit/activity.js';
import { ActionButton, IconButton, Stepper } from '../../kit/controls.js';
import { Field } from '../../kit/frame.js';
import { useCheckpoint } from '../../kit/pedagogy.js';
import { congruent, mod, residuePath } from './core.js';

export interface ModularClockProps {
  modulus?: number;
  start?: number;
  step?: number;
  turns?: number;
  title?: string;
  prompt?: string;
}

export function ModularClockLab({
  modulus: initialModulus = 12,
  start: initialStart = 2,
  step: initialStep = 5,
  turns: initialTurns = 3,
  title = 'Walk the residues, not the number line',
  prompt = 'Apply the same step repeatedly and watch different integers land on the same clock position.',
}: ModularClockProps): ReactNode {
  const [modulus, setModulus] = useState(initialModulus);
  const [start, setStart] = useState(initialStart);
  const [step, setStep] = useState(initialStep);
  const [turns, setTurns] = useState(initialTurns);
  const [visible, setVisible] = useState(0);
  const path = useMemo(() => residuePath(start, step, turns, modulus), [start, step, turns, modulus]);
  const current = path[Math.min(visible, path.length - 1)] ?? mod(start, modulus);
  const complete = visible === path.length - 1;
  useCheckpoint({ solved: complete, activity: `modular-clock:${modulus}:${start}:${step}:${turns}` });
  const reset = (): void => setVisible(0);
  const update =
    (setter: (value: number) => void) =>
    (value: number): void => {
      setter(value);
      setVisible(0);
    };
  return (
    <Activity.Root className="discrete-modular-activity" focusLayout="compact">
      <Activity.Header>
        <Activity.Heading eyebrow="Modular arithmetic" title={title} description={prompt} />
        <Activity.FocusButton />
      </Activity.Header>
      <Activity.Status>
        <strong>
          {start + visible * step} ≡ {current} (mod {modulus})
        </strong>
        <span>
          step {step >= 0 ? '+' : ''}
          {step}
        </span>
        <span>
          {visible}/{turns} moves
        </span>
      </Activity.Status>
      <Activity.Workspace>
        <Activity.Canvas label={`Clock modulo ${modulus}`}>
          <div className="modular-clock" style={{ '--clock-count': modulus } as CSSProperties}>
            {Array.from({ length: modulus }, (_, value) => {
              const angle = (value / modulus) * Math.PI * 2 - Math.PI / 2;
              // Quantize trigonometric output so different JS runtimes produce identical SSR markup.
              const clockX = (50 + 40 * Math.cos(angle)).toFixed(4);
              const clockY = (50 + 40 * Math.sin(angle)).toFixed(4);
              return (
                <span
                  key={value}
                  className="modular-mark"
                  data-current={value === current || undefined}
                  data-start={value === mod(start, modulus) || undefined}
                  data-visited={path.slice(0, visible + 1).includes(value) || undefined}
                  style={
                    {
                      '--clock-x': `${clockX}%`,
                      '--clock-y': `${clockY}%`,
                    } as CSSProperties
                  }
                >
                  {value}
                </span>
              );
            })}
            <div
              className="modular-hand"
              style={{ '--clock-angle': `${(current / modulus) * 360}deg` } as CSSProperties}
            />
            <strong className="modular-centre">
              mod
              <br />
              {modulus}
            </strong>
          </div>
          <div className="modular-trail" aria-label="Residue walk so far">
            {path.slice(0, visible + 1).map((value, index) => (
              <span key={index} data-current={index === visible || undefined}>
                {index > 0 ? <i aria-hidden="true">→</i> : null}
                {value}
              </span>
            ))}
          </div>
        </Activity.Canvas>
        <Activity.Inspector label="Clock rule">
          <Activity.InspectorSection>
            <div className="lab-activity-fields">
              <Field label="modulus">
                <Stepper value={modulus} onChange={update(setModulus)} min={2} max={16} />
              </Field>
              <Field label="start">
                <Stepper value={start} onChange={update(setStart)} min={-20} max={30} />
              </Field>
              <Field label="step">
                <Stepper value={step} onChange={update(setStep)} min={-12} max={12} />
              </Field>
              <Field label="moves">
                <Stepper value={turns} onChange={update(setTurns)} min={1} max={8} />
              </Field>
              <p className="lab-muted-copy">
                Numbers are congruent when their difference is divisible by {modulus}:{' '}
                {congruent(start, current, modulus)
                  ? 'the current pair is congruent.'
                  : 'these positions differ.'}
              </p>
            </div>
          </Activity.InspectorSection>
        </Activity.Inspector>
      </Activity.Workspace>
      <Activity.Feedback>
        <span>Observe</span>
        <div>
          Wrapping changes the representative integer, not its residue class. Negative values wrap by the same
          rule.
        </div>
      </Activity.Feedback>
      <Activity.Transport>
        <IconButton label="Reset clock walk" onClick={reset}>
          <RotateCcw aria-hidden="true" />
        </IconButton>
        <div className="lab-transport-state">
          <strong>{complete ? 'Walk complete' : 'Advance one congruent step'}</strong>
          <span>
            {start + visible * step} maps to {current}
          </span>
        </div>
        <ActionButton onClick={() => setVisible((value) => Math.min(turns, value + 1))} disabled={complete}>
          Add {step}
        </ActionButton>
      </Activity.Transport>
    </Activity.Root>
  );
}
