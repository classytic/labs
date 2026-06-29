'use client';

import { dataScene, registerDataScene } from "./data-scene.mjs";
import { SceneStudio } from "./scene-studio.mjs";
import { useEffect, useRef, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";

//#region src/kit/scene-library.tsx
/**
* The project Scene Library, persistence + a polished manager for the no-code skins a
* project keeps. Specs live as data; `registerScenes(loadSceneLibrary())` at app boot makes
* every saved skin available in every lab and picker. `SceneLibraryManager` is the in-product
* surface: a tidy card grid with a light-dismiss dialog (SceneStudio inside) for add/edit and
* an inline confirm for delete. Native <dialog closedby="any">, @starting-style entry/exit,
* reduced-motion aware, stage-token themed, one component, no new deps.
*/
const KEY = "classytic.sceneLibrary";
function loadSceneLibrary() {
	if (typeof window === "undefined") return [];
	try {
		const raw = window.localStorage.getItem(KEY);
		return raw ? JSON.parse(raw) : [];
	} catch {
		return [];
	}
}
function saveSceneLibrary(specs) {
	if (typeof window === "undefined") return;
	try {
		window.localStorage.setItem(KEY, JSON.stringify(specs));
	} catch {}
}
/** Bulk-register saved skins. Call once at app boot: registerScenes(loadSceneLibrary()). */
function registerScenes(specs) {
	specs.forEach(registerDataScene);
}
/** Load + register saved skins on mount; mutations persist and re-register. */
function useSceneLibrary() {
	const [specs, setSpecs] = useState([]);
	useEffect(() => {
		const loaded = loadSceneLibrary();
		registerScenes(loaded);
		setSpecs(loaded);
	}, []);
	const persist = (next) => {
		setSpecs(next);
		saveSceneLibrary(next);
		registerScenes(next);
	};
	return {
		specs,
		upsert: (spec, prevName) => persist([...specs.filter((s) => s.name !== spec.name && s.name !== prevName), spec]),
		remove: (name) => persist(specs.filter((s) => s.name !== name))
	};
}
const previewOf = (spec) => spec.kind === "count" ? dataScene(spec).render({
	count: 6,
	highlight: 2,
	width: 130,
	height: 116
}) : dataScene(spec).render({
	frac: .6,
	width: 130,
	height: 116
});
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
const BLANK = {
	name: "",
	kind: "count",
	icon: "🍩",
	label: ""
};
function SceneLibraryManager({ onUse }) {
	const lib = useSceneLibrary();
	const dlg = useRef(null);
	const [draft, setDraft] = useState(BLANK);
	const [editing, setEditing] = useState(void 0);
	const [confirm, setConfirm] = useState(null);
	const open = (spec) => {
		setDraft(spec ?? BLANK);
		setEditing(spec?.name);
		dlg.current?.showModal();
	};
	useEffect(() => {
		const d = dlg.current;
		if (!d) return;
		d.setAttribute("closedby", "any");
		if ("closedBy" in HTMLDialogElement.prototype) return;
		const onClick = (e) => {
			if (e.target !== d) return;
			const r = d.getBoundingClientRect();
			if (!(r.top <= e.clientY && e.clientY <= r.top + r.height && r.left <= e.clientX && e.clientX <= r.left + r.width)) d.close();
		};
		d.addEventListener("click", onClick);
		return () => d.removeEventListener("click", onClick);
	}, []);
	const nameTrim = draft.name.trim();
	const dup = lib.specs.some((s) => s.name === nameTrim && s.name !== editing);
	const valid = nameTrim.length > 0 && !dup;
	const save = () => {
		if (!valid) return;
		lib.upsert(draft, editing);
		dlg.current?.close();
	};
	return /* @__PURE__ */ jsxs("div", {
		className: "scl",
		children: [
			/* @__PURE__ */ jsx("style", { children: STYLE }),
			/* @__PURE__ */ jsxs("div", {
				className: "scl-head",
				children: [
					/* @__PURE__ */ jsx("h3", {
						className: "scl-h",
						children: "Custom scenes"
					}),
					/* @__PURE__ */ jsxs("span", {
						className: "scl-count",
						children: [lib.specs.length, " saved · used across every lesson"]
					}),
					/* @__PURE__ */ jsx("span", { className: "scl-spacer" }),
					/* @__PURE__ */ jsx("button", {
						type: "button",
						className: "scl-btn scl-btn--primary",
						onClick: () => open(),
						children: "+ New scene"
					})
				]
			}),
			lib.specs.length === 0 ? /* @__PURE__ */ jsxs("div", {
				className: "scl-empty",
				children: [
					/* @__PURE__ */ jsx("strong", { children: "No custom scenes yet" }),
					/* @__PURE__ */ jsx("span", { children: "Create a skin from an emoji or a shape, no code. It saves to this project and works in every lab." }),
					/* @__PURE__ */ jsx("button", {
						type: "button",
						className: "scl-btn scl-btn--primary",
						onClick: () => open(),
						style: { marginTop: 4 },
						children: "+ New scene"
					})
				]
			}) : /* @__PURE__ */ jsx("div", {
				className: "scl-grid",
				children: lib.specs.map((spec) => /* @__PURE__ */ jsxs("div", {
					className: "scl-card",
					children: [
						/* @__PURE__ */ jsx("div", {
							className: "scl-fig",
							children: previewOf(spec)
						}),
						/* @__PURE__ */ jsx("span", {
							className: "scl-name",
							children: spec.label || spec.name
						}),
						/* @__PURE__ */ jsxs("span", {
							className: "scl-sub",
							children: [
								/* @__PURE__ */ jsx("code", { children: spec.name }),
								" · ",
								spec.kind === "count" ? "count" : "level"
							]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "scl-actions",
							children: [
								onUse && /* @__PURE__ */ jsx("button", {
									type: "button",
									className: "scl-icon",
									title: "Use in the lab",
									"aria-label": `use ${spec.name}`,
									onClick: () => onUse(spec),
									children: "▸"
								}),
								/* @__PURE__ */ jsx("button", {
									type: "button",
									className: "scl-icon",
									title: "Edit",
									"aria-label": `edit ${spec.name}`,
									onClick: () => open(spec),
									children: "✎"
								}),
								/* @__PURE__ */ jsx("button", {
									type: "button",
									className: "scl-icon",
									title: "Delete",
									"aria-label": `delete ${spec.name}`,
									onClick: () => setConfirm(spec.name),
									children: "🗑"
								})
							]
						}),
						confirm === spec.name && /* @__PURE__ */ jsxs("div", {
							className: "scl-confirm",
							children: [/* @__PURE__ */ jsxs("strong", {
								style: { fontSize: 13 },
								children: [
									"Delete “",
									spec.label || spec.name,
									"”?"
								]
							}), /* @__PURE__ */ jsxs("div", {
								style: {
									display: "flex",
									gap: 8
								},
								children: [/* @__PURE__ */ jsx("button", {
									type: "button",
									className: "scl-btn scl-btn--ghost",
									onClick: () => setConfirm(null),
									children: "Cancel"
								}), /* @__PURE__ */ jsx("button", {
									type: "button",
									className: "scl-btn",
									style: {
										borderColor: "var(--stage-warn)",
										color: "var(--stage-warn)"
									},
									onClick: () => {
										lib.remove(spec.name);
										setConfirm(null);
									},
									children: "Delete"
								})]
							})]
						})
					]
				}, spec.name))
			}),
			/* @__PURE__ */ jsx("dialog", {
				ref: dlg,
				className: "scl-dialog",
				"aria-label": "Edit custom scene",
				children: /* @__PURE__ */ jsxs("div", {
					className: "scl-dlg-body",
					children: [
						/* @__PURE__ */ jsx("h4", {
							className: "scl-dlg-h",
							children: editing ? "Edit scene" : "New scene"
						}),
						/* @__PURE__ */ jsx(SceneStudio, {
							spec: draft,
							onChange: setDraft
						}),
						dup && /* @__PURE__ */ jsxs("span", {
							className: "scl-err",
							children: [
								"A scene named “",
								nameTrim,
								"” already exists, pick another name."
							]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "scl-foot",
							children: [/* @__PURE__ */ jsx("button", {
								type: "button",
								className: "scl-btn scl-btn--ghost",
								onClick: () => dlg.current?.close(),
								children: "Cancel"
							}), /* @__PURE__ */ jsx("button", {
								type: "button",
								className: "scl-btn scl-btn--primary",
								disabled: !valid,
								onClick: save,
								children: editing ? "Save changes" : "Add to library"
							})]
						})
					]
				})
			})
		]
	});
}

//#endregion
export { SceneLibraryManager, loadSceneLibrary, registerScenes, saveSceneLibrary, useSceneLibrary };