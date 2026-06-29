'use client';

import { Tex as Tex$1 } from "../../core/tex.mjs";
import { Chip } from "../../kit/controls.mjs";
import { LabFrame } from "../../kit/frame.mjs";
import { HintLadder, RevealSolution, useCheckpoint, useHints } from "../../kit/pedagogy.mjs";
import { CATEGORICAL } from "../../kit/palette.mjs";
import { useMemo, useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
import { compileLogic, cubeCovers, cubeOfSelection, cubeTerm, logicToLatex, minimize, useControlSurface } from "@classytic/stage";

//#region src/discrete/karnaugh/preset.tsx
/**
* KarnaughMapLab, the GENERAL "simplify boolean by eye" tool. A K-map is just a
* truth table re-laid in GRAY-CODE order so that adjacent cells differ in ONE
* variable; circling a power-of-two block of 1s drops the variable that changes
* across it. That is the same "overcount, then correct" move as the rest of the
* pack, a group merges redundant minterms the way ÷k! merges redundant orderings.
*
* Creator declares a `formula` (any 2–4 variable expression) OR explicit
* `minterms` (+ optional `dontCares`). Two modes:
*   • show    , the kernel's minimal cover is drawn as coloured loops + the SOP.
*   • simplify, the learner taps 1-cells to draw their own groups; each is
*                live-validated (legal sub-cube? all ones?) and its product term
*                shown; solved when every 1 is covered, with a "minimal!" bonus.
*
* Minimisation is Quine–McCluskey in the stage logic kernel (`minimize` /
* `cubeOfSelection`), the map only RENDERS what the kernel computes. Groups that
* wrap the map edges render as two (or four) loops, exactly as on paper.
*/
const CS = 50;
const LH = 50, TH = 46;
const PALETTE = CATEGORICAL;
const gray = (i) => i ^ i >> 1;
const bits = (v, n) => v.toString(2).padStart(n, "0");
/** Maximal consecutive runs of sorted indices (wrap shows as two runs, desired). */
function runs(idx) {
	const s = [...idx].sort((a, b) => a - b);
	const out = [];
	let start = s[0], prev = s[0];
	for (let i = 1; i < s.length; i++) {
		if (s[i] === prev + 1) {
			prev = s[i];
			continue;
		}
		out.push([start, prev]);
		start = s[i];
		prev = s[i];
	}
	out.push([start, prev]);
	return out;
}
function KarnaughMapLab({ formula, minterms: mtIn, dontCares: dcIn = [], vars: varsIn, mode = "show", title = "Karnaugh map", prompt, objectives, hints: hintList, controlId }) {
	const model = useMemo(() => {
		let vars;
		let minterms;
		let dontCares = dcIn;
		if (formula) {
			const c = compileLogic(formula);
			if (!c.ok) return { error: c.error };
			vars = c.vars;
			const total = 1 << vars.length;
			minterms = [];
			for (let m = 0; m < total; m++) {
				const env = {};
				vars.forEach((v, i) => {
					env[v] = (m & 1 << vars.length - 1 - i) !== 0;
				});
				if (c.eval(env)) minterms.push(m);
			}
		} else {
			vars = varsIn ?? ["a", "b"];
			minterms = (mtIn ?? []).slice();
		}
		const n = vars.length;
		if (n < 2 || n > 4) return { error: "K-map supports 2–4 variables" };
		const result = minimize({
			minterms,
			vars,
			dontCares
		});
		return {
			vars,
			n,
			minterms,
			dontCares,
			result
		};
	}, [
		formula,
		mtIn,
		dcIn,
		varsIn
	]);
	const hints = useHints(hintList);
	const [selected, setSelected] = useState([]);
	const [groups, setGroups] = useState([]);
	const [revealed, setRevealed] = useState(false);
	if ("error" in model) return /* @__PURE__ */ jsx(LabFrame, {
		title,
		children: /* @__PURE__ */ jsxs("p", {
			style: { color: "var(--stage-bad)" },
			children: ["⚠ ", model.error]
		})
	});
	const { vars, n, minterms, dontCares, result } = model;
	const rowBits = n <= 2 ? 1 : n === 3 ? 1 : 2;
	const colBits = n - rowBits;
	const nRows = 1 << rowBits, nCols = 1 << colBits;
	const oneSet = new Set(minterms);
	const dcSet = new Set(dontCares);
	const rowVars = vars.slice(0, rowBits), colVars = vars.slice(rowBits);
	const mintermAt = (gr, gc) => gray(gr) << colBits | gray(gc);
	const cellOf = (m) => {
		for (let gr = 0; gr < nRows; gr++) for (let gc = 0; gc < nCols; gc++) if (mintermAt(gr, gc) === m) return {
			gr,
			gc
		};
		return {
			gr: 0,
			gc: 0
		};
	};
	const gridW = nCols * CS, gridH = nRows * CS;
	const W = LH + gridW + 16, H = TH + gridH + 16;
	const cellX = (gc) => LH + gc * CS;
	const cellY = (gr) => TH + gr * CS;
	const loopsFor = (cube) => {
		const cells = cubeCovers(cube, n).map(cellOf);
		const rowRuns = runs([...new Set(cells.map((c) => c.gr))]);
		const colRuns = runs([...new Set(cells.map((c) => c.gc))]);
		const out = [];
		for (const [r0, r1] of rowRuns) for (const [c0, c1] of colRuns) out.push({
			x: cellX(c0),
			y: cellY(r0),
			w: (c1 - c0 + 1) * CS,
			h: (r1 - r0 + 1) * CS
		});
		return out;
	};
	const shownGroups = mode === "simplify" ? (revealed ? result.cover : groups).map((cube, i) => ({
		cube,
		color: PALETTE[i % PALETTE.length]
	})) : result.cover.map((cube, i) => ({
		cube,
		color: PALETTE[i % PALETTE.length]
	}));
	const tapCell = (m) => {
		if (mode !== "simplify" || revealed) return;
		if (!oneSet.has(m) && !dcSet.has(m)) return;
		setSelected((s) => s.includes(m) ? s.filter((x) => x !== m) : [...s, m]);
	};
	const currentCube = selected.length ? cubeOfSelection(selected, n) : null;
	const currentValid = currentCube !== null && cubeCovers(currentCube, n).every((m) => oneSet.has(m) || dcSet.has(m));
	const addGroup = () => {
		if (currentValid && currentCube) {
			setGroups((g) => [...g, currentCube]);
			setSelected([]);
		}
	};
	const covered = /* @__PURE__ */ new Set();
	for (const g of groups) for (const m of cubeCovers(g, n)) covered.add(m);
	const allCovered = minterms.every((m) => covered.has(m));
	const minimal = allCovered && groups.length === result.cover.length;
	useCheckpoint({
		solved: mode === "simplify" ? allCovered : false,
		activity: `kmap:${title}`,
		hintsUsed: hints.count,
		score: {
			raw: minimal ? 1 : .85,
			max: 1
		}
	});
	useControlSurface(controlId, {
		reveal: {
			type: "action",
			label: "reveal minimal cover",
			invoke: () => setRevealed(true)
		},
		reset: {
			type: "action",
			label: "clear groups",
			invoke: () => {
				setGroups([]);
				setSelected([]);
				setRevealed(false);
			}
		}
	});
	const TexExpr = ({ expr }) => {
		if (expr === "0" || expr === "1") return /* @__PURE__ */ jsx("b", {
			style: { fontSize: 18 },
			children: expr
		});
		const c = compileLogic(expr.replace(/¬/g, "~"));
		return c.ok ? /* @__PURE__ */ jsx(Tex$1, { tex: logicToLatex(c.ast) }) : /* @__PURE__ */ jsx("span", { children: expr });
	};
	const figure = /* @__PURE__ */ jsxs("svg", {
		viewBox: `0 0 ${W} ${H}`,
		style: {
			width: "100%",
			maxWidth: "100%",
			height: "auto"
		},
		role: "grid",
		"aria-label": `Karnaugh map, ${n} variables (${vars.join(", ")}), ${nRows * nCols} cells, ${minterms.length} one${minterms.length === 1 ? "" : "s"}`,
		children: [
			/* @__PURE__ */ jsx("text", {
				x: LH + gridW / 2,
				y: 16,
				textAnchor: "middle",
				fontSize: 13,
				fontWeight: 700,
				fill: "var(--stage-muted)",
				children: colVars.join("")
			}),
			/* @__PURE__ */ jsx("text", {
				x: 14,
				y: TH + gridH / 2,
				textAnchor: "middle",
				fontSize: 13,
				fontWeight: 700,
				fill: "var(--stage-muted)",
				transform: `rotate(-90 14 ${TH + gridH / 2})`,
				children: rowVars.join("")
			}),
			Array.from({ length: nCols }, (_, gc) => /* @__PURE__ */ jsx("text", {
				x: cellX(gc) + CS / 2,
				y: TH - 8,
				textAnchor: "middle",
				fontSize: 13,
				fontWeight: 700,
				fill: "var(--stage-fg)",
				fontFamily: "ui-monospace, monospace",
				children: bits(gray(gc), colBits)
			}, `ch${gc}`)),
			Array.from({ length: nRows }, (_, gr) => /* @__PURE__ */ jsx("text", {
				x: LH - 10,
				y: cellY(gr) + CS / 2,
				textAnchor: "end",
				dominantBaseline: "central",
				fontSize: 13,
				fontWeight: 700,
				fill: "var(--stage-fg)",
				fontFamily: "ui-monospace, monospace",
				children: bits(gray(gr), rowBits)
			}, `rh${gr}`)),
			Array.from({ length: nRows }, (_, gr) => Array.from({ length: nCols }, (_, gc) => {
				const m = mintermAt(gr, gc);
				const isOne = oneSet.has(m), isDC = dcSet.has(m);
				const sel = mode === "simplify" && selected.includes(m);
				const val = isOne ? "1" : isDC ? "X" : "0";
				const tappable = mode === "simplify" && (isOne || isDC) && !revealed;
				const cellLabel = `minterm ${m}, value ${val}${sel ? ", selected" : ""}`;
				return /* @__PURE__ */ jsxs("g", {
					onClick: () => tapCell(m),
					onKeyDown: tappable ? (e) => {
						if (e.key === "Enter" || e.key === " ") {
							e.preventDefault();
							tapCell(m);
						}
					} : void 0,
					role: tappable ? "button" : "img",
					tabIndex: tappable ? 0 : void 0,
					"aria-label": cellLabel,
					"aria-pressed": tappable ? sel : void 0,
					style: { cursor: tappable ? "pointer" : "default" },
					children: [
						/* @__PURE__ */ jsx("rect", {
							x: cellX(gc),
							y: cellY(gr),
							width: CS,
							height: CS,
							fill: sel ? "color-mix(in oklab, var(--stage-good) 24%, transparent)" : isOne ? "color-mix(in oklab, var(--stage-good) 9%, transparent)" : "var(--stage-bg)",
							stroke: "var(--stage-grid)",
							strokeWidth: 1
						}),
						/* @__PURE__ */ jsx("text", {
							x: cellX(gc) + CS / 2,
							y: cellY(gr) + CS / 2,
							textAnchor: "middle",
							dominantBaseline: "central",
							fontSize: 17,
							fontWeight: 800,
							fill: isOne ? "var(--stage-good)" : isDC ? "var(--stage-warn)" : "var(--stage-muted)",
							style: { pointerEvents: "none" },
							children: val
						}),
						/* @__PURE__ */ jsx("text", {
							x: cellX(gc) + CS - 4,
							y: cellY(gr) + 11,
							textAnchor: "end",
							fontSize: 8.5,
							fill: "var(--stage-muted)",
							style: { pointerEvents: "none" },
							fontFamily: "ui-monospace, monospace",
							children: m
						})
					]
				}, `c${gr}-${gc}`);
			})),
			shownGroups.map(({ cube, color }, gi) => loopsFor(cube).map((r, ri) => {
				const inset = 4 + gi % 3 * 4;
				return /* @__PURE__ */ jsx("rect", {
					x: r.x + inset,
					y: r.y + inset,
					width: r.w - inset * 2,
					height: r.h - inset * 2,
					rx: 12,
					fill: "none",
					stroke: color,
					strokeWidth: 3,
					opacity: .95
				}, `g${gi}-${ri}`);
			})),
			mode === "simplify" && currentCube && currentValid && loopsFor(currentCube).map((r, ri) => /* @__PURE__ */ jsx("rect", {
				x: r.x + 3,
				y: r.y + 3,
				width: r.w - 6,
				height: r.h - 6,
				rx: 12,
				fill: "none",
				stroke: "var(--stage-fg)",
				strokeWidth: 2.5,
				strokeDasharray: "6 5"
			}, `cur${ri}`))
		]
	});
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt,
		objectives,
		aside: /* @__PURE__ */ jsx(Fragment$1, { children: mode === "show" ? /* @__PURE__ */ jsxs(Fragment$1, { children: [
			/* @__PURE__ */ jsx("p", {
				style: {
					fontWeight: 700,
					margin: "0 0 6px"
				},
				children: "Minimal form"
			}),
			/* @__PURE__ */ jsx("div", {
				style: {
					fontSize: 18,
					padding: "8px 12px",
					borderRadius: 10,
					background: "color-mix(in oklab, var(--stage-good) 10%, transparent)"
				},
				children: /* @__PURE__ */ jsx(TexExpr, { expr: result.expression })
			}),
			/* @__PURE__ */ jsxs("p", {
				style: {
					fontSize: 13,
					color: "var(--stage-muted)",
					marginTop: 8
				},
				children: [
					result.cover.length,
					" group",
					result.cover.length === 1 ? "" : "s",
					" cover",
					result.cover.length === 1 ? "s" : "",
					" ",
					minterms.length,
					" one",
					minterms.length === 1 ? "" : "s",
					". Each loop drops the variable that flips across it."
				]
			})
		] }) : /* @__PURE__ */ jsxs(Fragment$1, { children: [
			/* @__PURE__ */ jsx("p", {
				style: {
					fontWeight: 700,
					margin: "0 0 6px"
				},
				children: "Your groups"
			}),
			groups.length === 0 && /* @__PURE__ */ jsx("p", {
				style: {
					fontSize: 13,
					color: "var(--stage-muted)"
				},
				children: "Tap adjacent 1s to draw a group (size 1, 2, 4, 8…). Wrapping around edges is allowed."
			}),
			/* @__PURE__ */ jsx("ul", {
				style: {
					margin: "4px 0",
					paddingLeft: 18
				},
				children: groups.map((g, i) => /* @__PURE__ */ jsx("li", {
					style: { color: PALETTE[i % PALETTE.length] },
					children: /* @__PURE__ */ jsx(TexExpr, { expr: cubeTerm(g, vars) })
				}, i))
			}),
			selected.length > 0 && /* @__PURE__ */ jsxs("div", {
				style: {
					fontSize: 13,
					marginTop: 6
				},
				children: ["Selection: ", currentValid ? /* @__PURE__ */ jsxs(Fragment$1, { children: ["valid group → ", /* @__PURE__ */ jsx("b", { children: /* @__PURE__ */ jsx(TexExpr, { expr: cubeTerm(currentCube, vars) }) })] }) : /* @__PURE__ */ jsx("span", {
					style: { color: "var(--stage-bad)" },
					children: "not a legal group (need a power-of-two block of 1s)"
				})]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "lab-bar",
				style: {
					gap: 8,
					marginTop: 8
				},
				children: [
					/* @__PURE__ */ jsx(Chip, {
						selected: false,
						onClick: addGroup,
						children: "add group"
					}),
					/* @__PURE__ */ jsx(Chip, {
						selected: false,
						onClick: () => setSelected([]),
						children: "clear pick"
					}),
					/* @__PURE__ */ jsx(Chip, {
						selected: false,
						onClick: () => {
							setGroups([]);
							setSelected([]);
							setRevealed(false);
						},
						children: "reset"
					})
				]
			}),
			allCovered && /* @__PURE__ */ jsx("p", {
				className: "lab-pill",
				"data-state": "ok",
				style: { marginTop: 8 },
				children: minimal ? "✓ all ones covered, minimal!" : `✓ covered, but minimal is ${result.cover.length} group${result.cover.length === 1 ? "" : "s"}`
			})
		] }) }),
		footer: /* @__PURE__ */ jsxs(Fragment$1, { children: [mode === "simplify" && /* @__PURE__ */ jsx(RevealSolution, {
			available: !allCovered || !minimal,
			buttonLabel: "Show minimal cover",
			solution: /* @__PURE__ */ jsxs(Fragment$1, { children: [
				"The minimal SOP is ",
				/* @__PURE__ */ jsx(TexExpr, { expr: result.expression }),
				", ",
				result.cover.length,
				" group",
				result.cover.length === 1 ? "" : "s",
				"."
			] }),
			onReveal: () => setRevealed(true)
		}), /* @__PURE__ */ jsx(HintLadder, { hints })] }),
		children: figure
	});
}

//#endregion
export { KarnaughMapLab };