'use client';

/**
 * BinomialDistributionLab, the bridge from counting to the bell. P(X=k successes
 * in n trials) = C(n,k)·pᵏ·(1−p)ⁿ⁻ᵏ, drawn as bars you can interrogate: click a bar
 * and the formula DERIVES itself, k successes happen C(n,k) ways (the Pascal /
 * counting number), each way has probability pᵏ for the successes times (1−p)ⁿ⁻ᵏ for
 * the failures. Slide p to watch it skew and (at ½) turn symmetric; slide n and flip
 * on the normal overlay to watch the binomial become the Galton-board bell. Mean np
 * and σ = √(np(1−p)) are marked.
 *
 * One lab ties together Pascal (the coefficients), the counting labs (the C(n,k)),
 * and the normal distribution (the limit). Values from the nCr kernel.
 */

import { useMemo, useState, type ReactNode } from 'react';
import { nCr } from '../core/combinatorics.js';
import { Tex } from '../../core/tex.js';
import { ActionButton, Chip, Slider, Stepper, CheckButton, StatusPill } from '../../kit/controls.js';
import { Field, Readout } from '../../kit/frame.js';
import { Activity } from '../../kit/activity.js';
import { useHints, HintLadder, useCheckpoint } from '../../kit/pedagogy.js';
import { useControlSurface } from '@classytic/stage';

export interface BinomialProps {
  n?: number;
  p?: number;
  showNormal?: boolean;
  title?: string;
  prompt?: string;
  objectives?: string[];
  hints?: string[];
  controlId?: string;
}

const W = 540,
  H = 300,
  ML = 30,
  MR = 14,
  MT = 16,
  MB = 34;
const PW = W - ML - MR,
  PH = H - MT - MB;
const ACC = 'var(--stage-accent)',
  GOOD = 'var(--stage-good)';
const f3 = (x: number): string => (x < 0.0005 ? x.toExponential(1) : x.toFixed(3));

