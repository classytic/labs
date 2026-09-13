/**
 * The proof builder, and the diagram that makes a geometry proof readable.
 *
 * This lab was used by zero lessons. Two reasons, both fixed: its `graph` prop was never declared
 * in the schema, so every lesson got the built-in "n squared even implies n even" proof, which is
 * on no syllabus we teach; and it drew nothing, so a circle theorem could not be stated in it at
 * all. "The angle at the centre is twice the angle at the circumference" is unreadable as a
 * sentence until you can see WHICH two angles.
 */
import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ProofBuilderLab } from '../src/discrete/proof-builder/preset.js';
import { activeHighlights, chooseProofNode, initialProofState, type ProofGraph } from '../src/discrete/proof/core.js';

/** The circle theorem, the case this lab could not previously express. */
const CENTRE_THEOREM: ProofGraph = {
  premises: ['O is the centre', 'A, B and P lie on the circle'],
  target: 'Show that angle AOB = 2 × angle APB',
  conclusion: 'done',
  figure: {
    points: [
      { id: 'O', x: 0, y: 0, label: 'O' },
      { id: 'A', x: -3, y: -4, label: 'A' },
      { id: 'B', x: 3, y: -4, label: 'B' },
      { id: 'P', x: 0, y: 5, label: 'P' },
    ],
    circles: [{ id: 'circ', center: 'O', through: 'A' }],
    segments: [
      { id: 'OA', from: 'O', to: 'A' },
      { id: 'OB', from: 'O', to: 'B' },
      { id: 'OP', from: 'O', to: 'P' },
      { id: 'PA', from: 'P', to: 'A' },
      { id: 'PB', from: 'P', to: 'B' },
    ],
    angles: [
      { id: 'AOB', at: 'O', from: 'A', to: 'B', label: 'AOB' },
      { id: 'APB', at: 'P', from: 'A', to: 'B', label: 'APB' },
    ],
  },
  nodes: [
    {
      id: 'radii',
      statement: 'OA, OB and OP are all radii, so triangle OAP is isosceles',
      justification: 'Every radius of a circle has the same length.',
      highlights: ['OA', 'OP', 'circ'],
    },
    {
      id: 'base',
      statement: 'So the base angles of triangle OAP are equal',
      justification: 'An isosceles triangle has equal base angles.',
      requires: ['radii'],
      highlights: ['OA', 'OP', 'PA'],
    },
    {
      id: 'exterior',
      statement: 'The exterior angle of triangle OAP equals the sum of the two base angles',
      justification: 'The exterior angle theorem.',
      requires: ['base'],
      highlights: ['AOB'],
    },
    {
      id: 'done',
      statement: 'Adding both triangles gives angle AOB = 2 × angle APB',
      justification: 'Each half of the centre angle is twice its circumference angle.',
      requires: ['exterior'],
      highlights: ['AOB', 'APB'],
    },
  ],
};

describe('proof logic', () => {
  it('refuses a step whose supporting steps are not yet established', () => {
    const after = chooseProofNode(CENTRE_THEOREM, initialProofState(), 'done');
    expect(after.chosen).toEqual([]);
    expect(after.complete).toBe(false);
    expect(after.feedback).toMatch(/does not follow/i);
  });

  it('accepts the chain in order and completes on the conclusion', () => {
    let s = initialProofState();
    for (const id of ['radii', 'base', 'exterior', 'done']) s = chooseProofNode(CENTRE_THEOREM, s, id);
    expect(s.chosen).toEqual(['radii', 'base', 'exterior', 'done']);
    expect(s.complete).toBe(true);
  });
});

describe('the figure follows the argument', () => {
  it('lights nothing before the first step, so the diagram is not born grey', () => {
    expect(activeHighlights(CENTRE_THEOREM, []).size).toBe(0);
  });

  it('lights the LAST step only, not everything ever mentioned', () => {
    // A six-step proof that accumulates highlights ends up lighting the whole diagram, which is
    // the same as lighting none of it.
    const lit = activeHighlights(CENTRE_THEOREM, ['radii', 'base', 'exterior']);
    expect([...lit].sort()).toEqual(['AOB']);
    expect(lit.has('OA')).toBe(false);
  });

  it('falls back to the last step that HAS highlights', () => {
    const graph: ProofGraph = {
      ...CENTRE_THEOREM,
      nodes: CENTRE_THEOREM.nodes.map((n) => (n.id === 'exterior' ? { ...n, highlights: undefined } : n)),
    };
    // `exterior` lights nothing, so the figure keeps showing what `base` was about rather than
    // going blank mid-argument.
    const lit = activeHighlights(graph, ['radii', 'base', 'exterior']);
    expect([...lit].sort()).toEqual(['OA', 'OP', 'PA']);
  });
});

describe('the lab renders the authored proof, not its built-in default', () => {
  it('draws the authored figure and target', () => {
    const view = render(<ProofBuilderLab graph={CENTRE_THEOREM} />);
    // The target legitimately appears more than once: the status bar, the canvas target panel and
    // the conclusion step all name it.
    expect(view.getAllByText(/angle AOB = 2/).length).toBeGreaterThan(0);
    expect(view.getByLabelText('Diagram for the argument')).toBeTruthy();
    // The premises are the authored ones, not "n squared is even".
    expect(view.getByText('O is the centre')).toBeTruthy();
    expect(view.queryByText(/n² is even/)).toBeNull();
  });

  it('has no control that changes nothing', () => {
    // The proof-method Segmented set a value no logic read: switching Direct to Contradiction
    // left the argument identical, teaching that the choice is cosmetic.
    const view = render(<ProofBuilderLab graph={CENTRE_THEOREM} />);
    expect(view.queryByLabelText('proof strategy')).toBeNull();
  });

  it('advances the argument when a justified step is chosen', () => {
    const view = render(<ProofBuilderLab graph={CENTRE_THEOREM} />);
    fireEvent.click(view.getByRole('button', { name: /OA, OB and OP are all radii/ }));
    // Once in the feedback panel and once in the live region, which is correct and invisible.
    const said = view.getAllByText(/Every radius of a circle has the same length/);
    expect(said.length).toBeGreaterThan(0);
    // The step is now part of the argument, so it is no longer offered as a choice.
    expect(view.queryByRole('button', { name: /OA, OB and OP are all radii/ })).toBeNull();
  });
});
