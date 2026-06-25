'use client';

/**
 * CycleLab — ONE authorable lab for every cycle (water, rock, carbon, nitrogen,
 * food chains…). The creator/agent declares the model (nodes + process-labelled
 * edges) and a challenge; the shared CycleDiagram renders it. Not a bespoke
 * WaterCycle/RockCycle widget — the cycle is data.
 *
 *  • challenge='trace' — click a stage; its outgoing arrows + the processes that
 *    drive them light up. The branched rock/carbon cycles reveal that you don't
 *    have to go all the way around — any rock can melt or re-weather.
 *  • challenge='label-process' — the process names are stripped off the arrows
 *    into a tray; match each one to the transition it drives. That IS the IGCSE
 *    skill, and it's unambiguous (clean rings like the water cycle).
 *
 * Tokenized, reduced-motion safe (all motion is click-driven), agent-drivable.
 */

import { useMemo, useState, type ReactNode } from 'react';
import { CycleDiagram, edgeKey, type CycleNode, type CycleEdge } from '../../kit/cycle.js';
import { Chip, StatusPill } from '../../kit/controls.js';
import { LabFrame, ControlBar, Field, LiveRegion } from '../../kit/frame.js';
import { useCheckpoint } from '../../kit/pedagogy.js';
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

// deterministic shuffle (SSR-safe — no Math.random): order by a stable string hash
const hash = (s: string): number => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h >>> 0; };

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
    return <TraceCycle nodes={nodes} edges={edges} size={size} title={title} prompt={prompt} objectives={objectives} activity="cycle-trace" />;
  }
  return <LabelProcess nodes={nodes} edges={edges} size={size} title={title} prompt={prompt} objectives={objectives} hash={hash} activity="cycle-label" />;
}

// ── trace: click a stage → light its outgoing processes ──────────────────────
function TraceCycle({ nodes, edges, size, title, prompt, objectives, activity }: {
  nodes: CycleNode[]; edges: CycleEdge[]; size: number; title: string; prompt?: string; objectives?: string[]; activity: string;
}): ReactNode {
  const [active, setActive] = useState<string | null>(null);
  const [seen, setSeen] = useState<Set<string>>(new Set());
  const [reported, setReported] = useState(false);
  useCheckpoint({ solved: reported, activity });
  const labelOf = (id?: string | null): string => nodes.find((n) => n.id === id)?.label ?? '';
  const out = active ? edges.filter((e) => e.from === active) : [];

  const click = (id: string): void => {
    setActive(id);
    setSeen((s) => {
      const next = new Set(s).add(id);
      if (next.size >= nodes.length) setReported(true);
      return next;
    });
  };

  const figure = (
    <>
      <div style={{ borderRadius: 14, background: 'var(--stage-bg)', border: '1px solid var(--stage-grid)', padding: 8 }}>
        <CycleDiagram nodes={nodes} edges={edges} size={size} activeId={active} onNodeClick={click} ariaLabel={`${title} — click a stage to trace its transitions`} />
      </div>
      <LiveRegion>
        {active ? `${labelOf(active)} leads to ${out.map((e) => `${labelOf(e.to)} by ${e.label}`).join(', ') || 'nothing further'}.` : ''}
      </LiveRegion>
    </>
  );

  const footer = (
    <div className="lab-bar" style={{ flexWrap: 'wrap', gap: 10, minHeight: 30 }}>
      {active ? (
        out.length ? out.map((e) => (
          <span key={edgeKey(e)} style={{ fontSize: 13 }}>
            <b style={{ color: 'var(--stage-accent)' }}>{labelOf(active)}</b>
            <span style={{ color: 'var(--stage-muted)' }}> —{e.label}→ </span>
            <b>{labelOf(e.to)}</b>
          </span>
        )) : <span style={{ color: 'var(--stage-muted)' }}>{labelOf(active)} is an end of this path here.</span>
      ) : <span style={{ color: 'var(--stage-muted)' }}>Tap a stage to begin.</span>}
      <StatusPill ok={seen.size >= nodes.length}>{seen.size}/{nodes.length} stages traced</StatusPill>
    </div>
  );

  return <LabFrame title={title} prompt={prompt ?? 'Click each stage to trace where it goes — and which process drives the change.'} objectives={objectives} footer={footer}>{figure}</LabFrame>;
}