export function BinomialDistributionLab({
  n: n0 = 10,
  p: p0 = 0.5,
  showNormal: sn0 = false,
  title = 'Binomial distribution',
  prompt,
  objectives,
  hints: hintList,
  controlId,
}: BinomialProps): ReactNode {
  const [n, setN] = useState(n0);
  const [p, setP] = useState(p0);
  const [normal, setNormal] = useState(sn0);
  const [sel, setSel] = useState<number | null>(null);
  const [guess, setGuess] = useState(0);
  const [checked, setChecked] = useState(false);
  const hints = useHints(hintList);

  const probs = useMemo(
    () => Array.from({ length: n + 1 }, (_, k) => nCr(n, k) * p ** k * (1 - p) ** (n - k)),
    [n, p],
  );
  const mean = n * p,
    variance = n * p * (1 - p),
    sd = Math.sqrt(variance);
  const maxProbability = Math.max(...probs);
  const modes = probs.flatMap((probability, index) =>
    Math.abs(probability - maxProbability) < 1e-12 ? [index] : [],
  );
  const npdf = (x: number): number =>
    variance > 0 ? Math.exp(-((x - mean) ** 2) / (2 * variance)) / Math.sqrt(2 * Math.PI * variance) : 0;
  const yMax = Math.max(...probs, normal ? npdf(mean) : 0) * 1.1 || 1;

  const colW = PW / (n + 1);
  const xOf = (k: number): number => ML + (k + 0.5) * colW;
  const yOf = (v: number): number => MT + PH - (v / yMax) * PH;
  const barW = Math.min(40, colW * 0.74);

  const solved = checked && modes.includes(guess);
  useCheckpoint({ solved, activity: `binomial:${title}`, hintsUsed: hints.count });

  useControlSurface(controlId, {
    n: {
      type: 'number',
      label: 'trials n',
      min: 1,
      max: 24,
      step: 1,
      get: () => n,
      set: (v) => {
        setN(Math.round(v));
        setChecked(false);
      },
    },
    p: { type: 'number', label: 'success prob p', min: 0, max: 1, step: 0.01, get: () => p, set: setP },
    normal: { type: 'boolean', label: 'normal overlay', get: () => normal, set: setNormal },
    inspect: {
      type: 'number',
      label: 'inspect k (−1 clears)',
      min: -1,
      max: n,
      step: 1,
      get: () => sel ?? -1,
      set: (v) => setSel(v < 0 ? null : Math.round(v)),
    },
  });

  const ticks =
    n <= 16
      ? Array.from({ length: n + 1 }, (_, k) => k)
      : Array.from({ length: n + 1 }, (_, k) => k).filter((k) => k % 2 === 0);
  const figure = (
    <div className="probability-chart-scene">
      <svg
        className="probability-chart-svg"
        viewBox={`0 0 ${W} ${H}`}
        role="group"
        aria-label={`binomial n ${n} p ${p}, most likely ${modes.join(' and ')}`}
      >
        {/* bars */}
        {probs.map((pr, k) => {
          const on = sel === k;
          return (
            <g
              key={k}
              className="probability-chart-column"
              role="button"
              tabIndex={0}
              aria-label={`inspect ${k} successes, probability ${f3(pr)}`}
              aria-pressed={on}
              onClick={() => setSel(on ? null : k)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  setSel(on ? null : k);
                }
              }}
            >
              <rect x={xOf(k) - colW / 2} y={MT} width={colW} height={PH} fill="transparent" />
              <rect
                x={xOf(k) - barW / 2}
                y={yOf(pr)}
                width={barW}
                height={Math.max(0, MT + PH - yOf(pr))}
                rx={3}
                fill={on ? GOOD : `color-mix(in oklab, ${ACC} 78%, transparent)`}
              />
              {(n <= 16 || on) && (
                <text x={xOf(k)} y={yOf(pr) - 3} textAnchor="middle" fontSize={9} fill="var(--stage-muted)">
                  {(pr * 100).toFixed(pr < 0.1 ? 1 : 0)}
                </text>
              )}
            </g>
          );
        })}
        {/* axis + k labels */}
        <line x1={ML} y1={MT + PH} x2={W - MR} y2={MT + PH} stroke="var(--stage-fg)" strokeWidth={1.5} />
        {ticks.map((k) => (
          <text
            key={k}
            x={xOf(k)}
            y={MT + PH + 14}
            textAnchor="middle"
            fontSize={10}
            fill="var(--stage-muted)"
          >
            {k}
          </text>
        ))}
        {/* mean marker */}
        <line
          x1={xOf(mean)}
          y1={MT}
          x2={xOf(mean)}
          y2={MT + PH}
          stroke={GOOD}
          strokeWidth={1.5}
          strokeDasharray="4 3"
        />
        <text x={xOf(mean)} y={MT + 9} textAnchor="middle" fontSize={10} fontWeight={700} fill={GOOD}>
          μ={mean.toFixed(1)}
        </text>
        {/* normal overlay */}
        {normal && variance > 0 && (
          <polyline
            points={Array.from({ length: 121 }, (_, i) => {
              const x = -0.5 + (i / 120) * (n + 1);
              return `${(ML + (x + 0.5) * colW).toFixed(1)},${yOf(npdf(x)).toFixed(1)}`;
            }).join(' ')}
            fill="none"
            stroke="var(--stage-warn)"
            strokeWidth={2.5}
            strokeDasharray="6 4"
          />
        )}
      </svg>
    </div>
  );

  const aside = (
    <>
      <Readout
        label={modes.length > 1 ? 'equally most likely' : 'most likely'}
        value={modes.join(', ')}
        sub={
          <>
            <Tex tex={`\\mu = np = ${mean.toFixed(2)}`} /> · <Tex tex={`\\sigma = ${sd.toFixed(2)}`} />
          </>
        }
      />
      <div className="probability-equation">
        <Tex tex={'P(X=k)=\\binom{n}{k}p^{k}(1-p)^{n-k}'} />
      </div>
      {sel != null ? (
        <div className="probability-inspector" data-tone="success">
          <b>
            P(X={sel}) = {f3(probs[sel]!)}
          </b>
          <span>
            <Tex
              tex={`= \\binom{${n}}{${sel}} \\cdot ${p}^{${sel}} \\cdot ${(1 - p).toFixed(2)}^{${n - sel}}`}
            />
          </span>
          <span className="discrete-muted">
            = {nCr(n, sel)} ways × (each {f3(p ** sel * (1 - p) ** (n - sel))})
          </span>
        </div>
      ) : (
        <div>
          <p className="lab-prompt">🎯 Which number of successes is most likely? Guess, then check.</p>
          <div className="lab-field-row">
            <Field label="most likely k">
              <Stepper
                value={guess}
                onChange={(v) => {
                  setGuess(v);
                  setChecked(false);
                }}
                min={0}
                max={n}
                label="most likely k"
              />
            </Field>
            <CheckButton onClick={() => setChecked(true)}>Check</CheckButton>
            {checked && (
              <StatusPill ok={modes.includes(guess)}>
                {modes.includes(guess) ? `✓ ${guess}` : `it's ${modes.join(' or ')}`}
              </StatusPill>
            )}
          </div>
        </div>
      )}
    </>
  );

  const controls = (
    <div className="lab-activity-fields">
      <Field label="trials n" value={n}>
        <Slider
          value={n}
          min={1}
          max={24}
          step={1}
          onChange={(v) => {
            setN(v);
            setChecked(false);
          }}
          ariaLabel="trials"
        />
      </Field>
      <Field label="success p" value={p.toFixed(2)}>
        <Slider value={p} min={0} max={1} step={0.01} onChange={setP} ariaLabel="success probability" />
      </Field>
      <Field label="normal">
        <Chip selected={normal} onClick={() => setNormal((v) => !v)}>
          bell overlay
        </Chip>
      </Field>
      {sel != null && <ActionButton onClick={() => setSel(null)}>clear inspection</ActionButton>}
    </div>
  );

  const footer = (
    <>
      <p className="lab-prompt discrete-prompt-muted">
        Coefficients are Pascal's row n; at p = ½ it's that row ÷ 2ⁿ. Crank n with the bell overlay → the
        binomial becomes the normal (the Galton board).
      </p>
      <HintLadder hints={hints} />
    </>
  );

  return (
    <Activity.Root className="discrete-binomial-activity">
      <Activity.Header>
        <Activity.Heading
          eyebrow="Discrete distributions"
          title={title}
          description={
            prompt ??
            'Change the number of trials and success probability, then inspect how counting determines every bar.'
          }
        />
        <Activity.FocusButton />
      </Activity.Header>
      <Activity.Status>
        <strong>{modes.length > 1 ? 'tied modes' : `mode ${modes[0]}`}</strong>
        <span>n {n}</span>
        <span>p {p.toFixed(2)}</span>
        <span>μ {mean.toFixed(2)}</span>
      </Activity.Status>
      <Activity.Workspace>
        <Activity.Canvas label="Binomial probability distribution">{figure}</Activity.Canvas>
        <Activity.Inspector label="Distribution evidence and parameters">
          {aside}
          {controls}
        </Activity.Inspector>
      </Activity.Workspace>
      <Activity.Feedback>
        <span>Observe</span>
        <div>
          {sel != null
            ? `${nCr(n, sel)} equally likely arrangements contribute to P(X=${sel}); the powers account for ${sel} successes and ${n - sel} failures.`
            : normal
              ? 'As n grows away from boundary probabilities, the discrete bars approach the normal overlay.'
              : 'At p = 0.5 the distribution mirrors Pascal’s coefficients; moving p shifts and skews the mass.'}
        </div>
      </Activity.Feedback>
      <section className="lab-authored-task" aria-label="Explain the binomial distribution">
        {footer}
      </section>
      <Activity.LiveRegion>
        Binomial with {n} trials and success probability {p.toFixed(2)}. Mean {mean.toFixed(2)}, standard
        deviation {sd.toFixed(2)}, most likely successes {modes.join(' and ')}
        {sel != null ? `; selected probability P of ${sel} is ${f3(probs[sel]!)}` : ''}.
      </Activity.LiveRegion>
      <Activity.Transport>
        <div className="lab-transport-state" aria-live="polite">
          <strong>
            {solved ? 'Mode identified' : sel != null ? `Inspecting k = ${sel}` : 'Choose or predict a bar'}
          </strong>
          <span>σ {sd.toFixed(2)}</span>
        </div>
        {sel != null ? (
          <ActionButton className="lab-primary-action" onClick={() => setSel(null)}>
            Clear inspection
          </ActionButton>
        ) : null}
      </Activity.Transport>
    </Activity.Root>
  );
}
