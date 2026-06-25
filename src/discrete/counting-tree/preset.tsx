'use client';

/**
 * CountingTree — the GENERAL sequential-counting + probability-tree tool. One
 * model covers the multiplication principle, permutations (draw without
 * replacement → n·(n−1)·…), with-replacement counts (nᵏ), the
 * permutation→combination collapse (÷k!), AND probability trees (multiply the
 * weights down a path). The creator declares the stages (or a pool to draw
 * from); the kernel (`@classytic/labs/discrete/core`) computes every number, so
 * an agent narrates and never invents.
 *
 * Two authoring forms:
 *   • `stages`  — explicit uniform-per-stage branches (general multiplication /
 *                 independent probability, e.g. flip a coin 3×).
 *   • `pool`+`draws`+`replacement` — draw k items from a pool; replacement off
 *                 ⇒ a permutation tree (5·4·3), on ⇒ nᵏ.
 */

import { Fragment, useMemo, useState, type ReactNode } from 'react';
import { Stage, Segment, Dot, Label, useControlSurface, useLearner } from '@classytic/stage';
import { Stepper, Chip, CheckButton, StatusPill } from '../../kit/controls.js';
import { LabFrame, ControlBar, Field } from '../../kit/frame.js';
import { useHints, HintLadder, RevealSolution, useCheckpoint } from '../../kit/pedagogy.js';
import { factorial } from '../core/combinatorics.js';
import { Tex } from '../../core/tex.js';

export interface TreeBranch { label: string; weight?: number }
export interface TreeStage { label?: string; branches: TreeBranch[] }
export type CountAsk = 'ordered' | 'unordered';

export interface CountingTreeProps {
  stages?: TreeStage[];
  /** Draw-from-a-pool form (generates the stages). */
  pool?: string[];
  draws?: number;
  replacement?: boolean;
  mode?: 'count' | 'probability';
  /** count mode: ask for the ordered total, or the unordered (÷k!) count. */
  ask?: CountAsk;
  title?: string;
  prompt?: string;
  objectives?: string[];
  hints?: string[];
  controlId?: string;
  height?: number;
}

interface TNode { id: number; depth: number; y: number; label: string; leaf: boolean }
interface TEdge { from: number; to: number; label: string; weight: number }
const MAX_LEAVES = 28; // keep trees legible; lessons are small

/** A readable fraction for small denominators, else 2dp. */
function frac(w: number): string {
  for (let d = 2; d <= 12; d++) { const n = w * d; if (Math.abs(n - Math.round(n)) < 1e-6) return `${Math.round(n)}/${d}`; }
  return w.toFixed(2);
}

