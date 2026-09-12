/**
 * Projectile runtime render smoke — from SRC (not dist). Migrated labs are tested here,
 * under tests/labs/<domain>/<lab-id>/, against the source of truth; the legacy dist-importing
 * gallery/widgets harnesses are only for not-yet-migrated labs. SSR render (no DOM needed):
 * the effects (frame loop) don't run, but the initial figure paints.
 */
import { describe, it, expect } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ProjectileLab from '../../../../src/domains/physics/projectile-lab/runtime/index.js';

describe('projectile runtime (render smoke, from src)', () => {
  it('paints an SVG stage with the target', () => {
    const html = renderToStaticMarkup(createElement(ProjectileLab, { targetMeters: 70 }));
    expect(html).toContain('<svg');
    expect(html.toLowerCase()).toContain('target');
  });
});
