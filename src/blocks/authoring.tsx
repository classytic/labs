'use client';

/**
 * @classytic/labs/blocks — editor UI kit.
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
    try { const p = JSON.parse(raw); if (Array.isArray(p)) return p as T[]; } catch { /* not JSON */ }
  }
  return fallback;
}

/** A subtle settings panel shown above a block while editing. */
export function ConfigPanel({ children }: { children: ReactNode }): ReactNode {
  return <div className="mb-2 space-y-2 rounded-md border border-border/60 bg-muted/40 p-2.5 text-xs">{children}</div>;
}

export function ConfigRow({ label, children }: { label: string; children: ReactNode }): ReactNode {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-20 shrink-0 font-medium text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}

export function ChipToggle({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }): ReactNode {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={['rounded-full border px-2.5 py-0.5 font-medium transition-colors', active ? 'border-transparent bg-primary text-primary-foreground' : 'border-border text-muted-foreground hover:bg-background'].join(' ')}
    >
      {children}
    </button>
  );
}

/**
 * Text input with a LOCAL draft so the caret never jumps: committing up to
 * `updateAttributes` round-trips through Slate and re-renders; we only re-sync
 * from upstream when the field is not focused (external/programmatic edits).
 */
export function TextField({ value, onChange, placeholder, mono, className }: { value: string; onChange: (v: string) => void; placeholder?: string; mono?: boolean; className?: string }): ReactNode {
  const [draft, setDraft] = useState(value);
  const focused = useRef(false);
  useEffect(() => { if (!focused.current) setDraft(value); }, [value]);
  return (
    <input
      type="text"
      value={draft}
      placeholder={placeholder}
      onFocus={() => { focused.current = true; }}
      onBlur={() => { focused.current = false; setDraft(value); }}
      onChange={(e) => { setDraft(e.target.value); onChange(e.target.value); }}
      className={['min-w-0 rounded border border-border bg-background px-2 py-1', mono ? 'font-mono' : '', className ?? ''].join(' ')}
    />
  );
}

export function NumField({ value, onChange, className }: { value: number; onChange: (v: number) => void; className?: string }): ReactNode {
  const [draft, setDraft] = useState(String(value));
  const focused = useRef(false);
  useEffect(() => { if (!focused.current) setDraft(Number.isFinite(value) ? String(value) : ''); }, [value]);
  return (
    <input
      type="number"
      value={draft}
      onFocus={() => { focused.current = true; }}
      onBlur={() => { focused.current = false; setDraft(Number.isFinite(value) ? String(value) : ''); }}
      onChange={(e) => { setDraft(e.target.value); const n = Number.parseFloat(e.target.value); if (Number.isFinite(n)) onChange(n); }}
      className={['w-16 rounded border border-border bg-background px-1.5 py-1', className ?? ''].join(' ')}
    />
  );
}

export function SmallButton({ onClick, children, tone }: { onClick: () => void; children: ReactNode; tone?: 'danger' }): ReactNode {
  return (
    <button
      type="button"
      onClick={onClick}
      className={['rounded px-1.5 py-0.5 text-xs transition-colors', tone === 'danger' ? 'text-muted-foreground hover:text-destructive' : 'border border-border text-muted-foreground hover:bg-background'].join(' ')}
    >
      {children}
    </button>
  );
}

