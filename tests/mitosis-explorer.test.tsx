import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import {
  MITOSIS_CHECKPOINTS,
  attachmentEvidence,
  mitosisState,
  nextMitosisCheckpoint,
} from '../src/biology/cell-division/core.js';
import { MitosisExplorerLab, type MitosisSceneProps } from '../src/biology/cell-division/preset.js';

afterEach(cleanup);

function TestScene({ state }: MitosisSceneProps) {
  return <output aria-label="Rendered checkpoint">{state.checkpoint}</output>;
}

describe('mitosis explorer engine', () => {
  it('keeps DNA replication before the mitotic checkpoints', () => {
    for (const checkpoint of MITOSIS_CHECKPOINTS) expect(mitosisState(checkpoint).dnaReplicated).toBe(true);
  });
  it('keeps sisters attached through metaphase', () => {
    expect(mitosisState('metaphase').sisterChromatidsAttached).toBe(true);
    expect(mitosisState('anaphase').sisterChromatidsAttached).toBe(false);
  });
  it('counts separated chromatids as daughter chromosomes', () => {
    expect(mitosisState('metaphase').chromosomeCount).toBe(4);
    expect(mitosisState('anaphase').chromosomeCount).toBe(8);
  });
  it('bounds checkpoint navigation', () => {
    expect(nextMitosisCheckpoint('cell', -1)).toBe('cell');
    expect(nextMitosisCheckpoint('metaphase', 1)).toBe('anaphase');
  });
  it('requires sister kinetochores to face opposite poles', () => {
    expect(attachmentEvidence({ a: 'left', b: 'left' }).stable).toBe(false);
    expect(attachmentEvidence({ a: 'left', b: 'right' }).stable).toBe(true);
    expect(attachmentEvidence({ a: null, b: 'right' }).stable).toBe(false);
  });
  it('keeps the canonical sequence and biological scene on the same checkpoint', () => {
    render(<MitosisExplorerLab sceneRenderer={TestScene} />);
    expect(screen.getByLabelText('Rendered checkpoint').textContent).toBe('cell');
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(screen.getByLabelText('Rendered checkpoint').textContent).toBe('nucleus');
  });
  it('honours an authored initial checkpoint', () => {
    render(<MitosisExplorerLab checkpoint="metaphase" sceneRenderer={TestScene} />);
    expect(screen.getByLabelText('Rendered checkpoint').textContent).toBe('metaphase');
    expect(screen.getByText('Same-pole attachment cannot divide the chromosome equally.')).toBeTruthy();
  });
  it('requires a stable spindle attachment before anaphase', () => {
    render(<MitosisExplorerLab checkpoint="metaphase" sceneRenderer={TestScene} />);
    const continueButton = screen.getByRole('button', { name: 'Continue' });
    expect((continueButton as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Sister B' }));
    fireEvent.click(screen.getByRole('button', { name: 'Right pole →' }));
    expect((continueButton as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(continueButton);
    expect(screen.getByLabelText('Rendered checkpoint').textContent).toBe('anaphase');
  });
});
