/**
 * SlotFill interaction — the tap-a-tile-into-a-blank engine. The UX invariant that
 * was missing: a filled blank must be un-fillable (return its tile to the tray) so a
 * learner is never locked into a pick before the whole thing is solved. Pin: place a
 * correct tile → the blank fills + its tray tile goes used; tap the filled blank →
 * the fill clears + the tile is selectable again.
 *
 * Imports the BUILT dist (what ships); run `npm run build` first.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { SlotFill } from '../dist/kit/index.mjs';

afterEach(cleanup);

describe('SlotFill clear/unselect', () => {
  it('fills on a correct tile, then a tap on the filled blank returns the tile to the tray', () => {
    // Two slots so filling one doesn't solve the whole thing (a solved fill locks).
    const { getByLabelText, queryByLabelText } = render(
      <SlotFill
        slots={[
          { id: 'a', answer: 7 },
          { id: 'b', answer: 5 },
        ]}
        tiles={[7, 5, 3]}
        activity="test-slotfill"
      />,
    );

    // The correct tile is a live button; no blank is filled yet.
    const tile7 = getByLabelText('tile 7') as HTMLButtonElement;
    expect(tile7.disabled).toBe(false);
    expect(queryByLabelText(/^filled/)).toBeNull();

    // Place it → blank 'a' reads "filled 7, tap to clear" and the tile is used (disabled).
    fireEvent.click(tile7);
    const filled = getByLabelText('filled 7, tap to clear');
    expect(filled).toBeTruthy();
    expect((getByLabelText('tile 7') as HTMLButtonElement).disabled).toBe(true);

    // Tap the filled blank → it clears; the tile is selectable again.
    fireEvent.click(filled);
    expect(queryByLabelText(/^filled/)).toBeNull();
    expect((getByLabelText('tile 7') as HTMLButtonElement).disabled).toBe(false);
  });

  it('a wrong tile never commits (nothing to unselect)', () => {
    const { getByLabelText, queryByLabelText } = render(
      <SlotFill
        slots={[
          { id: 'a', answer: 7 },
          { id: 'b', answer: 5 },
        ]}
        tiles={[7, 5, 3]}
        activity="test-slotfill-2"
      />,
    );
    fireEvent.click(getByLabelText('tile 3'));
    expect(queryByLabelText(/^filled/)).toBeNull();
  });

  it('once every blank is solved the fill locks (no clear affordance)', () => {
    const { getByLabelText, queryByLabelText } = render(
      <SlotFill slots={[{ id: 'a', answer: 7 }]} tiles={[7]} activity="test-slotfill-3" />,
    );
    fireEvent.click(getByLabelText('tile 7'));
    // Solved → the blank is a static "filled 7" (no "tap to clear"), so it can't be undone.
    expect(getByLabelText('filled 7')).toBeTruthy();
    expect(queryByLabelText('filled 7, tap to clear')).toBeNull();
  });
});