export function SelectField({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }): ReactNode {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="rounded border border-border bg-background px-1.5 py-1 text-[11px]">
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

/** Comma-separated text ↔ string[] (caret-stable). */
export function TagsField({ value, onChange, placeholder }: { value: string[]; onChange: (v: string[]) => void; placeholder?: string }): ReactNode {
  const [draft, setDraft] = useState((value ?? []).join(', '));
  const focused = useRef(false);
  useEffect(() => { if (!focused.current) setDraft((value ?? []).join(', ')); }, [value]);
  return (
    <input
      type="text"
      value={draft}
      placeholder={placeholder}
      onFocus={() => { focused.current = true; }}
      onBlur={() => { focused.current = false; setDraft((value ?? []).join(', ')); }}
      onChange={(e) => { setDraft(e.target.value); onChange(e.target.value.split(',').map((s) => s.trim()).filter(Boolean)); }}
      className="min-w-0 flex-1 rounded border border-border bg-background px-2 py-1 text-[11px]"
    />
  );
}

/** A JSON escape hatch for deeply-nested data (advanced authoring); keeps a
 *  draft and commits on every valid parse, keeping the last good value. */
export function JsonArea<T>({ value, onChange, rows = 6 }: { value: T; onChange: (v: T) => void; rows?: number }): ReactNode {
  const [draft, setDraft] = useState(() => JSON.stringify(value, null, 2));
  const [bad, setBad] = useState(false);
  const focused = useRef(false);
  useEffect(() => { if (!focused.current) setDraft(JSON.stringify(value, null, 2)); }, [value]);
  return (
    <div className="w-full">
      <textarea
        value={draft}
        rows={rows}
        spellCheck={false}
        onFocus={() => { focused.current = true; }}
        onBlur={() => { focused.current = false; setDraft(JSON.stringify(value, null, 2)); setBad(false); }}
        onChange={(e) => { setDraft(e.target.value); try { onChange(JSON.parse(e.target.value) as T); setBad(false); } catch { setBad(true); } }}
        className="w-full rounded border border-border bg-background px-2 py-1 font-mono text-[11px] leading-snug"
      />
      {bad ? <span className="text-[11px] text-destructive">invalid JSON — last valid kept</span> : null}
    </div>
  );
}

export const POS_OPTS = ['noun', 'verb', 'article', 'adjective', 'preposition', 'pronoun', 'conjunction', 'adverb', 'other'];

/** Region "backdrop" landmarks the scene draws as panels (vs object emoji). */
export const SCENE_BACKDROPS = ['sky', 'water', 'ground', 'room'];

const ICON_ITEMS: { v: string; group: string; kw: string; label?: string }[] = [
  { v: 'sky', group: 'Scenes', label: 'sky', kw: 'sky air backdrop' },
  { v: 'water', group: 'Scenes', label: 'water', kw: 'water river sea lake pond' },
  { v: 'ground', group: 'Scenes', label: 'ground', kw: 'ground grass field floor' },
  { v: 'room', group: 'Scenes', label: 'room', kw: 'room indoor wall house' },
  { v: '🐦', group: 'Animals', kw: 'bird fly' }, { v: '🐱', group: 'Animals', kw: 'cat' }, { v: '🐶', group: 'Animals', kw: 'dog' }, { v: '🐟', group: 'Animals', kw: 'fish' }, { v: '🐝', group: 'Animals', kw: 'bee' }, { v: '🦋', group: 'Animals', kw: 'butterfly' }, { v: '🐢', group: 'Animals', kw: 'turtle' }, { v: '🐰', group: 'Animals', kw: 'rabbit bunny' }, { v: '🐘', group: 'Animals', kw: 'elephant' }, { v: '🦁', group: 'Animals', kw: 'lion' },
  { v: '🌳', group: 'Nature', kw: 'tree' }, { v: '🌲', group: 'Nature', kw: 'pine tree' }, { v: '🌊', group: 'Nature', kw: 'wave sea water' }, { v: '☁️', group: 'Nature', kw: 'cloud' }, { v: '🌧️', group: 'Nature', kw: 'rain' }, { v: '⛰️', group: 'Nature', kw: 'mountain hill' }, { v: '🌙', group: 'Nature', kw: 'moon' }, { v: '⭐', group: 'Nature', kw: 'star' }, { v: '🌸', group: 'Nature', kw: 'flower' }, { v: '🌞', group: 'Nature', kw: 'sun' },
  { v: '📦', group: 'Things', kw: 'box package' }, { v: '⚽', group: 'Things', kw: 'ball football' }, { v: '🔵', group: 'Things', kw: 'ball dot circle' }, { v: '🚗', group: 'Things', kw: 'car' }, { v: '⛵', group: 'Things', kw: 'boat ship sail' }, { v: '🪁', group: 'Things', kw: 'kite' }, { v: '🎈', group: 'Things', kw: 'balloon' }, { v: '🥤', group: 'Things', kw: 'cup drink' }, { v: '📚', group: 'Things', kw: 'book' }, { v: '🔑', group: 'Things', kw: 'key' },
  { v: '🏠', group: 'Places', kw: 'house home' }, { v: '🏫', group: 'Places', kw: 'school' }, { v: '🪑', group: 'Places', kw: 'chair table' }, { v: '🛏️', group: 'Places', kw: 'bed' }, { v: '🚪', group: 'Places', kw: 'door' }, { v: '🌉', group: 'Places', kw: 'bridge' },
  { v: '🍎', group: 'Food', kw: 'apple fruit' }, { v: '🍌', group: 'Food', kw: 'banana' }, { v: '🍚', group: 'Food', kw: 'rice' }, { v: '🍞', group: 'Food', kw: 'bread' }, { v: '☕', group: 'Food', kw: 'coffee tea cup' },
  { v: '🧍', group: 'People', kw: 'person stand' }, { v: '🧒', group: 'People', kw: 'child kid' }, { v: '🧑‍🏫', group: 'People', kw: 'teacher' },
];

function bgFor(v: string): string {
  return v === 'sky' ? 'linear-gradient(#bfe1ff,#eef7ff)' : v === 'water' ? 'linear-gradient(#6aa6e6,#3f81cf)' : v === 'ground' ? 'linear-gradient(#86c06a,#5fa244)' : 'linear-gradient(#efe6d6,#d8c5a8)';
}

function IconSwatch({ v, label }: { v: string; label?: string }): ReactNode {
  if (SCENE_BACKDROPS.includes(v)) {
    return (
      <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
        <span style={{ width: 22, height: 15, borderRadius: 4, background: bgFor(v), border: '1px solid rgba(0,0,0,.15)' }} />
        <span style={{ fontSize: 9, lineHeight: 1 }}>{label}</span>
      </span>
    );
  }
  return <span style={{ fontSize: 19, lineHeight: 1 }}>{v}</span>;
}

/** A searchable, categorised icon picker — teachers click an icon (or a scene
 *  backdrop), never type emoji. Falls back to a paste-any-emoji field. */
export function IconPicker({ value, onChange, placeholder = 'pick' }: { value?: string; onChange: (v: string) => void; placeholder?: string }): ReactNode {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const ql = q.trim().toLowerCase();
  const shown = ql ? ICON_ITEMS.filter((it) => it.kw.includes(ql) || (it.label ?? '').includes(ql)) : ICON_ITEMS;
  const cur = ICON_ITEMS.find((it) => it.v === value);
  return (
    <span style={{ position: 'relative', display: 'inline-block' }}>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-label="pick icon" className="flex items-center justify-center rounded border border-border bg-background" style={{ minWidth: 34, height: 30, padding: '0 4px' }}>
        {value ? (cur ? <IconSwatch v={cur.v} label={cur.label} /> : <span style={{ fontSize: 19 }}>{value}</span>) : <span className="text-[10px] text-muted-foreground">{placeholder}</span>}
      </button>
      {open && (
        <>
          <span onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
          <div style={{ position: 'absolute', zIndex: 41, top: '112%', left: 0, width: 250, maxHeight: 236, overflowY: 'auto', background: 'var(--popover, var(--card, #fff))', color: 'var(--foreground, inherit)', border: '1px solid var(--border, #ddd)', borderRadius: 10, boxShadow: '0 10px 28px rgba(0,0,0,.2)', padding: 8 }}>
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="search (bird, river, box…)" className="mb-2 w-full rounded border border-border bg-background px-2 py-1 text-[12px]" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 4 }}>
              {shown.map((it) => (
                <button key={it.v} type="button" title={it.label ?? it.kw} onClick={() => { onChange(it.v); setOpen(false); setQ(''); }} className="flex items-center justify-center rounded hover:bg-muted" style={{ height: 30, background: it.v === value ? 'color-mix(in oklab, var(--primary, #3b82f6) 18%, transparent)' : 'transparent' }}>
                  <IconSwatch v={it.v} label={it.label} />
                </button>
              ))}
              {shown.length === 0 && <span className="text-[11px] text-muted-foreground" style={{ gridColumn: '1 / -1' }}>no match — paste any emoji below</span>}
            </div>
            <input value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder="or paste any emoji" className="mt-2 w-full rounded border border-border bg-background px-2 py-1 text-[12px]" />
          </div>
        </>
      )}
    </span>
  );
}

