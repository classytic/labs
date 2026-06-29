'use client';

import { Tex as Tex$1 } from "../../core/tex.mjs";
import { Chip } from "../../kit/controls.mjs";
import { ControlBar, LabFrame } from "../../kit/frame.mjs";
import { HintLadder, useCheckpoint, useHints } from "../../kit/pedagogy.mjs";
import { normalCdf, normalPdf, zScore } from "../core/normal.mjs";
import { useEffect, useMemo, useRef, useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
import { useControlSurface } from "@classytic/stage";

//#region src/statistics/z-table/preset.tsx
/**
* ZTableLab, read a z-table like the exam expects, and see what each lookup MEANS.
* Standardize a raw value (x → z = (x−μ)/σ), then the classic Φ(z) table lights up
* the row/column and cell for that z, while a mini standard-normal curve shades the
* matching tail and shows the probability. Click any cell to jump there (and the
* raw value x updates to stay consistent). Negative z is handled by the symmetry
* Φ(−z) = 1 − Φ(z), spelled out rather than hidden.
*
* Φ comes from the normal kernel (`normalCdf`); the table is just that function laid
* out as the familiar grid, one source of truth, no transcribed magic numbers.
*/
const CW = 230, CH = 116, CPAD = 6;
const ROWS = Array.from({ length: 35 }, (_, i) => i / 10);
const COLS = Array.from({ length: 10 }, (_, j) => j / 100);
const f2 = (x) => x.toFixed(2);
const f4 = (x) => x.toFixed(4);
function ZTableLab({ x = 650, mu = 500, sigma = 100, tail = "left", title = "The z-table", prompt, objectives, hints: hintList, controlId }) {
	const [xv, setXv] = useState(x);
	const [m, setM] = useState(mu);
	const [sg, setSg] = useState(sigma);
	const [t, setT] = useState(tail);
	const hints = useHints(hintList);
	const z = zScore(xv, m, sg);
	const phi = normalCdf(z);
	const prob = t === "left" ? phi : 1 - phi;
	const zLook = Math.round(Math.min(3.49, Math.abs(z)) * 100) / 100;
	const xMinC = -3.5, xMaxC = 3.5, yMaxC = normalPdf(0) * 1.1;
	const cx = (v) => CPAD + (v - xMinC) / (xMaxC - xMinC) * (CW - 2 * CPAD);
	const cy = (v) => CH - 16 - v / yMaxC * (CH - 26);
	const curve = useMemo(() => Array.from({ length: 121 }, (_, i) => {
		const v = xMinC + i / 120 * (xMaxC - xMinC);
		return `${cx(v).toFixed(1)},${cy(normalPdf(v)).toFixed(1)}`;
	}).join(" "), []);
	const shade = useMemo(() => {
		const loX = t === "left" ? xMinC : z, hiX = t === "left" ? z : xMaxC;
		const a0 = Math.max(xMinC, Math.min(loX, hiX)), a1 = Math.min(xMaxC, Math.max(loX, hiX));
		const pts = [`${cx(a0).toFixed(1)},${cy(0).toFixed(1)}`];
		for (let i = 0; i <= 60; i++) {
			const v = a0 + i / 60 * (a1 - a0);
			pts.push(`${cx(v).toFixed(1)},${cy(normalPdf(v)).toFixed(1)}`);
		}
		pts.push(`${cx(a1).toFixed(1)},${cy(0).toFixed(1)}`);
		return `M${pts.join(" L")} Z`;
	}, [z, t]);
	const pickCell = (rz, cz) => {
		const zz = (z < 0 ? -1 : 1) * (rz + cz);
		setXv(Math.round((m + zz * sg) * 100) / 100);
	};
	const scrollBox = useRef(null);
	const selRow = useRef(null);
	useEffect(() => {
		const box = scrollBox.current, row = selRow.current;
		if (!box || !row) return;
		const br = box.getBoundingClientRect(), rr = row.getBoundingClientRect();
		box.scrollTop += rr.top - br.top - box.clientHeight / 2 + rr.height / 2;
	}, [zLook]);
	const lookedUp = useRef(/* @__PURE__ */ new Set());
	const [lookupCount, setLookupCount] = useState(0);
	useEffect(() => {
		if (Number.isFinite(zLook) && !lookedUp.current.has(zLook)) {
			lookedUp.current.add(zLook);
			setLookupCount(lookedUp.current.size);
		}
	}, [zLook]);
	useCheckpoint({
		solved: lookupCount >= 3,
		activity: `z-table:${title}`,
		hintsUsed: hints?.count ?? 0
	});
	useControlSurface(controlId, {
		x: {
			type: "number",
			label: "raw value x",
			min: -1e4,
			max: 1e4,
			step: 1,
			get: () => xv,
			set: setXv
		},
		mu: {
			type: "number",
			label: "mean μ",
			min: -1e4,
			max: 1e4,
			step: 1,
			get: () => m,
			set: setM
		},
		sigma: {
			type: "number",
			label: "std dev σ",
			min: .1,
			max: 1e4,
			step: 1,
			get: () => sg,
			set: setSg
		},
		tail: {
			type: "enum",
			label: "tail",
			options: ["left", "right"],
			get: () => t,
			set: (v) => setT(v)
		}
	});
	const numIn = (val, set, w = 64) => /* @__PURE__ */ jsx("input", {
		type: "number",
		value: Number.isInteger(val) ? val : Number(val.toFixed(2)),
		onChange: (e) => set(Number(e.target.value)),
		style: {
			width: w,
			padding: "3px 6px",
			borderRadius: 6,
			border: "1px solid var(--stage-grid)",
			background: "var(--stage-bg)",
			color: "var(--stage-fg)",
			fontWeight: 700,
			fontVariantNumeric: "tabular-nums"
		}
	});
	const figure = /* @__PURE__ */ jsxs(Fragment$1, { children: [
		/* @__PURE__ */ jsxs("div", {
			style: {
				display: "flex",
				gap: 18,
				flexWrap: "wrap",
				alignItems: "center",
				margin: "6px 0"
			},
			children: [/* @__PURE__ */ jsxs("div", {
				style: {
					display: "flex",
					gap: 6,
					alignItems: "center",
					flexWrap: "wrap",
					fontSize: 14
				},
				children: [
					/* @__PURE__ */ jsxs("span", { children: ["x = ", numIn(xv, setXv)] }),
					/* @__PURE__ */ jsxs("span", {
						style: { color: "var(--stage-muted)" },
						children: [
							"from N(",
							/* @__PURE__ */ jsx(Tex$1, { tex: "\\\\mu" }),
							"=",
							numIn(m, setM, 56),
							", ",
							/* @__PURE__ */ jsx(Tex$1, { tex: "\\\\sigma" }),
							"=",
							numIn(sg, setSg, 52),
							")"
						]
					}),
					/* @__PURE__ */ jsxs("span", {
						style: { fontWeight: 800 },
						children: [
							/* @__PURE__ */ jsx(Tex$1, { tex: "\\\\to z =" }),
							" ",
							/* @__PURE__ */ jsx("span", {
								style: { color: "var(--stage-accent)" },
								children: f2(z)
							})
						]
					})
				]
			}), /* @__PURE__ */ jsxs("div", {
				style: {
					flex: 1,
					minWidth: 230,
					display: "flex",
					alignItems: "center",
					gap: 12
				},
				children: [/* @__PURE__ */ jsxs("svg", {
					viewBox: `0 0 ${CW} ${CH}`,
					style: {
						width: 230,
						height: "auto"
					},
					role: "img",
					"aria-label": `standard normal, ${t} tail at z ${f2(z)}, area ${f4(prob)}`,
					children: [
						/* @__PURE__ */ jsx("path", {
							d: shade,
							fill: "color-mix(in oklab, var(--stage-accent) 36%, transparent)"
						}),
						/* @__PURE__ */ jsx("line", {
							x1: CPAD,
							y1: cy(0),
							x2: CW - CPAD,
							y2: cy(0),
							stroke: "var(--stage-fg)",
							strokeWidth: 1.2
						}),
						/* @__PURE__ */ jsx("polyline", {
							points: curve,
							fill: "none",
							stroke: "var(--stage-fg)",
							strokeWidth: 2
						}),
						/* @__PURE__ */ jsx("line", {
							x1: cx(z),
							y1: cy(0),
							x2: cx(z),
							y2: 16,
							stroke: "var(--stage-accent)",
							strokeWidth: 1.5,
							strokeDasharray: "4 3"
						}),
						/* @__PURE__ */ jsxs("text", {
							x: cx(Math.max(-3.1, Math.min(xMaxC - .4, z))),
							y: CH - 3,
							textAnchor: "middle",
							fontSize: 10,
							fill: "var(--stage-accent)",
							fontWeight: 700,
							children: ["z=", f2(z)]
						})
					]
				}), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs("div", {
					style: {
						fontSize: 20,
						fontWeight: 800,
						color: "var(--stage-good)"
					},
					children: [(prob * 100).toFixed(2), "%"]
				}), /* @__PURE__ */ jsx("div", {
					style: {
						fontSize: 12,
						color: "var(--stage-muted)"
					},
					children: /* @__PURE__ */ jsx(Tex$1, { tex: `P(Z ${t === "left" ? "\\le" : "\\ge"} ${f2(z)})` })
				})] })]
			})]
		}),
		z < 0 && /* @__PURE__ */ jsxs("p", {
			className: "lab-prompt",
			style: { marginTop: 6 },
			children: [
				"z is negative, the table lists |z|; use symmetry ",
				/* @__PURE__ */ jsx("b", { children: /* @__PURE__ */ jsx(Tex$1, { tex: `\\Phi(${f2(z)}) = 1 - \\Phi(${f2(-z)}) = ${f4(phi)}` }) }),
				"."
			]
		}),
		/* @__PURE__ */ jsx("div", {
			ref: scrollBox,
			style: {
				overflow: "auto",
				maxHeight: 300,
				borderRadius: 10,
				border: "1px solid var(--stage-grid)",
				marginTop: 8
			},
			children: /* @__PURE__ */ jsxs("table", {
				style: {
					borderCollapse: "collapse",
					fontVariantNumeric: "tabular-nums",
					fontSize: 11
				},
				children: [/* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { children: [/* @__PURE__ */ jsx("th", {
					style: {
						position: "sticky",
						top: 0,
						left: 0,
						zIndex: 2,
						background: "var(--stage-bg)",
						padding: "4px 6px",
						borderBottom: "2px solid var(--stage-grid)",
						color: "var(--stage-accent)"
					},
					children: "z"
				}), COLS.map((c) => /* @__PURE__ */ jsxs("th", {
					style: {
						position: "sticky",
						top: 0,
						background: Math.abs(zLook * 100 % 10 / 100 - c) < .005 ? "color-mix(in oklab, var(--stage-accent) 18%, var(--stage-bg))" : "var(--stage-bg)",
						padding: "4px 6px",
						borderBottom: "2px solid var(--stage-grid)",
						color: "var(--stage-muted)"
					},
					children: [".", (c * 100).toFixed(0).padStart(2, "0")]
				}, c))] }) }), /* @__PURE__ */ jsx("tbody", { children: ROWS.map((r) => {
					const rowSel = Math.abs(Math.floor(zLook * 10) / 10 - r) < .005;
					return /* @__PURE__ */ jsxs("tr", {
						ref: rowSel ? selRow : void 0,
						children: [/* @__PURE__ */ jsx("td", {
							style: {
								position: "sticky",
								left: 0,
								background: rowSel ? "color-mix(in oklab, var(--stage-accent) 18%, var(--stage-bg))" : "var(--stage-bg)",
								padding: "3px 6px",
								fontWeight: 700,
								color: "var(--stage-accent)",
								borderRight: "1px solid var(--stage-grid)"
							},
							children: r.toFixed(1)
						}), COLS.map((c) => {
							const cellZ = r + c;
							const sel = Math.abs(cellZ - zLook) < .005;
							return /* @__PURE__ */ jsx("td", {
								onClick: () => pickCell(r, c),
								style: {
									padding: "3px 6px",
									textAlign: "right",
									cursor: "pointer",
									borderBottom: "1px solid color-mix(in oklab, var(--stage-grid) 50%, transparent)",
									background: sel ? "var(--stage-good)" : rowSel ? "color-mix(in oklab, var(--stage-accent) 7%, transparent)" : void 0,
									color: sel ? "white" : "var(--stage-fg)",
									fontWeight: sel ? 800 : 400
								},
								children: f4(normalCdf(cellZ))
							}, c);
						})]
					}, r);
				}) })]
			})
		})
	] });
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt,
		objectives,
		controls: /* @__PURE__ */ jsxs(ControlBar, { children: [/* @__PURE__ */ jsx(Chip, {
			selected: t === "left",
			onClick: () => setT("left"),
			children: "left tail Φ(z)"
		}), /* @__PURE__ */ jsx(Chip, {
			selected: t === "right",
			onClick: () => setT("right"),
			children: "right tail 1−Φ(z)"
		})] }),
		footer: /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsxs("p", {
			style: {
				fontSize: 12,
				color: "var(--stage-muted)",
				marginTop: 6
			},
			children: [
				"The table gives ",
				/* @__PURE__ */ jsx(Tex$1, { tex: "\\\\Phi(z) = P(Z \\\\le z)" }),
				". Row = z to one decimal, column = the hundredths digit. Click a cell to jump there."
			]
		}), /* @__PURE__ */ jsx(HintLadder, { hints })] }),
		children: figure
	});
}

//#endregion
export { ZTableLab };