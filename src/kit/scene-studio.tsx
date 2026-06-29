'use client';

/**
 * SceneStudio, the no-code form that authors a {@link DataSceneSpec}: a creator picks an
 * emoji or a shape + colour and gets a live preview, no render function, no JSON. It is the
 * UI front of `registerDataScene`, so a skin invented entirely in-product becomes a real
 * registry scene usable in any lab and listed in every picker.
 *
 * Controlled + self-contained (plain inputs, --stage-* tokens) so it drops into a CMS block
 * OR a standalone tool. It does NOT register anything itself, the host decides when to
 * `registerDataScene(spec)`; the preview is rendered straight from `dataScene(spec)`.
 */

import { useId, type ReactNode } from 'react';
import { dataScene, type DataSceneSpec } from './data-scene.js';

type Variant = 'count' | 'icons' | 'shape';

interface Flat {
  name: string; label: string; variant: Variant;
  icon: string; slots: number; shape: 'box' | 'cup' | 'circle'; color: string;
}

function toFlat(s: DataSceneSpec): Flat {
  const base = { name: s.name, label: s.label ?? '', icon: '⭐', slots: 5, shape: 'box' as const, color: '#7c83ff' };
  if (s.kind === 'count') return { ...base, variant: 'count', icon: s.icon };
  if ('icon' in s) return { ...base, variant: 'icons', icon: s.icon, slots: s.slots ?? 5 };
  return { ...base, variant: 'shape', shape: s.shape, color: s.color ?? '#7c83ff' };
}

function toSpec(f: Flat): DataSceneSpec {
  const name = f.name.trim() || 'custom';
  const label = f.label.trim() || undefined;
  if (f.variant === 'count') return { name, label, kind: 'count', icon: f.icon || '🔵' };
  if (f.variant === 'icons') return { name, label, kind: 'level', icon: f.icon || '⭐', slots: Math.max(1, Math.min(12, Math.round(f.slots))) };
  return { name, label, kind: 'level', shape: f.shape, color: f.color };
}

const inputStyle: React.CSSProperties = { padding: '6px 9px', borderRadius: 8, border: '1.5px solid color-mix(in oklab, var(--stage-fg) 24%, transparent)', background: 'var(--stage-bg)', color: 'var(--stage-fg)', fontSize: 14, width: '100%' };
const labelStyle: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: 'var(--stage-muted)', textTransform: 'uppercase', letterSpacing: 0.4 };

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }): ReactNode {
  return (
    <button type="button" onClick={onClick} style={{ padding: '5px 11px', borderRadius: 999, fontWeight: 700, fontSize: 13, cursor: 'pointer', border: `2px solid ${active ? 'var(--stage-accent)' : 'color-mix(in oklab, var(--stage-fg) 22%, transparent)'}`, background: active ? 'color-mix(in oklab, var(--stage-accent) 16%, transparent)' : 'transparent', color: 'var(--stage-fg)' }}>{children}</button>
  );
}

export interface SceneStudioProps {
  spec: DataSceneSpec;
  onChange: (spec: DataSceneSpec) => void;
}

export function SceneStudio({ spec, onChange }: SceneStudioProps): ReactNode {
  const f = toFlat(spec);
  const uid = useId();
  const set = (patch: Partial<Flat>): void => onChange(toSpec({ ...f, ...patch }));
  const meta = dataScene(spec);
  const preview = f.variant === 'count'
    ? meta.render({ count: 6, highlight: 2, width: 150, height: 150 })
    : meta.render({ frac: 0.6, width: 150, height: 150 });

  return (
    <div className="not-prose" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 170px', gap: 18, alignItems: 'start', padding: 14, borderRadius: 12, border: '1px solid color-mix(in oklab, var(--stage-fg) 14%, transparent)' }}>
      <div style={{ display: 'grid', gap: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <label style={{ display: 'grid', gap: 4 }}><span style={labelStyle}>name (id)</span><input style={inputStyle} value={f.name} onChange={(e) => set({ name: e.currentTarget.value })} placeholder="pizza" /></label>
          <label style={{ display: 'grid', gap: 4 }}><span style={labelStyle}>label</span><input style={inputStyle} value={f.label} onChange={(e) => set({ label: e.currentTarget.value })} placeholder="Pizza" /></label>
        </div>

        <div style={{ display: 'grid', gap: 4 }}>
          <span style={labelStyle}>type</span>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Chip active={f.variant === 'count'} onClick={() => set({ variant: 'count' })}>count of icons</Chip>
            <Chip active={f.variant === 'icons'} onClick={() => set({ variant: 'icons' })}>icon rating</Chip>
            <Chip active={f.variant === 'shape'} onClick={() => set({ variant: 'shape' })}>filling shape</Chip>
          </div>
        </div>

        {(f.variant === 'count' || f.variant === 'icons') && (
          <div style={{ display: 'grid', gridTemplateColumns: f.variant === 'icons' ? '1fr 1fr' : '1fr', gap: 10 }}>
            <label style={{ display: 'grid', gap: 4 }}><span style={labelStyle}>icon (emoji)</span><input style={{ ...inputStyle, fontSize: 20 }} value={f.icon} onChange={(e) => set({ icon: [...e.currentTarget.value][0] ?? '' })} placeholder="🍕" /></label>
            {f.variant === 'icons' && <label style={{ display: 'grid', gap: 4 }}><span style={labelStyle}>how many</span><input style={inputStyle} type="number" min={1} max={12} value={f.slots} onChange={(e) => set({ slots: Number(e.currentTarget.value) })} /></label>}
          </div>
        )}

        {f.variant === 'shape' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <label style={{ display: 'grid', gap: 4 }}><span style={labelStyle}>shape</span>
              <select style={inputStyle} value={f.shape} onChange={(e) => set({ shape: e.currentTarget.value as Flat['shape'] })}>
                <option value="box">box</option><option value="cup">cup</option><option value="circle">circle (pie)</option>
              </select>
            </label>
            <label style={{ display: 'grid', gap: 4 }}><span style={labelStyle}>colour</span>
              <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input id={uid} type="color" value={/^#/.test(f.color) ? f.color : '#7c83ff'} onChange={(e) => set({ color: e.currentTarget.value })} style={{ width: 34, height: 34, padding: 0, border: 'none', background: 'none' }} />
                <input style={inputStyle} value={f.color} onChange={(e) => set({ color: e.currentTarget.value })} placeholder="#7c83ff" />
              </span>
            </label>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', justifyItems: 'center', gap: 6 }}>
        <span style={labelStyle}>preview</span>
        <div style={{ minHeight: 150, display: 'grid', placeItems: 'center' }}>{preview}</div>
      </div>
    </div>
  );
}
