import { describe, expect, it } from 'vitest';
import {
  digitalLogicPathway,
  electronicCircuitsPathway,
  electronicDevicesPathway,
  moduleSteps,
  pathwayToMdx,
  plannedSteps,
  readySteps,
  type LabPathway,
} from '../src/pathways/index.js';
import { labManifests } from '../src/domains/manifests.js';
import { labTag } from '../src/lab-def/define-lab.js';

/** Every MDX tag the library can actually render. */
const RENDERABLE = new Set(labManifests.map((manifest) => manifest.tag ?? labTag(manifest.id)));

const COURSES: LabPathway[] = [electronicCircuitsPathway, electronicDevicesPathway, digitalLogicPathway];

describe.each(COURSES.map((course) => [course.title, course] as const))('%s', (_title, course) => {
  it('only emits tags that resolve to a real lab', () => {
    // The guard that matters: a pathway is metadata, so a typo in a tag would otherwise
    // survive typecheck and surface as a blank lesson in front of a class.
    const unresolved = readySteps(course)
      .map((step) => step.tag)
      .filter((tag) => !RENDERABLE.has(tag));
    expect(unresolved).toEqual([]);
  });

  it('does not mark a step planned once its lab exists', () => {
    const alreadyBuilt = plannedSteps(course)
      .filter((step) => RENDERABLE.has(step.tag))
      .map((step) => step.id);
    expect(alreadyBuilt).toEqual([]);
  });

  it('has unique step ids and unique module ids', () => {
    const stepIds = course.steps.map((step) => step.id);
    expect(new Set(stepIds).size).toBe(stepIds.length);
    const moduleIds = (course.modules ?? []).map((module) => module.id);
    expect(new Set(moduleIds).size).toBe(moduleIds.length);
  });

  it('assigns every step to a declared module, and every module owns steps', () => {
    const moduleIds = new Set((course.modules ?? []).map((module) => module.id));
    expect(course.steps.filter((step) => !step.module || !moduleIds.has(step.module))).toEqual([]);
    for (const id of moduleIds) expect(moduleSteps(course, id).length).toBeGreaterThan(0);
  });

  it('keeps steps grouped in module order, so the outline reads top to bottom', () => {
    const order = (course.modules ?? []).map((module) => module.id);
    const seen = course.steps.map((step) => order.indexOf(step.module ?? ''));
    expect(seen).toEqual([...seen].sort((a, b) => a - b));
  });

  it('generates MDX for built labs only', () => {
    const mdx = pathwayToMdx(course);
    for (const step of plannedSteps(course)) expect(mdx).not.toContain(`<${step.tag}`);
    expect(mdx.split('\n\n')).toHaveLength(readySteps(course).length);
  });
});

describe('digital logic pathway', () => {
  it('crosses from combinational to sequential at the memory module', () => {
    expect((digitalLogicPathway.modules ?? []).map((module) => module.id)).toEqual([
      'numbers',
      'boolean-algebra',
      'minimisation',
      'combinational',
      'memory',
      'counting',
      'control',
      'capstone',
    ]);
  });

  it('proves De Morgan by comparing two formulas in one truth table', () => {
    const mdx = pathwayToMdx(digitalLogicPathway);
    expect(mdx).toContain('<TruthTable formula="¬(p ∧ q)" compare="¬p ∨ ¬q" mode="fill" />');
  });

  it('teaches NAND universality with the four-NAND XOR', () => {
    const step = digitalLogicPathway.steps.find((item) => item.id === 'nand-universality');
    expect(step?.defaultAttributes).toMatchObject({ preset: 'xor-nand', mode: 'predict' });
  });

  it('marks the built sequential labs ready and keeps the rest of the plan planned', () => {
    const planned = plannedSteps(digitalLogicPathway).map((step) => step.id);
    const ready = readySteps(digitalLogicPathway).map((step) => step.id);
    for (const built of [
      'twos-complement',
      'sr-latch',
      'latch-vs-flip-flop',
      'jk-flip-flop',
      'binary-counter',
      'shift-register',
      'wire-a-chip',
    ]) {
      expect(planned).not.toContain(built);
      expect(ready).toContain(built);
    }
    expect(planned).toContain('gated-d-latch');
    expect(planned).toContain('ripple-counter');
    expect(planned).toContain('state-machine-designer');
  });
});

describe('electronics pathways', () => {
  it('are fully built, so both chapters can ship today', () => {
    expect(plannedSteps(electronicDevicesPathway)).toEqual([]);
    expect(readySteps(electronicDevicesPathway).length).toBe(electronicDevicesPathway.steps.length);
  });

  it('land the learner on the same NAND the digital logic course starts from', () => {
    const last = electronicDevicesPathway.steps.map((step) => step.tag);
    expect(last).toContain('CmosNand');
    expect(readySteps(digitalLogicPathway).map((step) => step.tag)).toContain('LogicGate');
  });
});
