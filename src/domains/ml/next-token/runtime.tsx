'use client';

/**
 * NextTokenLab — the mechanism shared by a language model and a modern recommender.
 *
 * Netflix's 2025 foundation model treats a viewing history as a sentence: each play or rewatch is
 * a token, and one autoregressive model predicts the next one. That replaced hundreds of
 * specialised recommenders. So "predict the next item" is not a language trick, it is the shape
 * of the whole current generation of systems, and it is worth meeting as arithmetic.
 *
 * The model is an n-gram counter, which is what language models were before neural ones. Every
 * number on screen can be recomputed from the corpus with a pencil, which is exactly the property
 * a student needs before being asked to believe anything about a model with a trillion parameters.
 */

import { useCallback, useMemo, useState, type ReactNode } from 'react';
import {
  useHints,
  HintLadder,
  useCheckpoint,
  useChallenge,
  ChallengeCard,
  type ChallengeQuestion,
} from '../../../kit/pedagogy.js';
import { Field, LiveRegion } from '../../../kit/frame.js';
import { Segmented, Slider, ActionButton } from '../../../kit/controls.js';
import { MLActivity, MLResetTransport } from '../activity.js';
import { DEFAULT_CORPUS, buildModel, distribution } from './model.js';

export interface NextTokenProps {
  corpus?: string[][];
  start?: string[];
  order?: number;
  temperature?: number;
  title?: string;
  prompt?: string;
  objectives?: string[];
  hints?: string[];
  height?: number;
}

const TRANSFER: ChallengeQuestion[] = [
  {
    id: 'temperature-meaning',
    prompt: 'Raising temperature makes a model sound more inventive. What has actually changed?',
    choices: [
      {
        value: 'flatten',
        label: 'the probabilities were flattened, so unlikely tokens get picked more often',
      },
      { value: 'knowledge', label: 'the model learned more during training' },
      { value: 'order', label: 'the ranking of the tokens was reversed' },
    ],
    answer: 'flatten',
    explain:
      'Temperature reshapes the distribution and never reorders it. The favourite stays the favourite; it just stops winning every time, which reads as variety.',
  },
];

const BAR_W = 240;

