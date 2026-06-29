'use client';

import { ChipToggle, ConfigPanel, ConfigRow, JsonArea, NumField, RowsEditor, TagsField, TextField } from "./authoring.mjs";
import { Fragment, jsx } from "react/jsx-runtime";
import { z } from "zod";

//#region src/blocks/lab-config.tsx
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
/** Peel optional / default / nullable wrappers to the underlying type. */
function baseOf(schema) {
	let s = schema;
	for (let i = 0; i < 8; i++) {
		if (s instanceof z.ZodOptional || s instanceof z.ZodNullable) {
			s = s.unwrap();
			continue;
		}
		if (s instanceof z.ZodDefault) {
			s = s.def.innerType ?? s;
			continue;
		}
		break;
	}
	return s;
}
/** The element schema of a ZodArray, across zod versions. */
function elementOf(arr) {
	const a = arr;
	return a.element ?? a.def?.element ?? a.def?.type ?? null;
}
const GROW_KEYS = new Set([
	"name",
	"label",
	"prompt",
	"text",
	"title",
	"description"
]);
/** Map a ZodObject's fields to RowsEditor columns, null if any field is too complex to flatten. */
function columnsFor(obj) {
	const cols = [];
	for (const [k, f] of Object.entries(obj.shape)) {
		const b = baseOf(f);
		const grow = GROW_KEYS.has(k);
		if (b instanceof z.ZodString) cols.push({
			key: k,
			label: k,
			grow
		});
		else if (b instanceof z.ZodNumber) cols.push({
			key: k,
			label: k,
			type: "number"
		});
		else if (b instanceof z.ZodBoolean) cols.push({
			key: k,
			label: k,
			type: "bool"
		});
		else if (b instanceof z.ZodEnum) cols.push({
			key: k,
			label: k,
			type: "select",
			options: b.options ?? []
		});
		else return null;
	}
	return cols.length ? cols : null;
}
/** A blank record matching a ZodObject (for RowsEditor's "+ row"). */
function blankFor(obj) {
	const r = {};
	for (const [k, f] of Object.entries(obj.shape)) {
		const b = baseOf(f);
		r[k] = b instanceof z.ZodNumber ? 0 : b instanceof z.ZodBoolean ? false : b instanceof z.ZodEnum ? b.options?.[0] ?? "" : "";
	}
	return r;
}
function LabConfig({ schema, value, onChange, omit = [], flat = false }) {
	if (!(schema instanceof z.ZodObject)) return /* @__PURE__ */ jsx(JsonArea, {
		value,
		onChange: (v) => onChange(v)
	});
	const shape = schema.shape;
	const set = (k, v) => onChange({ [k]: v });
	const rows = Object.entries(shape).filter(([k]) => !omit.includes(k)).map(([key, field]) => {
		const base = baseOf(field);
		const cur = value?.[key];
		if (base instanceof z.ZodString) return /* @__PURE__ */ jsx(ConfigRow, {
			label: key,
			children: /* @__PURE__ */ jsx(TextField, {
				value: cur ?? "",
				onChange: (v) => set(key, v),
				className: "flex-1"
			})
		}, key);
		if (base instanceof z.ZodNumber) return /* @__PURE__ */ jsx(ConfigRow, {
			label: key,
			children: /* @__PURE__ */ jsx(NumField, {
				value: cur ?? 0,
				onChange: (v) => set(key, v)
			})
		}, key);
		if (base instanceof z.ZodBoolean) return /* @__PURE__ */ jsx(ConfigRow, {
			label: key,
			children: /* @__PURE__ */ jsx(ChipToggle, {
				active: !!cur,
				onClick: () => set(key, !cur),
				children: key
			})
		}, key);
		if (base instanceof z.ZodEnum) return /* @__PURE__ */ jsx(ConfigRow, {
			label: key,
			children: /* @__PURE__ */ jsx("span", {
				style: {
					display: "inline-flex",
					gap: 6,
					flexWrap: "wrap"
				},
				children: (base.options ?? []).map((o) => /* @__PURE__ */ jsx(ChipToggle, {
					active: cur === o,
					onClick: () => set(key, o),
					children: o
				}, o))
			})
		}, key);
		if (base instanceof z.ZodArray) {
			const el = elementOf(base);
			const elBase = el ? baseOf(el) : null;
			if (elBase instanceof z.ZodObject) {
				const cols = columnsFor(elBase);
				if (cols) return /* @__PURE__ */ jsx(ConfigRow, {
					label: key,
					children: /* @__PURE__ */ jsx(RowsEditor, {
						rows: Array.isArray(cur) ? cur : [],
						columns: cols,
						addLabel: key.replace(/s$/, "") || "row",
						newRow: () => blankFor(elBase),
						onChange: (v) => set(key, v)
					})
				}, key);
			}
			if (elBase instanceof z.ZodString) return /* @__PURE__ */ jsx(ConfigRow, {
				label: key,
				children: /* @__PURE__ */ jsx(TagsField, {
					value: Array.isArray(cur) ? cur : [],
					onChange: (v) => set(key, v),
					placeholder: key
				})
			}, key);
			return /* @__PURE__ */ jsx(ConfigRow, {
				label: `${key} (advanced)`,
				children: /* @__PURE__ */ jsx(JsonArea, {
					value: cur ?? [],
					onChange: (v) => set(key, v)
				})
			}, key);
		}
		if (base instanceof z.ZodObject) return /* @__PURE__ */ jsx(ConfigRow, {
			label: key,
			children: /* @__PURE__ */ jsx("span", {
				className: "w-full rounded-md border border-border/60 bg-background/40 p-1.5",
				children: /* @__PURE__ */ jsx(LabConfig, {
					schema: base,
					value: cur ?? {},
					onChange: (patch) => set(key, {
						...cur ?? {},
						...patch
					}),
					flat: true
				})
			})
		}, key);
		return /* @__PURE__ */ jsx(ConfigRow, {
			label: `${key} (advanced)`,
			children: /* @__PURE__ */ jsx(JsonArea, {
				value: cur ?? null,
				onChange: (v) => set(key, v)
			})
		}, key);
	});
	return flat ? /* @__PURE__ */ jsx(Fragment, { children: rows }) : /* @__PURE__ */ jsx(ConfigPanel, { children: rows });
}

//#endregion
export { LabConfig };