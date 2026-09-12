import { describe, expect, it } from 'vitest';
import ts from 'typescript';
import { createLabTemplates } from '../scripts/lab-create.mjs';

const templates = createLabTemplates({
  domain: 'physics',
  id: 'sample-motion',
  tag: 'SampleMotion',
  title: 'Sample motion',
  description: 'Explore a changing quantity.',
  group: 'Physics',
});

describe('canonical lab generator', () => {
  it('keeps unverified experience metadata out of a new manifest', () => {
    expect(templates.manifest).not.toContain('experience:');
    expect(templates.manifest).toContain('initialValue');
    expect(templates.manifest).toContain("loadRuntime: () => import('./runtime.js')");
  });

  it('creates a compiled authored runtime instead of a hand-rolled shell', () => {
    expect(templates.activity).toContain('defineAuthoredActivity({');
    expect(templates.activity).not.toContain('react');
    expect(templates.activity).not.toContain('zod');
    expect(templates.runtime).toContain("import { activity } from './activity.js'");
    expect(templates.runtime).toContain('<AuthoredActivityRuntime');
    expect(templates.runtime).toContain('<AuthoredMetricGate');
    expect(templates.runtime).toContain('<Slider');
    expect(templates.runtime).not.toContain('<Activity.Root>');
    expect(templates.runtime).not.toContain('<input');
    expect(templates.runtime).not.toContain('TODO:');
  });

  it('creates a CMS example and executable behavior/accessibility tests', () => {
    expect(templates.example).toContain('<SampleMotion');
    expect(templates.example).toContain('initialValue={1}');
    expect(templates.test).toContain("getByRole('button', { name: 'Continue' })");
    expect(templates.test).toContain("getByRole('slider', { name: 'Model value' })");
    expect(templates.test).toContain("getByLabelText('Current model value')");
    expect(templates.test).toContain("getByRole('button', { name: 'Reset model' })");
  });

  it('emits syntactically valid TypeScript and TSX', () => {
    for (const [name, source] of [
      ['manifest.ts', templates.manifest],
      ['activity.ts', templates.activity],
      ['runtime.tsx', templates.runtime],
      ['sample-motion.test.tsx', templates.test],
    ] as const) {
      const result = ts.transpileModule(source, {
        fileName: name,
        reportDiagnostics: true,
        compilerOptions: {
          jsx: ts.JsxEmit.ReactJSX,
          module: ts.ModuleKind.ESNext,
          target: ts.ScriptTarget.ES2022,
        },
      });
      const errors = (result.diagnostics ?? []).filter(
        (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error,
      );
      expect(errors, name).toEqual([]);
    }
  });
});
