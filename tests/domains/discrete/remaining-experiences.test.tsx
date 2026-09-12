import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { VennSetBoardLab } from '../../../src/discrete/venn/preset.js';
import { PascalTriangleLab } from '../../../src/discrete/pascal/preset.js';
import RuleCardRuntime from '../../../src/domains/discrete/rule-card/runtime.js';
import vennManifest from '../../../src/domains/discrete/venn/manifest.js';
import pascalManifest from '../../../src/domains/discrete/pascal/manifest.js';
import ruleCardManifest from '../../../src/domains/discrete/rule-card/manifest.js';

describe('remaining discrete learning experiences', () => {
  it('turns a set expression into checked Venn regions and explains overlap', () => {
    render(
      <VennSetBoardLab
        sets={[
          { name: 'A', members: [1, 2] },
          { name: 'B', members: [2, 3] },
        ]}
        mode="shade"
        target="A ∩ B"
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'A ∩ B' }));
    fireEvent.click(screen.getByRole('button', { name: 'Check' }));
    expect(screen.getByText(/exactly right/i)).not.toBeNull();
    fireEvent.click(screen.getByRole('radio', { name: /counted twice/i }));
    expect(screen.getByText(/one copy of the overlap/i)).not.toBeNull();
  });

  it('requires interaction with Pascal’s triangle as well as transfer reasoning', () => {
    render(<PascalTriangleLab rows={5} />);
    fireEvent.click(screen.getByRole('button', { name: 'row 5, position 2, value 10' }));
    expect(screen.getByText(/selected row 5, position 2, value 10/i)).not.toBeNull();
    fireEvent.click(screen.getByRole('radio', { name: '10' }));
    expect(screen.getByText(/counts ordered pairs/i)).not.toBeNull();
  });

  it('ships a prediction-gated visual rule instead of a static custom default', () => {
    const { container } = render(<RuleCardRuntime />);
    expect(screen.getByText(/predict before exploring/i)).not.toBeNull();
    expect(container.querySelector('.lab-predict-body')?.getAttribute('data-locked')).toBe('true');
    fireEvent.click(screen.getByRole('radio', { name: '12' }));
    expect(container.querySelector('.lab-predict-body')?.hasAttribute('data-locked')).toBe(false);
    expect(screen.getByLabelText(/rule of product.*visualization/i)).not.toBeNull();
  });

  it('rejects ambiguous sets, unsafe rows, and ungated custom rules', () => {
    expect(vennManifest.schema.safeParse({ sets: [{ name: 'A', members: [1] }] }).success).toBe(false);
    expect(
      vennManifest.schema.safeParse({
        sets: [
          { name: 'A', members: [1, 1] },
          { name: 'B', members: [2] },
        ],
      }).success,
    ).toBe(false);
    expect(
      vennManifest.schema.safeParse({
        sets: [
          { name: 'A', members: [1] },
          { name: 'A', members: [2] },
        ],
      }).success,
    ).toBe(false);
    expect(pascalManifest.schema.safeParse({ rows: 15 }).success).toBe(false);
    expect(ruleCardManifest.schema.safeParse({ preset: 'none', name: 'Custom', formula: 'x' }).success).toBe(
      false,
    );
    expect(
      ruleCardManifest.schema.safeParse({
        preset: 'none',
        name: 'Custom',
        formula: 'x',
        challenge: {
          prompt: 'Which?',
          choices: [
            { value: 'a', label: 'A' },
            { value: 'b', label: 'B' },
          ],
          answer: 'missing',
        },
      }).success,
    ).toBe(false);
  });
});