export function NextTokenLab({
  corpus = DEFAULT_CORPUS,
  start = ['heist'],
  order = 2,
  temperature = 1,
  title = 'Predicting what comes next',
  prompt,
  objectives,
  hints: hintList,
  height = 300,
}: NextTokenProps): ReactNode {
  const source = corpus.length ? corpus : DEFAULT_CORPUS;
  const [orderNow, setOrderNow] = useState(Math.min(2, Math.max(1, order)));
  const [temp, setTemp] = useState(temperature);
  const [sequence, setSequence] = useState<string[]>(() => [...start]);
  const [picks, setPicks] = useState(0);
  const hints = useHints(hintList);
  const challenge = useChallenge(TRANSFER);

  const model = useMemo(() => buildModel(source, orderNow), [source, orderNow]);
  const options = useMemo(() => distribution(model, sequence, temp), [model, sequence, temp]);
  const best = options[0];
  const matched = best?.matched ?? 0;

  useCheckpoint({
    solved: picks >= 3 && challenge.allCorrect,
    activity: `next-token:${title}`,
    hintsUsed: hints.count,
  });

  const step = useCallback((token: string) => {
    setSequence((current) => [...current, token]);
    setPicks((count) => count + 1);
  }, []);

  const figure = (
    // No reserved height. The number of candidate tokens varies with the context, and after a
    // context the corpus only ever continued one way there is a SINGLE bar, which is the point
    // being made. A fixed minimum turned that state into one bar above a large empty panel.
    <div className="ml-interactive-scene">
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14, alignItems: 'center' }}>
        {sequence.map((token, index) => (
          <span
            key={`${token}-${index}`}
            className="lab-chip"
            data-sel={index >= start.length || undefined}
            style={{ fontSize: 13 }}
          >
            {token}
          </span>
        ))}
        <span style={{ opacity: 0.5, fontSize: 18, lineHeight: 1 }}>?</span>
      </div>

      <svg
        viewBox={`0 0 ${BAR_W + 190} ${Math.max(1, options.length) * 28}`}
        style={{ width: '100%', maxWidth: BAR_W + 190, display: 'block' }}
        role="img"
        aria-label={`Next token probabilities: ${options.map((o) => `${o.token} ${(o.p * 100).toFixed(0)} percent`).join(', ')}`}
      >
        {options.map((option, index) => {
          const y = index * 28;
          const width = Math.max(2, option.p * BAR_W);
          return (
            <g key={option.token} onClick={() => step(option.token)} style={{ cursor: 'pointer' }}>
              <text x={0} y={y + 17} fontSize={12} fill="currentColor" fontWeight={index === 0 ? 700 : 400}>
                {option.token}
              </text>
              <rect
                x={92}
                y={y + 5}
                width={width}
                height={16}
                rx={3}
                fill={index === 0 ? 'var(--stage-accent, #6366f1)' : 'var(--stage-wire, #94a3b8)'}
                opacity={index === 0 ? 1 : 0.55}
              />
              <text x={92 + width + 8} y={y + 17} fontSize={11} fill="currentColor" opacity={0.8}>
                {(option.p * 100).toFixed(1)}% · seen {option.count}×
              </text>
            </g>
          );
        })}
      </svg>
      {!options.length && (
        <p style={{ opacity: 0.7 }}>The corpus is empty, so there is nothing to predict from.</p>
      )}
    </div>
  );

  const instruments = (
    <div className="ml-readout">
      <span className="lab-field-label">Context used</span>
      <strong className="ml-score">
        {matched === 0 ? 'none, overall frequency' : `last ${matched} token${matched === 1 ? '' : 's'}`}
      </strong>
      <p className="ml-control-hint">
        {matched < Math.min(orderNow, sequence.length)
          ? 'This exact context never appears in the corpus, so the model backed off to a shorter one rather than giving up.'
          : 'The full context was found in the corpus, so these counts come from real continuations of it.'}
      </p>
      <span className="lab-field-label">How it is computed</span>
      <p className="ml-control-hint">
        Count every time this context appears and record what followed. Divide by the total. That is the whole
        model, and every number above can be checked against the corpus by hand.
      </p>
    </div>
  );

  const controls = (
    <>
      <div className="lab-segmented-field">
        <span className="lab-field-label">Context length</span>
        <Segmented
          ariaLabel="context length"
          value={String(orderNow)}
          onChange={(value: string) => setOrderNow(Number(value))}
          options={[
            { value: '1', label: '1 token' },
            { value: '2', label: '2 tokens' },
          ]}
        />
      </div>
      <Field label="temperature" value={<b>{temp.toFixed(2)}</b>}>
        <Slider value={temp} min={0.1} max={3} step={0.1} onChange={setTemp} ariaLabel="temperature" />
      </Field>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <ActionButton onClick={() => best && step(best.token)} disabled={!best}>
          Take the most likely
        </ActionButton>
        <ActionButton
          className="lab-btn-ghost"
          onClick={() => {
            setSequence([...start]);
            setPicks(0);
          }}
        >
          Clear
        </ActionButton>
      </div>
      <p className="ml-control-hint">
        Click any bar to choose that token yourself. A real model samples from exactly this distribution.
      </p>
    </>
  );

  const reset = (): void => {
    setOrderNow(Math.min(2, Math.max(1, order)));
    setTemp(temperature);
    setSequence([...start]);
    setPicks(0);
    challenge.reset();
  };

  return (
    <MLActivity
      className="ml-next-token"
      eyebrow="Autoregression"
      title={title}
      prompt={
        prompt ??
        'A viewing history is a sentence, and the next show is the next word. Netflix replaced hundreds of models with one that does only this, and so does every language model you have used.'
      }
      status={
        <>
          <strong>next: {best?.token ?? 'nothing'}</strong>
          <span>{best ? `${(best.p * 100).toFixed(1)}%` : ''}</span>
          <span>context {orderNow}</span>
          <span>temp {temp.toFixed(2)}</span>
        </>
      }
      figure={figure}
      instruments={
        <>
          {instruments}
          <LiveRegion>
            {best
              ? `Most likely next token is ${best.token} at ${(best.p * 100).toFixed(1)} percent, from ${best.count} occurrences.`
              : 'No prediction available.'}
          </LiveRegion>
        </>
      }
      controls={controls}
      feedback={
        temp > 1.6
          ? 'At a high temperature the bars have flattened. The favourite is still the favourite, but the model now picks unlikely continuations often, which reads as invention and also as error.'
          : temp < 0.5
            ? 'At a low temperature almost all the probability sits on one token. The output becomes repetitive and safe, which is what a low setting is for.'
            : picks > 0
              ? 'Each pick becomes part of the context for the next one. That loop, run thousands of times, is how a model writes a paragraph.'
              : 'Pick a token and watch the distribution change, because the context has changed.'
      }
      objectives={objectives}
      transport={
        <MLResetTransport
          onReset={reset}
          state={picks >= 3 ? 'Now answer the transfer question' : `Extend the sequence (${picks}/3)`}
          detail={`${sequence.length} tokens · ${options.length} candidates`}
        />
      }
      challenge={
        <ChallengeCard questions={TRANSFER} state={challenge} title="What temperature actually does" />
      }
      support={<HintLadder hints={hints} />}
      canvasLabel="Sequence so far and the probability of each possible next token"
      inspectorLabel="How the prediction was computed"
    />
  );
}

export default NextTokenLab;
