#!/usr/bin/env node

/** Manifest-level learning-experience report. This does not replace browser, a11y,
 * scientific-review, or learner-outcome testing; it identifies where those promises
 * have not even been declared in the portable package contract. */

import { createLabQualityReport } from '../dist/authoring/index.mjs';
import { labManifests } from '../dist/domains/manifests.mjs';
import { activityPlanLoaders } from '../dist/domains/activity-map.mjs';

const args = process.argv.slice(2);
const has = (name) => args.includes(`--${name}`);
const option = (name) => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? args[index + 1] : undefined;
};
const domain = option('domain');
const activities = Object.fromEntries(
  await Promise.all(
    Object.entries(activityPlanLoaders).map(async ([id, load]) => [id, (await load()).activity]),
  ),
);
const report = createLabQualityReport(labManifests, domain, activities);

if (has('json')) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log(
    `Labs quality contract${domain ? ` · ${domain}` : ''}: ${report.ready}/${report.total} ready, ${report.incomplete} incomplete, ${report.undeclared} undeclared`,
  );
  const ready = report.entries.filter((entry) => entry.status === 'ready');
  if (ready.length) console.log(`Ready: ${ready.map((entry) => `${entry.domain}/${entry.id}`).join(', ')}`);
  if (has('list') || has('details')) {
    for (const entry of report.entries.filter((item) => item.status !== 'ready')) {
      console.log(`- ${entry.domain}/${entry.id} · ${entry.status}${entry.starter ? ' · STARTER' : ''}`);
      if (has('details')) for (const issue of entry.issues) console.log(`    ${issue}`);
    }
  }
  if (!has('list') && !has('details') && report.ready !== report.total)
    console.log(
      'Run with --list to see candidates, --details for issues, --domain <name> to focus, or --json for tooling.',
    );
}

if (has('strict')) {
  const blocked = report.entries.filter((entry) => entry.starter && entry.status !== 'ready');
  if (blocked.length) {
    console.error(
      `\nQuality gate failed: ${blocked.length} starter lab${blocked.length === 1 ? '' : 's'} lack a complete experience contract.`,
    );
    process.exit(1);
  }
  console.log('Quality gate passed: every starter lab declares a complete experience contract.');
}
