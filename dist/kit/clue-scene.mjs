'use client';

import { jsx, jsxs } from "react/jsx-runtime";

//#region src/kit/clue-scene.tsx
/** Total a clue evaluates to, given the unknowns' answers (kept consistent by construction). */
function clueTotal(clue, unknowns) {
	return clue.coeffs.reduce((s, c, i) => s + c * (unknowns[i]?.answer ?? 0), 0);
}
const chipColor = (u) => u.color ?? "var(--stage-accent)";
/** A coloured token for an unknown (the reusable atom of every scene). */
function UnknownChip({ u, size = 30, withLabel = false }) {
	return /* @__PURE__ */ jsxs("span", {
		style: {
			display: "inline-grid",
			justifyItems: "center",
			gap: 2,
			verticalAlign: "middle"
		},
		children: [/* @__PURE__ */ jsx("span", {
			"aria-label": u.label ?? u.sym,
			style: {
				width: size,
				height: size,
				borderRadius: 8,
				display: "grid",
				placeItems: "center",
				fontSize: size * .6,
				lineHeight: 1,
				background: `color-mix(in oklab, ${chipColor(u)} 22%, transparent)`,
				border: `2px solid ${chipColor(u)}`
			},
			children: u.sym
		}), withLabel && u.label && /* @__PURE__ */ jsx("span", {
			style: {
				fontSize: 10,
				color: "var(--stage-muted)"
			},
			children: u.label
		})]
	});
}
const fmtTotal = (n, currency = "", unit = "") => `${currency}${Math.round(n * 100) / 100}${unit ? " " + unit : ""}`;
/** Tiles: "2▲ + 1● = 12". Universal, reads as the equation it is. */
function ClueTiles({ clue, unknowns, currency, unit }) {
	return /* @__PURE__ */ jsxs("div", {
		style: {
			display: "flex",
			alignItems: "center",
			gap: 8,
			flexWrap: "wrap",
			fontSize: 18,
			fontWeight: 700,
			padding: "8px 12px",
			borderRadius: 12,
			background: "color-mix(in oklab, var(--stage-fg) 5%, transparent)"
		},
		children: [
			clue.coeffs.map((c, i) => ({
				c,
				u: unknowns[i]
			})).filter((t) => t.c !== 0).map((t, i) => /* @__PURE__ */ jsxs("span", {
				style: {
					display: "inline-flex",
					alignItems: "center",
					gap: 4
				},
				children: [
					i > 0 && /* @__PURE__ */ jsx("span", {
						style: {
							color: "var(--stage-muted)",
							margin: "0 2px"
						},
						children: "+"
					}),
					t.c,
					/* @__PURE__ */ jsx(UnknownChip, {
						u: t.u,
						size: 28
					})
				]
			}, i)),
			/* @__PURE__ */ jsx("span", {
				style: { color: "var(--stage-muted)" },
				children: "="
			}),
			/* @__PURE__ */ jsx("strong", { children: fmtTotal(clueTotal(clue, unknowns), currency, unit) })
		]
	});
}
/** Receipt: a shop bill listing quantities and the total (unit prices unknown). */
function ClueReceipt({ clue, unknowns, currency = "$", store = "Receipt" }) {
	const lines = clue.coeffs.map((c, i) => ({
		c,
		u: unknowns[i]
	})).filter((t) => t.c !== 0);
	const row = {
		display: "flex",
		justifyContent: "space-between",
		gap: 16,
		alignItems: "center"
	};
	return /* @__PURE__ */ jsxs("div", {
		style: {
			width: 210,
			padding: 14,
			borderRadius: 12,
			border: "2px solid color-mix(in oklab, var(--stage-fg) 18%, transparent)",
			background: "color-mix(in oklab, var(--stage-fg) 4%, var(--stage-bg))",
			display: "grid",
			gap: 8,
			fontVariantNumeric: "tabular-nums"
		},
		children: [
			/* @__PURE__ */ jsx("div", {
				style: { fontWeight: 800 },
				children: store
			}),
			lines.map((t, i) => /* @__PURE__ */ jsx("div", {
				style: {
					...row,
					color: "var(--stage-muted)"
				},
				children: /* @__PURE__ */ jsxs("span", {
					style: {
						display: "inline-flex",
						alignItems: "center",
						gap: 6
					},
					children: [
						t.c,
						" ",
						/* @__PURE__ */ jsx(UnknownChip, {
							u: t.u,
							size: 22
						}),
						" ",
						t.u.label
					]
				})
			}, i)),
			/* @__PURE__ */ jsx("div", { style: { borderTop: "1px dashed color-mix(in oklab, var(--stage-fg) 30%, transparent)" } }),
			/* @__PURE__ */ jsxs("div", {
				style: {
					...row,
					fontWeight: 800
				},
				children: [/* @__PURE__ */ jsx("span", { children: "Total" }), /* @__PURE__ */ jsx("span", {
					style: { color: "var(--stage-good)" },
					children: fmtTotal(clueTotal(clue, unknowns), currency)
				})]
			})
		]
	});
}
/** Balance: buckets (one per coeff, coloured by type) on the left pan vs a weight on the right. */
function ClueBalance({ clue, unknowns, unit = "kg" }) {
	const W = 240, H = 132;
	const beamY = 34, pivX = W / 2, panY = 70;
	const lpx = pivX - 70, rpx = 190;
	const buckets = [];
	clue.coeffs.forEach((c, i) => {
		for (let k = 0; k < c; k++) buckets.push({
			color: unknowns[i]?.color ?? "var(--stage-accent)",
			sym: unknowns[i]?.sym ?? ""
		});
	});
	const bw = Math.min(26, 110 / Math.max(1, buckets.length));
	const Bucket = ({ x, color, sym }) => {
		const w = bw * .86, h = bw * 1.1, topY = panY - h;
		return /* @__PURE__ */ jsxs("g", { children: [
			/* @__PURE__ */ jsx("path", {
				d: `M ${x - w / 2} ${topY} L ${x - w / 2 + 2} ${panY - 2} L ${x + w / 2 - 2} ${panY - 2} L ${x + w / 2} ${topY} Z`,
				fill: `color-mix(in oklab, ${color} 30%, var(--stage-bg))`,
				stroke: color,
				strokeWidth: 1.6,
				strokeLinejoin: "round"
			}),
			/* @__PURE__ */ jsx("ellipse", {
				cx: x,
				cy: topY,
				rx: w / 2,
				ry: 2.4,
				fill: color,
				fillOpacity: .5
			}),
			/* @__PURE__ */ jsx("text", {
				x,
				y: topY + h * .62,
				fontSize: bw * .5,
				textAnchor: "middle",
				dominantBaseline: "middle",
				children: sym
			})
		] });
	};
	const total = clueTotal(clue, unknowns);
	const bx0 = lpx - (buckets.length - 1) * bw / 2;
	return /* @__PURE__ */ jsxs("svg", {
		width: W,
		height: H,
		viewBox: `0 0 ${W} ${H}`,
		role: "img",
		"aria-label": `balance: ${buckets.length} buckets weigh ${total} ${unit}`,
		children: [
			/* @__PURE__ */ jsx("path", {
				d: `M ${pivX - 12} ${H - 10} L 132 ${H - 10} L ${pivX} 40 Z`,
				fill: "var(--stage-metal, #8a8a8a)"
			}),
			/* @__PURE__ */ jsx("rect", {
				x: pivX - 78,
				y: beamY - 3,
				width: 156,
				height: 6,
				rx: 3,
				fill: "var(--stage-metal, #8a8a8a)"
			}),
			[lpx, rpx].map((px, i) => /* @__PURE__ */ jsxs("g", { children: [/* @__PURE__ */ jsx("line", {
				x1: px,
				y1: beamY,
				x2: px,
				y2: panY,
				stroke: "color-mix(in oklab, var(--stage-fg) 40%, transparent)",
				strokeWidth: 1.5
			}), /* @__PURE__ */ jsx("path", {
				d: `M ${px - 34} ${panY} Q ${px} 84 ${px + 34} ${panY}`,
				fill: "none",
				stroke: "var(--stage-metal, #8a8a8a)",
				strokeWidth: 2.5,
				strokeLinecap: "round"
			})] }, i)),
			buckets.map((b, i) => /* @__PURE__ */ jsx(Bucket, {
				x: bx0 + i * bw,
				color: b.color,
				sym: b.sym
			}, i)),
			/* @__PURE__ */ jsxs("g", { children: [/* @__PURE__ */ jsx("rect", {
				x: rpx - 26,
				y: panY - 34,
				width: 52,
				height: 30,
				rx: 6,
				fill: "var(--stage-bg)",
				stroke: "color-mix(in oklab, var(--stage-fg) 35%, transparent)",
				strokeWidth: 1.5
			}), /* @__PURE__ */ jsxs("text", {
				x: rpx,
				y: panY - 18,
				fontSize: 14,
				fontWeight: 800,
				textAnchor: "middle",
				dominantBaseline: "middle",
				fill: "var(--stage-fg)",
				children: [total, unit ? " " + unit : ""]
			})] })
		]
	});
}
/** Bar model (tape diagram): each clue is one bar of unit cells grouped by unknown = total. */
function ClueBar({ clue, unknowns, currency, unit }) {
	return /* @__PURE__ */ jsxs("div", {
		style: {
			display: "flex",
			alignItems: "center",
			gap: 8,
			padding: "8px 12px",
			borderRadius: 12,
			background: "color-mix(in oklab, var(--stage-fg) 5%, transparent)"
		},
		children: [
			/* @__PURE__ */ jsx("div", {
				style: {
					display: "flex",
					gap: 5
				},
				children: clue.coeffs.map((c, i) => ({
					c,
					u: unknowns[i]
				})).filter((t) => t.c !== 0).map((t, ti) => /* @__PURE__ */ jsx("div", {
					style: { display: "flex" },
					children: Array.from({ length: t.c }).map((_, k) => /* @__PURE__ */ jsx("div", {
						style: {
							width: 30,
							height: 34,
							display: "grid",
							placeItems: "center",
							fontSize: 14,
							background: `color-mix(in oklab, ${chipColor(t.u)} 28%, transparent)`,
							border: `1.5px solid ${chipColor(t.u)}`,
							borderRadius: t.c === 1 ? 8 : k === 0 ? "8px 0 0 8px" : k === t.c - 1 ? "0 8px 8px 0" : 0,
							marginLeft: k > 0 ? -1.5 : 0
						},
						children: t.u.sym
					}, k))
				}, ti))
			}),
			/* @__PURE__ */ jsx("span", {
				style: {
					color: "var(--stage-muted)",
					fontWeight: 700
				},
				children: "="
			}),
			/* @__PURE__ */ jsx("strong", {
				style: {
					fontSize: 16,
					fontVariantNumeric: "tabular-nums"
				},
				children: fmtTotal(clueTotal(clue, unknowns), currency, unit)
			})
		]
	});
}
/** Coin piles: each unknown is a stack of coins (coloured by type) = a money total. */
function ClueCoins({ clue, unknowns, currency = "$" }) {
	return /* @__PURE__ */ jsxs("div", {
		style: {
			display: "flex",
			alignItems: "center",
			gap: 8,
			padding: "8px 12px",
			borderRadius: 12,
			background: "color-mix(in oklab, var(--stage-fg) 5%, transparent)"
		},
		children: [
			clue.coeffs.map((c, i) => ({
				c,
				u: unknowns[i]
			})).filter((t) => t.c !== 0).map((t, ti) => /* @__PURE__ */ jsxs("span", {
				style: {
					display: "inline-flex",
					alignItems: "flex-end",
					gap: 6
				},
				children: [ti > 0 && /* @__PURE__ */ jsx("span", {
					style: {
						color: "var(--stage-muted)",
						fontWeight: 700,
						marginBottom: 8
					},
					children: "+"
				}), /* @__PURE__ */ jsx("span", {
					style: {
						position: "relative",
						width: 30,
						height: 16 + t.c * 7
					},
					children: Array.from({ length: t.c }).map((_, k) => /* @__PURE__ */ jsx("span", {
						style: {
							position: "absolute",
							bottom: k * 7,
							left: 0,
							width: 30,
							height: 16,
							borderRadius: "50%",
							border: `1.5px solid color-mix(in oklab, ${chipColor(t.u)} 65%, black)`,
							background: `radial-gradient(circle at 40% 35%, color-mix(in oklab, ${chipColor(t.u)} 70%, white), ${chipColor(t.u)})`,
							display: "grid",
							placeItems: "center",
							fontSize: 9
						},
						children: t.u.sym
					}, k))
				})]
			}, ti)),
			/* @__PURE__ */ jsx("span", {
				style: {
					color: "var(--stage-muted)",
					fontWeight: 700
				},
				children: "="
			}),
			/* @__PURE__ */ jsx("strong", {
				style: {
					fontSize: 16,
					fontVariantNumeric: "tabular-nums"
				},
				children: fmtTotal(clueTotal(clue, unknowns), currency)
			})
		]
	});
}
const CLUE_REGISTRY = /* @__PURE__ */ new Map();
function registerClueScene(meta) {
	CLUE_REGISTRY.set(meta.name, meta);
}
function getClueScene(name) {
	return CLUE_REGISTRY.get(name);
}
function listClueScenes() {
	return [...CLUE_REGISTRY.values()];
}
registerClueScene({
	name: "tiles",
	label: "Algebra tiles",
	render: (q) => /* @__PURE__ */ jsx(ClueTiles, { ...q })
});
registerClueScene({
	name: "receipt",
	label: "Shop receipt",
	render: (q) => /* @__PURE__ */ jsx(ClueReceipt, { ...q })
});
registerClueScene({
	name: "balance",
	label: "Bucket balance",
	render: (q) => /* @__PURE__ */ jsx(ClueBalance, { ...q })
});
registerClueScene({
	name: "bar",
	label: "Bar model",
	render: (q) => /* @__PURE__ */ jsx(ClueBar, { ...q })
});
registerClueScene({
	name: "coins",
	label: "Coin piles",
	render: (q) => /* @__PURE__ */ jsx(ClueCoins, { ...q })
});
/** Render one clue in the chosen scene (registry name). Creators extend via registerClueScene. */
function ClueScene({ kind, ...rest }) {
	return getClueScene(kind)?.render(rest) ?? /* @__PURE__ */ jsx(ClueTiles, { ...rest });
}

//#endregion
export { ClueBalance, ClueBar, ClueCoins, ClueReceipt, ClueScene, ClueTiles, UnknownChip, clueTotal, getClueScene, listClueScenes, registerClueScene };