'use client';

/**
 * PrepositionScene, pick the preposition that matches a spatial picture.
 *
 * Prepositions are inherently spatial, so each item shows a little scene (a
 * thing in / on / under / beside a box) and the learner names the relation.
 * The teaching point for Bangla speakers: English puts the preposition BEFORE
 * the noun ("on the box"), where Bangla uses a postposition AFTER it, so the
 * answer slots in front of the noun and the note makes that contrast explicit.
 */

import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { Activity } from '../../kit/activity.js';
import { AssessedChoiceGroup } from '../../kit/controls.js';
import { LanguageActivity, LanguageAdvance } from '../activity.js';
import { useCheckpoint, useHints, HintLadder } from '../../kit/pedagogy.js';
import { Icon, normalizeIcon, type IconValue } from '../icon.js';
import { Speaker } from '../ui.js';
import { Sun } from 'lucide-react';

/** Spatial relations a creator can depict (positions the figure vs the landmark). */
export type Relation =
  'in' | 'on' | 'over' | 'above' | 'under' | 'below' | 'beside' | 'between' | 'behind' | 'infront' | 'at';

export const RELATIONS: Relation[] = [
  'in',
  'on',
  'over',
  'above',
  'under',
  'below',
  'beside',
  'between',
  'behind',
  'infront',
  'at',
];

export interface PrepItem {
  /** Text before the blank, e.g. "The bird is". */
  before: string;
  /** The noun phrase after the preposition, e.g. "the tree.". */
  noun: string;
  answer: string;
  options: string[];
  /** Spatial relation to depict (positions the figure vs the landmark). */
  scene: Relation;
  /** The figure being placed, an emoji string or an `IconRef`. Default a ball. */
  figure?: IconValue;
  /** The reference landmark, an emoji/`IconRef`, OR a backdrop key string
   *  ('sky'|'water'|'ground'|'room'). Default a box. */
  landmark?: IconValue;
  note?: string;
  /** Targeted feedback per WRONG pick: `{ [option]: 'why that trap is tempting' }`.
   *  Turns a wrong tap into a teaching moment instead of a bare "not quite". */
  feedback?: Record<string, string>;
}

export interface PrepositionProps {
  items: PrepItem[];
  objectives?: string[];
  hints?: string[];
  /** BCP-47 of the sentence, e.g. 'en-US'. Set it to show a 🔊 that reads the
   *  correct sentence once solved (hear the preposition in place). */
  lang?: string;
  title?: string;
  prompt?: string;
}

// Always CENTER-anchor a figure (translate(-50%,-50%)) at a safe %, never flush
// to an edge, emoji glyph metrics vary by platform, and a top:0% figure clips
// under the panel's overflow:hidden on fonts whose glyph overshoots its box.
// Centred placement grows the glyph around its midpoint, so it stays inside.
const figAt = (left: string, top: string, scale = 1, opacity?: number): CSSProperties => ({
  left,
  top,
  transform: `translate(-50%,-50%)${scale !== 1 ? ` scale(${scale})` : ''}`,
  ...(opacity != null ? { opacity } : {}),
});

// where the figure sits relative to the centered landmark, pure data, so any
// emoji pair (bird/tree, boat/river, cloud/sky…) composes without new code.
const FIGURE_POS: Record<Relation, CSSProperties> = {
  over: figAt('50%', '20%'),
  above: figAt('50%', '20%'),
  on: figAt('50%', '34%'),
  in: figAt('50%', '56%', 0.6),
  under: figAt('50%', '84%'),
  below: figAt('50%', '84%'),
  beside: figAt('80%', '56%'),
  between: figAt('50%', '56%'),
  behind: figAt('60%', '44%', 0.85, 0.5),
  infront: figAt('42%', '64%', 1.1),
  at: figAt('74%', '82%'),
};

/** Region landmarks the scene draws as a panel rather than an emoji. */
const BACKDROP_KEYS = ['sky', 'water', 'ground', 'room'];

function Backdrop({ kind }: { kind: string }): ReactNode {
  if (kind === 'sky')
    return (
      <div className="lang-backdrop" data-kind="sky">
        <Sun className="lang-backdrop-sun" aria-hidden />
      </div>
    );
  if (kind === 'water') return <div className="lang-backdrop" data-kind="water" />;
  if (kind === 'ground') return <div className="lang-backdrop" data-kind="ground" />;
  if (kind === 'room') return <div className="lang-backdrop" data-kind="room" />;
  return null;
}

/** Figure placement over a backdrop (relative to the region, not a centred emoji).
 *  Center-anchored at safe %s for the same no-clip reason as FIGURE_POS. */
function backdropFigPos(kind: string, rel: Relation): CSSProperties {
  const hi = rel === 'over' || rel === 'above';
  const lo = rel === 'under' || rel === 'below';
  if (kind === 'water')
    return rel === 'in' ? figAt('50%', '76%') : hi ? figAt('50%', '20%') : figAt('50%', '42%');
  if (kind === 'sky') return figAt('50%', '38%');
  if (kind === 'ground') return hi ? figAt('50%', '20%') : lo ? figAt('50%', '86%') : figAt('50%', '60%');
  return figAt('50%', '48%');
}

