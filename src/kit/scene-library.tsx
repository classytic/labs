'use client';

/**
 * The project Scene Library, persistence + a polished manager for the no-code skins a
 * project keeps. Specs live as data; `registerScenes(loadSceneLibrary())` at app boot makes
 * every saved skin available in every lab and picker. `SceneLibraryManager` is the in-product
 * surface: a tidy card grid with a light-dismiss dialog (SceneStudio inside) for add/edit and
 * an inline confirm for delete. Native <dialog closedby="any">, @starting-style entry/exit,
 * reduced-motion aware, stage-token themed, one component, no new deps.
 */

import { Button } from '@/components/ui/button';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Pencil, Play, Plus, Trash2 } from 'lucide-react';
import { dataScene, registerDataScene, type DataSceneSpec } from './data-scene.js';
import { SceneStudio } from './scene-studio.js';

const KEY = 'classytic.sceneLibrary';

export function loadSceneLibrary(): DataSceneSpec[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as DataSceneSpec[]) : [];
  } catch {
    return [];
  }
}
export function saveSceneLibrary(specs: DataSceneSpec[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(specs));
  } catch {
    /* quota / privacy mode */
  }
}
/** Bulk-register saved skins. Call once at app boot: registerScenes(loadSceneLibrary()). */
export function registerScenes(specs: DataSceneSpec[]): void {
  specs.forEach(registerDataScene);
}

export interface SceneLibrary {
  specs: DataSceneSpec[];
  upsert: (spec: DataSceneSpec, prevName?: string) => void;
  remove: (name: string) => void;
}

/** Load + register saved skins on mount; mutations persist and re-register. */
export function useSceneLibrary(): SceneLibrary {
  const [specs, setSpecs] = useState<DataSceneSpec[]>([]);
  useEffect(() => {
    const loaded = loadSceneLibrary();
    registerScenes(loaded);
    setSpecs(loaded);
  }, []);
  const persist = (next: DataSceneSpec[]): void => {
    setSpecs(next);
    saveSceneLibrary(next);
    registerScenes(next);
  };
  return {
    specs,
    upsert: (spec, prevName) =>
      persist([...specs.filter((s) => s.name !== spec.name && s.name !== prevName), spec]),
    remove: (name) => persist(specs.filter((s) => s.name !== name)),
  };
}

const previewOf = (spec: DataSceneSpec): ReactNode =>
  spec.kind === 'count'
    ? dataScene(spec).render({
        count: 6,
        highlight: 2,
        width: 130,
        height: 116,
      })
    : dataScene(spec).render({ frac: 0.6, width: 130, height: 116 });

const BLANK: DataSceneSpec = { name: '', kind: 'count', icon: '🍩', label: '' };

