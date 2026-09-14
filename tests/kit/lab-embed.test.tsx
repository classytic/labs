import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { Activity } from '../../src/kit/activity.js';
import { LabEmbedProvider } from '../../src/kit/embed.js';

/**
 * A lab standing alone must introduce itself; a lab inside a lesson must not, because
 * the page already did. These two assertions are the whole contract, and they are here
 * because the gallery cannot show it: the gallery imports lab components directly and
 * so always takes the standalone path.
 */
function Sample() {
  return (
    <Activity.Root>
      <Activity.Header>
        <Activity.Heading eyebrow="Angle measure" title="One radian, measured in radii" description="Lay the radius along the rim." />
      </Activity.Header>
    </Activity.Root>
  );
}

describe('lab heading, embedded vs standalone', () => {
  it('introduces itself when it stands alone', () => {
    const v = render(<Sample />);
    expect(v.getByText('Angle measure')).toBeTruthy();
    const title = v.getByRole('heading', { name: 'One radian, measured in radii' });
    expect(title.className).not.toContain('lab-sr-only');
    expect(v.getByText('Lay the radius along the rim.')).toBeTruthy();
    v.unmount();
  });

  it('drops the eyebrow and the product name inside a lesson', () => {
    const v = render(
      <LabEmbedProvider>
        <Sample />
      </LabEmbedProvider>,
    );
    // The category eyebrow is gone entirely: the lesson heading already said it.
    expect(v.queryByText('Angle measure')).toBeNull();
    // The title stays for assistive tech, so the region keeps its accessible name.
    const title = v.getByRole('heading', { name: 'One radian, measured in radii' });
    expect(title.className).toContain('lab-sr-only');
    // The instruction survives: it is the only line that says what to DO.
    expect(v.getByText('Lay the radius along the rim.')).toBeTruthy();
    v.unmount();
  });

  /**
   * `Sample` never accepts a title or a prompt, which is the point: most labs don't. The
   * lesson's words have to reach the heading without the lab agreeing to carry them, or a
   * Bangla course would read in English chrome and the fix would mean editing 294 labs.
   */
  it('lets the lesson rename a lab that never took the props', () => {
    const v = render(
      <LabEmbedProvider title="এক রেডিয়ান" prompt="রিমের উপর ব্যাসার্ধ বসাও।">
        <Sample />
      </LabEmbedProvider>,
    );
    expect(v.getByText('রিমের উপর ব্যাসার্ধ বসাও।')).toBeTruthy();
    expect(v.queryByText('Lay the radius along the rim.')).toBeNull();
    // The title is the region's accessible name, so it has to change language too.
    expect(v.getByRole('heading', { name: 'এক রেডিয়ান' })).toBeTruthy();
    v.unmount();
  });

  it('keeps the lab’s own heading when the lesson says nothing', () => {
    const v = render(
      <LabEmbedProvider title="   " prompt={undefined}>
        <Sample />
      </LabEmbedProvider>,
    );
    // Blank is not an override: an empty heading is worse than the general one.
    expect(v.getByRole('heading', { name: 'One radian, measured in radii' })).toBeTruthy();
    expect(v.getByText('Lay the radius along the rim.')).toBeTruthy();
    v.unmount();
  });
});
