'use client';

/**
 * CycleLab, ONE authorable lab for every cycle (water, rock, carbon, nitrogen,
 * food chains…). The creator/agent declares the model (nodes + process-labelled
 * edges) and a challenge; the shared CycleDiagram renders it. Not a bespoke
 * WaterCycle/RockCycle widget, the cycle is data.
 *
 *  • challenge='trace', click a stage; its outgoing arrows + the processes that
 *    drive them light up. The branched rock/carbon cycles reveal that you don't
 *    have to go all the way around, any rock can melt or re-weather.
 *  • challenge='label-process', the process names are stripped off the arrows
 *    into a tray; match each one to the transition it drives. That IS the IGCSE
 *    skill, and it's unambiguous (clean rings like the water cycle).
 *
 * Tokenized, reduced-motion safe (all motion is click-driven), agent-drivable.
 */

import { useMemo, useState, type ReactNode } from 'react';
import { RotateCcw } from 'lucide-react';
import { CycleDiagram, edgeKey, type CycleNode, type CycleEdge } from '../../kit/cycle.js';
import { Chip, IconButton, StatusPill } from '../../kit/controls.js';
import { Activity } from '../../kit/activity.js';
import { Field } from '../../kit/frame.js';
import { ChallengeCard, useChallenge, useCheckpoint, type ChallengeQuestion } from '../../kit/pedagogy.js';
import { WATER_CYCLE } from '../cycles.js';

export type CycleChallenge = 'trace' | 'label-process';

export interface CycleLabProps {
  nodes?: CycleNode[];
  edges?: CycleEdge[];
  challenge?: CycleChallenge;
  size?: number;
  title?: string;
  prompt?: string;
  objectives?: string[];
}

// deterministic shuffle (SSR-safe, no Math.random): order by a stable string hash
const hash = (s: string): number => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h >>> 0;
};

export function CycleLab({
  nodes = WATER_CYCLE.nodes,
  edges = WATER_CYCLE.edges,
  challenge = 'label-process',
  size = 340,
  title = 'The water cycle',
  prompt,
  objectives,
}: CycleLabProps): ReactNode {
  if (challenge === 'trace') {
    return (
      <TraceCycle
        nodes={nodes}
        edges={edges}
        size={size}
        title={title}
        prompt={prompt}
        objectives={objectives}
        activity="cycle-trace"
      />
    );
  }
  return (
    <LabelProcess
      nodes={nodes}
      edges={edges}
      size={size}
      title={title}
      prompt={prompt}
      objectives={objectives}
      hash={hash}
      activity="cycle-label"
    />
  );
}