export function SceneLibraryManager({ onUse }: { onUse?: (spec: DataSceneSpec) => void }): ReactNode {
  const lib = useSceneLibrary();
  const dlg = useRef<HTMLDialogElement>(null);
  const [draft, setDraft] = useState<DataSceneSpec>(BLANK);
  const [editing, setEditing] = useState<string | undefined>(undefined);
  const [confirm, setConfirm] = useState<string | null>(null);

  const open = (spec?: DataSceneSpec): void => {
    setDraft(spec ?? BLANK);
    setEditing(spec?.name);
    dlg.current?.showModal();
  };

  // light-dismiss: set native closedby="any"; fall back to a backdrop-click handler
  // where it is not yet supported (Esc always closes a modal dialog regardless).
  useEffect(() => {
    const d = dlg.current;
    if (!d) return;
    d.setAttribute('closedby', 'any');
    if ('closedBy' in HTMLDialogElement.prototype) return;
    const onClick = (e: MouseEvent): void => {
      if (e.target !== d) return;
      const r = d.getBoundingClientRect();
      const inside =
        r.top <= e.clientY &&
        e.clientY <= r.top + r.height &&
        r.left <= e.clientX &&
        e.clientX <= r.left + r.width;
      if (!inside) d.close();
    };
    d.addEventListener('click', onClick);
    return () => d.removeEventListener('click', onClick);
  }, []);

  const nameTrim = draft.name.trim();
  const dup = lib.specs.some((s) => s.name === nameTrim && s.name !== editing);
  const valid = nameTrim.length > 0 && !dup;
  const save = (): void => {
    if (!valid) return;
    lib.upsert(draft, editing);
    dlg.current?.close();
  };

  return (
    <div className="[--scl-line:color-mix(in_oklab,var(--stage-fg)_14%,transparent)]">
      <div className="mb-3.5 flex flex-wrap items-center gap-3">
        <h3 className="m-0 text-base font-extrabold">Custom scenes</h3>
        <span className="text-xs font-bold text-[var(--stage-muted)]">
          {lib.specs.length} saved · used across every lesson
        </span>
        <span className="flex-1" />
        <Button type="button" size="sm" onClick={() => open()}>
          <Plus aria-hidden="true" />
          New scene
        </Button>
      </div>

      {lib.specs.length === 0 ? (
        <div className="grid justify-items-center gap-2 rounded-[14px] border border-dashed border-[var(--scl-line)] p-[34px] text-center text-[var(--stage-muted)]">
          <strong>No custom scenes yet</strong>
          <span>
            Create a skin from an emoji or a shape, no code. It saves to this project and works in every lab.
          </span>
          <Button type="button" size="sm" className="mt-1" onClick={() => open()}>
            <Plus aria-hidden="true" />
            New scene
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(168px,1fr))] gap-3.5">
          {lib.specs.map((spec) => (
            <div
              key={spec.name}
              className="group relative grid justify-items-center gap-1.5 rounded-[14px] border border-[var(--scl-line)] bg-[var(--stage-bg)] px-3 pb-3 pt-3.5 transition-shadow hover:shadow-lg focus-within:shadow-lg"
            >
              <div className="grid min-h-[120px] place-items-center">{previewOf(spec)}</div>
              <span className="text-sm font-extrabold">{spec.label || spec.name}</span>
              <span className="text-[11px] text-[var(--stage-muted)]">
                <code>{spec.name}</code> · {spec.kind === 'count' ? 'count' : 'level'}
              </span>
              <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                {onUse && (
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="outline"
                    title="Use in the lab"
                    aria-label={`use ${spec.name}`}
                    onClick={() => onUse(spec)}
                  >
                    <Play aria-hidden="true" />
                  </Button>
                )}
                <Button
                  type="button"
                  size="icon-sm"
                  variant="outline"
                  title="Edit"
                  aria-label={`edit ${spec.name}`}
                  onClick={() => open(spec)}
                >
                  <Pencil aria-hidden="true" />
                </Button>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="outline"
                  title="Delete"
                  aria-label={`delete ${spec.name}`}
                  onClick={() => setConfirm(spec.name)}
                >
                  <Trash2 aria-hidden="true" />
                </Button>
              </div>
              {confirm === spec.name && (
                <div className="absolute inset-0 grid place-items-center gap-2 rounded-[14px] bg-[color-mix(in_oklab,var(--stage-bg)_88%,transparent)]">
                  <strong className="text-[13px]">Delete “{spec.label || spec.name}”?</strong>
                  <div className="flex gap-2">
                    <Button type="button" size="sm" variant="ghost" onClick={() => setConfirm(null)}>
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        lib.remove(spec.name);
                        setConfirm(null);
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <dialog
        ref={dlg}
        closedby="any"
        className="m-auto w-[min(620px,94vw)] translate-y-3.5 rounded-2xl border-0 bg-[var(--stage-bg)] p-0 text-[var(--stage-fg)] opacity-0 shadow-2xl transition-[opacity,translate,overlay,display] duration-200 open:translate-y-0 open:opacity-100 backdrop:bg-black/45 backdrop:backdrop-blur-[2px] motion-reduce:translate-y-0 motion-reduce:transition-none"
        aria-label="Edit custom scene"
      >
        <div className="grid gap-4 p-5">
          <h4 className="m-0 text-[17px] font-extrabold">{editing ? 'Edit scene' : 'New scene'}</h4>
          <SceneStudio spec={draft} onChange={setDraft} />
          {dup && (
            <span className="text-xs font-semibold text-[var(--stage-warn)]">
              A scene named “{nameTrim}” already exists, pick another name.
            </span>
          )}
          <div className="flex justify-end gap-2.5">
            <Button type="button" variant="ghost" onClick={() => dlg.current?.close()}>
              Cancel
            </Button>
            <Button type="button" disabled={!valid} onClick={save}>
              {editing ? 'Save changes' : 'Add to library'}
            </Button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
