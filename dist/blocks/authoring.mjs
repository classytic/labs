'use client';

import { useEffect, useRef, useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";

//#region src/blocks/authoring.tsx
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
/**
* Coerce a block attribute into an array. MDX↔Slate round-trips can hand an array
* attribute back as a JSON STRING (when a block has no `fromAttrs` parser), so a
* bare `attr ?? []` slips a string through and `.map` throws. Always read array
* attrs through this: array → as-is, JSON-string-of-array → parsed, else fallback.
*/
function coerceArray(raw, fallback = []) {
	if (Array.isArray(raw)) return raw;
	if (typeof raw === "string" && raw.trim()) try {
		const p = JSON.parse(raw);
		if (Array.isArray(p)) return p;
	} catch {}
	return fallback;
}
/** A subtle settings panel shown above a block while editing. */
function ConfigPanel({ children }) {
	return /* @__PURE__ */ jsx("div", {
		className: "mb-2 space-y-2 rounded-md border border-border/60 bg-muted/40 p-2.5 text-xs",
		children
	});
}
function ConfigRow({ label, children }) {
	return /* @__PURE__ */ jsxs("div", {
		className: "flex flex-wrap items-center gap-2",
		children: [/* @__PURE__ */ jsx("span", {
			className: "w-20 shrink-0 font-medium text-muted-foreground",
			children: label
		}), children]
	});
}
function ChipToggle({ active, onClick, children }) {
	return /* @__PURE__ */ jsx("button", {
		type: "button",
		onClick,
		"aria-pressed": active,
		className: ["rounded-full border px-2.5 py-0.5 font-medium transition-colors", active ? "border-transparent bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:bg-background"].join(" "),
		children
	});
}
/**
* Text input with a LOCAL draft so the caret never jumps: committing up to
* `updateAttributes` round-trips through Slate and re-renders; we only re-sync
* from upstream when the field is not focused (external/programmatic edits).
*/
function TextField({ value, onChange, placeholder, mono, className }) {
	const [draft, setDraft] = useState(value);
	const focused = useRef(false);
	useEffect(() => {
		if (!focused.current) setDraft(value);
	}, [value]);
	return /* @__PURE__ */ jsx("input", {
		type: "text",
		value: draft,
		placeholder,
		onFocus: () => {
			focused.current = true;
		},
		onBlur: () => {
			focused.current = false;
			setDraft(value);
		},
		onChange: (e) => {
			setDraft(e.target.value);
			onChange(e.target.value);
		},
		className: [
			"min-w-0 rounded border border-border bg-background px-2 py-1",
			mono ? "font-mono" : "",
			className ?? ""
		].join(" ")
	});
}
function NumField({ value, onChange, className }) {
	const [draft, setDraft] = useState(String(value));
	const focused = useRef(false);
	useEffect(() => {
		if (!focused.current) setDraft(Number.isFinite(value) ? String(value) : "");
	}, [value]);
	return /* @__PURE__ */ jsx("input", {
		type: "number",
		value: draft,
		onFocus: () => {
			focused.current = true;
		},
		onBlur: () => {
			focused.current = false;
			setDraft(Number.isFinite(value) ? String(value) : "");
		},
		onChange: (e) => {
			setDraft(e.target.value);
			const n = Number.parseFloat(e.target.value);
			if (Number.isFinite(n)) onChange(n);
		},
		className: ["w-16 rounded border border-border bg-background px-1.5 py-1", className ?? ""].join(" ")
	});
}
function SmallButton({ onClick, children, tone }) {
	return /* @__PURE__ */ jsx("button", {
		type: "button",
		onClick,
		className: ["rounded px-1.5 py-0.5 text-xs transition-colors", tone === "danger" ? "text-muted-foreground hover:text-destructive" : "border border-border text-muted-foreground hover:bg-background"].join(" "),
		children
	});
}
function SelectField({ value, onChange, options }) {
	return /* @__PURE__ */ jsx("select", {
		value,
		onChange: (e) => onChange(e.target.value),
		className: "rounded border border-border bg-background px-1.5 py-1 text-[11px]",
		children: options.map((o) => /* @__PURE__ */ jsx("option", {
			value: o,
			children: o
		}, o))
	});
}
/** Comma-separated text ↔ string[] (caret-stable). */
function TagsField({ value, onChange, placeholder }) {
	const [draft, setDraft] = useState((value ?? []).join(", "));
	const focused = useRef(false);
	useEffect(() => {
		if (!focused.current) setDraft((value ?? []).join(", "));
	}, [value]);
	return /* @__PURE__ */ jsx("input", {
		type: "text",
		value: draft,
		placeholder,
		onFocus: () => {
			focused.current = true;
		},
		onBlur: () => {
			focused.current = false;
			setDraft((value ?? []).join(", "));
		},
		onChange: (e) => {
			setDraft(e.target.value);
			onChange(e.target.value.split(",").map((s) => s.trim()).filter(Boolean));
		},
		className: "min-w-0 flex-1 rounded border border-border bg-background px-2 py-1 text-[11px]"
	});
}
/** A JSON escape hatch for deeply-nested data (advanced authoring); keeps a
*  draft and commits on every valid parse, keeping the last good value. */
function JsonArea({ value, onChange, rows = 6 }) {
	const [draft, setDraft] = useState(() => JSON.stringify(value, null, 2));
	const [bad, setBad] = useState(false);
	const focused = useRef(false);
	useEffect(() => {
		if (!focused.current) setDraft(JSON.stringify(value, null, 2));
	}, [value]);
	return /* @__PURE__ */ jsxs("div", {
		className: "w-full",
		children: [/* @__PURE__ */ jsx("textarea", {
			value: draft,
			rows,
			spellCheck: false,
			onFocus: () => {
				focused.current = true;
			},
			onBlur: () => {
				focused.current = false;
				setDraft(JSON.stringify(value, null, 2));
				setBad(false);
			},
			onChange: (e) => {
				setDraft(e.target.value);
				try {
					onChange(JSON.parse(e.target.value));
					setBad(false);
				} catch {
					setBad(true);
				}
			},
			className: "w-full rounded border border-border bg-background px-2 py-1 font-mono text-[11px] leading-snug"
		}), bad ? /* @__PURE__ */ jsx("span", {
			className: "text-[11px] text-destructive",
			children: "invalid JSON, last valid kept"
		}) : null]
	});
}
const POS_OPTS = [
	"noun",
	"verb",
	"article",
	"adjective",
	"preposition",
	"pronoun",
	"conjunction",
	"adverb",
	"other"
];
/** Region "backdrop" landmarks the scene draws as panels (vs object emoji). */
const SCENE_BACKDROPS = [
	"sky",
	"water",
	"ground",
	"room"
];
const ICON_ITEMS = [
	{
		v: "sky",
		group: "Scenes",
		label: "sky",
		kw: "sky air backdrop"
	},
	{
		v: "water",
		group: "Scenes",
		label: "water",
		kw: "water river sea lake pond"
	},
	{
		v: "ground",
		group: "Scenes",
		label: "ground",
		kw: "ground grass field floor"
	},
	{
		v: "room",
		group: "Scenes",
		label: "room",
		kw: "room indoor wall house"
	},
	{
		v: "🐦",
		group: "Animals",
		kw: "bird fly"
	},
	{
		v: "🐱",
		group: "Animals",
		kw: "cat"
	},
	{
		v: "🐶",
		group: "Animals",
		kw: "dog"
	},
	{
		v: "🐟",
		group: "Animals",
		kw: "fish"
	},
	{
		v: "🐝",
		group: "Animals",
		kw: "bee"
	},
	{
		v: "🦋",
		group: "Animals",
		kw: "butterfly"
	},
	{
		v: "🐢",
		group: "Animals",
		kw: "turtle"
	},
	{
		v: "🐰",
		group: "Animals",
		kw: "rabbit bunny"
	},
	{
		v: "🐘",
		group: "Animals",
		kw: "elephant"
	},
	{
		v: "🦁",
		group: "Animals",
		kw: "lion"
	},
	{
		v: "🌳",
		group: "Nature",
		kw: "tree"
	},
	{
		v: "🌲",
		group: "Nature",
		kw: "pine tree"
	},
	{
		v: "🌊",
		group: "Nature",
		kw: "wave sea water"
	},
	{
		v: "☁️",
		group: "Nature",
		kw: "cloud"
	},
	{
		v: "🌧️",
		group: "Nature",
		kw: "rain"
	},
	{
		v: "⛰️",
		group: "Nature",
		kw: "mountain hill"
	},
	{
		v: "🌙",
		group: "Nature",
		kw: "moon"
	},
	{
		v: "⭐",
		group: "Nature",
		kw: "star"
	},
	{
		v: "🌸",
		group: "Nature",
		kw: "flower"
	},
	{
		v: "🌞",
		group: "Nature",
		kw: "sun"
	},
	{
		v: "📦",
		group: "Things",
		kw: "box package"
	},
	{
		v: "⚽",
		group: "Things",
		kw: "ball football"
	},
	{
		v: "🔵",
		group: "Things",
		kw: "ball dot circle"
	},
	{
		v: "🚗",
		group: "Things",
		kw: "car"
	},
	{
		v: "⛵",
		group: "Things",
		kw: "boat ship sail"
	},
	{
		v: "🪁",
		group: "Things",
		kw: "kite"
	},
	{
		v: "🎈",
		group: "Things",
		kw: "balloon"
	},
	{
		v: "🥤",
		group: "Things",
		kw: "cup drink"
	},
	{
		v: "📚",
		group: "Things",
		kw: "book"
	},
	{
		v: "🔑",
		group: "Things",
		kw: "key"
	},
	{
		v: "🏠",
		group: "Places",
		kw: "house home"
	},
	{
		v: "🏫",
		group: "Places",
		kw: "school"
	},
	{
		v: "🪑",
		group: "Places",
		kw: "chair table"
	},
	{
		v: "🛏️",
		group: "Places",
		kw: "bed"
	},
	{
		v: "🚪",
		group: "Places",
		kw: "door"
	},
	{
		v: "🌉",
		group: "Places",
		kw: "bridge"
	},
	{
		v: "🍎",
		group: "Food",
		kw: "apple fruit"
	},
	{
		v: "🍌",
		group: "Food",
		kw: "banana"
	},
	{
		v: "🍚",
		group: "Food",
		kw: "rice"
	},
	{
		v: "🍞",
		group: "Food",
		kw: "bread"
	},
	{
		v: "☕",
		group: "Food",
		kw: "coffee tea cup"
	},
	{
		v: "🧍",
		group: "People",
		kw: "person stand"
	},
	{
		v: "🧒",
		group: "People",
		kw: "child kid"
	},
	{
		v: "🧑‍🏫",
		group: "People",
		kw: "teacher"
	}
];
function bgFor(v) {
	return v === "sky" ? "linear-gradient(#bfe1ff,#eef7ff)" : v === "water" ? "linear-gradient(#6aa6e6,#3f81cf)" : v === "ground" ? "linear-gradient(#86c06a,#5fa244)" : "linear-gradient(#efe6d6,#d8c5a8)";
}
function IconSwatch({ v, label }) {
	if (SCENE_BACKDROPS.includes(v)) return /* @__PURE__ */ jsxs("span", {
		style: {
			display: "inline-flex",
			flexDirection: "column",
			alignItems: "center",
			gap: 1
		},
		children: [/* @__PURE__ */ jsx("span", { style: {
			width: 22,
			height: 15,
			borderRadius: 4,
			background: bgFor(v),
			border: "1px solid rgba(0,0,0,.15)"
		} }), /* @__PURE__ */ jsx("span", {
			style: {
				fontSize: 9,
				lineHeight: 1
			},
			children: label
		})]
	});
	return /* @__PURE__ */ jsx("span", {
		style: {
			fontSize: 19,
			lineHeight: 1
		},
		children: v
	});
}
/** A searchable, categorised icon picker, teachers click an icon (or a scene
*  backdrop), never type emoji. Falls back to a paste-any-emoji field. */
function IconPicker({ value, onChange, placeholder = "pick" }) {
	const [open, setOpen] = useState(false);
	const [q, setQ] = useState("");
	const ql = q.trim().toLowerCase();
	const shown = ql ? ICON_ITEMS.filter((it) => it.kw.includes(ql) || (it.label ?? "").includes(ql)) : ICON_ITEMS;
	const cur = ICON_ITEMS.find((it) => it.v === value);
	return /* @__PURE__ */ jsxs("span", {
		style: {
			position: "relative",
			display: "inline-block"
		},
		children: [/* @__PURE__ */ jsx("button", {
			type: "button",
			onClick: () => setOpen((o) => !o),
			"aria-label": "pick icon",
			className: "flex items-center justify-center rounded border border-border bg-background",
			style: {
				minWidth: 34,
				height: 30,
				padding: "0 4px"
			},
			children: value ? cur ? /* @__PURE__ */ jsx(IconSwatch, {
				v: cur.v,
				label: cur.label
			}) : /* @__PURE__ */ jsx("span", {
				style: { fontSize: 19 },
				children: value
			}) : /* @__PURE__ */ jsx("span", {
				className: "text-[10px] text-muted-foreground",
				children: placeholder
			})
		}), open && /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx("span", {
			onClick: () => setOpen(false),
			style: {
				position: "fixed",
				inset: 0,
				zIndex: 40
			}
		}), /* @__PURE__ */ jsxs("div", {
			style: {
				position: "absolute",
				zIndex: 41,
				top: "112%",
				left: 0,
				width: 250,
				maxHeight: 236,
				overflowY: "auto",
				background: "var(--popover, var(--card, #fff))",
				color: "var(--foreground, inherit)",
				border: "1px solid var(--border, #ddd)",
				borderRadius: 10,
				boxShadow: "0 10px 28px rgba(0,0,0,.2)",
				padding: 8
			},
			children: [
				/* @__PURE__ */ jsx("input", {
					autoFocus: true,
					value: q,
					onChange: (e) => setQ(e.target.value),
					placeholder: "search (bird, river, box…)",
					className: "mb-2 w-full rounded border border-border bg-background px-2 py-1 text-[12px]"
				}),
				/* @__PURE__ */ jsxs("div", {
					style: {
						display: "grid",
						gridTemplateColumns: "repeat(6, 1fr)",
						gap: 4
					},
					children: [shown.map((it) => /* @__PURE__ */ jsx("button", {
						type: "button",
						title: it.label ?? it.kw,
						onClick: () => {
							onChange(it.v);
							setOpen(false);
							setQ("");
						},
						className: "flex items-center justify-center rounded hover:bg-muted",
						style: {
							height: 30,
							background: it.v === value ? "color-mix(in oklab, var(--primary, #3b82f6) 18%, transparent)" : "transparent"
						},
						children: /* @__PURE__ */ jsx(IconSwatch, {
							v: it.v,
							label: it.label
						})
					}, it.v)), shown.length === 0 && /* @__PURE__ */ jsx("span", {
						className: "text-[11px] text-muted-foreground",
						style: { gridColumn: "1 / -1" },
						children: "no match, paste any emoji below"
					})]
				}),
				/* @__PURE__ */ jsx("input", {
					value: value ?? "",
					onChange: (e) => onChange(e.target.value),
					placeholder: "or paste any emoji",
					className: "mt-2 w-full rounded border border-border bg-background px-2 py-1 text-[12px]"
				})
			]
		})] })]
	});
}
/** Edit an array of records as add/remove/reorder rows of typed fields, the
*  creator-facing alternative to hand-writing JSON. */
function RowsEditor({ rows, onChange, columns, newRow, addLabel = "row" }) {
	const list = Array.isArray(rows) ? rows : [];
	const set = (i, key, v) => onChange(list.map((r, j) => j === i ? {
		...r,
		[key]: v
	} : r));
	const remove = (i) => onChange(list.filter((_, j) => j !== i));
	const move = (i, d) => {
		const j = i + d;
		if (j < 0 || j >= list.length) return;
		const next = list.slice();
		const t = next[i];
		next[i] = next[j];
		next[j] = t;
		onChange(next);
	};
	return /* @__PURE__ */ jsxs("div", {
		className: "w-full space-y-1.5",
		children: [list.map((r, i) => {
			const rec = r;
			return /* @__PURE__ */ jsxs("div", {
				className: "flex flex-wrap items-center gap-1.5 rounded-md border border-border/60 bg-background/40 p-1.5",
				children: [
					columns.map((col) => {
						if (col.type === "number") return /* @__PURE__ */ jsxs("span", {
							className: "inline-flex items-center gap-1 text-[11px] text-muted-foreground",
							children: [col.label, /* @__PURE__ */ jsx(NumField, {
								value: Number(rec[col.key]) || 0,
								onChange: (v) => set(i, col.key, v)
							})]
						}, col.key);
						if (col.type === "pos") return /* @__PURE__ */ jsx(SelectField, {
							value: rec[col.key] ?? "other",
							onChange: (v) => set(i, col.key, v),
							options: POS_OPTS
						}, col.key);
						if (col.type === "select") return /* @__PURE__ */ jsx(SelectField, {
							value: rec[col.key] ?? col.options?.[0] ?? "",
							onChange: (v) => set(i, col.key, v),
							options: col.options ?? []
						}, col.key);
						if (col.type === "tags") return /* @__PURE__ */ jsx("span", {
							className: `flex min-w-0 ${col.grow ? "flex-1" : ""}`,
							children: /* @__PURE__ */ jsx(TagsField, {
								value: rec[col.key] ?? [],
								onChange: (v) => set(i, col.key, v),
								placeholder: col.label
							})
						}, col.key);
						if (col.type === "bool") return /* @__PURE__ */ jsxs("label", {
							className: "flex items-center gap-1 text-[11px] text-muted-foreground",
							children: [/* @__PURE__ */ jsx("input", {
								type: "checkbox",
								checked: !!rec[col.key],
								onChange: (e) => set(i, col.key, e.target.checked)
							}), col.label]
						}, col.key);
						if (col.type === "icon") return /* @__PURE__ */ jsx(IconPicker, {
							value: rec[col.key],
							onChange: (v) => set(i, col.key, v),
							placeholder: col.label
						}, col.key);
						return /* @__PURE__ */ jsx("span", {
							className: `flex min-w-0 ${col.grow ? "flex-1" : ""}`,
							children: /* @__PURE__ */ jsx(TextField, {
								value: rec[col.key] ?? "",
								onChange: (v) => set(i, col.key, v),
								placeholder: col.label,
								className: "w-full text-[11px]"
							})
						}, col.key);
					}),
					/* @__PURE__ */ jsx("button", {
						type: "button",
						"aria-label": "move up",
						onClick: () => move(i, -1),
						className: "px-1 text-muted-foreground hover:text-foreground",
						children: "↑"
					}),
					/* @__PURE__ */ jsx("button", {
						type: "button",
						"aria-label": "move down",
						onClick: () => move(i, 1),
						className: "px-1 text-muted-foreground hover:text-foreground",
						children: "↓"
					}),
					/* @__PURE__ */ jsx("button", {
						type: "button",
						"aria-label": "remove row",
						onClick: () => remove(i),
						className: "px-1 text-destructive hover:opacity-70",
						children: "✕"
					})
				]
			}, i);
		}), /* @__PURE__ */ jsxs("button", {
			type: "button",
			onClick: () => onChange([...list, newRow()]),
			className: "rounded-md border border-dashed border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:border-primary hover:text-foreground",
			children: ["+ ", addLabel]
		})]
	});
}

//#endregion
export { ChipToggle, ConfigPanel, ConfigRow, JsonArea, NumField, RowsEditor, SelectField, SmallButton, TagsField, TextField, coerceArray };