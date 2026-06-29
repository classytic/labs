'use client';

import { Chip, StatusPill } from "../../kit/controls.mjs";
import { ControlBar, LabFrame, LiveRegion } from "../../kit/frame.mjs";
import { useCheckpoint } from "../../kit/pedagogy.mjs";
import { BASE_COLOR, CODON_TABLE, RNA_BASES, TRANSCRIBE } from "./core.mjs";
import { useMemo, useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";

//#region src/biology/sequence/central-dogma.tsx
/**
* CentralDogmaLab, the whole central dogma in one flow: DNA → (transcription) →
* mRNA → (translation) → protein. The learner does BOTH steps on one starting
* strand: first pair the DNA template into mRNA (T→U), then read each 3-base codon
* to its amino acid. Translation unlocks only once the mRNA is correct, so the
* dependency (you can't translate what isn't transcribed) is felt. Reuses the
* sequence core (TRANSCRIBE + CODON_TABLE), no new pairing logic.
*/
const hash = (s) => {
	let h = 0;
	for (let i = 0; i < s.length; i++) h = h * 31 + s.charCodeAt(i) | 0;
	return h >>> 0;
};
const AA_POOL = [
	"Met",
	"Leu",
	"Gly",
	"Phe",
	"Ser",
	"Val",
	"Stop",
	"Tyr"
];
function CentralDogmaLab({ dna = [
	"T",
	"A",
	"C",
	"G",
	"A",
	"A",
	"C",
	"C",
	"T",
	"A",
	"T",
	"T"
], title = "The central dogma: DNA → mRNA → protein", prompt = "Transcribe the DNA into mRNA (T→U), then translate each codon into an amino acid.", objectives }) {
	const nCodons = Math.floor(dna.length / 3);
	const [mrna, setMrna] = useState(() => dna.map(() => null));
	const [protein, setProtein] = useState(() => Array.from({ length: nCodons }, () => null));
	const [selBase, setSelBase] = useState(null);
	const [selAA, setSelAA] = useState(null);
	const mrnaOK = (i) => mrna[i] === TRANSCRIBE[dna[i]];
	const transcribed = dna.every((_, i) => mrnaOK(i));
	const codonStr = (c) => transcribed ? [
		0,
		1,
		2
	].map((k) => mrna[c * 3 + k]).join("") : "";
	const proteinOK = (c) => transcribed && protein[c] === CODON_TABLE[codonStr(c)];
	const translated = transcribed && Array.from({ length: nCodons }).every((_, c) => proteinOK(c));
	const done = transcribed && translated;
	useCheckpoint({
		solved: done,
		activity: "central-dogma"
	});
	const aaOptions = useMemo(() => {
		const correct = Array.from({ length: nCodons }, (_, c) => CODON_TABLE[[
			0,
			1,
			2
		].map((k) => TRANSCRIBE[dna[c * 3 + k]]).join("")] ?? "???");
		return [...new Set([...correct, ...AA_POOL])].slice(0, Math.max(4, new Set(correct).size + 2)).sort((a, b) => hash(a) - hash(b));
	}, [dna, nCodons]);
	const placeBase = (i) => {
		if (mrnaOK(i)) {
			setMrna((m) => m.map((v, j) => j === i ? null : v));
			return;
		}
		if (!selBase) return;
		setMrna((m) => m.map((v, j) => j === i ? selBase : v));
		setSelBase(null);
	};
	const placeAA = (c) => {
		if (!transcribed) return;
		if (proteinOK(c)) {
			setProtein((p) => p.map((v, j) => j === c ? null : v));
			return;
		}
		if (!selAA) return;
		setProtein((p) => p.map((v, j) => j === c ? selAA : v));
		setSelAA(null);
	};
	const colorOf = (b) => BASE_COLOR[b] ?? "var(--stage-accent)";
	const TILE = 34;
	const tile = (bg) => ({
		minWidth: TILE,
		height: 34,
		borderRadius: 7,
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		fontWeight: 800,
		fontSize: 15,
		background: bg,
		color: "var(--stage-bg)"
	});
	const arrow = (label) => /* @__PURE__ */ jsxs("div", {
		style: {
			display: "flex",
			alignItems: "center",
			gap: 8,
			margin: "6px 0",
			color: "var(--stage-muted)",
			fontSize: 12,
			fontWeight: 700
		},
		children: [
			/* @__PURE__ */ jsx("span", {
				style: { fontSize: 16 },
				children: "↓"
			}),
			" ",
			label
		]
	});
	const mrnaCount = dna.filter((_, i) => mrnaOK(i)).length;
	const protCount = Array.from({ length: nCodons }).filter((_, c) => proteinOK(c)).length;
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
					gap: 5,
					alignItems: "center"
				},
				children: [/* @__PURE__ */ jsx("span", {
					style: {
						minWidth: 92,
						fontSize: 11,
						fontWeight: 700,
						color: "var(--stage-muted)"
					},
					children: "DNA template"
				}), dna.map((b, i) => /* @__PURE__ */ jsx("div", {
					style: tile(colorOf(b)),
					children: b
				}, i))]
			}),
			arrow("transcription, copy the template, T → U"),
			/* @__PURE__ */ jsxs("div", {
				style: {
					display: "flex",
					gap: 5,
					alignItems: "center"
				},
				children: [/* @__PURE__ */ jsx("span", {
					style: {
						minWidth: 92,
						fontSize: 11,
						fontWeight: 700,
						color: "var(--stage-muted)"
					},
					children: "mRNA"
				}), dna.map((b, i) => {
					const v = mrna[i];
					const ok = v != null && mrnaOK(i);
					const bad = v != null && !ok;
					const sep = i > 0 && i % 3 === 0;
					return /* @__PURE__ */ jsx("button", {
						type: "button",
						onClick: () => placeBase(i),
						"aria-label": v ? `${v}${ok ? " correct" : " wrong"}` : `mRNA slot ${i + 1}`,
						style: {
							minWidth: TILE,
							height: 34,
							marginLeft: sep ? 8 : 0,
							borderRadius: 7,
							fontWeight: 800,
							fontSize: 15,
							cursor: "pointer",
							border: `2px ${v ? "solid" : "dashed"} ${ok ? "var(--stage-good)" : bad ? "var(--stage-danger)" : "var(--stage-grid)"}`,
							background: ok ? colorOf(v) : "var(--stage-bg)",
							color: ok ? "var(--stage-bg)" : bad ? "var(--stage-danger)" : "var(--stage-muted)"
						},
						children: v ?? "?"
					}, i);
				})]
			}),
			arrow(transcribed ? "translation, read each codon off the genetic code" : "translation, locked until the mRNA is complete"),
			/* @__PURE__ */ jsxs("div", {
				style: {
					display: "flex",
					gap: 5,
					alignItems: "center",
					opacity: transcribed ? 1 : .45
				},
				children: [/* @__PURE__ */ jsx("span", {
					style: {
						minWidth: 92,
						fontSize: 11,
						fontWeight: 700,
						color: "var(--stage-muted)"
					},
					children: "protein"
				}), Array.from({ length: nCodons }, (_, c) => {
					const v = protein[c];
					const ok = proteinOK(c);
					const bad = v != null && !ok;
					return /* @__PURE__ */ jsxs("button", {
						type: "button",
						onClick: () => placeAA(c),
						disabled: !transcribed,
						"aria-label": transcribed ? `codon ${codonStr(c)}` : "locked",
						style: {
							minWidth: 96,
							height: 34,
							marginRight: 8,
							borderRadius: 7,
							fontWeight: 800,
							fontSize: 13,
							cursor: transcribed ? "pointer" : "not-allowed",
							border: `2px ${v ? "solid" : "dashed"} ${ok ? "var(--stage-good)" : bad ? "var(--stage-danger)" : "var(--stage-grid)"}`,
							background: ok ? "var(--stage-good)" : "var(--stage-bg)",
							color: ok ? "var(--stage-bg)" : bad ? "var(--stage-danger)" : "var(--stage-muted)"
						},
						children: [transcribed ? /* @__PURE__ */ jsxs("span", {
							style: {
								fontSize: 10,
								opacity: .85
							},
							children: [codonStr(c), " "]
						}) : "", v ?? "·"]
					}, c);
				})]
			})
		]
	});
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt,
		objectives,
		controls: /* @__PURE__ */ jsxs(ControlBar, { children: [/* @__PURE__ */ jsxs("div", {
			className: "lab-bar",
			style: {
				flexWrap: "wrap",
				gap: 8
			},
			children: [
				/* @__PURE__ */ jsx("span", {
					style: {
						fontSize: 12,
						fontWeight: 700,
						color: "var(--stage-muted)"
					},
					children: "bases"
				}),
				[...RNA_BASES].map((b) => /* @__PURE__ */ jsx(Chip, {
					selected: selBase === b,
					onClick: () => {
						setSelBase((s) => s === b ? null : b);
						setSelAA(null);
					},
					children: /* @__PURE__ */ jsx("span", {
						style: {
							color: colorOf(b),
							fontWeight: 800
						},
						children: b
					})
				}, b)),
				/* @__PURE__ */ jsxs(StatusPill, {
					ok: transcribed,
					children: [
						mrnaCount,
						"/",
						dna.length,
						" mRNA"
					]
				})
			]
		}), /* @__PURE__ */ jsxs("div", {
			className: "lab-bar",
			style: {
				flexWrap: "wrap",
				gap: 8,
				opacity: transcribed ? 1 : .5
			},
			children: [
				/* @__PURE__ */ jsx("span", {
					style: {
						fontSize: 12,
						fontWeight: 700,
						color: "var(--stage-muted)"
					},
					children: "amino acids"
				}),
				aaOptions.map((a) => /* @__PURE__ */ jsx(Chip, {
					selected: selAA === a,
					onClick: () => {
						if (!transcribed) return;
						setSelAA((s) => s === a ? null : a);
						setSelBase(null);
					},
					children: a
				}, a)),
				/* @__PURE__ */ jsxs(StatusPill, {
					ok: translated,
					children: [
						protCount,
						"/",
						nCodons,
						" codons"
					]
				})
			]
		})] }),
		footer: /* @__PURE__ */ jsxs(Fragment$1, { children: [done && /* @__PURE__ */ jsxs("p", {
			style: {
				fontSize: 13,
				color: "var(--stage-good)",
				fontWeight: 700,
				margin: "8px 0 0"
			},
			children: ["Polypeptide: ", Array.from({ length: nCodons }, (_, c) => CODON_TABLE[codonStr(c)]).join(" – ")]
		}), /* @__PURE__ */ jsx(LiveRegion, { children: done ? "Central dogma complete: DNA transcribed and translated." : transcribed ? `mRNA complete; ${protCount} of ${nCodons} codons translated.` : `${mrnaCount} of ${dna.length} mRNA bases paired.` })] }),
		children: figure
	});
}

//#endregion
export { CentralDogmaLab };