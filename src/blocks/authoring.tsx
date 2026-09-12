'use client';

/**
 * @classytic/labs/blocks, editor UI kit.
 *
 * The creator-facing authoring controls shared by every block's editing panel:
 * a settings panel, caret-stable text/number inputs, chips, a comma↔array tags
 * field, a typed select, a JSON escape hatch, and a generic add/remove/reorder
 * `RowsEditor`. Kept out of `index.tsx` so block specs stay declarative and the
 * controls are reusable + testable on their own.
 *
 * These only render in the editor (`mode === 'editing'`); the runtime lesson
 * never mounts them.
 */

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * Coerce a block attribute into an array. MDX↔Slate round-trips can hand an array
 * attribute back as a JSON STRING (when a block has no `fromAttrs` parser), so a
 * bare `attr ?? []` slips a string through and `.map` throws. Always read array
 * attrs through this: array → as-is, JSON-string-of-array → parsed, else fallback.
 */
export function coerceArray<T>(raw: unknown, fallback: T[] = []): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (typeof raw === 'string' && raw.trim()) {
    try {
      const p = JSON.parse(raw);
      if (Array.isArray(p)) return p as T[];
    } catch {
      /* not JSON */
    }
  }
  return fallback;
}

/** A subtle settings panel shown above a block while editing. */
export function ConfigPanel({ children }: { children: ReactNode }): ReactNode {
  return (
    <div className="mb-2 space-y-2 rounded-md border border-border/60 bg-muted/40 p-2.5 text-xs">
      {children}
    </div>
  );
}

