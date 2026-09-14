import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { gzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';

const root = join(import.meta.dirname, '..');

/**
 * styles/domains.css is a list of imports since the per-subject split, so a test that greps it for a
 * rule must read what it resolves to. Parts are concatenated in import order, which is the order the
 * rules were written in.
 */
const readDomainCss = (): string => {
  const dir = join(root, 'styles', 'domains');
  const aggregate = readFileSync(join(root, 'styles', 'domains.css'), 'utf8');
  return [...aggregate.matchAll(/@import "\.\/domains\/parts\/([a-z0-9-]+)\.css"/g)]
    .map(([, name]) => readFileSync(join(dir, 'parts', `${name}.css`), 'utf8'))
    .join('\n');
};
const source = join(root, 'src');
const files = (directory: string): string[] =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? files(join(directory, entry.name))
      : /\.tsx?$/.test(entry.name)
        ? [join(directory, entry.name)]
        : [],
  );
const normalized = (file: string): string => relative(root, file).replaceAll('\\', '/');
const transferCss = (css: string): string => css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ');

describe('architecture convergence', () => {
  // Walks every source file, so it is I/O bound: under full-suite parallelism it can pass the
  // default 10s and fail as a timeout rather than on its own merits.
  it('keeps compiled authored definitions out of React runtime modules', { timeout: 60_000 }, () => {
    const offenders = files(source)
      .filter((file) => file.endsWith('.tsx'))
      .filter((file) => /defineAuthoredActivity\s*\(/.test(readFileSync(file, 'utf8')))
      .map(normalized);
    expect(offenders).toEqual([]);
  });

  it('keeps circuit activity plans out of React components', () => {
    const offenders = files(join(source, 'circuits'))
      .filter((file) => file.endsWith('.tsx'))
      .filter((file) =>
        /const\s+[A-Z0-9_]+_ACTIVITY\s*:\s*AuthoredActivity\s*=/.test(readFileSync(file, 'utf8')),
      )
      .map(normalized);
    expect(offenders).toEqual([]);
  });

  it('keeps the shared stylesheet within its transfer budget', () => {
    // gzip is what a consumer downloads and is the strict number; the raw budget is source
    // discipline. core.css is deliberately the largest file in the package: it carries the token
    // layer, the shared interaction rules (one focus ring, one reduced-motion policy) and the
    // comments explaining both. Domain weight is budgeted per domain in the test below, because
    // since the split an app imports one subject's sheet rather than all of them.
    const layers = [
      ['core.css', 112 * 1024, 16 * 1024],
      // Figure art direction: tokens, domain palettes, scene type roles, illustration slot, plus
      // the hardware neutrals that deliberately do NOT invert with the theme (a switch chassis
      // drawn in ink turns white in dark mode, and a photo-negative does not read as hardware).
      ['figure.css', 10 * 1024, 3 * 1024],
      ['commerce.css', 24 * 1024, 5 * 1024],
      // Exam paper grammar: margin rule, bracketed marks, mark-scheme panel. One lab's worth.
      ['exam.css', 6 * 1024, 2 * 1024],
      // 3D shell: scene frame + legend + tools/inspector overlays + hint (was 4 KiB before overlays).
      ['three.css', 9 * 1024, 3 * 1024],
    ] as const;
    for (const [name, rawBudget, gzipBudget] of layers) {
      const css = readFileSync(join(root, 'styles', name), 'utf8');
      expect(Buffer.byteLength(css), `${name} source budget`).toBeLessThanOrEqual(rawBudget);
      expect(gzipSync(transferCss(css)).byteLength, `${name} transfer budget`).toBeLessThanOrEqual(
        gzipBudget,
      );
    }
  });

  it('budgets domain CSS per domain, because a page shows one subject', () => {
    // styles/domains.css is now a list of imports holding every subject in its original order, and
    // styles/domains/<subject>.css is what an app actually imports. The aggregate is allowed to be
    // large because nobody loads all of it.
    //
    // Two ceilings, because they catch different things. The transfer ceiling is what a learner
    // actually pays and is the one that matters. The source ceiling is a smell test: a subject that
    // needs this much CSS is usually carrying freight rather than genuinely being that big, which
    // is how the splitter's habit of absorbing a short slice into its larger neighbour was caught.
    // The maths sheet was shipping thermal-physics and river-crossing rules to a maths page, and
    // physics was shipping the CMOS and electronics rules; 9 KiB went back to the subject that owns
    // it and another 3 KiB of unreachable rules were deleted before these numbers were set.
    const dir = join(root, 'styles', 'domains');
    // Measured for every sheet before asserting, so one oversized subject cannot hide the next:
    // maths and physics were both over and only maths was reported, because the loop threw first.
    const over: string[] = [];
    for (const file of readdirSync(dir).filter((name) => name.endsWith('.css'))) {
      const sheet = readFileSync(join(dir, file), 'utf8');
      const css = [...sheet.matchAll(/@import "\.\/(?:parts\/)?([a-z0-9-]+)\.css"/g)]
        .map(([, name]) => {
          // A domain sheet imports its own parts plus ./shared.css, which is itself a list.
          const part = join(dir, 'parts', `${name}.css`);
          return existsSync(part)
            ? [part]
            : [...readFileSync(join(dir, `${name}.css`), 'utf8').matchAll(/parts\/([a-z0-9-]+)\.css/g)].map(
                ([, inner]) => join(dir, 'parts', `${inner}.css`),
              );
        })
        .flat()
        .map((part) => readFileSync(part, 'utf8'))
        .join('');
      const bytes = Buffer.byteLength(css);
      const transfer = gzipSync(transferCss(css)).byteLength;
      if (bytes > 44 * 1024) over.push(`${file} source ${bytes} > ${44 * 1024}`);
      if (transfer > 9 * 1024) over.push(`${file} transfer ${transfer} > ${9 * 1024}`);
    }
    expect(over).toEqual([]);
  });

  it('keeps optional WebGL isolated from normal domain bundles', () => {
    const regularEntries = [
      join(root, 'dist', 'index.mjs'),
      join(root, 'dist', 'chem', 'index.mjs'),
      join(root, 'dist', 'physics', 'index.mjs'),
    ];
    for (const entry of regularEntries) {
      expect(readFileSync(entry, 'utf8'), normalized(entry)).not.toMatch(
        /(?:@react-three\/fiber|from\s+["']three["'])/,
      );
    }
    const webgl = readFileSync(join(root, 'dist', 'three', 'chemistry', 'molecular-geometry.mjs'), 'utf8');
    const orbitalWebgl = readFileSync(join(root, 'dist', 'three', 'chemistry', 'atomic-orbital.mjs'), 'utf8');
    const surface = readFileSync(join(root, 'dist', 'three', 'surface.mjs'), 'utf8');
    expect(webgl).toContain('from "three"');
    expect(webgl).toContain('MolecularGeometryProjectedScene');
    expect(orbitalWebgl).toContain('from "three"');
    expect(orbitalWebgl).toContain('AtomicOrbitalProjectedScene');
    expect(orbitalWebgl).toContain('attributes-position');
    expect(orbitalWebgl).not.toContain('<mesh');
    expect(surface).toContain('from "@react-three/fiber"');
    expect(surface).toContain('frameloop = "demand"');
    expect(surface).toContain('dpr: [1, 1.5]');
    expect(surface).toContain('supportsWebGL');
    expect(surface).toContain('IntersectionObserver');
    expect(surface).toContain('webglcontextlost');
    expect(surface).toContain('prefers-reduced-motion: reduce');
    const threeCss = readFileSync(join(root, 'styles', 'three.css'), 'utf8');
    const aggregateCss = readFileSync(join(root, 'styles.css'), 'utf8');
    expect(aggregateCss).toContain('@import "./styles/three.css"');
    expect(aggregateCss).toContain('@import "./styles/modern-physics.css"');
    expect(threeCss).toMatch(/\.lab-three-canvas\s*\{[\s\S]*?height:\s*clamp/);
    expect(threeCss).toMatch(/canvas\s*\{[\s\S]*?touch-action:\s*pan-y/);
    expect(threeCss).not.toMatch(/touch-action:\s*none/);
  });

  it('keeps authored activity compilation independent from authoring validators', () => {
    const compiler = readFileSync(join(root, 'dist', 'kit', 'activity-authoring.mjs'), 'utf8');
    const runtime = readFileSync(join(root, 'dist', 'kit', 'authored-activity-runtime.mjs'), 'utf8');
    expect(compiler).toContain('classytic.activity-plan');
    expect(compiler).not.toMatch(/from\s+["']zod["']/);
    expect(runtime).not.toMatch(/from\s+["']zod["']/);
  });

  it('keeps shared controls touch-sized and mobile transport safe', () => {
    const core = readFileSync(join(root, 'styles', 'core.css'), 'utf8');
    expect(core).toMatch(/--lab-target:\s*44px/);
    for (const selector of ['lab-btn', 'lab-input', 'lab-chip']) {
      expect(core, selector).toMatch(
        new RegExp(`\\.${selector}\\s*\\{[\\s\\S]*?min-height:\\s*var\\(--lab-target\\)`),
      );
    }
    expect(core).toMatch(
      /@container lab-activity \(max-width: 42\.5rem\)[\s\S]*?\.lab-activity-transport\s*\{[\s\S]*?position:\s*sticky[\s\S]*?env\(safe-area-inset-bottom\)/,
    );
    const compactActivity = core.slice(core.indexOf('@container lab-activity (max-width: 42.5rem)'));
    expect(core).toMatch(/\.lab-activity-status\s*\{[\s\S]*?min-width:\s*0/);
    expect(compactActivity).toMatch(/\.lab-activity-status\s*\{[\s\S]*?flex-wrap:\s*wrap/);
  });

  it('keeps discrete inspector spacing on the shared section primitive', () => {
    const core = readFileSync(join(root, 'styles', 'core.css'), 'utf8');
    expect(core).toMatch(
      /\.lab-activity-inspector-section\s*\{[\s\S]*?gap:\s*var\(--lab-sp-16\)[\s\S]*?padding:\s*var\(--lab-sp-16\)/,
    );
    expect(core).not.toMatch(
      /\.lab-activity-inspector-section\s*\{[^}]*padding-(?:block|inline):\s*var\(--lab-sp-(?:2|4)\)/,
    );

    for (const preset of ['proof-builder', 'induction', 'pigeonhole', 'modular-clock', 'recurrence']) {
      const sourceFile = readFileSync(join(source, 'discrete', preset, 'preset.tsx'), 'utf8');
      expect(sourceFile, preset).toContain('<Activity.InspectorSection>');
    }

    const domains = readDomainCss();
    expect(domains).not.toMatch(/\.discrete-proof-activity \.lab-activity-inspector\[open\]/);
  });

  it('keeps authored rule figures container-responsive', () => {
    const core = readFileSync(join(root, 'styles', 'core.css'), 'utf8');
    const domains = readDomainCss();
    expect(core).toMatch(/\.rule-figure\s*\{[\s\S]*?width:\s*100%/);
    expect(domains).toMatch(/@container rule-card \(min-width: 32rem\)[\s\S]*?\.complex-rule-pair/);
    expect(domains).not.toMatch(/\.complex-rule-pair[\s\S]{0,180}width:\s*\d+px/);
  });

  it('keeps authoring panels on shared form primitives', () => {
    // The shared kit is included, not just the per-lab panels: it is where a native control
    // does the most damage (every panel inherits it) and it was exempt long enough for a raw
    // `<select>` to sit there ignoring the app theme.
    const offenders = [...files(join(source, 'domains')), join(source, 'blocks', 'authoring.tsx')]
      .filter(
        (file) =>
          file.endsWith('authoring.tsx') && /<(input|select|textarea)\b/.test(readFileSync(file, 'utf8')),
      )
      .map(normalized);
    expect(offenders).toEqual([]);
  });

  it('keeps shared block discovery UI free of static inline presentation', () => {
    const offenders = [join(source, 'blocks', 'authoring.tsx')]
      .filter((file) => /\bstyle=/.test(readFileSync(file, 'utf8')))
      .map(normalized);
    expect(offenders).toEqual([]);
  });

  it('keeps circuit presentation declarative outside its computed viewport', () => {
    const editor = readFileSync(join(source, 'build', 'CircuitEditor.tsx'), 'utf8');
    const scene = readFileSync(join(source, 'build', 'CircuitScene.tsx'), 'utf8');
    const sharedParts = readFileSync(join(source, 'build', 'parts', 'shared.tsx'), 'utf8');
    expect(editor.match(/\bstyle=/g) ?? []).toHaveLength(1);
    expect(scene).not.toMatch(/\bstyle=/);
    expect(sharedParts).not.toMatch(/\bstyle=/);
  });

  it('keeps shared concept and scene-authoring surfaces declarative', () => {
    const offenders = [join(source, 'kit', 'rule.tsx'), join(source, 'kit', 'scene-studio.tsx')]
      .filter((file) => /\bstyle=/.test(readFileSync(file, 'utf8')))
      .map(normalized);
    expect(offenders).toEqual([]);
  });

  it('keeps biology presentation independent from other domain CSS', () => {
    const offenders = files(join(source, 'biology'))
      .filter((file) => /className=[^\n]*(?:finance-|discrete-stage-scene)/.test(readFileSync(file, 'utf8')))
      .map(normalized);
    expect(offenders).toEqual([]);
  });

  it('keeps the photosynthesis flagship on canonical Activity anatomy', () => {
    const code = readFileSync(join(source, 'biology', 'photosynthesis-factors', 'preset.tsx'), 'utf8');
    expect(code).toMatch(/<Activity\.Root/);
    expect(code).not.toMatch(/\b(?:LabFrame|ControlBar)\b/);
  });

  it('keeps the respiration flagship on canonical Activity anatomy', () => {
    const code = readFileSync(join(source, 'biology', 'respiration', 'preset.tsx'), 'utf8');
    expect(code).toMatch(/<Activity\.Root/);
    expect(code).not.toMatch(/\b(?:LabFrame|ControlBar)\b/);
  });

  it('keeps enzyme and molecular-sequence flagships on canonical Activity anatomy', () => {
    const runtimes = [
      join(source, 'biology', 'enzyme-rate', 'preset.tsx'),
      join(source, 'biology', 'sequence', 'preset.tsx'),
      join(source, 'biology', 'sequence', 'central-dogma.tsx'),
    ];
    for (const runtime of runtimes) {
      const code = readFileSync(runtime, 'utf8');
      expect(code).toMatch(/<Activity\.Root/);
      expect(code).not.toMatch(/\b(?:LabFrame|ControlBar)\b/);
    }
  });

  it('keeps the shared genetic-cross renderer on canonical Activity anatomy', () => {
    const code = readFileSync(join(source, 'biology', 'genetic-cross', 'grid.tsx'), 'utf8');
    expect(code).toMatch(/<Activity\.Root/);
    expect(code).not.toMatch(/\b(?:LabFrame|ControlBar)\b/);
  });

  it('keeps the shared geography-cycle renderer on canonical Activity anatomy', () => {
    const code = readFileSync(join(source, 'geography', 'cycle-lab', 'preset.tsx'), 'utf8');
    expect(code).toMatch(/<Activity\.Root/);
    expect(code).not.toMatch(/\b(?:LabFrame|ControlBar)\b/);
  });

  it('keeps the law-of-large-numbers simulation on canonical Activity anatomy', () => {
    const code = readFileSync(join(source, 'discrete', 'lln', 'preset.tsx'), 'utf8');
    expect(code).toMatch(/<Activity\.Root/);
    expect(code).not.toMatch(/\b(?:LabFrame|ControlBar)\b/);
  });

  it('keeps probability simulation flagships on canonical Activity anatomy', () => {
    for (const name of ['monty-hall', 'monte-carlo']) {
      const code = readFileSync(join(source, 'discrete', name, 'preset.tsx'), 'utf8');
      expect(code).toMatch(/<Activity\.Root/);
      expect(code).not.toMatch(/\b(?:LabFrame|ControlBar)\b/);
    }
  });

  it('keeps discrete-distribution flagships on canonical Activity anatomy', () => {
    for (const name of ['binomial', 'hypergeometric', 'expected-value']) {
      const code = readFileSync(join(source, 'discrete', name, 'preset.tsx'), 'utf8');
      expect(code).toMatch(/<Activity\.Root/);
      expect(code).not.toMatch(/\b(?:LabFrame|ControlBar)\b/);
    }
  });

  it('keeps Cartesian-product counting flagships on canonical Activity anatomy', () => {
    for (const name of ['sample-space', 'outcome-builder', 'combination-studio']) {
      const code = readFileSync(join(source, 'discrete', name, 'preset.tsx'), 'utf8');
      expect(code).toMatch(/<Activity\.Root/);
      expect(code).not.toMatch(/\b(?:LabFrame|ControlBar|Callout)\b/);
    }
  });

  it('keeps permutation and selection flagships on canonical Activity anatomy', () => {
    for (const name of ['counting-tree', 'counting-slots', 'arrangements', 'selection']) {
      const code = readFileSync(join(source, 'discrete', name, 'preset.tsx'), 'utf8');
      expect(code).toMatch(/<Activity\.Root/);
      expect(code).not.toMatch(/\b(?:LabFrame|ControlBar|Callout)\b/);
    }
  });

  it('keeps set and combinatorial-structure flagships on canonical Activity anatomy', () => {
    for (const name of ['venn', 'pascal']) {
      const code = readFileSync(join(source, 'discrete', name, 'preset.tsx'), 'utf8');
      expect(code).toMatch(/<Activity\.Root/);
      expect(code).not.toMatch(/\b(?:LabFrame|ControlBar|Callout)\b/);
    }
  });

  it('keeps discrete Boolean-logic flagships on canonical Activity anatomy', () => {
    for (const name of ['truth-table', 'karnaugh']) {
      const code = readFileSync(join(source, 'discrete', name, 'preset.tsx'), 'utf8');
      expect(code).toMatch(/<Activity\.Root/);
      expect(code).not.toMatch(/\b(?:LabFrame|ControlBar|Callout)\b/);
    }
  });

  it('keeps normal-distribution lookup flagships on canonical Activity anatomy', () => {
    for (const name of ['normal', 'z-table']) {
      const code = readFileSync(join(source, 'statistics', name, 'preset.tsx'), 'utf8');
      expect(code).toMatch(/<Activity\.Root/);
      expect(code).not.toMatch(/\b(?:LabFrame|ControlBar|Callout)\b/);
    }
  });

  it('keeps descriptive-statistics flagships on canonical Activity anatomy', () => {
    for (const name of ['center-spread', 'histogram']) {
      const code = readFileSync(join(source, 'statistics', name, 'preset.tsx'), 'utf8');
      expect(code).toMatch(/<Activity\.Root/);
      expect(code).not.toMatch(/\b(?:LabFrame|ControlBar|Callout)\b/);
    }
  });

  it('keeps statistical simulation and series flagships on canonical Activity anatomy', () => {
    for (const name of ['sampling', 'galton', 'sequence']) {
      const code = readFileSync(join(source, 'statistics', name, 'preset.tsx'), 'utf8');
      expect(code).toMatch(/<Activity\.Root/);
      expect(code).not.toMatch(/\b(?:LabFrame|ControlBar|Callout)\b/);
    }
  });

  it('keeps isolated physics and geometry runtimes off legacy shell composition', () => {
    const projectile = readFileSync(
      join(source, 'domains', 'physics', 'projectile-lab', 'runtime', 'index.tsx'),
      'utf8',
    );
    expect(projectile).toMatch(/<AuthoredActivityRuntime/);
    expect(projectile).not.toMatch(/\b(?:LabFrame|ControlBar)\b/);
    const geometry = readFileSync(join(source, 'geometry', 'board', 'preset.tsx'), 'utf8');
    expect(geometry).toMatch(/<Activity\.Root/);
    expect(geometry).not.toMatch(/\b(?:LabFrame|ControlBar)\b/);
  });

  it('keeps logic learning surfaces on canonical Activity anatomy', () => {
    for (const name of ['lab.tsx', 'display.tsx']) {
      const code = readFileSync(join(source, 'logic', name), 'utf8');
      expect(code).toMatch(/<Activity\.Root/);
      expect(code).not.toMatch(/\b(?:LabFrame|ControlBar|Callout)\b/);
    }
  });

  it('keeps elementary math manipulatives on canonical Activity anatomy', () => {
    for (const name of ['fraction-bar', 'percent-bar', 'ratio-share', 'area-model', 'receipt']) {
      const code = readFileSync(join(source, 'math', name, 'preset.tsx'), 'utf8');
      expect(code).toMatch(/<Activity\.Root/);
      expect(code).not.toMatch(/\b(?:LabFrame|ControlBar|Callout)\b/);
    }
  });

  it('keeps algebra and linear manipulatives on canonical Activity anatomy', () => {
    for (const name of [
      'balance-algebra',
      'mystery-bucket',
      'linear-system',
      'system-solve',
      'function-machine',
      'rate-machine',
      'linear-model',
      'straight-line',
    ]) {
      const code = readFileSync(join(source, 'math', name, 'preset.tsx'), 'utf8');
      expect(code).toMatch(/<Activity\.Root/);
      expect(code).not.toMatch(/\b(?:LabFrame|ControlBar|Callout)\b/);
    }
  });

  it('keeps math runtimes independent from legacy presentation shells', () => {
    const offenders = files(join(source, 'math'))
      .filter((file) => /\b(?:LabFrame|ControlBar|Callout)\b/.test(readFileSync(file, 'utf8')))
      .map(normalized);
    expect(offenders).toEqual([]);
  });

  it('keeps domain runtimes independent from legacy presentation shells', () => {
    const domainRoots = [
      'algorithms',
      'biology',
      'chem',
      'circuits',
      'commerce',
      'discrete',
      'domains',
      'geography',
      'geometry',
      'ict',
      'language',
      'logic',
      'math',
      'ml',
      'networking',
      'physics',
      'statistics',
    ];
    const offenders = domainRoots
      .flatMap((domain) => files(join(source, domain)))
      .filter((file) => /\b(?:LabFrame|ControlBar|Callout)\b/.test(readFileSync(file, 'utf8')))
      .map(normalized);
    expect(offenders).toEqual([]);
  });

  it('keeps commerce presentation independent from other domain CSS', () => {
    const offenders = files(join(source, 'commerce'))
      .filter((file) =>
        /className=[^\n]*(?:physics-|biology-|math-|ml-|discrete-|network-)/.test(readFileSync(file, 'utf8')),
      )
      .map(normalized);
    expect(offenders).toEqual([]);
  });

  it('keeps commerce runtimes independent from legacy presentation shells', () => {
    const offenders = files(join(source, 'commerce'))
      .filter((file) => /\b(?:LabFrame|ControlBar|Callout)\b/.test(readFileSync(file, 'utf8')))
      .map(normalized);
    expect(offenders).toEqual([]);
  });

  it('keeps statistics and discrete presentation domain-owned', () => {
    const offenders = ['statistics', 'discrete']
      .flatMap((domain) => files(join(source, domain)))
      .filter((file) =>
        /className=[^\n]*(?:physics-|biology-|finance-|commerce-|math-|ml-|network-)/.test(
          readFileSync(file, 'utf8'),
        ),
      )
      .map(normalized);
    expect(offenders).toEqual([]);
  });

  it('keeps the geometry builder independent from host Tailwind utilities', () => {
    const code = readFileSync(join(source, 'geometry', 'builder.tsx'), 'utf8');
    expect(code).not.toMatch(/className=[^\n]*(?:rounded-|border-|bg-|text-|hover:|px-|py-|my-|ml-|cursor-)/);
  });

  it('keeps circuit runtime and editor composition package-styled', () => {
    const targets = [join(source, 'build', 'CircuitScene.tsx'), join(source, 'build', 'CircuitEditor.tsx')];
    const offenders = targets
      .filter((file) =>
        /className=[^\n]*(?:rounded-|border-|bg-|text-|hover:|px-|py-|gap-|flex|cursor-|overflow-|relative|min-h-)/.test(
          readFileSync(file, 'utf8'),
        ),
      )
      .map(normalized);
    expect(offenders).toEqual([]);
  });

  it('keeps row authoring actions on shared editor classes', () => {
    const code = readFileSync(join(source, 'blocks', 'authoring.tsx'), 'utf8');
    const rowsEditor = code.slice(code.indexOf('export function RowsEditor'));
    expect(rowsEditor).not.toMatch(
      /className=[^\n]*(?:rounded-|border-|bg-|text-|hover:|px-|py-|p-|gap-|space-|w-full)/,
    );
  });

  it('limits concrete-scene inline styles to runtime dimensions and state', () => {
    const counts = new Map([
      ['clue-scene.tsx', 4],
      ['receipt.tsx', 1],
      ['slot-fill.tsx', 3],
    ]);
    for (const [name, limit] of counts) {
      const code = readFileSync(join(source, 'kit', name), 'utf8');
      expect(code.match(/\bstyle=/g) ?? [], name).toHaveLength(limit);
    }
  });

  it('keeps visualization primitives within reviewed runtime-style boundaries', () => {
    const counts = new Map([
      ['annotate.tsx', 1],
      ['data-scene.tsx', 6],
      ['frame.tsx', 2],
      ['vessel.tsx', 5],
    ]);
    for (const [name, limit] of counts) {
      const code = readFileSync(join(source, 'kit', name), 'utf8');
      expect(code.match(/\bstyle=/g) ?? [], name).toHaveLength(limit);
    }
  });

  it('keeps pedagogy and electronics primitives free of static inline presentation', () => {
    const names = [
      'pedagogy.tsx',
      'scene-library.tsx',
      'electronics/basics.tsx',
      'electronics/icons.tsx',
      'electronics/meter.tsx',
      'electronics/semiconductor.tsx',
      'electronics/signals.tsx',
    ];
    const offenders = names
      .map((name) => join(source, 'kit', name))
      .filter((file) => /\bstyle=/.test(readFileSync(file, 'utf8')))
      .map(normalized);
    expect(offenders).toEqual([]);
  });

  it('keeps assessed choices on the canonical host-shadcn adapter', () => {
    const responseSurfaces = [
      join(source, 'kit', 'pedagogy.tsx'),
      join(source, 'kit', 'authored-response.tsx'),
    ];
    for (const file of responseSurfaces) {
      const code = readFileSync(file, 'utf8');
      expect(code, normalized(file)).toContain('AssessedChoiceGroup');
      expect(code, normalized(file)).not.toMatch(/<Button[\s\S]{0,320}role="radio"/);
    }
  });

  it('does not inject component-private stylesheets at runtime', () => {
    const offenders = files(source)
      .filter((file) => /<style(?:\s|>)/.test(readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')))
      .map(normalized);
    expect(offenders).toEqual([]);
  });

  it('keeps algorithm engines React-free behind explicit package subpaths', () => {
    const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as {
      exports: Record<string, unknown>;
    };
    expect(Object.keys(pkg.exports)).toEqual(
      expect.arrayContaining([
        './algorithms/core',
        './algorithms/graph',
        './algorithms/dp',
        './algorithms/heap',
        './algorithms/tree',
        './algorithms/react',
      ]),
    );
    const engineFiles = [
      'contract.ts',
      'graph.ts',
      'normalize.ts',
      'presets.ts',
      'dp.ts',
      'sequence-contract.ts',
      'heap.ts',
      'tree-contract.ts',
      'tree-layout.ts',
      'tree.ts',
      'tree-builder.ts',
      'tree-presets.ts',
    ];
    for (const name of engineFiles) {
      const code = readFileSync(join(source, 'algorithms', name), 'utf8');
      expect(code, name).not.toMatch(/(?:from\s+["']react|react\/jsx-runtime|\.tsx["'])/);
    }
  });

  it('keeps algorithm authoring chunks on leaf imports', () => {
    const offenders = files(join(source, 'domains', 'ict'))
      .filter((file) => file.endsWith('authoring.tsx'))
      .filter((file) =>
        /algorithms\/(?:index|react\/index|graph\/index|tree\/index|heap\/index|dp\/index)\.js/.test(
          readFileSync(file, 'utf8'),
        ),
      )
      .map(normalized);
    expect(offenders).toEqual([]);
  });

  it('separates circuit runtime from its authoring editor at the package boundary', () => {
    const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as {
      exports: Record<string, unknown>;
    };
    expect(Object.keys(pkg.exports)).toEqual(expect.arrayContaining(['./build/runtime', './build/editor']));
    const runtime = readFileSync(join(source, 'build', 'runtime', 'index.ts'), 'utf8');
    expect(runtime).not.toMatch(/CircuitEditor\.js|editor-ops\.js/);
  });

  it('separates logic runtime from its visual builder at the package boundary', () => {
    const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as {
      exports: Record<string, unknown>;
    };
    expect(Object.keys(pkg.exports)).toEqual(expect.arrayContaining(['./logic/runtime', './logic/editor']));
    const runtime = readFileSync(join(source, 'logic', 'runtime', 'index.ts'), 'utf8');
    expect(runtime).not.toMatch(/LogicEditor\.js|LogicEditScene\.js|LogicBuildLab\.js|edit-ops\.js/);
  });

  it('keeps gallery catalog discovery schema-free', () => {
    const catalog = readFileSync(join(source, 'domains', 'catalog.ts'), 'utf8');
    const generated = readFileSync(join(source, 'domains', 'catalog-map.ts'), 'utf8');
    expect(catalog).not.toMatch(/manifests\.js/);
    expect(generated).not.toMatch(/(?:from\s+["']zod|\/manifest\.js)/);
  });

  it('loads real authoring schemas by domain instead of through one eager registry', () => {
    const loaders = readFileSync(join(source, 'domains', 'block-loaders.ts'), 'utf8');
    expect(loaders).not.toMatch(/manifests\.js/);
    expect(loaders).toMatch(/import\(['"]\.\/block-sets\/math\.js['"]\)/);
    expect(loaders).toMatch(/import\(['"]\.\/block-sets\/physics\.js['"]\)/);
  });

  it('does not restore legacy domain loaders or runtime style injectors', () => {
    const offenders = files(source)
      .filter((file) => /LAB_DOMAIN_LOADERS|loadDomainComponents|LabStyles/.test(readFileSync(file, 'utf8')))
      .map(normalized);
    expect(offenders).toEqual([]);
  });

  it('keeps deprecated Guide and Steps compatibility out of built-in labs', () => {
    const offenders = files(source)
      .filter((file) => !file.includes(`${join('src', 'kit')}`))
      .filter((file) => /from\s+["'][^"']*\/kit\/(?:guide|steps)\.js["']/.test(readFileSync(file, 'utf8')))
      .map(normalized);
    expect(offenders).toEqual([]);
  });

  it('keeps math and physics runtime controls on shared primitives', () => {
    const offenders = [join(source, 'math'), join(source, 'physics')]
      .flatMap(files)
      .filter((file) => /<(button|input|select|textarea)\b/.test(readFileSync(file, 'utf8')))
      .map(normalized);
    expect(offenders).toEqual([]);
  });

  it('keeps Commerce experiences on the authored activity runtime', () => {
    const offenders = files(join(source, 'commerce'))
      .filter((file) => file !== join(source, 'commerce', 'activity.tsx'))
      .filter((file) =>
        /\b(?:LabFrame|ControlBar|CommerceActivity|useGuide|GuideNav|useChallenge|ChallengeCard|useLearningSequence|LearningSequenceNav)\b/.test(
          readFileSync(file, 'utf8'),
        ),
      )
      .map(normalized);
    expect(offenders).toEqual([]);
  });

  it('keeps Chemistry experiences on the authored activity runtime', () => {
    const offenders = files(join(source, 'chem'))
      .filter((file) =>
        /\b(?:LabFrame|ControlBar|useGuide|GuideNav|useChallenge|ChallengeCard|useLearningSequence|LearningSequenceNav)\b/.test(
          readFileSync(file, 'utf8'),
        ),
      )
      .map(normalized);
    expect(offenders).toEqual([]);
    const experiences = [
      'battery.tsx',
      'bohr-atom.tsx',
      'diffusion/preset.tsx',
      'electrochem/preset.tsx',
      'equilibrium/preset.tsx',
      'gas-box/preset.tsx',
      'kinetics/preset.tsx',
      'periodic-trends/preset.tsx',
      'reaction-lab.tsx',
      'reaction-profile.tsx',
      'solution/dilution.tsx',
      'solution/solution-box.tsx',
      'stoichiometry/preset.tsx',
      'titration/preset.tsx',
    ];
    for (const name of experiences)
      expect(readFileSync(join(source, 'chem', name), 'utf8'), name).toMatch(/<AuthoredActivityRuntime/);
  });

  it('keeps electronics flagships on the authored activity runtime', () => {
    const experiences = [
      'rc-charging/preset.tsx',
      'diode/preset.tsx',
      'transistor/preset.tsx',
      'semiconductor/silicon-lattice.tsx',
      'semiconductor/hall-effect.tsx',
      'semiconductor/conduction.tsx',
      'semiconductor/mosfet-inside.tsx',
      'semiconductor/pn-junction.tsx',
      'semiconductor/bjt-inside.tsx',
      'ac-dc/preset.tsx',
      'brownout/preset.tsx',
      'cmos-gate/inverter.tsx',
      'cmos-gate/nand.tsx',
      'cmos-gate/nor.tsx',
      'cmos-gate/rnmos-not.tsx',
      'capacitor-leak/preset.tsx',
      'circuit/preset.tsx',
    ];
    for (const name of experiences) {
      const code = readFileSync(join(source, 'circuits', name), 'utf8');
      expect(code, name).toMatch(/<AuthoredActivityRuntime/);
      expect(code, name).not.toMatch(/\b(?:LabFrame|ControlBar|Callout|useChallenge|ChallengeCard)\b/);
    }
    const builder = readFileSync(join(source, 'circuits', 'circuit-builder.tsx'), 'utf8');
    expect(builder).toMatch(/<CircuitNetworkLab/);
    expect(builder).not.toMatch(/\b(?:LabFrame|ControlBar|solveDC|useFrameLoop)\b/);
  });

  it('keeps language experiences on one domain composition and one prominent audio action', () => {
    const offenders = files(join(source, 'language'))
      .filter((file) => file !== join(source, 'language', 'activity.tsx'))
      .filter((file) => /\b(?:LabFrame|ControlBar)\b|kit\/frame\.js/.test(readFileSync(file, 'utf8')))
      .map(normalized);
    expect(offenders).toEqual([]);
    for (const name of ['listening/preset.tsx', 'dictation/preset.tsx'])
      expect(readFileSync(join(source, 'language', name), 'utf8'), name).toMatch(/<ListenButton/);
  });

  it('keeps ICT number-system labs on Activity without cross-domain shell styling', () => {
    const cohort = ['place-value-dial.tsx', 'bit-grouper.tsx', 'base-odometer.tsx'].map((name) =>
      join(source, 'ict', 'number-systems', name),
    );
    const offenders = files(join(source, 'ict', 'number-systems'))
      .filter((file) =>
        /\b(?:LabFrame|ControlBar|StatusPill)\b|(?:lang-speak|discrete-stage-scene|lab-playwrap)/.test(
          readFileSync(file, 'utf8'),
        ),
      )
      .map(normalized);
    expect(offenders).toEqual([]);
    for (const file of cohort)
      expect(readFileSync(file, 'utf8'), normalized(file)).toMatch(/<Activity\.Root/);
  });

  it('keeps ML implementations colocated with their canonical manifests', () => {
    const ids = ['classifier-threshold', 'decision-boundary', 'kmeans', 'knn', 'regression'];
    for (const id of ids) {
      const runtime = readFileSync(join(source, 'domains', 'ml', id, 'runtime.tsx'), 'utf8');
      expect(runtime, id).not.toMatch(/\.\.\/\.\.\/\.\.\/ml\//);
      expect(runtime, id).toMatch(/export default/);
    }
    expect(readdirSync(join(source, 'ml')).sort()).toEqual(['index.ts']);
    const publicIndex = readFileSync(join(source, 'ml', 'index.ts'), 'utf8');
    expect(publicIndex).toMatch(/\.\.\/domains\/ml\/regression\/runtime\.js/);
  });

  it('keeps Packet Journey UI canonical while networking engines remain reusable', () => {
    const runtime = readFileSync(
      join(source, 'domains', 'networking', 'packet-journey', 'runtime.tsx'),
      'utf8',
    );
    const publicIndex = readFileSync(join(source, 'networking', 'index.ts'), 'utf8');
    expect(runtime).toMatch(/export function PacketJourneyLab/);
    expect(runtime).toMatch(/export default PacketJourneyLab/);
    expect(runtime).toMatch(/\.\.\/\.\.\/\.\.\/networking\/simulation\.js/);
    expect(publicIndex).toMatch(/\.\.\/domains\/networking\/packet-journey\/runtime\.js/);
    expect(files(join(source, 'networking')).map(normalized)).not.toContain(
      'src/networking/PacketJourneyLab.tsx',
    );
    for (const engine of [
      'contract.ts',
      'ip.ts',
      'simulation.ts',
      'presets.ts',
      'NetworkScene.tsx',
      'PacketInspector.tsx',
    ])
      expect(files(join(source, 'networking')).map((file) => file.split(/[\\/]/).at(-1))).toContain(engine);
  });

  it('keeps one focus-mode implementation and no compatibility frame', () => {
    const activity = readFileSync(join(source, 'kit', 'activity.tsx'), 'utf8');
    const frame = readFileSync(join(source, 'kit', 'frame.tsx'), 'utf8');
    const focusOwners = files(source)
      .filter((file) => /requestFullscreen|fullscreenchange/.test(readFileSync(file, 'utf8')))
      .map(normalized);
    expect(focusOwners).toEqual(['src/kit/activity.tsx']);
    expect(activity).toMatch(/function FocusButton/);
    expect(frame).not.toMatch(/LabFrame|ControlBar|Callout/);
    const publicKit = readFileSync(join(source, 'kit', 'index.ts'), 'utf8');
    expect(publicKit).not.toMatch(/LabFrame|ControlBar|Callout/);
  });

  it('allows Canvas2D only through reviewed high-density Stage layers', () => {
    const allowed = [
      'src/chem/gas-box/preset.tsx',
      // src/chem/solution/field.tsx left this list when it moved onto the figure kit: it is a
      // STATIC scatter capped at 260 particles, so SVG <Particle> costs nothing a frame loop would.
      'src/discrete/monte-carlo/preset.tsx',
      'src/math/gradient-descent.tsx',
      'src/domains/ml/knn/runtime.tsx',
      'src/physics/orbit-lab.tsx',
      'src/physics/rain-relative/preset.tsx',
      'src/physics/waves/doppler.tsx',
      'src/physics/waves/preset.tsx',
      'src/physics/waves/ripple.tsx',
      'src/physics/waves/string.tsx',
      'src/statistics/galton/preset.tsx',
      'src/statistics/sampling/preset.tsx',
    ];
    const canvasFiles = files(source)
      .filter((file) => /CanvasRenderingContext2D/.test(readFileSync(file, 'utf8')))
      .map(normalized)
      .sort();
    expect(canvasFiles).toEqual(allowed.sort());
    for (const name of canvasFiles)
      expect(
        readFileSync(join(root, name), 'utf8'),
        `${name} must render through Stage CanvasLayer`,
      ).toContain('CanvasLayer');
  });
});
