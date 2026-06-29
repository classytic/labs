'use client';

import { Fragment, jsx, jsxs } from "react/jsx-runtime";

//#region src/kit/gameshow.tsx
const FG = "var(--stage-fg)";
const METAL = "var(--stage-metal)";
const GOLD = "var(--stage-warn)";
const GOOD = "var(--stage-good)";
const SHEEN = "color-mix(in oklab, var(--stage-sheen, white) 55%, transparent)";
const LEAF = "color-mix(in oklab, var(--stage-accent) 92%, black)";
const RECESS = "color-mix(in oklab, var(--stage-fg) 88%, var(--stage-bg))";
/** A game-show door in box (x,y,w,h). `open` 0→1 swings the leaf aside to reveal
*  `children` (the prize/goat drawn behind). `picked` rings it; `dim` greys it. */
function DoorGlyph({ x, y, w, h, label, open = 0, picked = false, dim = false, children }) {
	const r = Math.min(12, w * .12);
	const inset = Math.max(4, w * .06);
	const ix = x + inset, iy = y + inset, iw = w - inset * 2, ih = h - inset * 2;
	return /* @__PURE__ */ jsxs("g", {
		opacity: dim ? .45 : 1,
		children: [
			/* @__PURE__ */ jsx("rect", {
				x,
				y,
				width: w,
				height: h,
				rx: r,
				fill: METAL
			}),
			/* @__PURE__ */ jsx("rect", {
				x: x + 1.5,
				y: y + 1.5,
				width: w - 3,
				height: h - 3,
				rx: r - 1,
				fill: "none",
				stroke: SHEEN,
				strokeWidth: 1,
				opacity: .4
			}),
			/* @__PURE__ */ jsx("clipPath", {
				id: `door-clip-${label ?? ""}-${x}-${y}`,
				children: /* @__PURE__ */ jsx("rect", {
					x: ix,
					y: iy,
					width: iw,
					height: ih,
					rx: r * .6
				})
			}),
			/* @__PURE__ */ jsxs("g", {
				clipPath: `url(#door-clip-${label ?? ""}-${x}-${y})`,
				children: [
					/* @__PURE__ */ jsx("rect", {
						x: ix,
						y: iy,
						width: iw,
						height: ih,
						rx: r * .6,
						fill: RECESS
					}),
					/* @__PURE__ */ jsx("rect", {
						x: ix,
						y: iy,
						width: iw,
						height: ih * .5,
						fill: "color-mix(in oklab, black 16%, transparent)"
					}),
					children
				]
			}),
			/* @__PURE__ */ jsxs("g", {
				style: {
					transform: `scaleX(${Math.max(.04, 1 - open)})`,
					transformOrigin: `${ix}px ${iy + ih / 2}px`,
					transition: "transform 0.5s cubic-bezier(.4,0,.2,1)"
				},
				children: [
					/* @__PURE__ */ jsx("rect", {
						x: ix,
						y: iy,
						width: iw,
						height: ih,
						rx: r * .6,
						fill: LEAF
					}),
					/* @__PURE__ */ jsx("rect", {
						x: ix + iw * .16,
						y: iy + ih * .08,
						width: iw * .68,
						height: ih * .42,
						rx: 4,
						fill: "none",
						stroke: "color-mix(in oklab, black 22%, transparent)",
						strokeWidth: 2
					}),
					/* @__PURE__ */ jsx("rect", {
						x: ix + iw * .16,
						y: iy + ih * .54,
						width: iw * .68,
						height: ih * .36,
						rx: 4,
						fill: "none",
						stroke: "color-mix(in oklab, black 22%, transparent)",
						strokeWidth: 2
					}),
					/* @__PURE__ */ jsx("path", {
						d: `M${ix + iw * .5},${iy + 2} V${iy + ih - 2}`,
						stroke: SHEEN,
						strokeWidth: 1,
						opacity: .3
					}),
					/* @__PURE__ */ jsx("circle", {
						cx: ix + iw * .84,
						cy: iy + ih * .52,
						r: Math.max(3, w * .05),
						fill: GOLD,
						stroke: "color-mix(in oklab, black 25%, transparent)",
						strokeWidth: 1
					}),
					label != null && /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx("circle", {
						cx: ix + iw * .5,
						cy: iy + ih * .3,
						r: Math.max(11, w * .16),
						fill: GOLD
					}), /* @__PURE__ */ jsx("text", {
						x: ix + iw * .5,
						y: iy + ih * .3,
						textAnchor: "middle",
						dominantBaseline: "central",
						fontSize: Math.max(13, w * .2),
						fontWeight: 800,
						fill: "color-mix(in oklab, black 70%, var(--stage-warn))",
						children: label
					})] })
				]
			}),
			picked && /* @__PURE__ */ jsx("rect", {
				x: x - 3,
				y: y - 3,
				width: w + 6,
				height: h + 6,
				rx: r + 3,
				fill: "none",
				stroke: GOOD,
				strokeWidth: 3.5
			})
		]
	});
}
/** The prize, a shiny car (side view) in box (x,y,w,h). */
function CarGlyph({ x, y, w, h }) {
	const X = (f) => x + w * f, Y = (f) => y + h * f;
	const edge = "color-mix(in oklab, var(--stage-warn) 55%, black)";
	const wheelR = h * .15, wy = Y(.8);
	return /* @__PURE__ */ jsxs("g", { children: [
		/* @__PURE__ */ jsx("path", {
			d: `M${X(.06)},${Y(.66)}
        Q${X(.06)},${Y(.5)} ${X(.16)},${Y(.48)}
        L${X(.3)},${Y(.46)}
        Q${X(.36)},${Y(.26)} ${X(.5)},${Y(.26)}
        L${X(.64)},${Y(.27)}
        Q${X(.72)},${Y(.3)} ${X(.78)},${Y(.47)}
        L${X(.9)},${Y(.5)}
        Q${X(.96)},${Y(.52)} ${X(.96)},${Y(.66)}
        L${X(.94)},${Y(.72)} L${X(.06)},${Y(.72)} Z`,
			fill: GOLD,
			stroke: edge,
			strokeWidth: Math.max(1.5, w * .018),
			strokeLinejoin: "round"
		}),
		/* @__PURE__ */ jsx("path", {
			d: `M${X(.34)},${Y(.45)} Q${X(.39)},${Y(.31)} ${X(.49)},${Y(.31)} L${X(.49)},${Y(.45)} Z`,
			fill: "color-mix(in oklab, var(--stage-bg) 70%, var(--stage-fg))",
			opacity: .85
		}),
		/* @__PURE__ */ jsx("path", {
			d: `M${X(.52)},${Y(.31)} L${X(.62)},${Y(.32)} Q${X(.67)},${Y(.34)} ${X(.71)},${Y(.45)} L${X(.52)},${Y(.45)} Z`,
			fill: "color-mix(in oklab, var(--stage-bg) 70%, var(--stage-fg))",
			opacity: .85
		}),
		/* @__PURE__ */ jsx("path", {
			d: `M${X(.14)},${Y(.56)} L${X(.86)},${Y(.56)}`,
			stroke: SHEEN,
			strokeWidth: h * .03,
			strokeLinecap: "round",
			opacity: .55
		}),
		/* @__PURE__ */ jsx("circle", {
			cx: X(.92),
			cy: Y(.6),
			r: h * .035,
			fill: "white"
		}),
		[.28, .72].map((f) => /* @__PURE__ */ jsxs("g", { children: [
			/* @__PURE__ */ jsx("circle", {
				cx: X(f),
				cy: wy,
				r: wheelR,
				fill: "color-mix(in oklab, var(--stage-fg) 88%, black)"
			}),
			/* @__PURE__ */ jsx("circle", {
				cx: X(f),
				cy: wy,
				r: wheelR * .5,
				fill: METAL
			}),
			/* @__PURE__ */ jsx("circle", {
				cx: X(f),
				cy: wy,
				r: wheelR * .16,
				fill: FG
			})
		] }, f))
	] });
}
/** The booby prize, a goat head in box (x,y,w,h). Big swept horns + beard so it
*  reads as a goat, not a mouse. */
function GoatGlyph({ x, y, w, h }) {
	const X = (f) => x + w * f, Y = (f) => y + h * f;
	const fur = "color-mix(in oklab, var(--stage-muted) 80%, var(--stage-bg))";
	const dark = "color-mix(in oklab, var(--stage-muted) 45%, black)";
	const horn = "color-mix(in oklab, var(--stage-muted) 30%, black)";
	const hw = Math.max(4, w * .07);
	return /* @__PURE__ */ jsxs("g", { children: [
		/* @__PURE__ */ jsx("path", {
			d: `M${X(.4)},${Y(.28)} C${X(.3)},${Y(.16)} ${X(.18)},${Y(.1)} ${X(.1)},${Y(.16)}`,
			fill: "none",
			stroke: horn,
			strokeWidth: hw,
			strokeLinecap: "round"
		}),
		/* @__PURE__ */ jsx("path", {
			d: `M${X(.6)},${Y(.28)} C${X(.7)},${Y(.16)} ${X(.82)},${Y(.1)} ${X(.9)},${Y(.16)}`,
			fill: "none",
			stroke: horn,
			strokeWidth: hw,
			strokeLinecap: "round"
		}),
		/* @__PURE__ */ jsx("path", {
			d: `M${X(.3)},${Y(.4)} Q${X(.12)},${Y(.46)} ${X(.16)},${Y(.6)} Q${X(.28)},${Y(.56)} ${X(.34)},${Y(.48)} Z`,
			fill: dark
		}),
		/* @__PURE__ */ jsx("path", {
			d: `M${X(.7)},${Y(.4)} Q${X(.88)},${Y(.46)} ${X(.84)},${Y(.6)} Q${X(.72)},${Y(.56)} ${X(.66)},${Y(.48)} Z`,
			fill: dark
		}),
		/* @__PURE__ */ jsx("path", {
			d: `M${X(.36)},${Y(.34)} Q${X(.5)},${Y(.28)} ${X(.64)},${Y(.34)} L${X(.6)},${Y(.74)} Q${X(.5)},${Y(.86)} ${X(.4)},${Y(.74)} Z`,
			fill: fur,
			stroke: dark,
			strokeWidth: 1.5,
			strokeLinejoin: "round"
		}),
		/* @__PURE__ */ jsx("ellipse", {
			cx: X(.5),
			cy: Y(.7),
			rx: w * .1,
			ry: h * .08,
			fill: dark,
			opacity: .35
		}),
		/* @__PURE__ */ jsx("ellipse", {
			cx: X(.43),
			cy: Y(.48),
			rx: w * .045,
			ry: h * .035,
			fill: "white"
		}),
		/* @__PURE__ */ jsx("ellipse", {
			cx: X(.57),
			cy: Y(.48),
			rx: w * .045,
			ry: h * .035,
			fill: "white"
		}),
		/* @__PURE__ */ jsx("rect", {
			x: X(.43) - w * .03,
			y: Y(.48) - h * .008,
			width: w * .06,
			height: h * .016,
			rx: 1,
			fill: FG
		}),
		/* @__PURE__ */ jsx("rect", {
			x: X(.57) - w * .03,
			y: Y(.48) - h * .008,
			width: w * .06,
			height: h * .016,
			rx: 1,
			fill: FG
		}),
		/* @__PURE__ */ jsx("circle", {
			cx: X(.46),
			cy: Y(.71),
			r: Math.max(1.2, w * .018),
			fill: dark
		}),
		/* @__PURE__ */ jsx("circle", {
			cx: X(.54),
			cy: Y(.71),
			r: Math.max(1.2, w * .018),
			fill: dark
		}),
		/* @__PURE__ */ jsx("path", {
			d: `M${X(.42)},${Y(.8)} Q${X(.5)},${Y(1.02)} ${X(.58)},${Y(.8)} Q${X(.5)},${Y(.88)} ${X(.42)},${Y(.8)} Z`,
			fill: fur,
			stroke: dark,
			strokeWidth: 1
		})
	] });
}

//#endregion
export { CarGlyph, DoorGlyph, GoatGlyph };