'use client';

/**
 * labBlock, wrap a plain lab component into a CMS block "on call", with ZERO
 * per-lab boilerplate. The host passes the lab component + its zod prop-schema; this
 * returns a `defineBlock` spec whose Component:
 *   • in render mode  → spreads the block attributes straight into the lab, and
 *   • in editing mode → shows the generic, zod-driven `LabConfig` panel above it
 *     (one field per prop, derived from the schema, no hand-written ConfigPanel).
 * The MDX tag is auto-derived (PascalCase of the key) by `defineBlock`.
 *
 * This is the ONE shared factory for every domain (`./physics`, `./chem`, …), a
 * domain file just declares `labBlock({ key, label, description, schema, Component })`
 * per lab instead of re-implementing the defineBlock + attribute-spread + editor
 * wiring each time. `commonLabProps` are the title/prompt/objectives/hints/controlId
 * fields every lab accepts; spread them into a lab's schema with `...commonLabProps`.
 */

import { z } from 'zod';
import type { ReactNode } from 'react';
import { defineBlock } from '@classytic/cms-ui/contract';
import { LabConfig } from './lab-config.js';

/** The authoring props every lab accepts. Spread into a lab schema: `{ ...commonLabProps }`. */
export const commonLabProps = {
  title: z.string().optional(),
  prompt: z.string().optional(),
  objectives: z.array(z.string()).optional(),
  hints: z.array(z.string()).optional(),
  controlId: z.string().optional(),
};

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface LabBlockDef<S extends z.ZodObject<any>> {
  /** kebab-case; the MDX tag defaults to its PascalCase (e.g. `gas-process` → `GasProcess`). */
  key: string;
  label: string;
  description: string;
  schema: S;
  /**
   * Render the lab from its attributes. TYPED against the schema, so a prop the lab
   * doesn't accept (or the wrong type) is a COMPILE error, the authoring schema can't
   * silently drift from the component's real props (and every prop stays CMS-authorable).
   */
  Component: (attrs: z.infer<S>) => ReactNode;
  /** Override the MDX tag when it isn't PascalCase(key) (e.g. key `shm` → tag `SimpleHarmonic`). */
  tag?: string;
  /** Props to hide from the auto-generated config panel (e.g. ones with bespoke UX). */
  omit?: string[];
}

/** PascalCase MDX tag from a kebab key, mirrors `defineBlock`'s default, for building a components map. */
export const pascalTag = (key: string): string => key.split('-').map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join('');

/**
 * A `defineBlock` result PLUS the MDX `tag` and raw `lab` render fn, so a domain's
 * tag→component render map can be DERIVED from its blocks (see {@link buildComponents})
 * instead of being hand-maintained in parallel.
 */
export type LabBlock = ReturnType<typeof defineBlock> & { readonly tag: string; readonly lab: (a: any) => ReactNode };

export function labBlock<S extends z.ZodObject<any>>({ key, label, description, schema, Component, tag, omit }: LabBlockDef<S>): LabBlock {
  const block = defineBlock({
    key,
    void: true,
    ...(tag ? { tag } : {}),
    label,
    description,
    category: 'interactive',
    schema,
    Component: ({ attributes, mode, updateAttributes }) => {
      const widget = Component(attributes);
      if (mode !== 'editing' || !updateAttributes) return widget;
      return <div><LabConfig schema={schema} value={attributes} onChange={updateAttributes as (patch: Record<string, unknown>) => void} omit={omit} />{widget}</div>;
    },
  }) as ReturnType<typeof defineBlock>;
  return Object.assign(block, { tag: tag ?? pascalTag(key), lab: Component as (a: any) => ReactNode });
}

/**
 * Derive the tag→component MDX render map from a domain's blocks, ONE source of truth.
 * Only `labBlock`-created blocks carry `.lab`; bespoke `defineBlock` blocks (custom editor
 * UI) are merged into the map by hand alongside this.
 */
export function buildComponents(blocks: readonly unknown[]): Record<string, (a: any) => ReactNode> {
  const map: Record<string, (a: any) => ReactNode> = {};
  for (const b of blocks) {
    const lb = b as Partial<LabBlock>;
    if (typeof lb.tag === 'string' && typeof lb.lab === 'function') map[lb.tag] = lb.lab;
  }
  return map;
}
