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

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useId, type ReactNode } from 'react';
import { Chip } from './controls.js';
import { dataScene, type DataSceneSpec } from './data-scene.js';

type Variant = 'count' | 'icons' | 'shape';

interface Flat {
  name: string;
  label: string;
  variant: Variant;
  icon: string;
  slots: number;
  shape: 'box' | 'cup' | 'circle';
  color: string;
}

function toFlat(s: DataSceneSpec): Flat {
  const base = {
    name: s.name,
    label: s.label ?? '',
    icon: '⭐',
    slots: 5,
    shape: 'box' as const,
    color: '#7c83ff',
  };
  if (s.kind === 'count') return { ...base, variant: 'count', icon: s.icon };
  if ('icon' in s) return { ...base, variant: 'icons', icon: s.icon, slots: s.slots ?? 5 };
  return {
    ...base,
    variant: 'shape',
    shape: s.shape,
    color: s.color ?? '#7c83ff',
  };
}

function toSpec(f: Flat): DataSceneSpec {
  const name = f.name.trim() || 'custom';
  const label = f.label.trim() || undefined;
  if (f.variant === 'count') return { name, label, kind: 'count', icon: f.icon || '🔵' };
  if (f.variant === 'icons')
    return {
      name,
      label,
      kind: 'level',
      icon: f.icon || '⭐',
      slots: Math.max(1, Math.min(12, Math.round(f.slots))),
    };
  return { name, label, kind: 'level', shape: f.shape, color: f.color };
}

const ICON_CHOICES = ['⭐', '🍎', '🍕', '🪙', '🧱', '🌱'] as const;

export interface SceneStudioProps {
  spec: DataSceneSpec;
  onChange: (spec: DataSceneSpec) => void;
}

export function SceneStudio({ spec, onChange }: SceneStudioProps): ReactNode {
  const f = toFlat(spec);
  const uid = useId();
  const set = (patch: Partial<Flat>): void => onChange(toSpec({ ...f, ...patch }));
  const meta = dataScene(spec);
  const preview =
    f.variant === 'count'
      ? meta.render({ count: 6, highlight: 2, width: 150, height: 150 })
      : meta.render({ frac: 0.6, width: 150, height: 150 });

  return (
    <div className="not-prose lab-scene-studio">
      <div className="lab-scene-studio-form">
        <div className="lab-scene-studio-fields">
          <label className="lab-scene-studio-field">
            <span className="lab-scene-studio-label">Internal name</span>
            <Input
              className="lab-scene-studio-input"
              value={f.name}
              onChange={(e) => set({ name: e.currentTarget.value })}
              placeholder="pizza"
              autoComplete="off"
            />
            <small>Used as the stable scene ID.</small>
          </label>
          <label className="lab-scene-studio-field">
            <span className="lab-scene-studio-label">Display label</span>
            <Input
              className="lab-scene-studio-input"
              value={f.label}
              onChange={(e) => set({ label: e.currentTarget.value })}
              placeholder="Pizza"
            />
          </label>
        </div>

        <fieldset className="lab-scene-studio-group">
          <legend className="lab-scene-studio-label">Representation</legend>
          <div className="lab-scene-studio-choices">
            <Chip
              className="lab-scene-studio-choice"
              selected={f.variant === 'count'}
              onClick={() => set({ variant: 'count' })}
            >
              <strong>Count</strong>
              <span>Repeat objects</span>
            </Chip>
            <Chip
              className="lab-scene-studio-choice"
              selected={f.variant === 'icons'}
              onClick={() => set({ variant: 'icons' })}
            >
              <strong>Rating</strong>
              <span>Fill fixed slots</span>
            </Chip>
            <Chip
              className="lab-scene-studio-choice"
              selected={f.variant === 'shape'}
              onClick={() => set({ variant: 'shape' })}
            >
              <strong>Level</strong>
              <span>Fill a container</span>
            </Chip>
          </div>
        </fieldset>

        {(f.variant === 'count' || f.variant === 'icons') && (
          <div className="lab-scene-studio-fields">
            <fieldset className="lab-scene-studio-group">
              <legend className="lab-scene-studio-label">Object</legend>
              <div className="lab-scene-studio-icons" aria-label="Suggested objects">
                {ICON_CHOICES.map((icon) => (
                  <Button
                    key={icon}
                    type="button"
                    size="icon-sm"
                    variant={f.icon === icon ? 'secondary' : 'outline'}
                    aria-label={`Use ${icon}`}
                    aria-pressed={f.icon === icon}
                    onClick={() => set({ icon })}
                  >
                    {icon}
                  </Button>
                ))}
                <label className="lab-scene-studio-custom-icon">
                  <span>Other</span>
                  <Input
                    aria-label="Custom emoji"
                    value={f.icon}
                    onChange={(e) => set({ icon: e.currentTarget.value })}
                    placeholder="🍩"
                  />
                </label>
              </div>
            </fieldset>
            {f.variant === 'icons' && (
              <label className="lab-scene-studio-field">
                <span className="lab-scene-studio-label">Number of slots</span>
                <Input
                  className="lab-scene-studio-input"
                  type="number"
                  min={1}
                  max={12}
                  value={f.slots}
                  onChange={(e) => set({ slots: Number(e.currentTarget.value) })}
                />
              </label>
            )}
          </div>
        )}

        {f.variant === 'shape' && (
          <div className="lab-scene-studio-fields">
            <label className="lab-scene-studio-field">
              <span className="lab-scene-studio-label">Container</span>
              <select
                className="lab-scene-studio-input"
                value={f.shape}
                onChange={(e) => set({ shape: e.currentTarget.value as Flat['shape'] })}
              >
                <option value="box">Box</option>
                <option value="cup">Cup</option>
                <option value="circle">Circle</option>
              </select>
            </label>
            <label className="lab-scene-studio-field">
              <span className="lab-scene-studio-label">Colour</span>
              <span className="lab-scene-studio-color">
                <Input
                  id={uid}
                  aria-label="Scene colour picker"
                  type="color"
                  value={/^#/.test(f.color) ? f.color : '#7c83ff'}
                  onChange={(e) => set({ color: e.currentTarget.value })}
                />
                <Input
                  className="lab-scene-studio-input"
                  aria-label="Scene colour value"
                  value={f.color}
                  onChange={(e) => set({ color: e.currentTarget.value })}
                  placeholder="#7c83ff"
                />
              </span>
            </label>
          </div>
        )}
      </div>

      <div className="lab-scene-studio-preview">
        <span className="lab-scene-studio-label">Live preview</span>
        <div className="lab-scene-studio-preview-stage">{preview}</div>
        <span className="lab-scene-studio-preview-note">
          {f.variant === 'count' ? 'Example with 6 objects' : 'Example at 60% fill'}
        </span>
      </div>
    </div>
  );
}
