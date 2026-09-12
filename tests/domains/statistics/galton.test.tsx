import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import { GaltonBoardLab } from '../../../src/statistics/galton/preset.js';

afterEach(() => vi.unstubAllGlobals());

describe('Galton board learning surface', () => {
  it('settles manual drops immediately when reduced motion is requested', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({ matches: true })),
    );
    const view = render(<GaltonBoardLab rows={8} />);

    expect(view.getByText('0 landed')).toBeTruthy();
    fireEvent.click(view.getByRole('button', { name: 'Drop one ball' }));

    expect(view.getByText('1 landed')).toBeTruthy();
    expect(view.getByText('balls: 1')).toBeTruthy();
  });
});
