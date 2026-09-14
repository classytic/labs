import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (path: string): string => readFileSync(resolve(path), 'utf8');

/**
 * styles/domains.css is a list of imports since the per-subject split, so a test that greps it for a
 * rule must read what it resolves to: the parts, concatenated in import order, which is the order
 * the rules were written in.
 */
const readDomainCss = (): string =>
  [...read('styles/domains.css').matchAll(/@import "\.\/domains\/parts\/([a-z0-9-]+)\.css"/g)]
    .map(([, name]) => read(`styles/domains/parts/${name}.css`))
    .join('\n');
const sourceFiles = (root: string): string[] =>
  readdirSync(resolve(root), { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && /\.tsx?$/.test(entry.name))
    .map((entry) => `${root}/${entry.parentPath.slice(resolve(root).length + 1)}/${entry.name}`)
    .map((path) => path.replace(/\/+/g, '/'));

describe('renderer-swappable scene viewport policy', () => {
  it.each([
    'src/chem/orbitals/preset.tsx',
    'src/chem/molecular-geometry/preset.tsx',
    'src/physics/modern/quantum/bloch-preset.tsx',
    'src/chem/stereochemistry/preset.tsx',
    'src/chem/orbital-overlap/preset.tsx',
    'src/chem/crystal-lattice/preset.tsx',
    'src/biology/cell-division/preset.tsx',
    'src/biology/cell-division/meiosis-preset.tsx',
    'src/biology/cell-system/preset.tsx',
    'src/biology/cell-energy/preset.tsx',
    'src/biology/membrane-transport/preset.tsx',
  ])('%s uses the shared stable viewport', (path) => {
    const source = read(path);
    expect(source).toContain('SceneViewport');
    expect(source).toMatch(/<SceneViewport[\s\S]*<\/SceneViewport>/);
  });

  it('defines one bounded responsive scene geometry', () => {
    const css = read('styles/core.css');
    expect(css).toContain('.lab-scene-viewport');
    expect(css).toContain('height: clamp(');
    expect(css).toContain('overflow: hidden');
  });

  it('exposes explicit focus-density profiles instead of stretching every activity', () => {
    const runtime = read('src/kit/authored-activity-runtime.tsx');
    const sequence = read('src/math/sequence-predict/preset.tsx');
    expect(runtime).toContain("focusLayout?: 'compact' | 'standard' | 'immersive'");
    const activity = read('src/kit/activity.tsx');
    expect(runtime).toContain('focusLayout={focusLayout}');
    expect(activity).toContain("focusLayout = 'standard'");
    expect(activity).toContain('data-focus-layout={focusLayout}');
    expect(sequence).toContain('focusLayout="compact"');
  });

  it('marks editors and algorithm canvases as immersive', () => {
    for (const path of [
      'src/build/CircuitEditor.tsx',
      'src/logic/LogicEditor.tsx',
      'src/algorithms/GraphAlgorithmLab.tsx',
      'src/algorithms/GridPathLab.tsx',
      'src/algorithms/TreeQuestLab.tsx',
    ]) {
      expect(read(path)).toContain('focusLayout="immersive"');
    }
  });

  it('marks data-rich subject simulations as immersive', () => {
    for (const path of [
      'src/biology/enzyme-rate/preset.tsx',
      'src/biology/genetic-cross/grid.tsx',
      'src/biology/sequence/central-dogma.tsx',
      'src/statistics/histogram/preset.tsx',
      'src/statistics/sampling/preset.tsx',
      'src/statistics/z-table/preset.tsx',
      'src/geography/cycle-lab/preset.tsx',
    ]) {
      expect(read(path)).toContain('focusLayout="immersive"');
    }
  });

  it('enlarges only named data-visualization surfaces in focus mode', () => {
    const css = read('styles/core.css');
    expect(css).toContain('[data-focus-layout="immersive"] .statistics-chart');
    expect(css).toContain('[data-focus-layout="immersive"] .geography-cycle-scene svg');
    expect(css).toContain(':is(.biology-plot-region, .biology-chart-scene)');
  });

  it('gives every chemistry simulation an explicit immersive focus profile', () => {
    for (const path of [
      'src/chem/reaction-lab.tsx',
      'src/chem/reaction-profile.tsx',
      'src/chem/bohr-atom.tsx',
      'src/chem/battery.tsx',
      'src/chem/titration/preset.tsx',
      'src/chem/solution/solution-box.tsx',
      'src/chem/solution/dilution.tsx',
      'src/chem/periodic-trends/preset.tsx',
      'src/chem/stoichiometry/preset.tsx',
      'src/chem/kinetics/preset.tsx',
      'src/chem/electrochem/preset.tsx',
      'src/chem/diffusion/preset.tsx',
      'src/chem/gas-box/preset.tsx',
      'src/chem/equilibrium/preset.tsx',
    ]) {
      expect(read(path)).toContain('focusLayout="immersive"');
    }
  });

  it('gives electronics simulations an explicit immersive focus profile', () => {
    for (const path of [
      'src/circuits/circuit-lab.tsx',
      'src/circuits/ac-dc/preset.tsx',
      'src/circuits/transistor/preset.tsx',
      'src/circuits/rc-charging/preset.tsx',
      'src/circuits/brownout/preset.tsx',
      'src/circuits/semiconductor/pn-junction.tsx',
      'src/circuits/semiconductor/bjt-inside.tsx',
      'src/circuits/semiconductor/mosfet-inside.tsx',
      'src/circuits/cmos-gate/inverter.tsx',
    ]) {
      expect(read(path)).toContain('focusLayout="immersive"');
    }
  });

  // Atwood is deliberately compact: the scene was tightened to 270 units tall and reads at that
  // size, so stretching it in focus mode only spreads the same drawing further apart. What the
  // rule is actually about is that a simulation STATES its focus behaviour rather than inheriting
  // a default, so this asserts an explicit profile and the immersive list below keeps its value.
  it('gives physics simulations an explicit focus profile', () => {
    expect(read('src/physics/atwood/preset.tsx')).toMatch(/focusLayout="(immersive|compact)"/);
    for (const path of [
      'src/physics/ramp-forces/preset.tsx',
      'src/physics/thermal/preset.tsx',
      'src/physics/fields/activity.tsx',
      'src/physics/waves/wave-activity.tsx',
      'src/physics/modern/relativity/simultaneity-preset.tsx',
      'src/physics/modern/quantum/uncertainty-preset.tsx',
      'src/physics/modern/nuclear/fission-preset.tsx',
      'src/physics/modern/imaging/preset.tsx',
    ]) {
      expect(read(path)).toContain('focusLayout="immersive"');
    }
  });

  it('preserves domain class hooks through the authored runtime', () => {
    const runtime = read('src/kit/authored-activity-runtime.tsx');
    const mechanics = read('src/physics/mechanics/activity.tsx');
    const thermal = read('src/physics/thermal/activity.tsx');
    const fields = read('src/physics/fields/activity.tsx');
    expect(runtime).toContain('className?: string');
    expect(runtime).toContain("['lab-authored-activity', className]");
    expect(mechanics).toContain('className={className}');
    expect(thermal).toContain('className={className}');
    expect(fields).toContain('className={className}');
    expect(read('src/physics/electric-flux/preset.tsx')).toContain('className="physics-electric-flux"');
  });

  it('gives physics SVG labels a theme-safe contrast halo', () => {
    const css = readDomainCss();
    expect(css).toContain('.physics-scene-surface text');
    expect(css).toContain('paint-order: stroke fill');
    expect(css).toContain('stroke: var(--card, var(--stage-bg))');
  });

  it('keeps dense mechanics canvases symbolic and moves measurements into the runtime readout', () => {
    const expectations: Array<[string, string[]]> = [
      // W₁/W₂ rather than m₁g/m₂g since the scene was relabelled: still symbols, which is what this
      // rule is about. The forces stay named; only the notation changed.
      ['src/physics/atwood/preset.tsx', ['label="W₁"', 'label="W₂"', 'label="T"', 'label="a"']],
      ['src/physics/ramp-forces/preset.tsx', ['label="mg"', "label={held ? 'fₛ' : 'fₖ'}"]],
      ['src/physics/couple-torque/preset.tsx', ['label="F₁"', 'label="F₂"', 'text="d"']],
      ['src/physics/electric-flux/preset.tsx', ['text="A"', 'text="surface normal"', 'label="θ"']],
    ];

    for (const [path, labels] of expectations) {
      const source = read(path);
      for (const label of labels) expect(source).toContain(label);
    }

    const ramp = read('src/physics/ramp-forces/preset.tsx');
    expect(ramp).not.toContain('label={`mg ');
    expect(ramp).not.toContain('label={`friction ');
    expect(ramp).not.toContain('label={`push ');
  });

  it('keeps simulation actions separate from parameter fields', () => {
    const presentation = read('src/physics/mechanics/presentation.tsx');
    const css = readDomainCss();
    expect(presentation).toContain('className="physics-simulation-actions"');
    expect(css).toContain('.physics-simulation-actions');
    expect(css).toContain('flex: 1 0 100%');
  });

  it('restores root hooks used by specialized physics layouts', () => {
    expect(read('src/physics/waves/wave-activity.tsx')).toContain('className="physics-wave"');
    expect(read('src/physics/river-boat.tsx')).toContain('className="physics-river-boat"');
    expect(read('src/physics/modern/imaging/preset.tsx')).toContain('className="physics-imaging"');
    expect(read('src/physics/modern/imaging/spectrum-preset.tsx')).toContain('className="physics-imaging"');
  });

  it('uses one responsive authored-response contract for choices and form answers', () => {
    const response = read('src/kit/authored-response.tsx');
    const pedagogy = read('src/kit/pedagogy.tsx');
    const learningChecks = read('src/algorithms/LearningChecks.tsx');
    const css = read('styles/core.css');
    expect(response).toContain('data-response-layout={responseLayout}');
    expect(pedagogy).toContain('data-response-layout={choiceResponseLayout(q.choices)}');
    expect(pedagogy).toContain('className="lab-response-entry"');
    expect(learningChecks).toContain('<AssessedChoiceGroup');
    expect(response).toContain('className="lab-response-entry"');
    expect(response).toContain('className="lab-ordering-list"');
    expect(response).toContain('<ArrowUp data-icon="inline-start" />');
    expect(response).toContain('<ArrowDown data-icon="inline-start" />');
    expect(response).toContain('className="lab-reflection-rubric"');
    expect(response).toContain('aria-describedby={feedback ? feedbackId : undefined}');
    expect(response).toContain("role={result === false ? 'alert' : 'status'}");
    expect(css).toContain('.lab-challenge-q[data-response-layout="compact"] .lab-choices');
    expect(css).toContain('.lab-response-entry[data-multiline]');
    expect(css).toContain('.lab-ordering-actions');
    expect(css).toContain('.lab-reflection-rubric');
  });

  it('routes algorithm prediction choices through the shared assessed control', () => {
    for (const path of [
      'src/algorithms/GraphAlgorithmLab.tsx',
      'src/algorithms/GridPathLab.tsx',
      'src/algorithms/GrowthLab.tsx',
      'src/algorithms/HashLab.tsx',
      'src/algorithms/HeapQuestLab.tsx',
      'src/algorithms/ListLab.tsx',
      'src/algorithms/SearchLab.tsx',
      'src/algorithms/SortingLab.tsx',
      'src/algorithms/TreeQuestLab.tsx',
    ]) {
      const source = read(path);
      expect(source).toContain('<AssessedChoiceGroup');
      expect(source).not.toContain('data-answer=');
      expect(source).not.toContain('@/components/ui/button');
    }
  });

  it('uses host shadcn buttons for interactive algorithm scene controls', () => {
    const heap = read('src/algorithms/HeapDualView.tsx');
    expect(heap).toContain("from '@/components/ui/button'");
    expect(heap).toContain('<Button');
    expect(heap).not.toContain('<button');
  });

  it('uses one assessed choice contract for language grammar practice', () => {
    for (const path of [
      'src/language/agreement/preset.tsx',
      'src/language/article-lens/preset.tsx',
      'src/language/preposition-scene/preset.tsx',
    ]) {
      const source = read(path);
      expect(source).toContain('<AssessedChoiceGroup');
      expect(source).not.toContain('<button');
      expect(source).not.toContain('className="lang-choice"');
    }
  });

  it('uses shared assessment or host controls for every language interaction', () => {
    const listening = read('src/language/listening/preset.tsx');
    expect(listening).toContain('<AssessedChoiceGroup');
    expect(listening).not.toContain('<button');

    for (const path of [
      'src/language/error-correct/preset.tsx',
      'src/language/word-match/preset.tsx',
      'src/language/ui.tsx',
    ]) {
      const source = read(path);
      expect(source).toContain("from '@/components/ui/button'");
      expect(source).toContain('<Button');
      expect(source).not.toContain('<button');
    }
  });

  it('uses host controls for specialized discrete workspace interactions', () => {
    for (const path of [
      'src/discrete/combination-studio/figure.tsx',
      'src/discrete/outcome-builder/preset.tsx',
      'src/discrete/sample-space/preset.tsx',
      'src/discrete/truth-table/preset.tsx',
    ]) {
      const source = read(path);
      expect(source).toContain("from '@/components/ui/button'");
      expect(source).toContain('<Button');
      expect(source).not.toContain('<button');
    }
  });

  it('uses shared or host controls for commerce decisions and accounting slots', () => {
    const activity = read('src/commerce/activity.tsx');
    const lesson = read('src/commerce/finance/business-lesson.tsx');
    const journal = read('src/commerce/accounting/journal-poster.tsx');
    expect(activity).toContain('<AssessedChoiceGroup');
    expect(activity).not.toContain('<button');
    expect(lesson).toContain('<AssessedChoiceGroup');
    expect(lesson).not.toContain('<button');
    expect(journal).toContain("from '@/components/ui/button'");
    expect(journal).not.toContain('<button');
  });

  it('uses host controls for specialized biology sequence and genetics interactions', () => {
    for (const path of [
      'src/biology/sequence/preset.tsx',
      'src/biology/sequence/central-dogma.tsx',
      'src/biology/genetic-cross/grid.tsx',
    ]) {
      const source = read(path);
      expect(source).toContain("from '@/components/ui/button'");
      expect(source).toContain('<Button');
      expect(source).not.toContain('<button');
    }
  });

  it('keeps circuits, logic, and circuit building on shared or host controls', () => {
    for (const root of ['src/circuits', 'src/logic', 'src/build']) {
      for (const path of sourceFiles(root)) {
        const source = read(path);
        expect(source, path).not.toMatch(/<(?:button|input|select|textarea)\b/);
      }
    }
  });

  it('keeps the remaining subject and authoring domains on shared or host controls', () => {
    for (const root of [
      'src/statistics',
      'src/geography',
      'src/ict',
      'src/networking',
      'src/exam',
      'src/blocks',
      'src/authoring',
    ]) {
      for (const path of sourceFiles(root)) {
        const source = read(path);
        expect(source, path).not.toMatch(/<(?:button|input|select|textarea)\b/);
      }
    }
  });

  it('uses shared presentation hooks for networking targets and lab-config options', () => {
    for (const path of [
      'src/networking/VpnScene.tsx',
      'src/networking/VlanScene.tsx',
      'src/networking/SwitchScene.tsx',
      'src/networking/PlugScene.tsx',
    ]) {
      const source = read(path);
      expect(source).toContain('className="network-scene-target"');
      expect(source).toContain('data-interactive=');
      expect(source).not.toContain('style={{ cursor:');
    }

    const config = read('src/blocks/lab-config.tsx');
    expect(config).toContain('className="lab-config-options"');
    expect(config).not.toContain("style={{ display: 'inline-flex'");
  });
});
