'use client';

/**
 * The project Scene Library, persistence + a polished manager for the no-code skins a
 * project keeps. Specs live as data; `registerScenes(loadSceneLibrary())` at app boot makes
 * every saved skin available in every lab and picker. `SceneLibraryManager` is the in-product
 * surface: a tidy card grid with a light-dismiss dialog (SceneStudio inside) for add/edit and
 * an inline confirm for delete. Native <dialog closedby="any">, @starting-style entry/exit,
 * reduced-motion aware, stage-token themed, one component, no new deps.
 */

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { dataScene, registerDataScene, type DataSceneSpec } from './data-scene.js';
import { SceneStudio } from './scene-studio.js';

const KEY = 'classytic.sceneLibrary';

export function loadSceneLibrary(): DataSceneSpec[] {
  if (typeof window === 'undefined') return [];
  try { const raw = window.localStorage.getItem(KEY); return raw ? (JSON.parse(raw) as DataSceneSpec[]) : []; } catch { return []; }
}
export function saveSceneLibrary(specs: DataSceneSpec[]): void {
  if (typeof window === 'undefined') return;
  try { window.localStorage.setItem(KEY, JSON.stringify(specs)); } catch { /* quota / privacy mode */ }
}
/** Bulk-register saved skins. Call once at app boot: registerScenes(loadSceneLibrary()). */
export function registerScenes(specs: DataSceneSpec[]): void { specs.forEach(registerDataScene); }

export interface SceneLibrary {
  specs: DataSceneSpec[];
  upsert: (spec: DataSceneSpec, prevName?: string) => void;
  remove: (name: string) => void;
}

/** Load + register saved skins on mount; mutations persist and re-register. */
export function useSceneLibrary(): SceneLibrary {
  const [specs, setSpecs] = useState<DataSceneSpec[]>([]);
  useEffect(() => { const loaded = loadSceneLibrary(); registerScenes(loaded); setSpecs(loaded); }, []);
  const persist = (next: DataSceneSpec[]): void => { setSpecs(next); saveSceneLibrary(next); registerScenes(next); };
  return {
    specs,
    upsert: (spec, prevName) => persist([...specs.filter((s) => s.name !== spec.name && s.name !== prevName), spec]),
    remove: (name) => persist(specs.filter((s) => s.name !== name)),
  };
}

const previewOf = (spec: DataSceneSpec): ReactNode =>
  spec.kind === 'count'
    ? dataScene(spec).render({ count: 6, highlight: 2, width: 130, height: 116 })
    : dataScene(spec).render({ frac: 0.6, width: 130, height: 116 });

const STYLE = `
.scl{ --scl-line: color-mix(in oklab, var(--stage-fg) 14%, transparent); }
.scl-head{ display:flex; align-items:center; gap:12px; margin-bottom:14px; }
.scl-h{ font-weight:800; font-size:16px; margin:0; }
.scl-count{ font-size:12px; font-weight:700; color:var(--stage-muted); }
.scl-spacer{ flex:1; }
.scl-btn{ font-weight:700; font-size:13px; border-radius:9px; padding:8px 14px; cursor:pointer; border:1.5px solid var(--scl-line); background:transparent; color:var(--stage-fg); }
.scl-btn--primary{ border-color:var(--stage-accent); background:var(--stage-accent); color:#fff; }
.scl-btn--ghost{ border-color:transparent; }
.scl-btn:disabled{ opacity:.45; cursor:not-allowed; }
.scl-grid{ display:grid; grid-template-columns:repeat(auto-fill, minmax(168px,1fr)); gap:14px; }
.scl-card{ position:relative; display:grid; justify-items:center; gap:6px; padding:14px 12px 12px; border:1px solid var(--scl-line); border-radius:14px; background:var(--stage-bg);
  opacity:1; transition: opacity .25s ease, translate .25s ease, box-shadow .15s ease; }
.scl-card:hover{ box-shadow:0 6px 18px rgba(0,0,0,.08); }
@starting-style{ .scl-card{ opacity:0; translate:0 8px; } }
.scl-fig{ min-height:120px; display:grid; place-items:center; }
.scl-name{ font-weight:800; font-size:14px; }
.scl-sub{ font-size:11px; color:var(--stage-muted); }
.scl-actions{ position:absolute; top:8px; right:8px; display:flex; gap:4px; opacity:0; transition:opacity .15s ease; }
.scl-card:hover .scl-actions, .scl-card:focus-within .scl-actions{ opacity:1; }
.scl-icon{ width:28px; height:28px; border-radius:8px; display:grid; place-items:center; cursor:pointer; border:1px solid var(--scl-line); background:var(--stage-bg); color:var(--stage-fg); font-size:13px; }
.scl-icon:hover{ background:color-mix(in oklab, var(--stage-fg) 8%, transparent); }
.scl-confirm{ position:absolute; inset:0; display:grid; place-items:center; gap:8px; background:color-mix(in oklab, var(--stage-bg) 88%, transparent); border-radius:14px; }
.scl-empty{ display:grid; justify-items:center; gap:8px; padding:34px; border:1.5px dashed var(--scl-line); border-radius:14px; color:var(--stage-muted); text-align:center; }
.scl-dialog{ border:none; border-radius:16px; padding:0; width:min(620px, 94vw); background:var(--stage-bg); color:var(--stage-fg); box-shadow:0 24px 70px rgba(0,0,0,.28);
  opacity:0; translate:0 14px; transition: opacity .22s ease, translate .22s ease, overlay .22s allow-discrete, display .22s allow-discrete; }
.scl-dialog[open]{ opacity:1; translate:0 0; }
@starting-style{ .scl-dialog[open]{ opacity:0; translate:0 14px; } }
.scl-dialog::backdrop{ background:rgba(0,0,0,.45); backdrop-filter:blur(2px); }
.scl-dlg-body{ padding:20px; display:grid; gap:16px; }
.scl-dlg-h{ font-weight:800; font-size:17px; margin:0; }
.scl-foot{ display:flex; justify-content:flex-end; gap:10px; }
.scl-err{ font-size:12px; font-weight:600; color:var(--stage-warn); }
@media (prefers-reduced-motion: reduce){
  .scl-card, .scl-dialog{ translate:none; transition-duration:.05s; }
  @starting-style{ .scl-card, .scl-dialog[open]{ translate:none; } }
}`;

