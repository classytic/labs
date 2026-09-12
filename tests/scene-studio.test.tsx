import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SceneStudio } from '../src/kit/scene-studio.js';

afterEach(cleanup);

describe('SceneStudio', () => {
  it('uses a labelled, accessible representation picker and compact preview', () => {
    const view = render(
      <SceneStudio
        spec={{ name: 'stars', label: 'Stars', kind: 'level', icon: '⭐', slots: 5 }}
        onChange={() => undefined}
      />,
    );

    expect(view.getByRole('group', { name: 'Representation' })).toBeTruthy();
    expect(view.getByRole('button', { name: /Rating/ }).getAttribute('aria-pressed')).toBe('true');
    expect(view.container.querySelector('.lab-scene-studio-preview-stage')).toBeTruthy();
    expect(view.getByText('Example at 60% fill')).toBeTruthy();
  });

  it('emits portable data specs from preset and custom object controls', () => {
    const onChange = vi.fn();
    const view = render(
      <SceneStudio spec={{ name: 'objects', kind: 'count', icon: '⭐' }} onChange={onChange} />,
    );

    fireEvent.click(view.getByRole('button', { name: 'Use 🍎' }));
    expect(onChange).toHaveBeenLastCalledWith({
      name: 'objects',
      label: undefined,
      kind: 'count',
      icon: '🍎',
    });

    fireEvent.change(view.getByLabelText('Custom emoji'), { target: { value: '🧑‍🚀' } });
    expect(onChange).toHaveBeenLastCalledWith({
      name: 'objects',
      label: undefined,
      kind: 'count',
      icon: '🧑‍🚀',
    });
  });
});
