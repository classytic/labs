import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { OpticsLab } from '../dist/physics/index.mjs';
import { DerivativeExplorer } from '../dist/math/index.mjs';

// WAI-ARIA APG: a draggable handle must expose proper slider semantics.
describe('draggable handle accessibility', () => {
  it('OpticsLab draggable handles are role=slider with valuenow + valuetext', () => {
    const { container } = render(<OpticsLab />);
    const sliders = container.querySelectorAll('[role="slider"]');
    expect(sliders.length).toBeGreaterThan(0);
    const s = sliders[0]!;
    expect(s.getAttribute('tabindex')).toBe('0');
    expect(s.getAttribute('aria-valuenow')).toBeTruthy();
    expect(s.getAttribute('aria-valuetext')).toMatch(/x .*y /); // free 2D point → "x .., y .."
    expect(s.getAttribute('aria-label')).toBeTruthy();
  });

  it('a constrained (1D) handle announces a single value + orientation', () => {
    // DerivativeExplorer's point moves on the curve; the integral/limit endpoints
    // are horizontal sliders. Render derivative and assert a slider exists.
    const { container } = render(<DerivativeExplorer equation="x^2" />);
    const s = container.querySelector('[role="slider"]');
    expect(s).not.toBeNull();
    expect(s!.getAttribute('aria-orientation')).toBeTruthy();
  });
});