const BLANK: DataSceneSpec = { name: '', kind: 'count', icon: '🍩', label: '' };

export function SceneLibraryManager({ onUse }: { onUse?: (spec: DataSceneSpec) => void }): ReactNode {
  const lib = useSceneLibrary();
  const dlg = useRef<HTMLDialogElement>(null);
  const [draft, setDraft] = useState<DataSceneSpec>(BLANK);
  const [editing, setEditing] = useState<string | undefined>(undefined);
  const [confirm, setConfirm] = useState<string | null>(null);

  const open = (spec?: DataSceneSpec): void => { setDraft(spec ?? BLANK); setEditing(spec?.name); dlg.current?.showModal(); };

  // light-dismiss: set native closedby="any"; fall back to a backdrop-click handler
  // where it is not yet supported (Esc always closes a modal dialog regardless).
  useEffect(() => {
    const d = dlg.current; if (!d) return;
    d.setAttribute('closedby', 'any');
    if ('closedBy' in HTMLDialogElement.prototype) return;
    const onClick = (e: MouseEvent): void => {
      if (e.target !== d) return;
      const r = d.getBoundingClientRect();
      const inside = r.top <= e.clientY && e.clientY <= r.top + r.height && r.left <= e.clientX && e.clientX <= r.left + r.width;
      if (!inside) d.close();
    };
    d.addEventListener('click', onClick);
    return () => d.removeEventListener('click', onClick);
  }, []);

  const nameTrim = draft.name.trim();
  const dup = lib.specs.some((s) => s.name === nameTrim && s.name !== editing);
  const valid = nameTrim.length > 0 && !dup;
  const save = (): void => { if (!valid) return; lib.upsert(draft, editing); dlg.current?.close(); };

  return (
    <div className="scl">
      <style>{STYLE}</style>
      <div className="scl-head">
        <h3 className="scl-h">Custom scenes</h3>
        <span className="scl-count">{lib.specs.length} saved · used across every lesson</span>
        <span className="scl-spacer" />
        <button type="button" className="scl-btn scl-btn--primary" onClick={() => open()}>+ New scene</button>
      </div>

      {lib.specs.length === 0 ? (
        <div className="scl-empty">
          <strong>No custom scenes yet</strong>
          <span>Create a skin from an emoji or a shape, no code. It saves to this project and works in every lab.</span>
          <button type="button" className="scl-btn scl-btn--primary" onClick={() => open()} style={{ marginTop: 4 }}>+ New scene</button>
        </div>
      ) : (
        <div className="scl-grid">
          {lib.specs.map((spec) => (
            <div key={spec.name} className="scl-card">
              <div className="scl-fig">{previewOf(spec)}</div>
              <span className="scl-name">{spec.label || spec.name}</span>
              <span className="scl-sub"><code>{spec.name}</code> · {spec.kind === 'count' ? 'count' : 'level'}</span>
              <div className="scl-actions">
                {onUse && <button type="button" className="scl-icon" title="Use in the lab" aria-label={`use ${spec.name}`} onClick={() => onUse(spec)}>▸</button>}
                <button type="button" className="scl-icon" title="Edit" aria-label={`edit ${spec.name}`} onClick={() => open(spec)}>✎</button>
                <button type="button" className="scl-icon" title="Delete" aria-label={`delete ${spec.name}`} onClick={() => setConfirm(spec.name)}>🗑</button>
              </div>
              {confirm === spec.name && (
                <div className="scl-confirm">
                  <strong style={{ fontSize: 13 }}>Delete “{spec.label || spec.name}”?</strong>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" className="scl-btn scl-btn--ghost" onClick={() => setConfirm(null)}>Cancel</button>
                    <button type="button" className="scl-btn" style={{ borderColor: 'var(--stage-warn)', color: 'var(--stage-warn)' }} onClick={() => { lib.remove(spec.name); setConfirm(null); }}>Delete</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <dialog ref={dlg} className="scl-dialog" aria-label="Edit custom scene">
        <div className="scl-dlg-body">
          <h4 className="scl-dlg-h">{editing ? 'Edit scene' : 'New scene'}</h4>
          <SceneStudio spec={draft} onChange={setDraft} />
          {dup && <span className="scl-err">A scene named “{nameTrim}” already exists, pick another name.</span>}
          <div className="scl-foot">
            <button type="button" className="scl-btn scl-btn--ghost" onClick={() => dlg.current?.close()}>Cancel</button>
            <button type="button" className="scl-btn scl-btn--primary" disabled={!valid} onClick={save}>{editing ? 'Save changes' : 'Add to library'}</button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
