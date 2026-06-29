'use client';

import { Chip, StatusPill } from "../../kit/controls.mjs";
import { ControlBar, LabFrame, LiveRegion } from "../../kit/frame.mjs";
import { useCheckpoint } from "../../kit/pedagogy.mjs";
import { BASE_COLOR, buildSequenceModel } from "./core.mjs";
import { useMemo, useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";

//#region src/biology/sequence/preset.tsx
/**
* SequenceLab, ONE base-pairing tool for DNA replication, transcription and
* translation. The template strand is given; the learner BUILDS the partner strand
* by pairing each unit (base or codon), that manipulation is the whole point, so
* it clears the "interactive only when it teaches" bar. Pick a base/amino acid from
* the palette, tap the slot under its template unit; correct locks green, wrong
* flags red. Replication shows the semiconservative idea: the old strand stays, you
* build the new one.
*
* HTML tiles (flex + horizontal scroll on phones), tokenized, no deps.
*/
const hash = (s) => {
	let h = 0;
	for (let i = 0; i < s.length; i++) h = h * 31 + s.charCodeAt(i) | 0;
	return h >>> 0;
};
const DEFAULT_TITLE = {
	replication: "DNA replication, build the new strand",
	transcription: "Transcription, read DNA into mRNA",
	translation: "Translation, read codons into protein"
};
const DEFAULT_PROMPT = {
	replication: "Each base pairs A–T and G–C. The old strand stays; you build its complement.",
	transcription: "mRNA copies the template, but T is replaced by U (A–U, G–C).",
	translation: "Each 3-base codon codes for one amino acid. Read the chain off the genetic code."
};
function SequenceLab({ kind = "replication", template, title, prompt, objectives }) {
	const units = template ?? (kind === "translation" ? [
		"AUG",
		"UUU",
		"GGA",
		"UAC",
		"UAA"
	] : [
		"T",
		"A",
		"C",
		"G",
		"G",
		"A",
		"T",
		"C"
	]);
	const model = useMemo(() => buildSequenceModel(kind, units), [kind, units.join(",")]);
	const palette = useMemo(() => [...model.options].sort((a, b) => hash(a) - hash(b)), [model]);
	const [filled, setFilled] = useState(() => units.map(() => null));
	const [sel, setSel] = useState(null);
	const correctAt = (i) => filled[i] === model.partnerOf(units[i]);
	const solvedCount = units.filter((_, i) => correctAt(i)).length;
	const solved = solvedCount === units.length;
	useCheckpoint({
		solved,
		activity: `sequence-${kind}`
	});
	const place = (i) => {
		if (correctAt(i)) {
			setFilled((f) => f.map((v, j) => j === i ? null : v));
			return;
		}
		if (!sel) return;
		setFilled((f) => f.map((v, j) => j === i ? sel : v));
		setSel(null);
	};
	const tileW = kind === "translation" ? 52 : 38;
	const tileStyle = (color) => ({
		minWidth: tileW,
		height: 38,
		borderRadius: 8,
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		fontWeight: 800,
		fontSize: kind === "translation" ? 13 : 16,
		background: color,
		color: "var(--stage-bg)",
		padding: "0 6px"
	});
	const colorOf = (b) => BASE_COLOR[b] ?? "var(--stage-accent)";
	const NEUTRAL = "color-mix(in oklab, var(--stage-fg) 26%, var(--stage-bg))";
	const figure = /* @__PURE__ */ jsxs("div", {
		style: {
			borderRadius: 14,
			background: "var(--stage-bg)",
			border: "1px solid var(--stage-grid)",
			padding: 14,
			overflowX: "auto"
		},
		children: [
			/* @__PURE__ */ jsxs("div", {
				style: {
					display: "flex",
					gap: 6,
					alignItems: "center",
					marginBottom: 4
				},
				children: [/* @__PURE__ */ jsx("span", {
					style: {
						minWidth: 96,
						fontSize: 11,
						fontWeight: 700,
						color: "var(--stage-muted)"
					},
					children: model.topLabel
				}), units.map((u, i) => /* @__PURE__ */ jsx("div", {
					style: tileStyle(u.length > 1 ? NEUTRAL : colorOf(u)),
					children: u
				}, i))]
			}),
			/* @__PURE__ */ jsxs("div", {
				style: {
					display: "flex",
					gap: 6
				},
				children: [/* @__PURE__ */ jsx("span", { style: { minWidth: 96 } }), units.map((_, i) => /* @__PURE__ */ jsx("div", {
					style: {
						minWidth: tileW,
						textAlign: "center",
						color: "var(--stage-grid)",
						fontSize: 12,
						lineHeight: "12px"
					},
					children: kind === "translation" ? "↓" : "┊"
				}, i))]
			}),
			/* @__PURE__ */ jsxs("div", {
				style: {
					display: "flex",
					gap: 6,
					alignItems: "center",
					marginTop: 4
				},
				children: [/* @__PURE__ */ jsx("span", {
					style: {
						minWidth: 96,
						fontSize: 11,
						fontWeight: 700,
						color: "var(--stage-muted)"
					},
					children: model.bottomLabel
				}), units.map((u, i) => {
					const v = filled[i];
					const ok = v != null && correctAt(i);
					const bad = v != null && !ok;
					const bg = ok ? model.partnerIsBase ? colorOf(v) : "var(--stage-good)" : "var(--stage-bg)";
					return /* @__PURE__ */ jsx("button", {
						type: "button",
						onClick: () => place(i),
						"aria-label": v ? `${v}${ok ? " correct" : " wrong"}` : `empty slot under ${u}`,
						style: {
							minWidth: tileW,
							height: 38,
							borderRadius: 8,
							padding: "0 6px",
							fontWeight: 800,
							fontSize: kind === "translation" ? 13 : 16,
							cursor: "pointer",
							border: `2px ${v ? "solid" : "dashed"} ${ok ? "var(--stage-good)" : bad ? "var(--stage-danger)" : "var(--stage-grid)"}`,
							background: bg,
							color: ok ? "var(--stage-bg)" : bad ? "var(--stage-danger)" : "var(--stage-muted)"
						},
						children: v ?? "?"
					}, i);
				})]
			})
		]
	});
	const controls = /* @__PURE__ */ jsxs(ControlBar, { children: [palette.map((o) => /* @__PURE__ */ jsx(Chip, {
		selected: sel === o,
		onClick: () => setSel((s) => s === o ? null : o),
		children: /* @__PURE__ */ jsx("span", {
			style: {
				color: model.partnerIsBase ? colorOf(o) : "inherit",
				fontWeight: 800
			},
			children: o
		})
	}, o)), /* @__PURE__ */ jsxs(StatusPill, {
		ok: solved,
		children: [
			solvedCount,
			"/",
			units.length,
			" paired"
		]
	})] });
	const footer = /* @__PURE__ */ jsxs(Fragment$1, { children: [
		kind === "replication" && /* @__PURE__ */ jsxs("p", {
			style: {
				fontSize: 12,
				color: "var(--stage-muted)",
				margin: "8px 0 0"
			},
			children: [
				"Each daughter DNA keeps one ",
				/* @__PURE__ */ jsx("b", { children: "old" }),
				" strand + one ",
				/* @__PURE__ */ jsx("b", { children: "new" }),
				" strand, that’s ",
				/* @__PURE__ */ jsx("b", { children: "semiconservative" }),
				" replication."
			]
		}),
		solved && kind === "translation" && /* @__PURE__ */ jsxs("p", {
			style: {
				fontSize: 13,
				color: "var(--stage-good)",
				fontWeight: 700,
				margin: "8px 0 0"
			},
			children: ["Polypeptide: ", units.map((u) => model.partnerOf(u)).join(" – ")]
		}),
		/* @__PURE__ */ jsx(LiveRegion, { children: solved ? `${model.bottomLabel} complete.` : `${solvedCount} of ${units.length} paired.` })
	] });
	return /* @__PURE__ */ jsx(LabFrame, {
		title: title ?? DEFAULT_TITLE[kind],
		prompt: prompt ?? DEFAULT_PROMPT[kind],
		objectives,
		controls,
		footer,
		children: figure
	});
}

//#endregion
export { SequenceLab };