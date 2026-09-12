/**
 * Scaffold one lab in the canonical model without overwriting existing work.
 *
 *   npm run lab:create -- --domain physics --id transformer-attention
 *   npm run lab:create -- --domain physics --id foo --component FooLab --from ../../../physics/foo/index.js
 *
 * Emits a manifest, pure activity plan, isolated runtime, MDX authoring example,
 * and executable interaction test.
 * Run `npm run labs:generate` afterwards to refresh the registries.
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const pascal = (value) =>
  value
    .replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())
    .replace(/^./, (letter) => letter.toUpperCase());

export function createLabTemplates({ domain, id, tag, title, description, group, component, from }) {
  const componentName = pascal(id);
  const defaultTag = componentName;
  const manifest = `import { z } from 'zod';
import { defineLab } from '../../../lab-def/define-lab.js';

export default defineLab({
  id: '${id}',${tag !== defaultTag ? `\n  tag: '${tag}',` : ''}
  domain: '${domain}',
  group: '${group}',
  title: ${JSON.stringify(title)},
  description: ${JSON.stringify(description)},
  schema: z.object({
    title: z.string().optional(),
    prompt: z.string().optional(),
    initialValue: z.number().int().min(0).default(0),
    target: z.number().int().positive().default(4),
  }),
  taxonomy: {
    grades: [],
    outcomes: [],
    durationMinutes: 10,
    interaction: 'explorer',
    authorability: 'moderate',
  },
  // Add the experience declaration only after the real lesson has executable evidence for its
  // learning phases, response contract, keyboard path, transcript, and motion fallback.
  loadRuntime: () => import('./runtime.js'),
});
`;

  const activity = `import { defineAuthoredActivity } from '../../../kit/activity-authoring.js';

/** Portable lesson sequence. Keep domain state and React rendering in runtime.tsx. */
export const activity = defineAuthoredActivity({
  pattern: 'investigation',
  title: ${JSON.stringify(title)},
  objectives: ['Change one variable and explain the evidence produced by the model.'],
  success: [{ id: 'target-reached', source: 'metric', key: 'model-value', pendingLabel: 'Move the model to its authored target.' }],
  steps: [
    { id: 'investigate', phase: 'act', title: 'Test the model', lead: 'Change the model value until it reaches the target.', reveal: ['model', 'evidence'], controls: true, success: 'target-reached' },
    { id: 'explain', phase: 'explain', title: 'Explain the relationship', lead: 'Use the visible evidence to explain what changed and what stayed fixed.', reveal: ['model', 'evidence'] },
  ],
});
`;

  const runtime =
    component && from
      ? `'use client';

/** ${title} runtime — isolated lazy chunk backed by a leaf component import. */
export { activity } from './activity.js';
export { ${component} as default } from '${from}';
`
      : `'use client';

import { useState, type ReactNode } from 'react';
import { AuthoredActivityRuntime, AuthoredMetricGate } from '../../../kit/authored-activity-runtime.js';
import { Chip, Slider } from '../../../kit/controls.js';
import { Field, Readout } from '../../../kit/frame.js';
import { activity } from './activity.js';

interface ${componentName}Props {
  title?: string;
  prompt?: string;
  initialValue?: number;
  target?: number;
}

/** Functional compiled starter. Replace its scalar model with the domain model
 * while preserving the authored activity, evidence, and completion contract. */
