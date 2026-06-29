'use client';

import { CheckButton, StatusPill } from "../../kit/controls.mjs";
import { ControlBar, LabFrame, LiveRegion } from "../../kit/frame.mjs";
import { useEffect, useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";

//#region src/biology/genetic-cross/grid.tsx
/**
* CrossGrid, the shared Punnett-grid UI (single source of truth for every cross
* lab: monohybrid, dihybrid, sex-linked). It is PRESENTATIONAL: the parent labs
* compute the gametes + the combine rule and hand them in; this draws the gametes
* on the edges, fills the N×N grid, runs predict-before-reveal, and reads off the
* genotype + phenotype tally bars. No genetics logic lives here.
*/
function CrossGrid({ gametes1, gametes2, gameteLabel, combine, traitLabel, resetKey, predictFirst, header, legend, title, prompt, objectives, showGenotypeTally = true, onReveal }) {
	const [revealed, setRevealed] = useState(!predictFirst);
	const [highlight, setHighlight] = useState(null);
	useEffect(() => {
		setRevealed(!predictFirst);
		setHighlight(null);
	}, [resetKey, predictFirst]);
	const cells = gametes1.map((g1) => gametes2.map((g2) => combine(g1, g2)));
	const flat = cells.flat();
	const n = Math.max(gametes1.length, gametes2.length);
	const cellSize = n <= 2 ? 54 : n === 3 ? 46 : 40;
	const fontSize = n <= 2 ? 17 : 13;
	const genoCount = (g) => flat.filter((c) => c.genotype === g).length;
	const genotypes = [...new Set(flat.map((c) => c.genotype))];
	const phenoTally = (() => {
		const m = /* @__PURE__ */ new Map();
		for (const c of flat) {
			const e = m.get(c.phenotype.label) ?? {
				n: 0,
				color: c.phenotype.color
			};
			e.n += 1;
			m.set(c.phenotype.label, e);
		}
		return [...m.entries()].map(([label, v]) => ({
			label,
			...v
		}));
	})();
	const genoColor = (g) => flat.find((c) => c.genotype === g).phenotype.color;
	const reveal = () => {
		setRevealed(true);
		onReveal?.();
	};
	const Bar = ({ label, parts }) => {
		const total = parts.reduce((s, p) => s + p.n, 0) || 1;
		return /* @__PURE__ */ jsxs("div", {
			style: {
				flex: 1,
				minWidth: 200
			},
			children: [/* @__PURE__ */ jsxs("div", {
				style: {
					fontSize: 11,
					fontWeight: 700,
					color: "var(--stage-muted)",
					marginBottom: 3
				},
				children: [
					label,
					": ",
					parts.filter((p) => p.n).map((p) => `${p.n} ${p.tag}`).join(" : ")
				]
			}), /* @__PURE__ */ jsx("div", {
				style: {
					display: "flex",
					height: 16,
					borderRadius: 6,
					overflow: "hidden",
					border: "1px solid var(--stage-grid)"
				},
				children: parts.filter((p) => p.n).map((p, i) => /* @__PURE__ */ jsx("div", {
					style: {
						flex: p.n / total,
						background: p.color,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						fontSize: 10,
						fontWeight: 800,
						color: "var(--stage-bg)"
					},
					children: p.n
				}, i))
			})]
		});
	};
	const cellBg = (c) => highlight === c.genotype ? `color-mix(in oklab, ${c.phenotype.color} 34%, var(--stage-bg))` : `color-mix(in oklab, ${c.phenotype.color} 13%, var(--stage-bg))`;
	const cellAria = (c, r, ci) => revealed ? `${gameteLabel(gametes1[r])} × ${gameteLabel(gametes2[ci])} → ${c.genotype}, ${c.phenotype.label}` : `${gameteLabel(gametes1[r])} × ${gameteLabel(gametes2[ci])}, hidden until revealed`;
	const figure = /* @__PURE__ */ jsxs(Fragment$1, { children: [legend, /* @__PURE__ */ jsxs("div", {
		style: {
			borderRadius: 14,
			background: "var(--stage-bg)",
			border: "1px solid var(--stage-grid)",
			padding: 16,
			overflowX: "auto"
		},
		children: [/* @__PURE__ */ jsxs("div", {
			role: "table",
			"aria-label": revealed ? `Punnett grid, ${gametes1.length} by ${gametes2.length}. ${traitLabel} ratio ${phenoTally.map((p) => `${p.n} ${p.label}`).join(", ")}.` : `Punnett grid, ${gametes1.length} by ${gametes2.length}, offspring hidden until you reveal the cross.`,
			style: {
				display: "inline-grid",
				gridTemplateColumns: `${cellSize}px repeat(${gametes2.length}, ${cellSize}px)`,
				gap: 4
			},
			children: [/* @__PURE__ */ jsxs("div", {
				role: "row",
				style: { display: "contents" },
				children: [/* @__PURE__ */ jsx("div", {
					role: "columnheader",
					"aria-hidden": true,
					style: { pointerEvents: "none" }
				}), gametes2.map((g, i) => /* @__PURE__ */ jsx("div", {
					role: "columnheader",
					style: {
						textAlign: "center",
						fontSize,
						fontWeight: 800,
						color: "var(--stage-fg)"
					},
					children: gameteLabel(g)
				}, i))]
			}), cells.map((row, r) => /* @__PURE__ */ jsxs("div", {
				role: "row",
				style: { display: "contents" },
				children: [/* @__PURE__ */ jsx("div", {
					role: "rowheader",
					style: {
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						fontSize,
						fontWeight: 800,
						color: "var(--stage-fg)"
					},
					children: gameteLabel(gametes1[r])
				}), row.map((c, ci) => /* @__PURE__ */ jsx("button", {
					type: "button",
					role: "cell",
					"aria-label": cellAria(c, r, ci),
					onClick: () => revealed && setHighlight((h) => h === c.genotype ? null : c.genotype),
					title: revealed ? `${c.genotype} → ${c.phenotype.label}` : void 0,
					style: {
						width: cellSize,
						height: cellSize,
						borderRadius: 6,
						border: "1px solid var(--stage-grid)",
						background: revealed ? cellBg(c) : "var(--stage-bg)",
						cursor: revealed ? "pointer" : "default",
						fontSize,
						fontWeight: 700,
						color: "var(--stage-fg)",
						padding: 0
					},
					children: revealed ? c.genotype : "?"
				}, ci))]
			}, r))]
		}), revealed && highlight && (() => {
			const c = flat.find((x) => x.genotype === highlight);
			return /* @__PURE__ */ jsxs("p", {
				style: {
					fontSize: 12,
					color: "var(--stage-muted)",
					margin: "8px 0 0"
				},
				children: [
					highlight,
					": ",
					genoCount(highlight),
					" of ",
					flat.length,
					" (",
					(genoCount(highlight) / flat.length * 100).toFixed(0),
					"%) → ",
					/* @__PURE__ */ jsx("b", {
						style: { color: c.phenotype.color },
						children: c.phenotype.label
					}),
					c.note ?? ""
				]
			});
		})()]
	})] });
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt,
		objectives,
		controls: /* @__PURE__ */ jsxs(ControlBar, { children: [header, !revealed && /* @__PURE__ */ jsxs("div", {
			className: "lab-bar",
			children: [/* @__PURE__ */ jsxs("span", {
				style: { fontWeight: 600 },
				children: [
					"Predict the ",
					traitLabel,
					" ratio, then…"
				]
			}), /* @__PURE__ */ jsx(CheckButton, {
				onClick: reveal,
				children: "Reveal the cross"
			})]
		})] }),
		aside: revealed ? /* @__PURE__ */ jsxs("div", {
			className: "lab-bar",
			style: {
				gap: 16,
				flexWrap: "wrap",
				flexDirection: "column",
				alignItems: "stretch"
			},
			children: [
				showGenotypeTally && /* @__PURE__ */ jsx(Bar, {
					label: "Genotype",
					parts: genotypes.map((g) => ({
						n: genoCount(g),
						color: genoColor(g),
						tag: g
					}))
				}),
				/* @__PURE__ */ jsx(Bar, {
					label: traitLabel,
					parts: phenoTally.map((p) => ({
						n: p.n,
						color: p.color,
						tag: p.label
					}))
				}),
				/* @__PURE__ */ jsxs(StatusPill, {
					ok: true,
					children: [
						phenoTally.map((p) => p.n).join(":"),
						" ",
						phenoTally.map((p) => p.label).join(" : ")
					]
				})
			]
		}) : void 0,
		footer: /* @__PURE__ */ jsx(LiveRegion, { children: revealed ? `${traitLabel} ratio ${phenoTally.map((p) => `${p.n} ${p.label}`).join(", ")}.` : "Predict, then reveal." }),
		children: figure
	});
}

//#endregion
export { CrossGrid };