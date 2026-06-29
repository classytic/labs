'use client';

/**
 * CombinationStudioLab, the rule of product you can FEEL. Instead of reading
 * "3 × 2 = 6", the learner:
 *   1. picks one option from each rack (a shirt, some trousers) and watches a
 *      little character assemble live, so every outcome is a thing, not a label;
 *   2. PREDICTS how many different ones exist before exploring (predict-first);
 *   3. fills a discovery wall by making each combination, the wall is literally a
 *      rows × columns grid, so the product IS an area they complete;
 *   4. adds a third variable (a hat) and watches 3 × 2 = 6 become 3 × 2 × 2 = 12,
 *      feeling why a new choice MULTIPLIES.
 *
 * Fully authorable: a creator supplies any scenario (outfits, sundaes, number
 * plates, routes) as categories of options. Pure cartesian-product enumeration;
 * the count uses ruleOfProduct from the discrete kernel.
 */

import { useMemo, useState, type ReactNode } from 'react';
import { ruleOfProduct } from '../core/combinatorics.js';
import { CharacterFigure, ComboCard, OptionSwatch, type CharSlot, type CharacterParts } from './figure.js';
import { LabFrame, ControlBar, Callout } from '../../kit/frame.js';
import { Chip } from '../../kit/controls.js';
import { useChallenge, ChallengeCard, useCheckpoint, useHints, HintLadder } from '../../kit/pedagogy.js';

export interface ComboOption { id: string; label: string; emoji?: string; color?: string }
export interface ComboCategory { id: string; label: string; slot?: CharSlot; options: ComboOption[] }

export interface CombinationStudioProps {
  /** The thing being built, e.g. "outfit", "sundae" (used in the headline + question). */
  scenario?: string;
  categories?: ComboCategory[];
  /** 'character' assembles a person; 'card' stacks the chosen emoji (non-clothing). */
  figure?: 'character' | 'card';
  /** How many categories are in play at the start (rest revealed via + variable). */
  startActive?: number;
  /** Cap outcomes drawn on the wall. */
  maxWall?: number;
  title?: string;
  prompt?: string;
  objectives?: string[];
  hints?: string[];
}

// ── a charming default: outfits (shirt × trousers × hat) ────────────────────────
const DEFAULT_CATS: ComboCategory[] = [
  { id: 'shirt', label: 'Shirt', slot: 'top', options: [
    { id: 'r', label: 'red', color: '#e5484d' }, { id: 'b', label: 'blue', color: '#3e63dd' }, { id: 'g', label: 'green', color: '#30a46c' },
  ] },
  { id: 'trousers', label: 'Trousers', slot: 'bottom', options: [
    { id: 'd', label: 'denim', color: '#2b4a8b' }, { id: 'k', label: 'khaki', color: '#a18249' },
  ] },
  { id: 'hat', label: 'Hat', slot: 'hat', options: [
    { id: 'o', label: 'orange', color: '#f76808' }, { id: 'p', label: 'purple', color: '#8e4ec6' },
  ] },
];

interface Combo { key: string; picks: ComboOption[] }

/** cartesian product of the active categories' option lists. */
function enumerate(cats: ComboCategory[]): Combo[] {
  let acc: ComboOption[][] = [[]];
  for (const c of cats) acc = acc.flatMap((row) => c.options.map((o) => [...row, o]));
  return acc.map((picks) => ({ key: picks.map((o) => o.id).join('|'), picks }));
}

function partsOf(cats: ComboCategory[], picks: ComboOption[]): CharacterParts {
  const p: CharacterParts = {};
  cats.forEach((c, i) => {
    const o = picks[i]; if (!o) return;
    if (c.slot === 'top') p.top = o.color;
    else if (c.slot === 'bottom') p.bottom = o.color;
    else if (c.slot === 'hat') p.hat = o.color;
    else if (c.slot === 'hold') p.hold = o.emoji;
  });
  return p;
}