export default function ${componentName}({
  title = ${JSON.stringify(title)},
  prompt = 'Change the model and explain the relationship you observe.',
  initialValue = 0,
  target = 4,
}: ${componentName}Props): ReactNode {
  const [value, setValue] = useState(initialValue);
  const safeTarget = Math.max(1, target);
  const complete = value >= safeTarget;
  const reset = (): void => setValue(initialValue);

  return <AuthoredActivityRuntime
    activity={activity}
    activityId=${JSON.stringify(id)}
    eyebrow=${JSON.stringify(group)}
    title={title}
    description={prompt}
    status={<><span>{complete ? 'Target reached' : 'Exploring'}</span><span>{value} of {safeTarget}</span></>}
    evidence={<Readout value={\`\${value} / \${safeTarget}\`} sub="current value / target" />}
    controls={<>
      <Field label="Model value" value={value}>
        <Slider value={value} min={0} max={safeTarget} step={1} onChange={setValue} ariaLabel="Model value" />
      </Field>
      <Chip selected={false} onClick={reset}>Reset model</Chip>
    </>}
    observation={complete ? 'The model reached its target. Connect this state to the lesson objective.' : 'Changing the control produces matching evidence in the scene and readout.'}
    transcript={<p>The current model value is {value}; the target is {safeTarget}.</p>}
  >
    {({ complete: markComplete }) => <>
      <AuthoredMetricGate conditionId="target-reached" met={complete} complete={markComplete} />
      <output aria-label="Current model value">{value}</output>
    </>}
  </AuthoredActivityRuntime>;
}
`;

  const test = `import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { assessLabExperience } from '../../../../src/authoring/quality.js';
import { activity } from '../../../../src/domains/${domain}/${id}/activity.js';
import manifest from '../../../../src/domains/${domain}/${id}/manifest.js';
import ${componentName} from '../../../../src/domains/${domain}/${id}/runtime.js';

describe('${id} authored activity', () => {
  it('accepts blank author config and applies meaningful defaults', () => {
    expect(manifest.schema.parse({})).toMatchObject({ initialValue: 0, target: 4 });
    expect(assessLabExperience(manifest, activity).issues).not.toContain('Manifest objectives do not match the authored activity.');
  });

  it('provides a keyboard-native shared control, visible evidence, and text alternative', () => {
    render(<${componentName} initialValue={0} target={2} />);
    const control = screen.getByRole('slider', { name: 'Model value' });
    control.focus();
    fireEvent.change(control, { target: { value: '1' } });
    expect(screen.getByLabelText('Current model value')).toHaveTextContent('1');
    expect(screen.getByText(/current value \\/ target/i)).toBeInTheDocument();
    expect(screen.getByText(/current model value is 1/i)).toBeInTheDocument();
  });

  it('reports its metric gate to shared transport and resets without replacing it', () => {
    render(<${componentName} initialValue={0} target={1} />);
    const advance = screen.getByRole('button', { name: 'Continue' });
    expect(advance).toBeDisabled();
    fireEvent.change(screen.getByRole('slider', { name: 'Model value' }), { target: { value: '1' } });
    expect(advance).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: 'Reset model' }));
    expect(advance).toBeDisabled();
  });
});
`;

  const example = `# ${title}

The CMS owns the surrounding lesson prose. The lab receives only its meaningful live configuration:

<${tag}
  title=${JSON.stringify(title)}
  prompt="Change the model, compare the evidence, and explain what stays invariant."
  initialValue={1}
  target={6}
/>
`;

  return { manifest, activity, runtime, test, example };
}

function run() {
  const args = process.argv.slice(2);
  const opt = (name) => {
    const index = args.indexOf(`--${name}`);
    return index >= 0 && args[index + 1] && !args[index + 1].startsWith('--') ? args[index + 1] : undefined;
  };
  const domain = opt('domain');
  const id = opt('id');
  if (!domain || !id) {
    console.error(
      'usage: lab:create -- --domain <domain> --id <kebab-id> [--tag T] [--title ..] [--description ..] [--group G] [--component Name --from ../path.js]',
    );
    process.exit(1);
  }
  if (!/^[a-z][a-z0-9-]*$/.test(id)) {
    console.error(`✗ id must be kebab-case: '${id}'`);
    process.exit(1);
  }
  const component = opt('component');
  const from = opt('from');
  if (Boolean(component) !== Boolean(from)) {
    console.error('✗ --component and --from must be provided together');
    process.exit(1);
  }

  const config = {
    domain,
    id,
    tag: opt('tag') ?? pascal(id),
    title:
      opt('title') ??
      pascal(id)
        .replace(/([A-Z])/g, ' $1')
        .trim(),
    description: opt('description') ?? `An authorable ${id} interactive learning activity.`,
    group: opt('group') ?? pascal(domain),
    component,
    from,
  };
  const templates = createLabTemplates(config);
  const dir = new URL(`../src/domains/${domain}/${id}/`, import.meta.url);
  const testDir = new URL(`../tests/domains/${domain}/${id}/`, import.meta.url);
  const write = (url, content) => {
    if (existsSync(url)) {
      console.error(`✗ refusing to overwrite ${url.pathname}`);
      process.exit(1);
    }
    mkdirSync(new URL('.', url), { recursive: true });
    writeFileSync(url, content);
    console.log('created', url.pathname.replace(/^.*\/labs\//, ''));
  };

  write(new URL('manifest.ts', dir), templates.manifest);
  write(new URL('activity.ts', dir), templates.activity);
  write(new URL('runtime.tsx', dir), templates.runtime);
  write(new URL('example.mdx', dir), templates.example);
  write(new URL(`${id}.test.tsx`, testDir), templates.test);
  console.log(`\n✓ scaffolded ${domain}/${id}. Next: npm run labs:generate && npm run verify:release`);
}

const isMain = import.meta.url === pathToFileURL(process.argv[1] ?? '').href;
if (isMain) run();
