import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../src/', import.meta.url));
const legacyControl =
  /<(?:button|input|textarea)\b[\s\S]{0,320}?className=(?:"[^"]*|\{[^}]*)(?:lab-btn|lab-chip|lab-input|lab-icon-button)/g;
const legacyStatus = /<(?:span|div|p)\b[\s\S]{0,240}?className=(?:"[^"]*|\{[^}]*)(?:lab-pill)/g;
const failures = [];

function visit(directory) {
  for (const name of readdirSync(directory)) {
    const path = join(directory, name);
    if (statSync(path).isDirectory()) visit(path);
    else if (path.endsWith('.tsx')) {
      const source = readFileSync(path, 'utf8');
      const file = relative(root, path);
      if (legacyControl.test(source) || (file !== 'kit/controls.tsx' && legacyStatus.test(source)))
        failures.push(file);
    }
    legacyControl.lastIndex = 0;
    legacyStatus.lastIndex = 0;
  }
}

visit(root);
if (failures.length) {
  console.error(
    `Native controls and status elements may not use retired Labs UI classes:\n${failures.join('\n')}`,
  );
  process.exit(1);
}
console.log('[host-ui] no legacy native controls');
