import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Battery } from '../src/chem/battery.js';
import { BohrAtom } from '../src/chem/bohr-atom.js';
import { DiffusionLab } from '../src/chem/diffusion/preset.js';
import { ElectrochemLab } from '../src/chem/electrochem/preset.js';
import { LeChatelierLab } from '../src/chem/equilibrium/preset.js';
import { KineticsLab } from '../src/chem/kinetics/preset.js';
import { ReactionLab } from '../src/chem/reaction-lab.js';
import { ReactionProfile } from '../src/chem/reaction-profile.js';
import type { AuthoredActivity } from '../src/kit/activity-authoring.js';

const creatorActivity: AuthoredActivity = {
  pattern: 'investigation',
  title: 'Creator chemistry sequence',
  objectives: ['Inspect the scientific model'],
  steps: [
    {
      id: 'inspect',
      phase: 'act',
      title: 'Creator-defined chemistry step',
      reveal: ['model'],
      controls: true,
    },
  ],
};

describe('reaction and particle chemistry uses the authored runtime', () => {
  const labs = [
    ['reaction profile', <ReactionProfile activity={creatorActivity} />],
    ['reaction lab', <ReactionLab activity={creatorActivity} />],
    ['battery', <Battery activity={creatorActivity} />],
    ['bohr atom', <BohrAtom activity={creatorActivity} />],
    ['diffusion', <DiffusionLab activity={creatorActivity} />],
    ['electrochemistry', <ElectrochemLab activity={creatorActivity} />],
    ['equilibrium', <LeChatelierLab activity={creatorActivity} />],
    ['kinetics', <KineticsLab activity={creatorActivity} />],
  ] as const;

  it.each(labs)('lets hosts author the %s progression without replacing its engine', (_name, lab) => {
    const view = render(lab);
    expect(view.getByText('Creator-defined chemistry step')).toBeTruthy();
    expect(
      view.queryByText('Explore evidence') ?? view.getByRole('region', { name: 'Model controls' }),
    ).toBeTruthy();
  });
});
