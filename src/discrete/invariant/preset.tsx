'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { RotateCcw } from 'lucide-react';
import { Activity } from '../../kit/activity.js';
import { ActionButton, IconButton, Stepper } from '../../kit/controls.js';
import { Field } from '../../kit/frame.js';
import { useCheckpoint } from '../../kit/pedagogy.js';
import {
  applyInvariantMove,
  residueInvariant,
  targetReachableByInvariant,
  type InvariantMove,
} from './core.js';

export interface InvariantDetectiveProps {
  start?: number;
  target?: number;
  modulus?: number;
  moves?: InvariantMove[];
  title?: string;
  prompt?: string;
}
const DEFAULT_MOVES: InvariantMove[] = [
  { id: 'pair-up', label: 'Add two', delta: 2 },
  { id: 'pair-down', label: 'Remove two', delta: -2 },
];

export function InvariantDetectiveLab({
  start: initialStart = 5,
  target: initialTarget = 12,
  modulus = 2,
  moves = DEFAULT_MOVES,
  title = 'Can legal moves ever reach the target?',
  prompt = 'Try moves, then use the conserved residue to prove possibility or impossibility without searching forever.',
}: InvariantDetectiveProps): ReactNode {
  const [start, setStart] = useState(initialStart);
  const [target, setTarget] = useState(initialTarget);
  const [state, setState] = useState({ value: initialStart, moves: [] as string[] });
  const [committed, setCommitted] = useState(false);
  const reachable = useMemo(
    () => targetReachableByInvariant(start, target, moves, modulus),
    [start, target, moves, modulus],
  );
  const reset = (nextStart = start): void => {
    setState({ value: nextStart, moves: [] });
    setCommitted(false);
  };
  useCheckpoint({ solved: committed, activity: `invariant:${start}:${target}:${modulus}` });
  return (
    <Activity.Root className="discrete-invariant-activity">
      <Activity.Header>
        <Activity.Heading eyebrow="Invariant reasoning" title={title} description={prompt} />
        <Activity.FocusButton />
      </Activity.Header>
      <Activity.Status>
        <strong>
          {committed
            ? reachable
              ? 'Not ruled out by this invariant'
              : 'Impossible by invariant'
            : 'Investigate'}
        </strong>
        <span>value {state.value}</span>
        <span>residue {residueInvariant(state.value, modulus)}</span>
      </Activity.Status>
      <Activity.Workspace>
        <Activity.Canvas label="Move history and invariant">
          <div className="invariant-track">
            <span data-kind="start">{start}</span>
            {state.moves.map((id, index) => {
              const move = moves.find((item) => item.id === id)!;
              return (
                <span key={index}>
                  {move.delta >= 0 ? '+' : ''}
                  {move.delta}
                </span>
              );
            })}
            <strong>{state.value}</strong>
            <span data-kind="target">target {target}</span>
          </div>
          <div className="invariant-ledger">
            <span>
              start residue <b>{residueInvariant(start, modulus)}</b>
            </span>
            <span>
              current residue <b>{residueInvariant(state.value, modulus)}</b>
            </span>
            <span>
              target residue <b>{residueInvariant(target, modulus)}</b>
            </span>
          </div>
        </Activity.Canvas>
        <Activity.Inspector label="Legal moves and target">
          <div className="lab-activity-fields">
            <Field label="start">
              <Stepper
                value={start}
                onChange={(value) => {
                  setStart(value);
                  reset(value);
                }}
                min={0}
                max={20}
              />
            </Field>
            <Field label="target">
              <Stepper
                value={target}
                onChange={(value) => {
                  setTarget(value);
                  setCommitted(false);
                }}
                min={0}
                max={24}
              />
            </Field>
            <div className="proof-step-actions">
              {moves.map((move) => (
                <ActionButton
                  key={move.id}
                  className="lab-btn-ghost"
                  onClick={() => {
                    setState((current) => applyInvariantMove(current, move));
                    setCommitted(false);
                  }}
                  disabled={state.value + move.delta < 0}
                >
                  {move.label} ({move.delta >= 0 ? '+' : ''}
                  {move.delta})
                </ActionButton>
              ))}
            </div>
            <ActionButton onClick={() => setCommitted(true)}>Use residue mod {modulus}</ActionButton>
          </div>
        </Activity.Inspector>
      </Activity.Workspace>
      <Activity.Feedback>
        <span>{committed ? 'Conclusion' : 'Detect'}</span>
        <div>
          {committed
            ? reachable
              ? `The residues agree, so parity does not disprove reachability; another argument may still be needed.`
              : `Every legal move preserves residue ${residueInvariant(start, modulus)}, but the target has residue ${residueInvariant(target, modulus)}. It is unreachable.`
            : `Every legal move changes the value by a multiple of ${modulus}. Watch what never changes.`}
        </div>
      </Activity.Feedback>
      <Activity.Transport>
        <IconButton label="Reset invariant game" onClick={() => reset()}>
          <RotateCcw aria-hidden="true" />
        </IconButton>
        <div className="lab-transport-state">
          <strong>{state.moves.length} moves tried</strong>
          <span>
            {state.value} → target {target}
          </span>
        </div>
      </Activity.Transport>
    </Activity.Root>
  );
}