export function CountingTreeLab({
  stages, pool, draws = 2, replacement = false, mode = 'count', ask = 'ordered',
  title = 'Counting tree', prompt, objectives, hints: hintList, controlId, height = 320,
}: CountingTreeProps): ReactNode {
  const [guess, setGuess] = useState(0);
  const [checked, setChecked] = useState(false);
  const [peeked, setPeeked] = useState(false);
  const [sel, setSel] = useState(-1);       // selected leaf (probability path) / spotlight
  const hints = useHints(hintList);
  const learner = useLearner();

  // ── build the tree (nodes + edges + leaf paths) from either form ──
  const built = useMemo(() => {
    const nodes: TNode[] = [];
    const edges: TEdge[] = [];
    const leafPaths: { id: number; path: string; prob: number; edges: number[] }[] = [];
    let id = 0, leafY = 0, overflow = false;

    const kidsAt = (depth: number, remaining: string[]): { label: string; weight: number; item?: string }[] => {
      if (pool) {
        if (depth >= draws) return [];
        const items = replacement ? pool : remaining;
        return items.map((it) => ({ label: it, weight: items.length ? 1 / items.length : 0, item: it }));
      }
      const st = stages?.[depth];
      if (!st) return [];
      const tot = st.branches.reduce((s, b) => s + (b.weight ?? 1), 0) || 1;
      return st.branches.map((b) => ({ label: b.label, weight: mode === 'probability' ? (b.weight ?? 1) / tot : 1 }));
    };
    const depthCount = pool ? draws : (stages?.length ?? 0);

    const rec = (depth: number, remaining: string[], pathLabel: string, prob: number, edgeIds: number[]): TNode => {
      const myId = id++;
      const node: TNode = { id: myId, depth, y: 0, label: '', leaf: false };
      const kids = kidsAt(depth, remaining);
      if (kids.length === 0 || depth >= depthCount) {
        node.leaf = true;
        node.y = leafY++;
        node.label = pathLabel;
        leafPaths.push({ id: myId, path: pathLabel, prob, edges: edgeIds });
        nodes.push(node);
        return node;
      }
      const ys: number[] = [];
      for (const k of kids) {
        if (leafY > MAX_LEAVES) { overflow = true; break; }
        const eId = edges.length;
        const child = rec(depth + 1, replacement || !pool ? remaining : remaining.filter((r) => r !== k.item), pathLabel ? `${pathLabel}${k.label}` : k.label, prob * k.weight, [...edgeIds, eId]);
        edges.push({ from: myId, to: child.id, label: k.label, weight: k.weight });
        ys.push(child.y);
      }
      node.y = ys.length ? ys.reduce((a, b) => a + b, 0) / ys.length : leafY++;
      nodes.push(node);
      return node;
    };
    rec(0, pool ? [...pool] : [], '', 1, []);
    return { nodes, edges, leafPaths, leaves: leafY, maxDepth: depthCount, overflow };
  }, [stages, pool, draws, replacement, mode]);

  const byId = useMemo(() => new Map(built.nodes.map((n) => [n.id, n])), [built]);

  // ── kernel answers (the source of truth) ──
  const orderedTotal = built.leafPaths.length;
  const k = pool ? draws : (stages?.length ?? 0);
  const unorderedTotal = Math.round(orderedTotal / factorial(k));   // ÷k! (only meaningful when each leaf is one ordering of a chosen set)
  const factorStr = useMemo(() => {
    if (pool) {
      const n = pool.length;
      const parts = Array.from({ length: draws }, (_, i) => (replacement ? n : n - i));
      return parts.join(' \\times ');
    }
    return (stages ?? []).map((s) => s.branches.length).join(' \\times ');
  }, [pool, draws, replacement, stages]);

  const target = ask === 'unordered' ? unorderedTotal : orderedTotal;
  const solved = mode === 'count' ? checked && guess === target && !peeked : false;
  useCheckpoint({ solved, activity: `counting-tree:${title}`, hintsUsed: hints.count });

  const check = (): void => setChecked(true);
  const reset = (): void => { setGuess(0); setChecked(false); setSel(-1); };
  const reveal = (): void => {
    setPeeked(true); setGuess(target); setChecked(true);
    learner?.report({ activity: `counting-tree:${title}`, correct: false, completion: true, score: { raw: 0, max: 1 } });
  };

  useControlSurface(controlId, {
    highlight: { type: 'number', label: 'spotlight a path (leaf index, −1 clears)', min: -1, max: Math.max(0, built.leafPaths.length - 1), get: () => sel, set: (v) => setSel(Math.round(v)) },
    step: { type: 'action', label: 'walk to the next path', invoke: () => setSel((s) => (s + 1) % Math.max(1, built.leafPaths.length)) },
    reveal: { type: 'action', label: 'reveal the answer', invoke: reveal },
    check: { type: 'action', label: 'grade the count', invoke: check },
    reset: { type: 'action', label: 'clear', invoke: reset },
  });

  const selPath = sel >= 0 ? built.leafPaths[sel] : undefined;
  const selEdges = new Set(selPath?.edges ?? []);
  const view = { xMin: -0.4, xMax: built.maxDepth + 1.3, yMin: -0.7, yMax: Math.max(0.7, built.leaves - 1 + 0.7) };

  const figure = (
    <>
      <div style={{ borderRadius: 14, overflow: 'hidden', background: 'var(--stage-bg)', border: '1px solid var(--stage-grid)' }}>
        <Stage view={view} height={height} preserveAspect={false} ariaLabel={`Counting tree with ${orderedTotal} paths`}>
          {built.edges.map((e, i) => {
            const a = byId.get(e.from)!, b = byId.get(e.to)!;
            const on = selEdges.has(i);
            return (
              <Fragment key={i}>
                <Segment from={{ x: a.depth, y: a.y }} to={{ x: b.depth, y: b.y }} color={on ? 'var(--stage-good)' : 'var(--stage-muted)'} weight={on ? 3 : 1.5} opacity={on ? 1 : 0.6} />
                <Label x={(a.depth + b.depth) / 2} y={(a.y + b.y) / 2} text={mode === 'probability' ? `${e.label} ${frac(e.weight)}` : e.label} color={on ? 'var(--stage-good)' : 'var(--stage-fg)'} size={11} dy={-7} />
              </Fragment>
            );
          })}
          {built.nodes.map((n) => (
            <Fragment key={n.id}>
              <Dot x={n.depth} y={n.y} r={n.leaf ? 4 : 3} color={n.leaf ? 'var(--stage-accent)' : 'var(--stage-fg)'} opacity={n.leaf ? 1 : 0.6} />
              {n.leaf && <Label x={n.depth} y={n.y} text={mode === 'probability' ? `${n.label} = ${frac(built.leafPaths.find((p) => p.id === n.id)?.prob ?? 0)}` : n.label} color="var(--stage-accent)" size={11} dx={10} anchor="start" />}
            </Fragment>
          ))}
        </Stage>
      </div>

      {built.overflow && <p className="lab-prompt">Tree truncated at {MAX_LEAVES} paths — shrink the pool/draws to see it all.</p>}
    </>
  );

  const controls = mode === 'count' ? (
    <ControlBar>
      <Field label={ask === 'unordered' ? 'How many unordered selections?' : 'How many paths (outcomes)?'}>
        <Stepper value={guess} onChange={(v) => { setGuess(v); setChecked(false); }} min={0} max={Math.max(20, orderedTotal * 2)} />
      </Field>
      <CheckButton onClick={check}>Check</CheckButton>
      {checked && <StatusPill ok={guess === target}>{guess === target ? `✓ ${target}` : `Not yet — count the branches`}</StatusPill>}
      {built.leafPaths.length <= 16 && (
        <Field label="Trace each path">
          {built.leafPaths.map((p, i) => <Chip key={i} selected={sel === i} onClick={() => setSel(sel === i ? -1 : i)}>{p.path}</Chip>)}
          {sel >= 0 && <span style={{ fontSize: 12, color: 'var(--stage-muted)' }}>path {sel + 1} of {orderedTotal}</span>}
        </Field>
      )}
    </ControlBar>
  ) : (
    <ControlBar>
      <Field label="Trace a path">
        {built.leafPaths.map((p, i) => <Chip key={i} selected={sel === i} onClick={() => setSel(i)}>{p.path}</Chip>)}
      </Field>
      {selPath && <StatusPill ok>P({selPath.path}) = {frac(selPath.prob)} = {selPath.prob.toFixed(3)}</StatusPill>}
    </ControlBar>
  );

  const footer = (
    <>
      {mode === 'count' && checked && (
        <p className="lab-prompt">
          Multiplication principle: <b><Tex tex={`${factorStr} = ${orderedTotal}`} /></b> ordered outcomes.
          {ask === 'unordered' && <> Order doesn’t matter, so divide by {k}! = {factorial(k)}: <b><Tex tex={`${orderedTotal} / ${factorial(k)} = ${unorderedTotal}`} /></b>.</>}
        </p>
      )}
      {mode === 'count' && (
        <RevealSolution available={checked && !solved} solution={<>The count is <b>{target}</b> — <Tex tex={`${factorStr}${ask === 'unordered' ? ` \\div ${k}!` : ''}`} />.</>} onReveal={reveal} />
      )}
      <HintLadder hints={hints} />
    </>
  );

  return <LabFrame title={title} prompt={prompt} objectives={objectives} controls={controls} footer={footer}>{figure}</LabFrame>;
}
