'use client';

/**
 * LabConfig, the schema→form primitive. Give it a lab's Zod prop schema (already
 * the source of truth) + the current attributes + an `updateAttributes`-shaped
 * patch callback, and it introspects the schema and renders a friendly form, NO
 * raw JSON for the common cases:
 *   string→TextField · number→NumField · boolean→toggle · enum→chips
 *   array<object>→RowsEditor (columns auto-derived from the element shape)
 *   array<string>→tag input · nested object→a nested sub-form (recursion)
 * Only genuinely un-introspectable shapes (unions, records, arrays of arrays)
 * fall back to a raw-JSON box, an explicit last resort, not the default.
 *
 * So a block can drop its whole hand-built panel and do
 *   <LabConfig schema={SCHEMA} value={attributes} onChange={updateAttributes} />
 * and new props appear automatically. Bespoke panels stay only where a tailored
 * UX (e.g. a transaction builder, the lab picker) genuinely beats the auto-form.
 */

import { z } from 'zod';
import { useId, type ReactNode } from 'react';
import {
  ConfigPanel,
  ConfigRow,
  TextField,
  NumField,
  ChipToggle,
  SelectField,
  TagsField,
  RowsEditor,
  JsonArea,
  type RowCol,
} from './authoring.js';

/** Peel optional / default / nullable wrappers to the underlying type. */
function baseOf(schema: unknown): z.ZodType {
  let s = schema as z.ZodType;
  for (let i = 0; i < 8; i++) {
    if (s instanceof z.ZodOptional || s instanceof z.ZodNullable) {
      s = s.unwrap() as z.ZodType;
      continue;
    }
    if (s instanceof z.ZodDefault) {
      s = ((s.def as unknown as { innerType?: z.ZodType }).innerType ?? s) as z.ZodType;
      continue;
    }
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

/** Map a ZodObject's fields to RowsEditor columns, null if any field is too complex to flatten. */
function columnsFor(obj: z.ZodObject): RowCol[] | null {
  const cols: RowCol[] = [];
  for (const [k, f] of Object.entries(obj.shape as Record<string, z.ZodType>)) {
    const b = baseOf(f);
    const grow = GROW_KEYS.has(k);
    if (b instanceof z.ZodString) cols.push({ key: k, label: k, grow });
    else if (b instanceof z.ZodNumber) cols.push({ key: k, label: k, type: 'number' });
    else if (b instanceof z.ZodBoolean) cols.push({ key: k, label: k, type: 'bool' });
    else if (b instanceof z.ZodEnum)
      cols.push({ key: k, label: k, type: 'select', options: (b.options ?? []) as string[] });
    else return null; // nested array/object in a row → can't flatten to a column
  }
  return cols.length ? cols : null;
}

/** The `.describe()` text of a field, looking through optional/default wrappers. */
function hintOf(field: z.ZodType, base: z.ZodType): string | undefined {
  return (field as { description?: string }).description ?? (base as { description?: string }).description;
}

/** Best-effort min/max (+ int step) off a ZodNumber, across zod versions. */
function numConstraints(base: z.ZodType): { min?: number; max?: number; step?: number } {
  const out: { min?: number; max?: number; step?: number } = {};
  try {
    const b = base as unknown as {
      minValue?: unknown;
      maxValue?: unknown;
      def?: { checks?: unknown[] };
      _def?: { checks?: unknown[] };
    };
    if (typeof b.minValue === 'number') out.min = b.minValue;
    if (typeof b.maxValue === 'number') out.max = b.maxValue;
    const checks = (b.def?.checks ?? b._def?.checks ?? []) as {
      kind?: string;
      check?: string;
      format?: string;
    }[];
    for (const c of checks) {
      const kind = c?.kind ?? c?.check ?? c?.format;
      if (kind === 'int' || kind === 'safeint') out.step = 1;
    }
  } catch {
    /* introspection is best-effort; no constraint is fine */
  }
  return out;
}

/** A blank record matching a ZodObject (for RowsEditor's "+ row"). */
/**
 * The `.default(...)` a field carries, if any.
 *
 * Used to seed the raw-JSON fallback. A block inserts with NO attributes, so a nested-array prop
 * would otherwise open as `[]` and the author has to type the whole structure from memory. The
 * schema already holds a worked example: showing it is the difference between an editable
 * starting point and a blank box.
 */
function defaultOf(field: z.ZodType): unknown {
  let s = field as z.ZodType;
  for (let i = 0; i < 8; i++) {
    if (s instanceof z.ZodDefault) {
      const get = (s.def as unknown as { defaultValue?: unknown }).defaultValue;
      try {
        return typeof get === 'function' ? (get as () => unknown)() : get;
      } catch {
        return undefined;
      }
    }
    if (s instanceof z.ZodOptional || s instanceof z.ZodNullable) {
      s = s.unwrap() as z.ZodType;
      continue;
    }
    break;
  }
  return undefined;
}

function blankFor(obj: z.ZodObject): Record<string, unknown> {
  const r: Record<string, unknown> = {};
  for (const [k, f] of Object.entries(obj.shape as Record<string, z.ZodType>)) {
    const b = baseOf(f);
    r[k] =
      b instanceof z.ZodNumber
        ? 0
        : b instanceof z.ZodBoolean
          ? false
          : b instanceof z.ZodEnum
            ? ((b.options?.[0] as string) ?? '')
            : '';
  }
  return r;
}

export interface LabConfigProps {
  schema: z.ZodType;
  value: Record<string, unknown>;
  /** Patch callback, same shape as a block's `updateAttributes`. */
  onChange: (patch: Record<string, unknown>) => void;
  /** Props to skip (e.g. ones a bespoke panel already handles). */
  omit?: string[];
  /** Internal: nested objects render without re-wrapping in a ConfigPanel. */
  flat?: boolean;
}

export function LabConfig({ schema, value, onChange, omit = [], flat = false }: LabConfigProps): ReactNode {
  const uid = useId();
  if (!(schema instanceof z.ZodObject))
    return <JsonArea value={value} onChange={(v) => onChange(v as Record<string, unknown>)} />;
  const shape = schema.shape as Record<string, z.ZodType>;
  const set = (k: string, v: unknown): void => onChange({ [k]: v });

  // Run the REAL schema against the current attributes and index the first issue per
  // top-level field, so a creator sees exactly which field is wrong and why (an
  // out-of-range value, a bad enum, a missing required field) instead of it silently
  // reaching the preview. Nested paths surface at their owning top-level key.
  const parsed = schema.safeParse(value ?? {});
  const errors: Record<string, string> = {};
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const k = String(issue.path[0] ?? '');
      if (k && !(k in errors)) errors[k] = issue.message;
    }
  }

  const rows = Object.entries(shape)
    .filter(([k]) => !omit.includes(k))
    .map(([key, field]) => {
      const base = baseOf(field);
      const cur = value?.[key];
      const err = errors[key];
      const hint = hintOf(field, base);
      const errId = err ? `${uid}-${key}-err` : undefined;
      const rowProps = { label: key, hint, error: err, errorId: errId };

      if (base instanceof z.ZodString)
        return (
          <ConfigRow key={key} {...rowProps}>
            <TextField
              value={(cur as string) ?? ''}
              onChange={(v) => set(key, v)}
              className="flex-1"
              invalid={!!err}
              describedBy={errId}
            />
          </ConfigRow>
        );
      if (base instanceof z.ZodNumber) {
        const c = numConstraints(base);
        return (
          <ConfigRow key={key} {...rowProps}>
            <NumField
              value={(cur as number) ?? 0}
              onChange={(v) => set(key, v)}
              invalid={!!err}
              describedBy={errId}
              min={c.min}
              max={c.max}
              step={c.step}
            />
          </ConfigRow>
        );
      }
      if (base instanceof z.ZodBoolean)
        return (
          <ConfigRow key={key} {...rowProps}>
            <ChipToggle active={!!cur} onClick={() => set(key, !cur)}>
              {key}
            </ChipToggle>
          </ConfigRow>
        );
      if (base instanceof z.ZodEnum) {
        const opts = (base.options ?? []) as string[];
        return (
          <ConfigRow key={key} {...rowProps}>
            <span className="lab-config-options">
              {opts.map((o) => (
                <ChipToggle key={o} active={cur === o} onClick={() => set(key, o)}>
                  {o}
                </ChipToggle>
              ))}
            </span>
          </ConfigRow>
        );
      }

      if (base instanceof z.ZodArray) {
        const el = elementOf(base);
        const elBase = el ? baseOf(el) : null;
        if (elBase instanceof z.ZodObject) {
          const cols = columnsFor(elBase);
          if (cols) {
            return (
              <ConfigRow key={key} {...rowProps}>
                <RowsEditor
                  rows={(Array.isArray(cur) ? cur : []) as Record<string, unknown>[]}
                  columns={cols}
                  addLabel={key.replace(/s$/, '') || 'row'}
                  newRow={() => blankFor(elBase)}
                  onChange={(v) => set(key, v)}
                />
              </ConfigRow>
            );
          }
        }
        if (elBase instanceof z.ZodString) {
          return (
            <ConfigRow key={key} {...rowProps}>
              <TagsField
                value={(Array.isArray(cur) ? cur : []) as string[]}
                onChange={(v) => set(key, v)}
                placeholder={key}
              />
            </ConfigRow>
          );
        }
        // array of arrays / array of nested-objects → raw JSON (last resort), seeded with the
        // schema's own default so the author edits a worked example instead of an empty list.
        return (
          <ConfigRow key={key} label={`${key} (advanced)`} hint={hint} error={err} errorId={errId}>
            <JsonArea value={cur ?? defaultOf(field) ?? []} onChange={(v) => set(key, v)} />
          </ConfigRow>
        );
      }

      if (base instanceof z.ZodObject) {
        return (
          <ConfigRow key={key} {...rowProps}>
            <span className="w-full rounded-md border border-border/60 bg-background/40 p-1.5">
              <LabConfig
                schema={base}
                value={(cur as Record<string, unknown>) ?? {}}
                onChange={(patch) => set(key, { ...((cur as Record<string, unknown>) ?? {}), ...patch })}
                flat
              />
            </span>
          </ConfigRow>
        );
      }

      // unions / records / unknown → raw JSON (last resort)
      return (
        <ConfigRow key={key} label={`${key} (advanced)`} hint={hint} error={err} errorId={errId}>
          <JsonArea value={cur ?? null} onChange={(v) => set(key, v)} />
        </ConfigRow>
      );
    });

  return flat ? <>{rows}</> : <ConfigPanel>{rows}</ConfigPanel>;
}
