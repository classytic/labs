'use client';

/**
 * EmbeddingSpaceLab — meaning as geometry, which is the idea the whole modern stack rests on.
 *
 * The most-downloaded model on Hugging Face is not a chatbot. It is all-MiniLM-L6-v2, an 80MB
 * model whose only job is to turn a piece of text into a list of numbers so that similar text
 * lands nearby. Semantic search, RAG and recommendation all run on that one trick, so a student
 * who understands this picture understands the plumbing of most AI products they touch.
 *
 * The map here is 2D so it can be seen. A real embedding has hundreds of dimensions, and the lab
 * says so rather than pretending otherwise. What survives the reduction is the part that matters:
 * similarity is distance, and direction carries meaning, which is why vector arithmetic works.
 *
 * Both metrics are shown at once on purpose. Production uses cosine because vector length carries
 * no meaning there, and a learner who only ever sees one number cannot tell which property of the
 * picture is doing the work.
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
import { Segmented, Slider } from '../../../kit/controls.js';
import { MLActivity, MLResetTransport } from '../activity.js';
import {
  DEFAULT_EMBEDDING_ITEMS,
  analogyTarget,
  cosine,
  euclidean,
  rankBy,
  type EmbeddingItem,
  type EmbeddingMetric,
} from './embedding.js';

export type { EmbeddingItem, EmbeddingMetric };
export type EmbeddingMode = 'nearest' | 'analogy';

export interface EmbeddingSpaceProps {
  items?: EmbeddingItem[];
  query?: string;
  k?: number;
  mode?: EmbeddingMode;
  /** Three labels for a − b + c. Defaults to the classic king − man + woman. */
  analogy?: string[];
  metric?: EmbeddingMetric;
  title?: string;
  prompt?: string;
  objectives?: string[];
  hints?: string[];
  height?: number;
}

const DEFAULT_ITEMS = DEFAULT_EMBEDDING_ITEMS;

const GROUP_COLOR: Record<string, string> = {
  people: '#6366f1',
  animals: '#16a34a',
  vehicles: '#ea580c',
  food: '#c026d3',
};
const colorOf = (group?: string): string => GROUP_COLOR[group ?? ''] ?? '#64748b';

const TRANSFER: ChallengeQuestion[] = [
  {
    id: 'why-cosine',
    prompt:
      'A search engine embeds a one-line question and a long article. Why is cosine used rather than distance?',
    choices: [
      { value: 'angle', label: 'cosine compares direction, so length does not count against the long text' },
      { value: 'fast', label: 'cosine is faster to compute' },
      { value: 'accurate', label: 'cosine is always more accurate' },
    ],
    answer: 'angle',
    explain:
      'A long document tends to produce a longer vector. Distance would push it away from a short query for a reason that has nothing to do with meaning, while the angle between them is unaffected.',
  },
];