// ── label-process: match each process name to the arrow it drives ────────────
function LabelProcess({ nodes, edges, size, title, prompt, objectives, hash: h, activity }: {
  nodes: CycleNode[]; edges: CycleEdge[]; size: number; title: string; prompt?: string; objectives?: string[]; hash: (s: string) => number; activity: string;
}): ReactNode {
  const labelEdges = useMemo(() => edges.filter((e) => e.label), [edges]);
  const trueLabel = useMemo(() => Object.fromEntries(labelEdges.map((e) => [edgeKey(e), e.label!])), [labelEdges]);
  const allLabels = useMemo(() => [...new Set(labelEdges.map((e) => e.label!))].sort((a, b) => h(a) - h(b)), [labelEdges, h]);

  const [assign, setAssign] = useState<Record<string, string | null>>({});
  const [sel, setSel] = useState<string | null>(null);

  const correct = (k: string): boolean => assign[k] === trueLabel[k];
  const placed = labelEdges.filter((e) => correct(edgeKey(e))).map((e) => assign[edgeKey(e)]!);
  const pool = allLabels.filter((l) => !placed.includes(l));
  const solvedCount = labelEdges.filter((e) => correct(edgeKey(e))).length;
  const solved = solvedCount === labelEdges.length;
  useCheckpoint({ solved: solved && pool.length === 0, activity });

  const onSlot = (key: string): void => {
    if (correct(key)) { setAssign((a) => ({ ...a, [key]: null })); return; } // tap a correct one to free it
    if (!sel) return;
    setAssign((a) => ({ ...a, [key]: sel }));
    setSel(null);
  };

  const edgeSlot = (_e: CycleEdge, key: string, mid: { x: number; y: number }): ReactNode => {
    const val = assign[key];
    const ok = val != null && val === trueLabel[key];
    const bad = val != null && !ok;
    const w = (val ? val.length * 5.7 : 16) + 16;
    const stroke = ok ? 'var(--stage-good)' : bad ? 'var(--stage-danger)' : 'var(--stage-grid)';
    const fill = ok ? 'var(--stage-good)' : bad ? 'var(--stage-danger)' : 'var(--stage-muted)';
    return (
      <g onClick={() => onSlot(key)} style={{ cursor: 'pointer' }} role="button" aria-label={val ? `${val}${ok ? ' correct' : ' wrong'}` : 'empty slot'}>
        <rect x={Math.round(mid.x - w / 2)} y={mid.y - 10} width={Math.round(w)} height={20} rx={10} fill="var(--stage-bg)" stroke={stroke} strokeWidth={1.6} />
        <text x={mid.x} y={mid.y} fontSize={10.5} fontWeight={700} textAnchor="middle" dominantBaseline="central" fill={fill}>{val ?? '?'}</text>
      </g>
    );
  };

  const figure = (
    <>
      <div style={{ borderRadius: 14, background: 'var(--stage-bg)', border: '1px solid var(--stage-grid)', padding: 8 }}>
        <CycleDiagram nodes={nodes} edges={edges} size={size} edgeSlot={edgeSlot} ariaLabel={`${title} — match each process to its arrow`} />
      </div>
      <LiveRegion>
        {solved ? 'All processes matched correctly.' : `${solvedCount} of ${labelEdges.length} processes matched.`}
      </LiveRegion>
    </>
  );

  const controls = (
    <ControlBar>
      <Field label="processes">
        <span style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {pool.length ? pool.map((l) => (
            <Chip key={l} selected={sel === l} onClick={() => setSel((s) => (s === l ? null : l))}>{l}</Chip>
          )) : <span style={{ color: 'var(--stage-good)', fontWeight: 700 }}>All processes placed ✓</span>}
        </span>
      </Field>
    </ControlBar>
  );

  const footer = (
    <StatusPill ok={solved}>{solvedCount}/{labelEdges.length} correct</StatusPill>
  );

  return <LabFrame title={title} prompt={prompt ?? 'Pick a process, then tap the arrow it drives. Green locks it in; tap a locked one to take it back.'} objectives={objectives} controls={controls} footer={footer}>{figure}</LabFrame>;
}
