/**
 * Creator control policy — `controlConfig` on a lab hides/locks individual knobs
 * uniformly (LabFrame provides; Field/Control consume by `name ?? label`). One lab
 * (RampForcesLab) is the reference; the mechanism is shared, so this guards it.
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { RampForcesLab } from '../dist/physics/index.mjs';

describe('controlConfig hides + locks individual knobs', () => {
  it('with no config, every knob renders and none is locked', () => {
    const { container } = render(<RampForcesLab />);
    const labels = [...container.querySelectorAll('.lab-field-label')].map((n) => n.textContent);
    expect(labels.some((t) => t?.startsWith('mass'))).toBe(true);
    expect(labels.some((t) => t?.startsWith('angle'))).toBe(true);
    expect(container.querySelector('.lab-field[data-locked="true"]')).toBeNull();
  });

  it('hide removes the knob entirely; lock keeps it but freezes it (inert + read-only)', () => {
    const { container } = render(<RampForcesLab controlConfig={{ hide: ['mass'], lock: ['angle'] }} />);
    const labels = [...container.querySelectorAll('.lab-field-label')].map((n) => n.textContent ?? '');

    // hidden: the mass field is gone from the DOM
    expect(labels.some((t) => t.startsWith('mass'))).toBe(false);
    // others still present
    expect(labels.some((t) => t.startsWith('push'))).toBe(true);

    // locked: angle still shown, flagged, and its slider is inert (non-interactive)
    const locked = container.querySelector('.lab-field[data-locked="true"]');
    expect(locked).not.toBeNull();
    expect(locked!.querySelector('.lab-field-label')!.textContent).toMatch(/^angle/);
    const wrap = locked!.querySelector('.lab-locked-wrap');
    expect(wrap).not.toBeNull();
    expect(wrap!.hasAttribute('inert')).toBe(true);
    // the value readout is still visible (read-only, not removed)
    expect(locked!.querySelector('.lab-field-val')!.textContent).toMatch(/°/);
  });

  it('hide also works on non-Field controls via <Control> (the components toggle)', () => {
    const visible = render(<RampForcesLab />);
    expect([...visible.container.querySelectorAll('*')].some((n) => n.textContent === 'components')).toBe(true);
    const hidden = render(<RampForcesLab controlConfig={{ hide: ['components'] }} />);
    expect([...hidden.container.querySelectorAll('*')].some((n) => n.textContent === 'components')).toBe(false);
  });
});