export function EmbeddingSpaceLab({
  items = DEFAULT_ITEMS,
  query = 'cat',
  k = 3,
  mode = 'nearest',
  analogy = ['king', 'man', 'woman'],
  metric = 'cosine',
  title = 'Meaning as a place on a map',
  prompt,
  objectives,
  hints: hintList,
  height = 340,
}: EmbeddingSpaceProps): ReactNode {
  const pool = items.length ? items : DEFAULT_ITEMS;
  const [current, setCurrent] = useState(mode);
  const [selected, setSelected] = useState(
    () => pool.find((i) => i.label === query)?.label ?? pool[0]!.label,
  );
  const [kk, setKk] = useState(k);
  const [metricNow, setMetricNow] = useState<EmbeddingMetric>(metric);
  const [moved, setMoved] = useState(false);
  const hints = useHints(hintList);
  const challenge = useChallenge(TRANSFER);

  const byLabel = useMemo(() => new Map(pool.map((i) => [i.label, i])), [pool]);
  const queryItem = byLabel.get(selected) ?? pool[0]!;

  // In analogy mode the target is a computed POINT, not a word in the vocabulary.
  const [aLabel, bLabel, cLabel] = analogy;
  const resolved = useMemo(
    () => analogyTarget(pool, aLabel ?? '', bLabel ?? '', cLabel ?? ''),
    [pool, aLabel, bLabel, cLabel],
  );
  const a = byLabel.get(aLabel ?? '');
  const b = byLabel.get(bLabel ?? '');
  const c = byLabel.get(cLabel ?? '');
  const analogyOk = current === 'analogy' && !!resolved;
  const target: EmbeddingItem = analogyOk ? resolved!.target : queryItem;
  const exclude = analogyOk ? resolved!.exclude : [selected];

  const ranked = useMemo(
    () => rankBy(pool, target, metricNow, exclude),
    [pool, target, metricNow, exclude.join('|')],
  );
  const top = ranked.slice(0, Math.max(1, kk));
  const best = top[0];

  useCheckpoint({
    solved: moved && challenge.allCorrect,
    activity: `embedding:${title}`,
    hintsUsed: hints.count,
  });

  // ── view ────────────────────────────────────────────────────────────────────
  const pad = 1.4;
  const xs = pool.map((i) => i.x).concat(target.x);
  const ys = pool.map((i) => i.y).concat(target.y);
  const xMin = Math.min(...xs) - pad;
  const xMax = Math.max(...xs) + pad;
  const yMin = Math.min(...ys) - pad;
  const yMax = Math.max(...ys) + pad;
  // Points are mapped into an inset box, not the whole viewBox. A label is drawn to the RIGHT of
  // its point, so without a reserved right margin the rightmost word is clipped by the frame.
  const W = 560;
  const H = height;
  const PAD_L = 14;
  const PAD_R = 118;
  const PAD_Y = 18;
  const px = (x: number): number => PAD_L + ((x - xMin) / (xMax - xMin)) * (W - PAD_L - PAD_R);
  const py = (y: number): number => H - PAD_Y - ((y - yMin) / (yMax - yMin)) * (H - PAD_Y * 2);

  /**
   * In analogy mode only the winner gets a link. The runners-up are correct by cosine and are
   * visual noise: long dashed lines reaching across the map to unrelated words, which read as a
   * claim that those words are related when the point being made is about one landing place.
   */
  const linked = analogyOk ? ranked.slice(0, 1) : ranked.slice(0, Math.max(1, kk));

  const select = useCallback((label: string) => {
    setSelected(label);
    setMoved(true);
  }, []);

  const figure = (
    <div className="ml-interactive-scene">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: '100%', maxWidth: W, margin: '0 auto', display: 'block' }}
        role="img"
        aria-label={`Embedding map. ${analogyOk ? `Analogy target ${target.label}` : `Query ${selected}`}. Nearest: ${top.map((t) => t.item.label).join(', ')}.`}
      >
        {/* axes through the origin, because cosine is measured as an angle FROM it */}
        <line x1={px(xMin)} y1={py(0)} x2={px(xMax)} y2={py(0)} stroke="currentColor" opacity={0.15} />
        <line x1={px(0)} y1={py(yMin)} x2={px(0)} y2={py(yMax)} stroke="currentColor" opacity={0.15} />

        {/* links from the target to its nearest neighbours */}
        {linked.map((entry) => (
          <line
            key={`link-${entry.item.label}`}
            x1={px(target.x)}
            y1={py(target.y)}
            x2={px(entry.item.x)}
            y2={py(entry.item.y)}
            stroke="currentColor"
            strokeDasharray="4 3"
            opacity={0.45}
          />
        ))}

        {/* the analogy as two arrows: the step from b to a, repeated from c */}
        {analogyOk && (
          <>
            <line
              x1={px(b!.x)}
              y1={py(b!.y)}
              x2={px(a!.x)}
              y2={py(a!.y)}
              stroke="var(--stage-accent, #6366f1)"
              strokeWidth={2}
            />
            <line
              x1={px(c!.x)}
              y1={py(c!.y)}
              x2={px(target.x)}
              y2={py(target.y)}
              stroke="var(--stage-accent, #6366f1)"
              strokeWidth={2}
              strokeDasharray="5 3"
            />
          </>
        )}

        {pool.map((item) => {
          const isTop = top.some((t) => t.item.label === item.label);
          const isQuery = !analogyOk && item.label === selected;
          const isInput = analogyOk && exclude.includes(item.label);
          return (
            <g key={item.label} onClick={() => select(item.label)} style={{ cursor: 'pointer' }}>
              <circle
                cx={px(item.x)}
                cy={py(item.y)}
                r={isQuery ? 8 : 5.5}
                fill={colorOf(item.group)}
                opacity={isQuery || isTop || isInput ? 1 : 0.45}
                stroke={isQuery ? 'currentColor' : 'none'}
                strokeWidth={2}
              />
              {/* Halo behind the text: the analogy arrows run between points at the same height,
                  so without it a line draws straight through a word. */}
              <text
                x={px(item.x) + 9}
                y={py(item.y) + 4}
                fontSize={12}
                fill="currentColor"
                fontWeight={isQuery || isTop ? 700 : 400}
                opacity={isQuery || isTop || isInput ? 1 : 0.6}
                stroke="var(--stage-bg, #fff)"
                strokeWidth={3.5}
                paintOrder="stroke"
              >
                {item.label}
              </text>
            </g>
          );
        })}

        {analogyOk && (
          <>
            <circle
              cx={px(target.x)}
              cy={py(target.y)}
              r={9}
              fill="none"
              stroke="var(--stage-accent, #6366f1)"
              strokeWidth={2.5}
            />
            <text
              x={px(target.x)}
              y={py(target.y) - 16}
              textAnchor="middle"
              fontSize={11}
              fill="var(--stage-accent, #6366f1)"
              fontWeight={700}
              stroke="var(--stage-bg, #fff)"
              strokeWidth={3.5}
              paintOrder="stroke"
            >
              landing point
            </text>
          </>
        )}
      </svg>
    </div>
  );

  const instruments = (
    <div className="ml-readout">
      <span className="lab-field-label">
        {analogyOk ? 'Nearest to the landing point' : `Nearest to “${selected}”`}
      </span>
      <ol style={{ margin: '4px 0 8px', paddingLeft: 18 }}>
        {top.map((entry) => (
          <li key={entry.item.label} style={{ fontSize: 13 }}>
            <strong>{entry.item.label}</strong>{' '}
            <span style={{ opacity: 0.7 }}>
              cos {entry.cos.toFixed(3)} · dist {entry.dist.toFixed(2)}
            </span>
          </li>
        ))}
      </ol>
      <p className="ml-control-hint">
        Both numbers are shown so you can see which one the ranking is using. Cosine compares direction from
        the origin; distance compares position.
      </p>
      <p className="ml-control-hint">
        This map is 2D so it can be drawn. A real embedding from a model like all-MiniLM-L6-v2 has 384
        dimensions, and the same two measurements are used there.
      </p>
    </div>
  );

  const controls = (
    <>
      <div className="lab-segmented-field">
        <span className="lab-field-label">Question</span>
        <Segmented
          ariaLabel="question"
          value={current}
          onChange={(value: EmbeddingMode) => {
            setCurrent(value);
            setMoved(true);
          }}
          options={[
            { value: 'nearest', label: 'nearest' },
            { value: 'analogy', label: 'analogy' },
          ]}
        />
      </div>
      <div className="lab-segmented-field">
        <span className="lab-field-label">Rank by</span>
        <Segmented
          ariaLabel="metric"
          value={metricNow}
          onChange={(value: EmbeddingMetric) => {
            setMetricNow(value);
            setMoved(true);
          }}
          options={[
            { value: 'cosine', label: 'cosine' },
            { value: 'euclidean', label: 'distance' },
          ]}
        />
      </div>
      <Field label="how many neighbours" value={<b>{kk}</b>}>
        <Slider value={kk} min={1} max={5} step={1} onChange={setKk} ariaLabel="number of neighbours" />
      </Field>
      <p className="ml-control-hint">
        {current === 'nearest'
          ? 'Click any word on the map to ask what is closest to it.'
          : 'The solid arrow is the step from one word to another. The dashed arrow repeats that same step somewhere else.'}
      </p>
    </>
  );

  const reset = (): void => {
    setCurrent(mode);
    setSelected(pool.find((i) => i.label === query)?.label ?? pool[0]!.label);
    setKk(k);
    setMetricNow(metric);
    setMoved(false);
    challenge.reset();
  };

  return (
    <MLActivity
      className="ml-embedding-space"
      eyebrow="Embeddings"
      title={title}
      prompt={
        prompt ??
        'Every word here is a pair of numbers, so meaning becomes a position. Words used in similar ways end up in similar places, and that is the whole mechanism behind semantic search.'
      }
      status={
        <>
          <strong>{analogyOk ? target.label : `nearest to ${selected}`}</strong>
          <span>→ {best?.item.label ?? 'none'}</span>
          <span>cos {best?.cos.toFixed(3) ?? '0'}</span>
          <span>ranked by {metricNow === 'cosine' ? 'cosine' : 'distance'}</span>
        </>
      }
      figure={figure}
      instruments={
        <>
          {instruments}
          <LiveRegion>
            {analogyOk
              ? `${target.label} lands nearest ${best?.item.label}, cosine ${best?.cos.toFixed(3)}.`
              : `Nearest to ${selected} is ${best?.item.label}, cosine ${best?.cos.toFixed(3)}.`}
          </LiveRegion>
        </>
      }
      controls={controls}
      feedback={
        analogyOk
          ? `Direction carries meaning. The step that turns ${bLabel} into ${aLabel} is the same step that turns ${cLabel} into ${best?.item.label}, so the arithmetic lands on it.`
          : moved
            ? 'Words from the same group sit together, because they get used in the same contexts. Nothing here was labelled by hand.'
            : 'Click a word to ask what is nearest to it, then switch the question to analogy.'
      }
      objectives={objectives}
      transport={
        <MLResetTransport
          onReset={reset}
          state={moved ? 'Compare the two metrics' : 'Pick a word on the map'}
          detail={`${top.length} neighbour${top.length === 1 ? '' : 's'} shown`}
        />
      }
      challenge={
        <ChallengeCard questions={TRANSFER} state={challenge} title="Transfer it to a real system" />
      }
      support={<HintLadder hints={hints} />}
      canvasLabel="Word embedding map with nearest neighbours and analogy arrows"
      inspectorLabel="Similarity scores"
    />
  );
}

export default EmbeddingSpaceLab;
