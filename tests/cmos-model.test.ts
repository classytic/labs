import { describe, expect, it } from 'vitest';
import {
  inverterElements,
  nandElements,
  norElements,
  rnmosNotElements,
  solveOutput,
} from '../src/circuits/cmos-gate/model.js';

const VDD = 5;
const VTH = 2;
const bit = (volts: number): number => Number(volts > VDD / 2);

describe('CMOS circuit models', () => {
  it('solves inverter and resistor-NMOS truth tables', () => {
    expect([0, VDD].map((a) => bit(solveOutput(inverterElements(a, VDD, VTH))))).toEqual([1, 0]);
    expect([0, VDD].map((a) => bit(solveOutput(rnmosNotElements(a, VDD, VTH, 2_000))))).toEqual([1, 0]);
  });

  it('solves NAND and NOR truth tables from their transistor networks', () => {
    const inputs = [
      [0, 0],
      [0, VDD],
      [VDD, 0],
      [VDD, VDD],
    ] as const;
    expect(inputs.map(([a, b]) => bit(solveOutput(nandElements(a, b, VDD, VTH))))).toEqual([1, 1, 1, 0]);
    expect(inputs.map(([a, b]) => bit(solveOutput(norElements(a, b, VDD, VTH))))).toEqual([1, 0, 0, 0]);
  });
});