// ── trace: click a stage → light its outgoing processes ──────────────────────
function TraceCycle({
  nodes,
  edges,
  size,
  title,
  prompt,
  objectives,
  activity,
}: {
  nodes: CycleNode[];
  edges: CycleEdge[];
  size: number;
  title: string;
  prompt?: string;
  objectives?: string[];
  activity: string;
}): ReactNode {
  const [active, setActive] = useState<string | null>(null);
  const [seen, setSeen] = useState<Set<string>>(new Set());
  const firstEdge = edges[0]!;
  const processChoices = [
    ...new Set(edges.map((edge) => edge.label).filter((label): label is string => !!label)),
  ];
  const transfer: ChallengeQuestion[] = firstEdge
    ? [
        {
          id: 'direct-process',
          prompt: `Which process directly moves ${nodes.find((node) => node.id === firstEdge.from)?.label ?? firstEdge.from} to ${nodes.find((node) => node.id === firstEdge.to)?.label ?? firstEdge.to}?`,
          choices: [
            ...new Set([
              firstEdge.label ?? 'an unlabelled transition',
              ...processChoices.filter((label) => label !== firstEdge.label),
              'a process not shown',
            ]),
          ]
            .slice(0, 4)
            .map((label) => ({ value: label, label })),
          answer: firstEdge.label ?? 'an unlabelled transition',
          explain:
            'A cycle is a directed system: the arrow identifies the destination and its label identifies the process causing that transfer.',
        },
      ]
    : [];
  const challenge = useChallenge(transfer);
  useCheckpoint({ solved: seen.size >= nodes.length && challenge.allCorrect, activity });
  const labelOf = (id?: string | null): string => nodes.find((n) => n.id === id)?.label ?? '';
  const out = active ? edges.filter((e) => e.from === active) : [];

  const click = (id: string): void => {
    setActive(id);
    setSeen((s) => {
      const next = new Set(s).add(id);
      return next;
    });
  };

  const reset = (): void => {
    setActive(null);
    setSeen(new Set());
    challenge.reset();
  };

  const figure = (
    <div className="geography-cycle-scene">
      <CycleDiagram
        nodes={nodes}
        edges={edges}
        size={size}
        activeId={active}
        onNodeClick={click}
        ariaLabel={`${title}: a cycle diagram with ${nodes.length} stages (${nodes.map((nd) => nd.label).join(', ')}) connected by labelled process arrows. Activate a stage to trace its outgoing transitions and the processes that drive them.`}
      />
    </div>
  );

  const evidence = (
    <div className="lab-activity-fields geography-cycle-trace">
      {active ? (
        out.length ? (
          out.map((e) => (
            <span key={edgeKey(e)}>
              <b>{labelOf(active)}</b>
              <span> — {e.label} → </span>
              <b>{labelOf(e.to)}</b>
            </span>
          ))
        ) : (
          <span>{labelOf(active)} is an end of this path here.</span>
        )
      ) : (
        <span>Tap a stage to begin.</span>
      )}
      <StatusPill ok={seen.size >= nodes.length}>
        {seen.size}/{nodes.length} stages traced
      </StatusPill>
    </div>
  );

  return (
    <Activity.Root className="geography-cycle-activity" focusLayout="immersive">
      <Activity.Header>
        <Activity.Heading
          eyebrow="Earth systems"
          title={title}
          description={
            prompt ?? 'Click each stage to trace where it goes, and which process drives the change.'
          }
        />
        <Activity.FocusButton />
      </Activity.Header>
      <Activity.Status>
        <strong>{active ? labelOf(active) : 'choose a stage'}</strong>
        <span>
          {seen.size} of {nodes.length} traced
        </span>
        <span>
          {out.length
            ? `${out.length} outgoing path${out.length === 1 ? '' : 's'}`
            : active
              ? 'path ends here'
              : 'trace mode'}
        </span>
      </Activity.Status>
      <Activity.Workspace>
        <Activity.Canvas label={`${title} directed-cycle diagram`}>{figure}</Activity.Canvas>
        <Activity.Inspector label="Cycle path evidence">{evidence}</Activity.Inspector>
      </Activity.Workspace>
      <Activity.Feedback>
        <span>Observe</span>
        <div>
          {active
            ? `${labelOf(active)} ${out.length ? `moves to ${out.map((edge) => `${labelOf(edge.to)} by ${edge.label}`).join(' or ')}` : 'has no outgoing transition in this model'}.`
            : 'Select a store or stage to expose only the transfers that leave it.'}
        </div>
      </Activity.Feedback>
      <section className="lab-authored-task" aria-label="Transfer the cycle model">
        <ChallengeCard questions={transfer} state={challenge} title="Transfer the cycle model" />
      </section>
      <Activity.LiveRegion>
        {active
          ? `${labelOf(active)} leads to ${out.map((e) => `${labelOf(e.to)} by ${e.label}`).join(', ') || 'nothing further'}.`
          : ''}
      </Activity.LiveRegion>
      <Activity.Transport>
        <IconButton label="Reset cycle trace" onClick={reset}>
          <RotateCcw aria-hidden="true" />
        </IconButton>
        <div className="lab-transport-state" aria-live="polite">
          <strong>{seen.size >= nodes.length ? 'Trace complete' : 'Trace every stage'}</strong>
          <span>
            {seen.size} / {nodes.length} visited
          </span>
        </div>
      </Activity.Transport>
    </Activity.Root>
  );
}

