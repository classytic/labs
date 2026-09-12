/** Custom-scene helpers — map the authored form fields ↔ a DataSceneSpec. Pure (type-only kit
 *  import), shared by the runtime (which registers the scene) and the SceneStudio editor. */
import type { DataSceneSpec } from '../../../kit/data-scene.js';

export type { DataSceneSpec };

export function customSceneSpec(a: Record<string, unknown>): DataSceneSpec {
  const name = (typeof a.name === 'string' && a.name.trim()) || 'custom';
  const label = typeof a.label === 'string' && a.label.trim() ? a.label : undefined;
  const v = a.variant;
  if (v === 'icons')
    return { name, label, kind: 'level', icon: (a.icon as string) || '⭐', slots: Number(a.slots) || 5 };
  if (v === 'shape')
    return {
      name,
      label,
      kind: 'level',
      shape: (a.shape as 'box' | 'cup' | 'circle') || 'box',
      color: (a.color as string) || '#7c83ff',
    };
  return { name, label, kind: 'count', icon: (a.icon as string) || '🔵' };
}

export function customSceneAttrs(s: DataSceneSpec): Record<string, unknown> {
  if (s.kind === 'count') return { name: s.name, label: s.label ?? '', variant: 'count', icon: s.icon };
  if ('icon' in s)
    return { name: s.name, label: s.label ?? '', variant: 'icons', icon: s.icon, slots: s.slots ?? 5 };
  return {
    name: s.name,
    label: s.label ?? '',
    variant: 'shape',
    shape: s.shape,
    color: s.color ?? '#7c83ff',
  };
}
