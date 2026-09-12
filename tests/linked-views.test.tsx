import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { FractionBarLab } from '../src/math/fraction-bar/preset.js';
import { PercentBarLab } from '../src/math/percent-bar/preset.js';
import { RatioShareLab } from '../src/math/ratio-share/preset.js';
import { LinearModelLab } from '../src/math/linear-model/preset.js';
import { RateMachineLab } from '../src/math/rate-machine/preset.js';

describe('linked representation layout', () => {
  const cases = [
    ['fraction bar', <FractionBarLab scene="pie" />],
    ['percent bar', <PercentBarLab scene="battery" />],
    ['ratio share', <RatioShareLab scene="pie" />],
    ['linear model', <LinearModelLab scene="vessel" />],
    ['rate machine', <RateMachineLab scene="vessel" />],
  ] as const;

  for (const [name, lab] of cases) {
    it(`${name} keeps its concrete twin in the primary workspace`, () => {
      const html = renderToStaticMarkup(lab);
      expect(html).toContain('class="lab-reps"');
      expect(html).toContain('class="lab-reps-views"');
      expect(html).not.toContain('data-aside="true"');
    });
  }
});