// ── label-process: match each process name to the arrow it drives ────────────
function LabelProcess({
  nodes,
  edges,
  size,
  title,
  prompt,
  objectives,
  hash: h,
  activity,
}: {
  nodes: CycleNode[];
  edges: CycleEdge[];
  size: number;
  title: string;
  prompt?: string;
  objectives?: string[];
  hash: (s: string) => number;
  activity: string;
}): ReactNode {
  const labelEdges = useMemo(() => edges.filter((e) => e.label), [edges]);
  const trueLabel = useMemo(
    () => Object.fromEntries(labelEdges.map((e) => [edgeKey(e), e.label!])),
    [labelEdges],
  );
  const allLabels = useMemo(
    () => labelEdges.map((e) => e.label!).sort((a, b) => h(a) - h(b)),
    [labelEdges, h],
  );

  const [assign, setAssign] = useState<Record<string, string | null>>({});
  const [sel, setSel] = useState<string | null>(null);

  const correct = (k: string): boolean => assign[k] === trueLabel[k];
  const placed = labelEdges.filter((e) => correct(edgeKey(e))).map((e) => assign[edgeKey(e)]!);
  const remainingPlaced = [...placed];
  const pool = allLabels.filter((label) => {
    const index = remainingPlaced.indexOf(label);
    if (index < 0) return true;
    remainingPlaced.splice(index, 1);
    return false;
  });
  const solvedCount = labelEdges.filter((e) => correct(edgeKey(e))).length;
  const solved = solvedCount === labelEdges.length;
  const branched = nodes.some((node) => edges.filter((edge) => edge.from === node.id).length > 1);
  const transfer: ChallengeQuestion[] = [
    {
      id: 'system-transfer',
      prompt: branched
        ? 'What does a branch in this cycle model mean?'
        : 'What can happen if one process in this cycle stops?',
      choices: branched
        ? [
            { value: 'routes', label: 'material can move along more than one direct route' },
            { value: 'simultaneous', label: 'every particle must follow every branch simultaneously' },
          ]
        : [
            { value: 'interrupt', label: 'the connected transfer can be interrupted' },
            { value: 'decorative', label: 'nothing, because process labels are decorative' },
          ],
      answer: branched ? 'routes' : 'interrupt',
      explain: branched
        ? 'Branches encode alternative direct transfers from the same store; they are not a single compulsory ring.'
        : 'Each arrow represents a causal transfer, so removing its process breaks that connection in the system.',
    },
  ];
  const transferChallenge = useChallenge(transfer);
  useCheckpoint({ solved: solved && pool.length === 0 && transferChallenge.allCorrect, activity });

  const onSlot = (key: string): void => {
    if (correct(key)) {
      setAssign((a) => ({ ...a, [key]: null }));
      return;
    } // tap a correct one to free it
    if (!sel) return;
    setAssign((a) => ({ ...a, [key]: sel }));
    setSel(null);
  };

  const reset = (): void => {
    setAssign({});
    setSel(null);
    transferChallenge.reset();
  };

  const edgeSlot = (_e: CycleEdge, key: string, mid: { x: number; y: number }): ReactNode => {
    const val = assign[key];
    const ok = val != null && val === trueLabel[key];
    const bad = val != null && !ok;
    const w = (val ? val.length * 5.7 : 16) + 16;
    const stroke = ok ? 'var(--stage-good)' : bad ? 'var(--stage-danger)' : 'var(--stage-grid)';
    const fill = ok ? 'var(--stage-good)' : bad ? 'var(--stage-danger)' : 'var(--stage-muted)';
    const ariaLabel = val
      ? `${val}, ${ok ? 'correctly matched, activate to take it back' : 'incorrect, activate to clear'}`
      : sel
        ? `Empty process slot, activate to place ${sel} here`
        : 'Empty process slot, pick a process first, then activate to place it here';
    return (
      <g
        onClick={() => onSlot(key)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSlot(key);
          }
        }}
        className="geography-cycle-slot"
        role="button"
        tabIndex={0}
        aria-label={ariaLabel}
      >
        <rect
          x={Math.round(mid.x - w / 2)}
          y={mid.y - 10}
          width={Math.round(w)}
          height={20}
          rx={10}
          fill="var(--stage-bg)"
          stroke={stroke}
          strokeWidth={1.6}
        />
        <text
          x={mid.x}
          y={mid.y}
          fontSize={10.5}
          fontWeight={700}
          textAnchor="middle"
          dominantBaseline="central"
          fill={fill}
        >
          {val ?? '?'}
        </text>
      </g>
    );
  };

  const figure = (
    <div className="geography-cycle-scene">
      <CycleDiagram
        nodes={nodes}
        edges={edges}
        size={size}
        edgeSlot={edgeSlot}
        ariaLabel={`${title}: a cycle diagram with ${nodes.length} stages (${nodes.map((nd) => nd.label).join(', ')}) and ${labelEdges.length} arrows whose process labels have been removed. Pick a process from the tray, then activate the arrow slot it drives to match it.`}
      />
    </div>
  );

  const controls = (
    <div className="lab-activity-fields">
      <Field label="processes">
        <span className="geography-process-tray">
          {pool.length ? (
            pool.map((l, index) => (
              <Chip
                key={`${l}-${index}`}
                selected={sel === l}
                onClick={() => setSel((s) => (s === l ? null : l))}
              >
                {l}
              </Chip>
            ))
          ) : (
            <span className="geography-process-complete">All processes placed ✓</span>
          )}
        </span>
      </Field>
      <StatusPill ok={solved}>
        {solvedCount}/{labelEdges.length} correct
      </StatusPill>
      <p className="lab-muted-copy">
        Choose one process, then place it on the arrow whose transfer it causes.
      </p>
    </div>
  );

  return (
    <Activity.Root className="geography-cycle-activity" focusLayout="immersive">
      <Activity.Header>
        <Activity.Heading
          eyebrow="Earth systems"
          title={title}
          description={
            prompt ??
            'Pick a process, then tap the arrow it drives. Green locks it in; tap a locked one to take it back.'
          }
        />
        <Activity.FocusButton />
      </Activity.Header>
      <Activity.Status>
        <strong>{solved ? 'cycle complete' : sel ? `${sel} selected` : 'choose a process'}</strong>
        <span>
          {solvedCount} of {labelEdges.length} matched
        </span>
        <span>{nodes.length} stages</span>
      </Activity.Status>
      <Activity.Workspace>
        <Activity.Canvas label={`${title} process-matching diagram`}>{figure}</Activity.Canvas>
        <Activity.Inspector label="Process palette and matching evidence">{controls}</Activity.Inspector>
      </Activity.Workspace>
      <Activity.Feedback>
        <span>Observe</span>
        <div>
          {solved
            ? 'Every arrow now names the causal process that transfers material between stores.'
            : sel
              ? `Place ${sel} on the transition it drives.`
              : 'Read an arrow’s direction first, then choose the process that can cause that transfer.'}
        </div>
      </Activity.Feedback>
      <section className="lab-authored-task" aria-label="Transfer the cycle model">
        <ChallengeCard questions={transfer} state={transferChallenge} title="Transfer the cycle model" />
      </section>
      <Activity.LiveRegion>
        {solved
          ? 'All processes matched correctly.'
          : `${solvedCount} of ${labelEdges.length} processes matched.`}
      </Activity.LiveRegion>
      <Activity.Transport>
        <IconButton label="Reset process labels" onClick={reset}>
          <RotateCcw aria-hidden="true" />
        </IconButton>
        <div className="lab-transport-state" aria-live="polite">
          <strong>{solved ? 'Matching complete' : 'Match every process'}</strong>
          <span>
            {solvedCount} / {labelEdges.length} correct
          </span>
        </div>
      </Activity.Transport>
    </Activity.Root>
  );
}