export function ConfigRow({
  label,
  hint,
  error,
  errorId,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  errorId?: string;
  children: ReactNode;
}): ReactNode {
  return (
    <div className="flex flex-col gap-0.5">
      {/* 6rem, not 5: two-word labels ("term language", "audio language") wrapped to two lines
          and pushed their control out of line with every other row. */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="w-24 shrink-0 self-start pt-1.5 font-medium text-muted-foreground">{label}</span>
        {children}
      </div>
      {hint ? (
        <span className="pl-[calc(6rem+0.5rem)] text-[10.5px] leading-snug text-muted-foreground/80">
          {hint}
        </span>
      ) : null}
      {error ? (
        <span id={errorId} className="pl-[calc(6rem+0.5rem)] text-[10.5px] leading-snug text-destructive">
          {error}
        </span>
      ) : null}
    </div>
  );
}

export function ChipToggle({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}): ReactNode {
  return (
    <Button
      type="button"
      size="xs"
      variant={active ? 'secondary' : 'outline'}
      onClick={onClick}
      aria-pressed={active}
      className={[
        'rounded-full border px-2.5 py-0.5 font-medium transition-colors',
        active
          ? 'border-transparent bg-primary text-primary-foreground'
          : 'border-border text-muted-foreground hover:bg-background',
      ].join(' ')}
    >
      {children}
    </Button>
  );
}

/**
 * Text input with a LOCAL draft so the caret never jumps: committing up to
 * `updateAttributes` round-trips through Slate and re-renders; we only re-sync
 * from upstream when the field is not focused (external/programmatic edits).
 */
export function TextField({
  value,
  onChange,
  placeholder,
  mono,
  className,
  invalid,
  describedBy,
  ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  mono?: boolean;
  className?: string;
  invalid?: boolean;
  describedBy?: string;
  ariaLabel?: string;
}): ReactNode {
  const [draft, setDraft] = useState(value);
  const focused = useRef(false);
  useEffect(() => {
    if (!focused.current) setDraft(value);
  }, [value]);
  return (
    <Input
      type="text"
      value={draft}
      placeholder={placeholder}
      aria-label={ariaLabel}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      onFocus={() => {
        focused.current = true;
      }}
      onBlur={() => {
        focused.current = false;
        setDraft(value);
      }}
      onChange={(e) => {
        setDraft(e.target.value);
        onChange(e.target.value);
      }}
      className={[
        // `flex-1` rather than the host Input's `w-full`: inside a ConfigRow one field still
        // fills the line, but two (a term/translation language pair, say) split it instead of
        // each claiming 100% and wrapping onto separate rows.
        'min-w-0 flex-1 rounded border bg-background px-2 py-1',
        invalid ? 'border-destructive' : 'border-border',
        mono ? 'font-mono' : '',
        className ?? '',
      ].join(' ')}
    />
  );
}

/** Multi-line plain-text field (draft-buffered like TextField). For prose blocks
 *  such as a reading passage; use JsonArea instead for structured JSON. */
export function TextArea({
  value,
  onChange,
  placeholder,
  rows = 5,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}): ReactNode {
  const [draft, setDraft] = useState(value);
  const focused = useRef(false);
  useEffect(() => {
    if (!focused.current) setDraft(value);
  }, [value]);
  return (
    <Textarea
      value={draft}
      rows={rows}
      placeholder={placeholder}
      onFocus={() => {
        focused.current = true;
      }}
      onBlur={() => {
        focused.current = false;
        setDraft(value);
      }}
      onChange={(e) => {
        setDraft(e.target.value);
        onChange(e.target.value);
      }}
      className="w-full min-w-0 rounded border border-border bg-background px-2 py-1 leading-relaxed"
    />
  );
}

export function NumField({
  value,
  onChange,
  className,
  min,
  max,
  step,
  invalid,
  describedBy,
}: {
  value: number;
  onChange: (v: number) => void;
  className?: string;
  min?: number;
  max?: number;
  step?: number;
  invalid?: boolean;
  describedBy?: string;
}): ReactNode {
  const [draft, setDraft] = useState(String(value));
  const focused = useRef(false);
  useEffect(() => {
    if (!focused.current) setDraft(Number.isFinite(value) ? String(value) : '');
  }, [value]);
  return (
    <Input
      type="number"
      value={draft}
      min={min}
      max={max}
      step={step}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      onFocus={() => {
        focused.current = true;
      }}
      onBlur={() => {
        focused.current = false;
        setDraft(Number.isFinite(value) ? String(value) : '');
      }}
      onChange={(e) => {
        setDraft(e.target.value);
        const n = Number.parseFloat(e.target.value);
        if (Number.isFinite(n)) onChange(n);
      }}
      className={[
        'w-16 rounded border bg-background px-1.5 py-1',
        invalid ? 'border-destructive' : 'border-border',
        className ?? '',
      ].join(' ')}
    />
  );
}

export function SmallButton({
  onClick,
  children,
  tone,
  ariaLabel,
}: {
  onClick: () => void;
  children: ReactNode;
  tone?: 'danger';
  ariaLabel?: string;
}): ReactNode {
  return (
    <Button
      type="button"
      size="xs"
      variant={tone === 'danger' ? 'destructive' : 'outline'}
      onClick={onClick}
      aria-label={ariaLabel}
      className={[
        'rounded px-1.5 py-0.5 text-xs transition-colors',
        tone === 'danger'
          ? 'text-muted-foreground hover:text-destructive'
          : 'border border-border text-muted-foreground hover:bg-background',
      ].join(' ')}
    >
      {children}
    </Button>
  );
}

export interface SelectOption {
  value: string;
  label: string;
}

export function SelectField({
  value,
  onChange,
  options,
  ariaLabel,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  options: readonly (string | SelectOption)[];
  ariaLabel?: string;
  className?: string;
}): ReactNode {
  const items = options.map((option) =>
    typeof option === 'string' ? { value: option, label: option } : option,
  );
  /* The host's shadcn Select, not the native element: a raw dropdown is painted by the OS,
     so it ignores the app theme and cannot be styled to match the Inputs beside it.
     `items` is what lets `SelectValue` show the chosen option's LABEL rather than its value. */
  return (
    <Select
      items={items}
      value={value}
      onValueChange={(next) => {
        if (typeof next === 'string') onChange(next);
      }}
    >
      <SelectTrigger
        size="sm"
        aria-label={ariaLabel}
        className={['min-w-0 text-[11px]', className ?? ''].join(' ')}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function BooleanField({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  hint?: string;
}): ReactNode {
  return (
    <label className="inline-flex min-w-0 cursor-pointer items-start gap-2 rounded-md border border-border bg-background px-2.5 py-2 text-foreground">
      <Checkbox
        checked={checked}
        onCheckedChange={(value) => onChange(value === true)}
        className="mt-0.5 shrink-0"
      />
      <span className="grid min-w-0 gap-0.5">
        <strong className="text-[11px] font-medium leading-tight">{label}</strong>
        {hint ? <small className="text-[10.5px] leading-snug text-muted-foreground">{hint}</small> : null}
      </span>
    </label>
  );
}

export function SegmentedField({
  value,
  onChange,
  options,
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  options: readonly SelectOption[];
  ariaLabel: string;
}): ReactNode {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="inline-flex rounded-md border border-border bg-muted/50 p-0.5"
    >
      {options.map((option) => (
        <Button
          key={option.value}
          type="button"
          size="xs"
          variant={value === option.value ? 'secondary' : 'ghost'}
          role="tab"
          aria-selected={value === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}

/** Comma-separated text ↔ string[] (caret-stable). */
export function TagsField({
  value,
  onChange,
  placeholder,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}): ReactNode {
  const [draft, setDraft] = useState((value ?? []).join(', '));
  const focused = useRef(false);
  useEffect(() => {
    if (!focused.current) setDraft((value ?? []).join(', '));
  }, [value]);
  return (
    <Input
      type="text"
      value={draft}
      placeholder={placeholder}
      onFocus={() => {
        focused.current = true;
      }}
      onBlur={() => {
        focused.current = false;
        setDraft((value ?? []).join(', '));
      }}
      onChange={(e) => {
        setDraft(e.target.value);
        onChange(
          e.target.value
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
        );
      }}
      className="min-w-0 flex-1 rounded border border-border bg-background px-2 py-1 text-[11px]"
    />
  );
}

/**
 * Per-wrong-option feedback editor. Given the item's WRONG options, shows one
 * note box each, so a creator writes targeted "why that trap is tempting" copy
 * without touching a map by hand. Empty notes are pruned from the stored record.
 */
export function FeedbackField({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: Record<string, string>;
  onChange: (v: Record<string, string>) => void;
}): ReactNode {
  const map = value ?? {};
  if (!options.length)
    return (
      <span className="text-[11px] italic text-muted-foreground">
        add the options first, then write feedback for each wrong one
      </span>
    );
  return (
    <div className="w-full space-y-1">
      {options.map((o) => (
        <div key={o} className="flex items-center gap-1.5">
          <span
            className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[11px] font-medium"
            title="wrong option"
          >
            {o === ', ' ? 'none' : o}
          </span>
          <span className="flex min-w-0 flex-1">
            <TextField
              value={map[o] ?? ''}
              onChange={(v) => {
                const next = { ...map };
                if (v.trim()) next[o] = v;
                else delete next[o];
                onChange(next);
              }}
              placeholder="why a learner is tempted by this + the rule (optional)"
              className="w-full text-[11px]"
            />
          </span>
        </div>
      ))}
    </div>
  );
}

/** The shared objectives + hints authoring cluster, so every lab's pedagogy panel
 *  is identical. Objectives show as a goal banner; hints reveal one at a time. */
export function PedagogyRows({
  objectives,
  hints,
  onObjectives,
  onHints,
}: {
  objectives?: string[];
  hints?: string[];
  onObjectives: (v: string[]) => void;
  onHints: (v: string[]) => void;
}): ReactNode {
  return (
    <>
      <ConfigRow label="objectives">
        <TagsField
          value={objectives ?? []}
          onChange={onObjectives}
          placeholder="comma-separated goals, e.g. use a / an / the correctly"
        />
      </ConfigRow>
      <ConfigRow label="hints">
        <TagsField
          value={hints ?? []}
          onChange={onHints}
          placeholder="comma-separated, revealed one at a time"
        />
      </ConfigRow>
    </>
  );
}

/** A JSON escape hatch for deeply-nested data (advanced authoring); keeps a
 *  draft and commits on every valid parse, keeping the last good value. */
export function JsonArea<T>({
  value,
  onChange,
  rows = 6,
}: {
  value: T;
  onChange: (v: T) => void;
  rows?: number;
}): ReactNode {
  const [draft, setDraft] = useState(() => JSON.stringify(value, null, 2));
  const [bad, setBad] = useState(false);
  const focused = useRef(false);
  useEffect(() => {
    if (!focused.current) setDraft(JSON.stringify(value, null, 2));
  }, [value]);
  return (
    <div className="w-full">
      <Textarea
        value={draft}
        rows={rows}
        spellCheck={false}
        onFocus={() => {
          focused.current = true;
        }}
        onBlur={() => {
          focused.current = false;
          setDraft(JSON.stringify(value, null, 2));
          setBad(false);
        }}
        onChange={(e) => {
          setDraft(e.target.value);
          try {
            onChange(JSON.parse(e.target.value) as T);
            setBad(false);
          } catch {
            setBad(true);
          }
        }}
        className="w-full rounded border border-border bg-background px-2 py-1 font-mono text-[11px] leading-snug"
      />
      {bad ? <span className="text-[11px] text-destructive">invalid JSON, last valid kept</span> : null}
    </div>
  );
}

export const POS_OPTS = [
  'noun',
  'verb',
  'article',
  'adjective',
  'preposition',
  'pronoun',
  'conjunction',
  'adverb',
  'other',
];

/** Region "backdrop" landmarks the scene draws as panels (vs object emoji). */
export const SCENE_BACKDROPS = ['sky', 'water', 'ground', 'room'];

const ICON_ITEMS: { v: string; group: string; kw: string; label?: string }[] = [
  { v: 'sky', group: 'Scenes', label: 'sky', kw: 'sky air backdrop' },
  {
    v: 'water',
    group: 'Scenes',
    label: 'water',
    kw: 'water river sea lake pond',
  },
  {
    v: 'ground',
    group: 'Scenes',
    label: 'ground',
    kw: 'ground grass field floor',
  },
  { v: 'room', group: 'Scenes', label: 'room', kw: 'room indoor wall house' },
  { v: '🐦', group: 'Animals', kw: 'bird fly' },
  { v: '🐱', group: 'Animals', kw: 'cat' },
  { v: '🐶', group: 'Animals', kw: 'dog' },
  { v: '🐟', group: 'Animals', kw: 'fish' },
  { v: '🐝', group: 'Animals', kw: 'bee' },
  { v: '🦋', group: 'Animals', kw: 'butterfly' },
  { v: '🐢', group: 'Animals', kw: 'turtle' },
  { v: '🐰', group: 'Animals', kw: 'rabbit bunny' },
  { v: '🐘', group: 'Animals', kw: 'elephant' },
  { v: '🦁', group: 'Animals', kw: 'lion' },
  { v: '🌳', group: 'Nature', kw: 'tree' },
  { v: '🌲', group: 'Nature', kw: 'pine tree' },
  { v: '🌊', group: 'Nature', kw: 'wave sea water' },
  { v: '☁️', group: 'Nature', kw: 'cloud' },
  { v: '🌧️', group: 'Nature', kw: 'rain' },
  { v: '⛰️', group: 'Nature', kw: 'mountain hill' },
  { v: '🌙', group: 'Nature', kw: 'moon' },
  { v: '⭐', group: 'Nature', kw: 'star' },
  { v: '🌸', group: 'Nature', kw: 'flower' },
  { v: '🌞', group: 'Nature', kw: 'sun' },
  { v: '📦', group: 'Things', kw: 'box package' },
  { v: '⚽', group: 'Things', kw: 'ball football' },
  { v: '🔵', group: 'Things', kw: 'ball dot circle' },
  { v: '🚗', group: 'Things', kw: 'car' },
  { v: '⛵', group: 'Things', kw: 'boat ship sail' },
  { v: '🪁', group: 'Things', kw: 'kite' },
  { v: '🎈', group: 'Things', kw: 'balloon' },
  { v: '🥤', group: 'Things', kw: 'cup drink' },
  { v: '📚', group: 'Things', kw: 'book' },
  { v: '🔑', group: 'Things', kw: 'key' },
  { v: '🏠', group: 'Places', kw: 'house home' },
  { v: '🏫', group: 'Places', kw: 'school' },
  { v: '🪑', group: 'Places', kw: 'chair table' },
  { v: '🛏️', group: 'Places', kw: 'bed' },
  { v: '🚪', group: 'Places', kw: 'door' },
  { v: '🌉', group: 'Places', kw: 'bridge' },
  { v: '🍎', group: 'Food', kw: 'apple fruit' },
  { v: '🍌', group: 'Food', kw: 'banana' },
  { v: '🍚', group: 'Food', kw: 'rice' },
  { v: '🍞', group: 'Food', kw: 'bread' },
  { v: '☕', group: 'Food', kw: 'coffee tea cup' },
  { v: '🧍', group: 'People', kw: 'person stand' },
  { v: '🧒', group: 'People', kw: 'child kid' },
  { v: '🧑‍🏫', group: 'People', kw: 'teacher' },
];

function backdropClass(v: string): string {
  return v === 'sky'
    ? 'bg-gradient-to-b from-sky-200 to-sky-50'
    : v === 'water'
      ? 'bg-gradient-to-b from-blue-400 to-blue-600'
      : v === 'ground'
        ? 'bg-gradient-to-b from-lime-400 to-green-600'
        : 'bg-gradient-to-b from-amber-50 to-amber-200';
}

function IconSwatch({ v, label }: { v: string; label?: string }): ReactNode {
  if (SCENE_BACKDROPS.includes(v)) {
    return (
      <span className="inline-flex flex-col items-center gap-px">
        <span className={`h-[15px] w-[22px] rounded border border-black/15 ${backdropClass(v)}`} />
        <span className="text-[9px] leading-none">{label}</span>
      </span>
    );
  }
  return <span className="text-[19px] leading-none">{v}</span>;
}

/** A searchable, categorised icon picker, teachers click an icon (or a scene
 *  backdrop), never type emoji. Falls back to a paste-any-emoji field. */
export function IconPicker({
  value,
  onChange,
  placeholder = 'pick',
}: {
  value?: string;
  onChange: (v: string) => void;
  placeholder?: string;
}): ReactNode {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const ql = q.trim().toLowerCase();
  const shown = ql
    ? ICON_ITEMS.filter((it) => it.kw.includes(ql) || (it.label ?? '').includes(ql))
    : ICON_ITEMS;
  const cur = ICON_ITEMS.find((it) => it.v === value);
  /* The host's Popover, not a hand-rolled absolute panel with a fixed backdrop: it portals its
     content and positions it with collision detection. The old panel was laid out relative to a
     trigger inside the lesson editor's narrow scrolling column, so it was clipped on the right
     and cut off at the bottom exactly where authors use it. */
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={<Button type="button" size="icon-sm" variant="outline" />}
        aria-label="pick icon"
      >
        {value ? (
          cur ? (
            <IconSwatch v={cur.v} label={cur.label} />
          ) : (
            <span className="text-[19px] leading-none">{value}</span>
          )
        ) : (
          <span className="text-[10px] text-muted-foreground">{placeholder}</span>
        )}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[250px] gap-0 p-2">
        <Input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="search (bird, river, box…)"
          className="mb-2 w-full text-xs"
        />
        <div className="grid max-h-[236px] grid-cols-6 gap-1 overflow-y-auto">
          {shown.map((it) => (
            <Button
              key={it.v}
              type="button"
              size="icon-sm"
              variant={it.v === value ? 'secondary' : 'ghost'}
              title={it.label ?? it.kw}
              aria-pressed={it.v === value}
              onClick={() => {
                onChange(it.v);
                setOpen(false);
                setQ('');
              }}
            >
              <IconSwatch v={it.v} label={it.label} />
            </Button>
          ))}
          {shown.length === 0 && (
            <span className="col-span-full text-[11px] text-muted-foreground">
              no match, paste any emoji below
            </span>
          )}
        </div>
        <Input
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="or paste any emoji"
          className="mt-2 w-full text-xs"
        />
      </PopoverContent>
    </Popover>
  );
}

export interface RowCol {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'pos' | 'select' | 'tags' | 'bool' | 'icon' | 'feedback';
  options?: string[];
  grow?: boolean;
  /** Give the column its own full-width line. For sentence-length values (an explanation, a
   *  worked note) that a shared row can only clip. */
  wide?: boolean;
  /** feedback columns: row key holding the option list (wrong = options − answer). */
  optionsKey?: string;
  /** feedback columns: a fixed option list (when options aren't a row field, e.g. articles). */
  optionsList?: string[];
  /** feedback columns: row key holding the correct value (default 'answer'). */
  answerKey?: string;
}

/** Edit an array of records as add/remove/reorder rows of typed fields, the
 *  creator-facing alternative to hand-writing JSON. */
export function RowsEditor<T extends object>({
  rows,
  onChange,
  columns,
  newRow,
  addLabel = 'row',
}: {
  rows: T[];
  onChange: (rows: T[]) => void;
  columns: RowCol[];
  newRow: () => T;
  addLabel?: string;
}): ReactNode {
  const list = Array.isArray(rows) ? rows : [];
  const set = (i: number, key: string, v: unknown): void =>
    onChange(list.map((r, j) => (j === i ? ({ ...r, [key]: v } as T) : r)));
  const remove = (i: number): void => onChange(list.filter((_, j) => j !== i));
  const move = (i: number, d: number): void => {
    const j = i + d;
    if (j < 0 || j >= list.length) return;
    const next = list.slice();
    const t = next[i]!;
    next[i] = next[j]!;
    next[j] = t;
    onChange(next);
  };
  return (
    <div className="block-rows-editor">
      {list.map((r, i) => {
        const rec = r as Record<string, unknown>;
        /* A placeholder only shows while a field is empty, so a filled row of seven columns
           became unlabelled boxes. The first row carries the column names; every row shares the
           same flex bases, so they read as headings for the whole table without repeating. */
        const head = (col: RowCol, extra?: string): ReactNode =>
          i === 0 ? (
            <span className={['block-row-caption', extra].filter(Boolean).join(' ')}>{col.label}</span>
          ) : null;
        return (
          <div key={i} className="block-row-editor">
            {columns.map((col) => {
              if (col.type === 'number')
                return (
                  <span key={col.key} className="block-row-number">
                    {col.label}
                    <NumField value={Number(rec[col.key]) || 0} onChange={(v) => set(i, col.key, v)} />
                  </span>
                );
              if (col.type === 'pos')
                return (
                  <span key={col.key} className="block-row-field">
                    {head(col)}
                    <SelectField
                      value={(rec[col.key] as string) ?? 'other'}
                      onChange={(v) => set(i, col.key, v)}
                      options={POS_OPTS}
                    />
                  </span>
                );
              if (col.type === 'select')
                return (
                  <span key={col.key} className="block-row-field">
                    {head(col)}
                    <SelectField
                      value={(rec[col.key] as string) ?? col.options?.[0] ?? ''}
                      onChange={(v) => set(i, col.key, v)}
                      options={col.options ?? []}
                    />
                  </span>
                );
              if (col.type === 'tags')
                return (
                  <span key={col.key} className="block-row-field" data-grow={col.grow || undefined}>
                    {head(col)}
                    <TagsField
                      value={(rec[col.key] as string[]) ?? []}
                      onChange={(v) => set(i, col.key, v)}
                      placeholder={col.label}
                    />
                  </span>
                );
              if (col.type === 'bool')
                return (
                  <label key={col.key} className="block-row-bool">
                    <Checkbox
                      checked={!!rec[col.key]}
                      onCheckedChange={(value) => set(i, col.key, value === true)}
                    />
                    {col.label}
                  </label>
                );
              if (col.type === 'icon')
                return (
                  <span key={col.key} className="block-row-field" data-fit>
                    {head(col)}
                    <IconPicker
                      value={rec[col.key] as string}
                      onChange={(v) => set(i, col.key, v)}
                      placeholder={col.label}
                    />
                  </span>
                );
              if (col.type === 'feedback') {
                const opts = col.optionsList ?? (rec[col.optionsKey ?? 'options'] as string[]) ?? [];
                const answer = rec[col.answerKey ?? 'answer'] as string;
                const wrong = (Array.isArray(opts) ? opts : []).filter((o) => o !== answer);
                return (
                  <span key={col.key} className="block-row-feedback">
                    <span className="block-row-feedback-label">{col.label}</span>
                    <FeedbackField
                      options={wrong}
                      value={(rec[col.key] as Record<string, string>) ?? {}}
                      onChange={(v) => set(i, col.key, v)}
                    />
                  </span>
                );
              }
              return (
                <span
                  key={col.key}
                  className="block-row-field"
                  data-grow={col.grow || undefined}
                  data-wide={col.wide || undefined}
                >
                  {head(col)}
                  <TextField
                    value={(rec[col.key] as string) ?? ''}
                    onChange={(v) => set(i, col.key, v)}
                    placeholder={col.label}
                    ariaLabel={col.label}
                    className="block-row-input"
                  />
                </span>
              );
            })}
            <span className="block-row-actions">
              <Button
                type="button"
                size="icon-xs"
                variant="ghost"
                aria-label="move up"
                onClick={() => move(i, -1)}
                disabled={i === 0}
              >
                ↑
              </Button>
              <Button
                type="button"
                size="icon-xs"
                variant="ghost"
                aria-label="move down"
                onClick={() => move(i, 1)}
                disabled={i === list.length - 1}
              >
                ↓
              </Button>
              <Button
                type="button"
                size="icon-xs"
                variant="destructive"
                aria-label="remove row"
                onClick={() => remove(i)}
              >
                ×
              </Button>
            </span>
          </div>
        );
      })}
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => onChange([...list, newRow()])}
        className="block-row-add"
      >
        + {addLabel}
      </Button>
    </div>
  );
}
