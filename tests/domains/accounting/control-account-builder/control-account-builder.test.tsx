import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { assessLabExperience } from '../../../../src/authoring/quality.js';
import { activity } from '../../../../src/domains/accounting/control-account-builder/activity.js';
import manifest from '../../../../src/domains/accounting/control-account-builder/manifest.js';
import ControlAccountBuilder from '../../../../src/domains/accounting/control-account-builder/runtime.js';

describe('control-account-builder', () => {
  it('has a valid experience contract', () =>
    expect(assessLabExperience(manifest, activity).issues).toEqual([]));
  it('shows sources and offers keyboard-native posting actions', () => {
    render(<ControlAccountBuilder />);
    fireEvent.click(screen.getByRole('radio', { name: /totals in books/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getAllByText(/sales journal/i).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: 'debit' }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: 'credit' }).length).toBeGreaterThan(0);
  });
});
