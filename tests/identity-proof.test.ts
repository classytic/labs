import { describe, expect, it } from 'vitest';
import {
  isComplete,
  judge,
  menuFor,
  proofProblems,
  workingAfter,
  type Move,
  type Proof,
} from '../src/math/identity-proof/core.js';
import { DEFAULT_MOVES, DEFAULT_PROOF } from '../src/math/identity-proof/default-proof.js';

describe('the default proof is a real proof', () => {
  it('has no authoring problems', () => {
    expect(proofProblems(DEFAULT_PROOF, DEFAULT_MOVES)).toEqual([]);
  });

  it('chains: every step starts where the previous one ended', () => {
    for (let i = 0; i + 1 < DEFAULT_PROOF.steps.length; i++) {
      expect(DEFAULT_PROOF.steps[i + 1]!.from).toBe(DEFAULT_PROOF.steps[i]!.to);
    }
  });

  it('arrives at the target it claims to prove', () => {
    expect(DEFAULT_PROOF.steps.at(-1)!.to).toContain(DEFAULT_PROOF.target);
  });

  it('offers a real choice at every step', () => {
    for (const step of DEFAULT_PROOF.steps) expect(step.detours!.length).toBeGreaterThan(0);
  });
});

describe('judging a choice', () => {
  const step = DEFAULT_PROOF.steps[0]!;

  it('advances on the move that works, and carries the reason', () => {
    const verdict = judge(step, 'to-sin-cos');
    expect(verdict.kind).toBe('advance');
    if (verdict.kind === 'advance') {
      expect(verdict.to).toBe(step.to);
      expect(verdict.why.length).toBeGreaterThan(20);
    }
  });

  it('explains a detour rather than calling it wrong', () => {
    // The whole point of the lab: a legal move that goes nowhere gets a reason, not a buzzer.
    const verdict = judge(step, 'square-both');
    expect(verdict.kind).toBe('detour');
    if (verdict.kind === 'detour') expect(verdict.why).toMatch(/both sides/i);
  });

  it('reports a move that was never on this menu as unavailable', () => {
    expect(judge(step, 'cancel').kind).toBe('unavailable');
  });
});

describe('the menu', () => {
  // A fixture, not the shipped default. The menu's behaviour is a property of the ENGINE, and the
  // first version of these tests asserted it against the authored default instead. That coupling
  // broke the moment the default was shortened, which is the tests telling the truth about a bad
  // dependency rather than about a bad engine.
  const FIXTURE: Proof = {
    claim: 'a \\equiv d',
    start: 'lhs',
    target: 'd',
    steps: (['m1', 'm2', 'm3', 'm4'] as const).map((move, i) => ({
      from: String.fromCharCode(97 + i),
      move,
      to: String.fromCharCode(98 + i),
      why: 'because',
      detours: (['d1', 'd2', 'd3'] as const).map((d) => ({ move: `${d}-${i}`, why: 'no' })),
    })),
  };

  it('offers exactly the correct move plus its detours', () => {
    const step = FIXTURE.steps[1]!;
    expect(new Set(menuFor(step, 1))).toEqual(new Set([step.move, ...step.detours!.map((d) => d.move)]));
  });

  it('does not simply list the correct move first', () => {
    // A menu that always leads with the answer can be answered without reading it.
    const positions = FIXTURE.steps.map((step, i) => menuFor(step, i).indexOf(step.move));
    expect(positions.some((p) => p > 0)).toBe(true);
  });

  it('is stable, so the server and the browser agree', () => {
    // Math.random here would re-order between the server render and the browser one, React would
    // throw away the markup, and the menu would visibly jump on load. Determinism is the whole
    // requirement; two different steps happening to share an order is harmless.
    for (const [i, step] of FIXTURE.steps.entries()) {
      expect(menuFor(step, i)).toEqual(menuFor(step, i));
    }
  });

  it('loses nothing: every option is offered exactly once', () => {
    for (const [i, step] of FIXTURE.steps.entries()) {
      const menu = menuFor(step, i);
      expect(menu).toHaveLength(1 + step.detours!.length);
      expect(new Set(menu).size).toBe(menu.length);
    }
  });
});

describe('the working so far', () => {
  it('starts with the opening expression alone', () => {
    expect(workingAfter(DEFAULT_PROOF, 0)).toEqual([DEFAULT_PROOF.steps[0]!.from]);
  });

  it('grows by one line per completed step', () => {
    expect(workingAfter(DEFAULT_PROOF, 2)).toHaveLength(3);
    expect(workingAfter(DEFAULT_PROOF, 2).at(-1)).toBe(DEFAULT_PROOF.steps[1]!.to);
  });

  it('stops growing once the proof is finished', () => {
    const all = DEFAULT_PROOF.steps.length;
    expect(workingAfter(DEFAULT_PROOF, all)).toHaveLength(all + 1);
    expect(workingAfter(DEFAULT_PROOF, all + 5)).toHaveLength(all + 1);
    expect(isComplete(DEFAULT_PROOF, all)).toBe(true);
    expect(isComplete(DEFAULT_PROOF, all - 1)).toBe(false);
  });
});

describe('authoring checks', () => {
  const moves: Move[] = [
    { id: 'a', label: 'A' },
    { id: 'b', label: 'B' },
  ];
  const sound: Proof = {
    claim: 'x \\equiv y',
    start: 'lhs',
    target: 'y',
    steps: [{ from: 'x', move: 'a', to: 'y', why: 'because', detours: [{ move: 'b', why: 'no' }] }],
  };

  it('passes a sound proof', () => {
    expect(proofProblems(sound, moves)).toEqual([]);
  });

  it('catches a BROKEN CHAIN, which is invisible in review', () => {
    // Edit one line's wording, forget the next line's `from`, and every step still looks fine on
    // its own while the proof silently jumps. This is the check the module exists for.
    const broken: Proof = {
      ...sound,
      target: 'z',
      steps: [
        { from: 'x', move: 'a', to: 'y', why: 'w', detours: [{ move: 'b', why: 'n' }] },
        { from: 'NOT-y', move: 'b', to: 'z', why: 'w', detours: [{ move: 'a', why: 'n' }] },
      ],
    };
    expect(proofProblems(broken, moves)).toContain('step 1 ends at "y" but step 2 starts at "NOT-y"');
  });

  it('catches a proof that never reaches its target', () => {
    expect(proofProblems({ ...sound, target: 'z' }, moves)).toContain(
      'the last step ends at "y", which is not the target "z"',
    );
  });

  it('catches a step with nothing to decide', () => {
    const noChoice: Proof = { ...sound, steps: [{ from: 'x', move: 'a', to: 'y', why: 'w' }] };
    expect(proofProblems(noChoice, moves)[0]).toMatch(/nothing to decide/);
  });

  it('catches an unknown move and a detour that is secretly the answer', () => {
    const bad: Proof = {
      ...sound,
      steps: [{ from: 'x', move: 'ghost', to: 'y', why: 'w', detours: [{ move: 'ghost', why: 'n' }] }],
    };
    const problems = proofProblems(bad, moves);
    expect(problems).toContain('step 1 uses the unknown move "ghost"');
    expect(problems).toContain('step 1 lists its own correct move as a detour');
  });
});
