'use client';

/**
 * IdentityProof, where the learner picks the MOVE instead of watching it.
 *
 * `Derivation` shows the next line and justifies it. That is right for a formula with one route and
 * wrong for proving an identity, where the examinable difficulty is not executing a step but
 * deciding which step to reach for. A learner who has watched five proofs still freezes at line
 * one, because nothing they watched was a decision.
 *
 * So the menu here mixes the move that works with moves that are legal algebra and go nowhere, and
 * a detour is answered with the REASON it goes nowhere rather than a buzzer. "Squaring both sides
 * assumes the thing you are proving" and "the right idea one step too early" are the sentences that
 * actually transfer, and no worked example contains them, because a worked example never takes the
 * wrong turning.
 *
 * The two rules of the game sit permanently on screen rather than in the feedback, because they are
 * what a learner forgets under pressure: work one side only, and start from the messier side.
 * See ./core.ts for why the chain is checked for connectedness at author time.
 */

import { useState, type ReactNode } from 'react';
import { Tex } from '../../core/tex.js';
import { Activity } from '../../kit/activity.js';
import { Chip } from '../../kit/controls.js';
import { LiveRegion, Readout } from '../../kit/frame.js';
import { useCheckpoint } from '../../kit/pedagogy.js';
import {
  isComplete,
  judge,
  menuFor,
  proofProblems,
  workingAfter,
  type Move,
  type Proof,
  type Verdict,
} from './core.js';
import { DEFAULT_MOVES, DEFAULT_PROOF } from './default-proof.js';

export interface IdentityProofProps {
  proof?: Proof;
  moves?: Move[];
  title?: string;
  prompt?: string;
  activity?: string;
}

export function IdentityProof({
  proof = DEFAULT_PROOF,
  moves = DEFAULT_MOVES,
  title = 'Prove the identity: choosing the move is the skill',
  prompt = 'Every move below is legal algebra. Only one gets closer to the other side, and the rest are answered with the reason they lead nowhere.',
  activity = 'identity-proof',
}: IdentityProofProps = {}): ReactNode {
  const [done, setDone] = useState(0);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [detours, setDetours] = useState(0);

  const labelOf = (id: string): string => moves.find((m) => m.id === id)?.label ?? id;
  const finished = isComplete(proof, done);
  const step = proof.steps[done];
  const lines = workingAfter(proof, done);

  useCheckpoint({ solved: finished, activity });

  const choose = (moveId: string): void => {
    if (!step) return;
    const result = judge(step, moveId);
    setVerdict(result);
    if (result.kind === 'advance') setDone((n) => n + 1);
    else if (result.kind === 'detour') setDetours((n) => n + 1);
  };

  // Authoring problems are surfaced in the lab itself, not only in the check script, because a
  // broken chain still renders as a plausible proof and a reviewer looking at it would see nothing.
  const problems = proofProblems(proof, moves);

  return (
    <Activity.Root className="math-identity-proof">
      <Activity.Header>
        <Activity.Heading eyebrow="Trigonometry" title={title} description={prompt} />
        <Activity.FocusButton />
      </Activity.Header>
      <Activity.Status>
        <strong>
          step {Math.min(done + 1, proof.steps.length)} of {proof.steps.length}
        </strong>
        <span>working the {proof.start === 'lhs' ? 'left' : 'right'} side</span>
        <span>
          {detours === 0 ? 'no detours yet' : `${detours} detour${detours === 1 ? '' : 's'} explained`}
        </span>
      </Activity.Status>

      <Activity.Workspace>
        <Activity.Canvas label="The identity and the working so far">
          <div className="lab-proof-claim">
            <span className="lab-eyebrow">Prove that</span>
            <Tex tex={proof.claim} block />
          </div>
          <ol className="lab-proof-working">
            {lines.map((line, i) => (
              <li key={i} data-latest={i === lines.length - 1}>
                <Tex tex={line} block />
                {i > 0 ? <span className="lab-proof-move">{labelOf(proof.steps[i - 1]!.move)}</span> : null}
              </li>
            ))}
          </ol>
          {finished ? (
            <p className="lab-proof-qed">
              This is the right-hand side, so the identity is proved. Write <strong>as required</strong>.
            </p>
          ) : null}
        </Activity.Canvas>

        <Activity.Dock>
          {step ? (
            <div className="lab-proof-choice">
              <span className="lab-field-label">What do you do next?</span>
              <div className="lab-proof-menu">
                {menuFor(step, done).map((id) => (
                  <Chip key={id} selected={false} onClick={() => choose(id)}>
                    {labelOf(id)}
                  </Chip>
                ))}
              </div>
            </div>
          ) : null}
        </Activity.Dock>

        {verdict ? (
          <Readout
            value={verdict.kind === 'advance' ? 'That is the move' : 'Legal, but it goes nowhere'}
            sub={verdict.kind === 'unavailable' ? 'That move is not on this menu.' : verdict.why}
          />
        ) : (
          <Readout
            value={`Start from the ${proof.start === 'lhs' ? 'left' : 'right'}-hand side`}
            sub="It is the messier one, so there is something to cancel and a fixed target to aim at."
          />
        )}
      </Activity.Workspace>

      <Activity.Feedback>
        <span>The two rules</span>
        <div>
          Work on <strong>one side only</strong>. Anything done to both sides at once, such as squaring or
          cross-multiplying, assumes the identity you are trying to prove and scores nothing. And start from
          the <strong>messier side</strong>: it has terms to cancel, and the simpler side sits there as the
          target you are aiming at.
          {problems.length ? ` Authoring note: ${problems.join('; ')}.` : ''}
        </div>
      </Activity.Feedback>

      <LiveRegion>
        {finished
          ? 'Proof complete.'
          : `Step ${done + 1} of ${proof.steps.length}. ${verdict?.kind === 'detour' ? 'That move does not advance the proof.' : ''}`}
      </LiveRegion>
    </Activity.Root>
  );
}
