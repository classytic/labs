import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import GridPathAuthoring from '../../../src/domains/ict/grid-path-dp/authoring.js';
import graphManifest from '../../../src/domains/ict/graph-algorithm/manifest.js';
import gridManifest from '../../../src/domains/ict/grid-path-dp/manifest.js';
import heapManifest from '../../../src/domains/ict/heap-quest/manifest.js';
import treeManifest from '../../../src/domains/ict/tree-quest/manifest.js';

describe('algorithm authoring surfaces', () => {
  it('keeps every flagship editor behind its manifest lazy boundary', () => {
    for (const manifest of [graphManifest, gridManifest, heapManifest, treeManifest]) {
      expect(manifest.loadAuthoring).toBeTypeOf('function');
    }
  });

  it('lets authors size and frame a DP lesson without editing its runtime', () => {
    const onChange = vi.fn();
    const view = render(<GridPathAuthoring value={{ rows: 3, cols: 4 }} onChange={onChange} />);
    expect(screen.getByLabelText('Learner preview')).toBeTruthy();
    expect(screen.getByText('12 states · 2–8 rows and columns keeps the table readable')).toBeTruthy();
    const dimensions = view.container.querySelectorAll('input[type="number"]');
    fireEvent.change(dimensions[0]!, { target: { value: '6' } });
    expect(onChange).toHaveBeenCalledWith({ rows: 6 });
  });
});
