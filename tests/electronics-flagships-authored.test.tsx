import React from 'react';
import { render, cleanup, fireEvent } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { AuthoredActivity } from '../src/kit/activity-authoring.js';
import { RCChargingLab } from '../src/circuits/rc-charging/preset.js';
import { DiodeLab } from '../src/circuits/diode/preset.js';
import { TransistorLab } from '../src/circuits/transistor/preset.js';
import { SiliconLatticeLab } from '../src/circuits/semiconductor/silicon-lattice.js';
import { HallEffectLab } from '../src/circuits/semiconductor/hall-effect.js';
import { ConductionLab } from '../src/circuits/semiconductor/conduction.js';
import { MosfetInsideLab } from '../src/circuits/semiconductor/mosfet-inside.js';
import { PnJunctionLab } from '../src/circuits/semiconductor/pn-junction.js';
import { BjtInsideLab } from '../src/circuits/semiconductor/bjt-inside.js';
import { CircuitNetworkLab } from '../src/circuits/circuit/preset.js';
import { BrownoutLab } from '../src/circuits/brownout/preset.js';
import { CapacitorLeakLab } from '../src/circuits/capacitor-leak/preset.js';
import { CmosInverterLab } from '../src/circuits/cmos-gate/inverter.js';
import { CmosNandLab } from '../src/circuits/cmos-gate/nand.js';
import { CmosNorLab } from '../src/circuits/cmos-gate/nor.js';
import { CircuitBuilder } from '../src/circuits/circuit-builder.js';
import { CircuitLab } from '../src/circuits/circuit-lab.js';
import { RNmosNotLab } from '../src/circuits/cmos-gate/rnmos-not.js';
import CircuitRuntime from '../src/domains/circuits/circuit/runtime.js';
import { assessLabExperience } from '../src/authoring/quality.js';
import conductionManifest from '../src/domains/circuits/conduction/manifest.js';
import siliconManifest from '../src/domains/circuits/silicon-lattice/manifest.js';
import pnManifest from '../src/domains/circuits/pn-junction/manifest.js';
import mosfetManifest from '../src/domains/circuits/mosfet-inside/manifest.js';
import bjtManifest from '../src/domains/circuits/bjt-inside/manifest.js';
import circuitManifest from '../src/domains/circuits/circuit/manifest.js';
import brownoutManifest from '../src/domains/circuits/brownout/manifest.js';
import capacitorLeakManifest from '../src/domains/circuits/capacitor-leak/manifest.js';
import cmosInverterManifest from '../src/domains/circuits/cmos-inverter/manifest.js';
import cmosNandManifest from '../src/domains/circuits/cmos-nand/manifest.js';
import cmosNorManifest from '../src/domains/circuits/cmos-nor/manifest.js';
import circuitBuilderManifest from '../src/domains/circuits/circuit-builder/manifest.js';
import circuitLabManifest from '../src/domains/circuits/circuit-lab/manifest.js';
import rnmosNotManifest from '../src/domains/circuits/rnmos-not/manifest.js';

afterEach(cleanup);

const activity: AuthoredActivity = {
  pattern: 'investigation',
  title: 'Author-defined electronics lesson',
  objectives: ['Inspect the model'],
  steps: [{ id: 'observe', phase: 'observe', title: 'Author-defined step' }],
};