export function CombinationStudioLab({
  scenario = 'outfit', categories = DEFAULT_CATS, figure = 'character',
  startActive, maxWall = 60, title = `How many ${scenario}s can you make?`,
  prompt = 'Pick one from each rack, make it, and fill the wall. Each new choice multiplies the total.',
  objectives, hints: hintList,
}: CombinationStudioProps = {}): ReactNode {
  const minActive = Math.min(2, categories.length);
  const [active, setActive] = useState(Math.max(1, Math.min(startActive ?? minActive, categories.length)));
  const cats = categories.slice(0, active);

  const [picks, setPicks] = useState<Record<string, string>>(() => Object.fromEntries(categories.map((c) => [c.id, c.options[0]!.id])));
  const [found, setFound] = useState<Set<string>>(new Set());
  const hints = useHints(hintList);

  const combos = useMemo(() => enumerate(cats), [cats]);
  const sizes = cats.map((c) => c.options.length);
  const total = ruleOfProduct(...sizes);
  const tooMany = total > maxWall;

  const currentPicks = cats.map((c) => c.options.find((o) => o.id === picks[c.id]) ?? c.options[0]!);
  const currentKey = currentPicks.map((o) => o.id).join('|');
  const madeCurrent = found.has(currentKey);

  // predict-first: re-key per active-count so they predict AGAIN after adding a variable
  const distract = [total + sizes[active - 1]!, sizes.reduce((a, b) => a + b, 0), Math.max(1, total - 2)].filter((d) => d !== total);
  const choices = [total, ...distract.slice(0, 2)].sort((a, b) => a - b).map((n) => ({ value: String(n), label: String(n) }));
  const questions = useMemo(() => [{
    id: `q-${active}-${total}`,
    prompt: `With ${cats.map((c, i) => `${sizes[i]} ${c.label.toLowerCase()}${sizes[i]! > 1 ? 's' : ''}`).join(' and ')}, how many different ${scenario}s?`,
    choices, answer: String(total),
    explain: `Yes: ${sizes.join(' × ')} = ${total}. Each independent choice multiplies.`,
  }], [active, total]); // eslint-disable-line react-hooks/exhaustive-deps
  const challenge = useChallenge(questions);

  const allFound = found.size >= total && total > 0;
  useCheckpoint({ solved: allFound, activity: `combination-studio:${scenario}`, hintsUsed: hints.count });

  const make = (): void => setFound((f) => new Set(f).add(currentKey));
  const pickOpt = (catId: string, optId: string): void => setPicks((p) => ({ ...p, [catId]: optId }));
  const addVar = (): void => { setActive((a) => Math.min(categories.length, a + 1)); setFound(new Set()); };
  const dropVar = (): void => { setActive((a) => Math.max(1, a - 1)); setFound(new Set()); };
  const reset = (): void => setFound(new Set());

  const FoundFig = ({ combo, size }: { combo: Combo; size: number }): ReactNode => (
    figure === 'character'
      ? <CharacterFigure parts={partsOf(cats, combo.picks)} size={size} dim={!found.has(combo.key)} />
      : <ComboCard cells={cats.map((c, i) => ({ emoji: combo.picks[i]!.emoji, color: combo.picks[i]!.color }))} size={size} dim={!found.has(combo.key)} />
  );

  // the wall: a literal rows × cols grid when exactly 2 variables (product = area)
  const grid2d = active === 2 && !tooMany;
  const rows = grid2d ? cats[0]!.options : [];
  const cols = grid2d ? cats[1]!.options : [];

  const figureEl = (
    <div style={{ display: 'grid', gap: 16 }}>
      {/* rule-of-product banner */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, flexWrap: 'wrap', fontSize: 20, fontWeight: 800 }}>
        {cats.map((c, i) => (
          <span key={c.id} style={{ display: 'inline-flex', alignItems: 'baseline', gap: 5 }}>
            {i > 0 && <span style={{ color: 'var(--stage-muted)' }}>×</span>}
            <span style={{ color: 'var(--stage-accent)' }}>{sizes[i]}</span>
            <span style={{ fontSize: 12, color: 'var(--stage-muted)', fontWeight: 600 }}>{c.label.toLowerCase()}{sizes[i]! > 1 ? 's' : ''}</span>
          </span>
        ))}
        <span style={{ color: 'var(--stage-muted)' }}>=</span>
        <span style={{ color: 'var(--stage-good)' }}>{total}</span>
        <span style={{ fontSize: 13, color: 'var(--stage-muted)', fontWeight: 600 }}>{found.size}/{total} found</span>
      </div>

      {/* the live workbench: racks → assembled character → make it */}
      <div style={{ display: 'flex', gap: 18, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', padding: '10px 6px', borderRadius: 14, background: 'var(--stage-bg)', border: '1px solid var(--stage-grid)' }}>
        <div style={{ display: 'grid', gap: 8 }}>
          {cats.map((c) => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ width: 64, fontSize: 12, fontWeight: 700, color: 'var(--stage-muted)', textAlign: 'right' }}>{c.label}</span>
              {c.options.map((o) => (
                <OptionSwatch key={o.id} emoji={o.emoji} color={o.color} label={o.label} selected={picks[c.id] === o.id} onClick={() => pickOpt(c.id, o.id)} />
              ))}
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', justifyItems: 'center', gap: 6 }}>
          {figure === 'character'
            ? <CharacterFigure parts={partsOf(cats, currentPicks)} size={96} />
            : <ComboCard cells={cats.map((c, i) => ({ emoji: currentPicks[i]!.emoji, color: currentPicks[i]!.color }))} size={84} />}
          <button
            type="button" onClick={make} disabled={madeCurrent}
            className="lab-btn"
            style={{ opacity: madeCurrent ? 0.5 : 1 }}
          >
            {madeCurrent ? '✓ already made' : '+ make this one'}
          </button>
        </div>
      </div>

      {/* the discovery wall */}
      {tooMany ? (
        <p style={{ margin: 0, padding: 12, borderRadius: 10, border: '1px dashed var(--stage-grid)', color: 'var(--stage-muted)' }}>
          That is <b>{total}</b> combinations, too many to draw, but the rule of product still gives the count without listing them. Drop a variable to see them all.
        </p>
      ) : grid2d ? (
        <div style={{ display: 'grid', gridTemplateColumns: `auto repeat(${cols.length}, 1fr)`, gap: 6, alignItems: 'center', justifyItems: 'center' }}>
          <span />
          {cols.map((o) => <span key={o.id} style={{ fontSize: 11, fontWeight: 700, color: 'var(--stage-muted)' }}>{o.label}</span>)}
          {rows.map((r, ri) => (
            <FragmentRow key={r.id} label={r.label}>
              {cols.map((cOpt, ci) => {
                const combo = combos[ri * cols.length + ci]!;
                const isFound = found.has(combo.key);
                return (
                  <div key={cOpt.id} style={{ padding: 4, borderRadius: 10, border: `1.5px solid ${isFound ? 'var(--stage-good)' : 'var(--stage-grid)'}`, background: isFound ? 'color-mix(in oklab, var(--stage-good) 12%, transparent)' : 'transparent' }}>
                    <FoundFig combo={combo} size={48} />
                  </div>
                );
              })}
            </FragmentRow>
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
          {combos.map((combo) => {
            const isFound = found.has(combo.key);
            return (
              <div key={combo.key} style={{ padding: 4, borderRadius: 10, border: `1.5px solid ${isFound ? 'var(--stage-good)' : 'var(--stage-grid)'}`, background: isFound ? 'color-mix(in oklab, var(--stage-good) 12%, transparent)' : 'transparent' }}>
                <FoundFig combo={combo} size={46} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const aside = (
    <>
      <ChallengeCard questions={questions} state={challenge} title="Predict first" />
      <Callout tone={allFound ? 'result' : 'info'}>
        {allFound
          ? <span style={{ color: 'var(--stage-good)', fontWeight: 700 }}>You made all {total}. That is exactly {sizes.join(' × ')} = {total}: every choice multiplied.</span>
          : <span style={{ color: 'var(--stage-muted)' }}>Make every {scenario} to fill the wall. Then add a variable and watch the total multiply.</span>}
      </Callout>
    </>
  );

  const controls = (
    <ControlBar>
      <Chip selected={false} onClick={addVar}>+ add a variable</Chip>
      <Chip selected={false} onClick={dropVar}>− drop a variable</Chip>
      <Chip selected={false} onClick={reset}>clear wall</Chip>
    </ControlBar>
  );

  return <LabFrame title={title} prompt={prompt} objectives={objectives} aside={aside} controls={controls} footer={<HintLadder hints={hints} />}>{figureEl}</LabFrame>;
}

/** A grid row: the row label cell + its children cells (keeps JSX flat above). */
function FragmentRow({ label, children }: { label: string; children: ReactNode }): ReactNode {
  return (
    <>
      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--stage-muted)', justifySelf: 'end' }}>{label}</span>
      {children}
    </>
  );
}
