'use client';

/**
 * LabConfig — the schema→form primitive. Give it a lab's Zod prop schema (already
 * the source of truth) + the current attributes + an `updateAttributes`-shaped
 * patch callback, and it introspects the schema and renders a friendly form — NO
 * raw JSON for the common cases:
 *   string→TextField · number→NumField · boolean→toggle · enum→chips
 *   array<object>→RowsEditor (columns auto-derived from the element shape)
 *   array<string>→tag input · nested object→a nested sub-form (recursion)
 * Only genuinely un-introspectable shapes (unions, records, arrays of arrays)
 * fall back to a raw-JSON box — an explicit last resort, not the default.
 *
 * So a block can drop its whole hand-built panel and do
 *   <LabConfig schema={SCHEMA} value={attributes} onChange={updateAttributes} />
 * and new props appear automatically. Bespoke panels stay only where a tailored
 * UX (e.g. a transaction builder, the lab picker) genuinely beats the auto-form.
 */

import { z } from 'zod';
import type { ReactNode } from 'react';
import { ConfigPanel, ConfigRow, TextField, NumField, ChipToggle, SelectField, TagsField, RowsEditor, JsonArea, type RowCol } from './authoring.js';

/** Peel optional / default / nullable wrappers to the underlying type. */
function baseOf(schema: unknown): z.ZodType {
  let s = schema as z.ZodType;
  for (let i = 0; i < 8; i++) {
    if (s instanceof z.ZodOptional || s instanceof z.ZodNullable) { s = s.unwrap() as z.ZodType; continue; }
    if (s instanceof z.ZodDefault) { s = ((s.def as unknown as { innerType?: z.ZodType }).innerType ?? s) as z.ZodType; continue; }
    break;
  }
  return s;
}

/** The element schema of a ZodArray, across zod versions. */
function elementOf(arr: z.ZodType): z.ZodType | null {
  const a = arr as unknown as { element?: z.ZodType; def?: { element?: z.ZodType; type?: z.ZodType } };
  return (a.element ?? a.def?.element ?? a.def?.type ?? null) as z.ZodType | null;
}

const GROW_KEYS = new Set(['name', 'label', 'prompt', 'text', 'title', 'description']);

/** Map a ZodObject's fields to RowsEditor columns — null if any field is too complex to flatten. */
function columnsFor(obj: z.ZodObject): RowCol[] | null {
  const cols: RowCol[] = [];
  for (const [k, f] of Object.entries(obj.shape as Record<string, z.ZodType>)) {
    const b = baseOf(f);
    const grow = GROW_KEYS.has(k);
    if (b instanceof z.ZodString) cols.push({ key: k, label: k, grow });
    else if (b instanceof z.ZodNumber) cols.push({ key: k, label: k, type: 'number' });
    else if (b instanceof z.ZodBoolean) cols.push({ key: k, label: k, type: 'bool' });
    else if (b instanceof z.ZodEnum) cols.push({ key: k, label: k, type: 'select', options: (b.options ?? []) as string[] });
    else return null; // nested array/object in a row → can't flatten to a column
  }
  return cols.length ? cols : null;
}

/** A blank record matching a ZodObject (for RowsEditor's "+ row"). */
function blankFor(obj: z.ZodObject): Record<string, unknown> {
  const r: Record<string, unknown> = {};
  for (const [k, f] of Object.entries(obj.shape as Record<string, z.ZodType>)) {
    const b = baseOf(f);
    r[k] = b instanceof z.ZodNumber ? 0 : b instanceof z.ZodBoolean ? false : b instanceof z.ZodEnum ? ((b.options?.[0] as string) ?? '') : '';
  }
  return r;
}

export interface LabConfigProps {
  schema: z.ZodType;
  value: Record<string, unknown>;
  /** Patch callback — same shape as a block's `updateAttributes`. */
  onChange: (patch: Record<string, unknown>) => void;
  /** Props to skip (e.g. ones a bespoke panel already handles). */
  omit?: string[];
  /** Internal: nested objects render without re-wrapping in a ConfigPanel. */
  flat?: boolean;
}

export function LabConfig({ schema, value, onChange, omit = [], flat = false }: LabConfigProps): ReactNode {
  if (!(schema instanceof z.ZodObject)) return <JsonArea value={value} onChange={(v) => onChange(v as Record<string, unknown>)} />;
  const shape = schema.shape as Record<string, z.ZodType>;
  const set = (k: string, v: unknown): void => onChange({ [k]: v });

  const rows = Object.entries(shape).filter(([k]) => !omit.includes(k)).map(([key, field]) => {
    const base = baseOf(field);
    const cur = value?.[key];

    if (base instanceof z.ZodString) return <ConfigRow key={key} label={key}><TextField value={(cur as string) ?? ''} onChange={(v) => set(key, v)} className="flex-1" /></ConfigRow>;
    if (base instanceof z.ZodNumber) return <ConfigRow key={key} label={key}><NumField value={(cur as number) ?? 0} onChange={(v) => set(key, v)} /></ConfigRow>;
    if (base instanceof z.ZodBoolean) return <ConfigRow key={key} label={key}><ChipToggle active={!!cur} onClick={() => set(key, !cur)}>{key}</ChipToggle></ConfigRow>;
    if (base instanceof z.ZodEnum) {
      const opts = (base.options ?? []) as string[];
      return <ConfigRow key={key} label={key}><span style={{ display: 'inline-flex', gap: 6, flexWrap: 'wrap' }}>{opts.map((o) => <ChipToggle key={o} active={cur === o} onClick={() => set(key, o)}>{o}</ChipToggle>)}</span></ConfigRow>;
    }

    if (base instanceof z.ZodArray) {
      const el = elementOf(base);
      const elBase = el ? baseOf(el) : null;
      if (elBase instanceof z.ZodObject) {
        const cols = columnsFor(elBase);
        if (cols) {
          return (
            <ConfigRow key={key} label={key}>
              <RowsEditor rows={(Array.isArray(cur) ? cur : []) as Record<string, unknown>[]} columns={cols} addLabel={key.replace(/s$/, '') || 'row'}
                newRow={() => blankFor(elBase)} onChange={(v) => set(key, v)} />
            </ConfigRow>
          );
        }
      }
      if (elBase instanceof z.ZodString) {
        return <ConfigRow key={key} label={key}><TagsField value={(Array.isArray(cur) ? cur : []) as string[]} onChange={(v) => set(key, v)} placeholder={key} /></ConfigRow>;
      }
      // array of arrays / array of nested-objects → raw JSON (last resort)
      return <ConfigRow key={key} label={`${key} (advanced)`}><JsonArea value={cur ?? []} onChange={(v) => set(key, v)} /></ConfigRow>;
    }

    if (base instanceof z.ZodObject) {
      return (
        <ConfigRow key={key} label={key}>
          <span className="w-full rounded-md border border-border/60 bg-background/40 p-1.5">
            <LabConfig schema={base} value={(cur as Record<string, unknown>) ?? {}} onChange={(patch) => set(key, { ...((cur as Record<string, unknown>) ?? {}), ...patch })} flat />
          </span>
        </ConfigRow>
      );
    }

    // unions / records / unknown → raw JSON (last resort)
    return <ConfigRow key={key} label={`${key} (advanced)`}><JsonArea value={cur ?? null} onChange={(v) => set(key, v)} /></ConfigRow>;
  });

  return flat ? <>{rows}</> : <ConfigPanel>{rows}</ConfigPanel>;
}