describe('electronics flagship authored convergence', () => {
  const cases = [
    ['rc charging', <RCChargingLab activity={activity} />],
    ['diode', <DiodeLab activity={activity} />],
    ['transistor', <TransistorLab activity={activity} />],
    ['silicon lattice', <SiliconLatticeLab activity={activity} />],
    ['Hall effect', <HallEffectLab activity={activity} />],
    ['metal conduction', <ConductionLab activity={activity} />],
    ['MOSFET interior', <MosfetInsideLab activity={activity} />],
    ['PN junction', <PnJunctionLab activity={activity} />],
    ['BJT interior', <BjtInsideLab activity={activity} />],
    ['circuit network', <CircuitNetworkLab activity={activity} />],
    ['brownout', <BrownoutLab activity={activity} />],
    ['capacitor leak', <CapacitorLeakLab activity={activity} />],
    ['CMOS inverter', <CmosInverterLab activity={activity} />],
    ['CMOS NAND', <CmosNandLab activity={activity} />],
    ['CMOS NOR', <CmosNorLab activity={activity} />],
    ['simple circuit builder', <CircuitBuilder activity={activity} />],
    ['series and parallel circuit lab', <CircuitLab activity={activity} />],
    ['resistor-load NMOS inverter', <RNmosNotLab activity={activity} />],
  ] as const;

  for (const [name, view] of cases)
    it(`uses the authored runtime for ${name}`, () => {
      const result = render(view);
      expect(result.container.querySelector('.lab-authored-activity')).not.toBeNull();
      expect(result.getByText('Author-defined step')).toBeTruthy();
      expect(result.container.querySelector('.lab-frame')).toBeNull();
    });

  // The readout lives in the evidence slot, which a prediction no longer sees, so the wording is
  // checked once the learner has earned it. In an intrinsic lattice neither carrier is a majority:
  // heat makes pairs, so calling either one "majority" would teach the doped case by accident.
  it('labels intrinsic carriers without calling either one a majority', () => {
    const result = render(<SiliconLatticeLab mode="intrinsic" />);
    fireEvent.click(result.getByRole('radio', { name: 'a mobile electron: n-type' }));
    expect(result.container.textContent).toMatch(/intrinsic carriers/i);
    expect(result.container.textContent).not.toContain('majority carriers');
  });

  it('states the Hall-voltage polarity convention', () => {
    const result = render(<HallEffectLab />);
    expect(result.container.textContent).toMatch(
      /top(?:-edge)? (?:potential )?minus bottom(?:-edge)?(?: potential)?/i,
    );
  });

  it('keeps fixed ions inside the PN depletion region and exposes authored initial bias', () => {
    const result = render(<PnJunctionLab bias={0.8} showCarriers={false} />);
    // The bias readout is evidence, and evidence is withheld while the prediction about bias is
    // still open, which is the whole point of asking it.
    fireEvent.click(result.getByRole('radio', { name: 'forward bias' }));
    const depletion = result.getByTestId('depletion-region');
    const depletionLeft = Number(depletion.getAttribute('x'));
    const depletionRight = depletionLeft + Number(depletion.getAttribute('width'));
    const fixedIons = result.container.querySelectorAll('.electronics-svg-passive circle[r="6"]');

    expect(fixedIons).toHaveLength(10);
    for (const ion of fixedIons) {
      const x = Number(ion.getAttribute('cx'));
      expect(x).toBeGreaterThanOrEqual(depletionLeft);
      expect(x).toBeLessThanOrEqual(depletionRight);
    }
    expect(result.container.textContent).toContain('Forward bias');
    expect(result.container.textContent).toContain('0.80 V');
    expect(result.container.querySelectorAll('.electronics-svg-passive circle[r="4.5"]')).toHaveLength(0);

    fireEvent.change(result.getByLabelText('bias voltage'), {
      target: { value: '-2' },
    });
    expect(result.container.textContent).toContain('Reverse bias');
  });

  it('publishes complete experience and authoring contracts for the semiconductor pathway', () => {
    for (const manifest of [conductionManifest, siliconManifest, pnManifest, mosfetManifest, bjtManifest]) {
      expect(assessLabExperience(manifest)).toEqual({
        ready: true,
        issues: [],
      });
    }
    expect(siliconManifest.schema.safeParse({ temperature: 1.2 }).success).toBe(false);
    expect(mosfetManifest.schema.safeParse({ vth: 0, k: 0.02 }).success).toBe(false);
    expect(bjtManifest.schema.safeParse({ beta: 0 }).success).toBe(false);
    expect(conductionManifest.schema.safeParse({ activity }).success).toBe(true);
  });

  it('publishes complete experience and authoring contracts for the focused circuit pathway', () => {
    for (const manifest of [
      circuitManifest,
      circuitBuilderManifest,
      circuitLabManifest,
      brownoutManifest,
      capacitorLeakManifest,
      cmosInverterManifest,
      cmosNandManifest,
      cmosNorManifest,
      rnmosNotManifest,
    ]) {
      expect(assessLabExperience(manifest)).toEqual({
        ready: true,
        issues: [],
      });
    }
    expect(circuitManifest.schema.safeParse({ emf: 0 }).success).toBe(false);
    expect(brownoutManifest.schema.safeParse({ vth: 3, vmax: 4 }).success).toBe(false);
    expect(capacitorLeakManifest.schema.safeParse({ capU: 1 }).success).toBe(false);
    expect(cmosInverterManifest.schema.safeParse({ vdd: 5, vth: 5 }).success).toBe(false);
    expect(cmosNandManifest.schema.safeParse({ vdd: 5, vth: 5 }).success).toBe(false);
    expect(cmosNorManifest.schema.safeParse({ vdd: 5, vth: 5 }).success).toBe(false);
    expect(circuitManifest.schema.safeParse({ activity }).success).toBe(true);
    expect(circuitLabManifest.schema.safeParse({ voltage: 25 }).success).toBe(false);
    expect(rnmosNotManifest.schema.safeParse({ vdd: 5, vth: 5 }).success).toBe(false);
  });

  it('forwards authored lessons through the circuit domain adapter', () => {
    const result = render(<CircuitRuntime activity={activity} title="Authored circuit lesson" />);
    expect(result.getByText('Author-defined step')).toBeTruthy();
    expect(result.getByText('Authored circuit lesson')).toBeTruthy();
  });
});