export interface RowCol { key: string; label: string; type?: 'text' | 'number' | 'pos' | 'select' | 'tags' | 'bool' | 'icon'; options?: string[]; grow?: boolean }

/** Edit an array of records as add/remove/reorder rows of typed fields — the
 *  creator-facing alternative to hand-writing JSON. */
export function RowsEditor<T extends object>({ rows, onChange, columns, newRow, addLabel = 'row' }: {
  rows: T[]; onChange: (rows: T[]) => void; columns: RowCol[]; newRow: () => T; addLabel?: string;
}): ReactNode {
  const list = Array.isArray(rows) ? rows : [];
  const set = (i: number, key: string, v: unknown): void => onChange(list.map((r, j) => (j === i ? ({ ...r, [key]: v } as T) : r)));
  const remove = (i: number): void => onChange(list.filter((_, j) => j !== i));
  const move = (i: number, d: number): void => { const j = i + d; if (j < 0 || j >= list.length) return; const next = list.slice(); const t = next[i]!; next[i] = next[j]!; next[j] = t; onChange(next); };
  return (
    <div className="w-full space-y-1.5">
      {list.map((r, i) => {
        const rec = r as Record<string, unknown>;
        return (
          <div key={i} className="flex flex-wrap items-center gap-1.5 rounded-md border border-border/60 bg-background/40 p-1.5">
            {columns.map((col) => {
              if (col.type === 'number') return <span key={col.key} className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">{col.label}<NumField value={Number(rec[col.key]) || 0} onChange={(v) => set(i, col.key, v)} /></span>;
              if (col.type === 'pos') return <SelectField key={col.key} value={(rec[col.key] as string) ?? 'other'} onChange={(v) => set(i, col.key, v)} options={POS_OPTS} />;
              if (col.type === 'select') return <SelectField key={col.key} value={(rec[col.key] as string) ?? (col.options?.[0] ?? '')} onChange={(v) => set(i, col.key, v)} options={col.options ?? []} />;
              if (col.type === 'tags') return <span key={col.key} className={`flex min-w-0 ${col.grow ? 'flex-1' : ''}`}><TagsField value={(rec[col.key] as string[]) ?? []} onChange={(v) => set(i, col.key, v)} placeholder={col.label} /></span>;
              if (col.type === 'bool') return <label key={col.key} className="flex items-center gap-1 text-[11px] text-muted-foreground"><input type="checkbox" checked={!!rec[col.key]} onChange={(e) => set(i, col.key, e.target.checked)} />{col.label}</label>;
              if (col.type === 'icon') return <IconPicker key={col.key} value={rec[col.key] as string} onChange={(v) => set(i, col.key, v)} placeholder={col.label} />;
              return <span key={col.key} className={`flex min-w-0 ${col.grow ? 'flex-1' : ''}`}><TextField value={(rec[col.key] as string) ?? ''} onChange={(v) => set(i, col.key, v)} placeholder={col.label} className="w-full text-[11px]" /></span>;
            })}
            <button type="button" aria-label="move up" onClick={() => move(i, -1)} className="px-1 text-muted-foreground hover:text-foreground">↑</button>
            <button type="button" aria-label="move down" onClick={() => move(i, 1)} className="px-1 text-muted-foreground hover:text-foreground">↓</button>
            <button type="button" aria-label="remove row" onClick={() => remove(i)} className="px-1 text-destructive hover:opacity-70">✕</button>
          </div>
        );
      })}
      <button type="button" onClick={() => onChange([...list, newRow()])} className="rounded-md border border-dashed border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:border-primary hover:text-foreground">+ {addLabel}</button>
    </div>
  );
}