/** Plain-text label for an icon value (emoji char or IconRef.alt), for the
 *  scene's aria-label, since the visuals themselves are decorative. */
function iconLabel(v: IconValue): string {
  const r = normalizeIcon(v);
  return r ? r.alt || (r.kind === 'emoji' ? (r.id ?? '') : '') : '';
}

function SceneView({
  relation,
  figure = '🔵',
  landmark = '📦',
}: {
  relation: Relation;
  figure?: IconValue;
  landmark?: IconValue;
}): ReactNode {
  // backdrop detection applies only to the string landmark form (a region key)
  const isBackdrop = typeof landmark === 'string' && BACKDROP_KEYS.includes(landmark);
  const behindLandmark = relation === 'behind' && !isBackdrop;
  const figStyle = isBackdrop
    ? backdropFigPos(landmark as string, relation)
    : (FIGURE_POS[relation] ?? FIGURE_POS.on);
  const fig = <Icon icon={figure} className="lang-prepfig" style={figStyle} decorative />;
  return (
    <div
      className="lang-prepscene"
      role="img"
      aria-label={`${iconLabel(figure)} ${relation} ${iconLabel(landmark)}`.trim()}
    >
      {isBackdrop && <Backdrop kind={landmark as string} />}
      {!isBackdrop && relation === 'between' && (
        <Icon
          icon={landmark}
          className="lang-preplandmark"
          style={{ '--landmark-x': '28%' } as CSSProperties}
          decorative
        />
      )}
      {behindLandmark && fig}
      {!isBackdrop && (
        <Icon
          icon={landmark}
          className="lang-preplandmark"
          style={relation === 'between' ? ({ '--landmark-x': '72%' } as CSSProperties) : undefined}
          decorative
        />
      )}
      {!behindLandmark && fig}
    </div>
  );
}

export function PrepositionSceneLab({
  items,
  objectives,
  hints: hintList,
  lang,
  title = 'Where is it?',
  prompt = 'Pick the preposition: in English it comes before the noun.',
}: PrepositionProps): ReactNode {
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [solvedCount, setSolvedCount] = useState(0);
  useEffect(() => {
    setIdx(0);
    setPicked(null);
    setSolvedCount(0);
  }, [items]);

  const item = items[idx];
  const correct = picked !== null && item !== undefined && picked === item.answer;
  const total = items.length;
  const allDone = solvedCount >= total && total > 0;

  const hints = useHints(hintList);
  useCheckpoint({
    solved: allDone,
    activity: 'preposition',
    score: { raw: total, max: total },
    hintsUsed: hints.count,
  });

  if (!item) return null;
  const pick = (v: string): void => {
    if (correct) return;
    setPicked(v);
    if (v === item.answer) setSolvedCount((s) => Math.min(total, s + 1));
  };
  const next = (): void => {
    setPicked(null);
    setIdx((i) => Math.min(total - 1, i + 1));
  };
  const isLast = idx === total - 1;

  const figure = (
    <div className="lang-lab">
      <div className="lang-scene">
        <SceneView relation={item.scene} figure={item.figure} landmark={item.landmark} />
      </div>

      <div className="lang-sentence" aria-label="sentence">
        <span>{item.before}</span>
        <span className="lang-blank" data-state={picked === null ? 'idle' : correct ? 'ok' : 'no'}>
          {picked ?? '▢'}
        </span>
        <span className="lang-noun">{item.noun}</span>
        {lang && correct ? (
          <Speaker
            item={{
              term: `${item.before} ${item.answer} ${item.noun}`.replace(/\s+/g, ' ').trim(),
              translation: '',
            }}
            lang={lang}
          />
        ) : null}
      </div>

      <AssessedChoiceGroup
        value={picked ?? undefined}
        onChange={pick}
        ariaLabel="Choose the preposition that matches the scene"
        options={item.options.map((value) => ({
          value,
          label: value,
          disabled: correct,
          tone:
            picked === value
              ? value === item.answer
                ? ('correct' as const)
                : ('wrong' as const)
              : undefined,
        }))}
      />

      {picked !== null &&
        (correct ? (
          <p className="lang-why" data-state="ok" aria-live="polite">
            {item.note ?? `English: "${item.answer} ${item.noun}", the preposition comes first.`}
          </p>
        ) : item.feedback?.[picked] ? (
          <p className="lab-misconception lang-feedback" role="status" aria-live="polite">
            <span aria-hidden>⚠</span> {item.feedback[picked]}
          </p>
        ) : (
          <p className="lang-why" data-state="no" aria-live="polite">
            Not quite, look at the picture.
          </p>
        ))}
    </div>
  );

  return (
    <LanguageActivity
      title={title}
      prompt={prompt}
      objectives={objectives}
      progress={<Activity.ItemProgress done={solvedCount} total={total} label="All correct" />}
      controls={
        correct && !isLast ? <LanguageAdvance current={solvedCount} total={total} onNext={next} /> : undefined
      }
      footer={<HintLadder hints={hints} />}
    >
      {figure}
    </LanguageActivity>
  );
}
