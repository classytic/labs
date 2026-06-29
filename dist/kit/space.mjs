'use client';

import { useId } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { fmt, useCoords } from "@classytic/stage";

//#region src/kit/space.tsx
/**
* Space glyph kit, Earth, Sun and a satellite, drawn in the stage's pixel frame
* (project the world centre, then size everything off the px radius so the glyph
* is crisp at any zoom). Kurzgesagt-style: radial body gradient + a rim shadow
* for spherical depth + a top-left specular highlight, the technique borrowed from
* my-video's EarthIcon. Gradient ids are made unique per instance so multiple
* glyphs on one Stage don't collide.
*
* These are decorative (pointer-events:none), drop a draggable MovableDot on top
* if the body needs to be grabbed.
*/
/** Earth, blue oceans, a few green landmasses, ice caps, rim + shine + atmosphere. */
function EarthGlyph({ center, r, atmosphere = true }) {
	const c = useCoords();
	const [cx, cy] = c.toPx(center.x, center.y);
	const R = c.sx(r);
	const uid = useId().replace(/:/g, "");
	const land = `url(#${uid}-land)`;
	return /* @__PURE__ */ jsxs("g", {
		style: { pointerEvents: "none" },
		children: [
			/* @__PURE__ */ jsxs("defs", { children: [
				/* @__PURE__ */ jsxs("radialGradient", {
					id: `${uid}-ocean`,
					cx: "40%",
					cy: "35%",
					r: "65%",
					children: [
						/* @__PURE__ */ jsx("stop", {
							offset: "0%",
							stopColor: "#60A5FA"
						}),
						/* @__PURE__ */ jsx("stop", {
							offset: "40%",
							stopColor: "#3B82F6"
						}),
						/* @__PURE__ */ jsx("stop", {
							offset: "100%",
							stopColor: "#1E3A5F"
						})
					]
				}),
				/* @__PURE__ */ jsxs("linearGradient", {
					id: `${uid}-land`,
					x1: "0",
					y1: "0",
					x2: "0",
					y2: "1",
					children: [/* @__PURE__ */ jsx("stop", {
						offset: "0%",
						stopColor: "#4ADE80"
					}), /* @__PURE__ */ jsx("stop", {
						offset: "100%",
						stopColor: "#15803D"
					})]
				}),
				/* @__PURE__ */ jsxs("radialGradient", {
					id: `${uid}-rim`,
					cx: "50%",
					cy: "50%",
					r: "50%",
					children: [/* @__PURE__ */ jsx("stop", {
						offset: "68%",
						stopColor: "rgba(0,0,0,0)"
					}), /* @__PURE__ */ jsx("stop", {
						offset: "100%",
						stopColor: "rgba(0,0,0,0.4)"
					})]
				}),
				/* @__PURE__ */ jsxs("radialGradient", {
					id: `${uid}-shine`,
					cx: "32%",
					cy: "28%",
					r: "42%",
					children: [/* @__PURE__ */ jsx("stop", {
						offset: "0%",
						stopColor: "rgba(255,255,255,0.4)"
					}), /* @__PURE__ */ jsx("stop", {
						offset: "100%",
						stopColor: "rgba(255,255,255,0)"
					})]
				}),
				/* @__PURE__ */ jsx("clipPath", {
					id: `${uid}-clip`,
					children: /* @__PURE__ */ jsx("circle", {
						cx: fmt(cx),
						cy: fmt(cy),
						r: fmt(R)
					})
				})
			] }),
			atmosphere && /* @__PURE__ */ jsx("circle", {
				cx: fmt(cx),
				cy: fmt(cy),
				r: fmt(R + R * .1),
				fill: "none",
				stroke: "#93C5FD",
				strokeWidth: fmt(R * .06),
				opacity: .25
			}),
			/* @__PURE__ */ jsx("circle", {
				cx: fmt(cx),
				cy: fmt(cy),
				r: fmt(R),
				fill: `url(#${uid}-ocean)`
			}),
			/* @__PURE__ */ jsxs("g", {
				clipPath: `url(#${uid}-clip)`,
				children: [
					/* @__PURE__ */ jsx("path", {
						d: `M ${fmt(cx - R * .5)} ${fmt(cy - R * .45)} q ${fmt(R * .3)} ${fmt(-R * .15)} ${fmt(R * .5)} ${fmt(R * .1)} q ${fmt(R * .1)} ${fmt(R * .3)} ${fmt(-R * .15)} ${fmt(R * .4)} q ${fmt(-R * .35)} ${fmt(R * .1)} ${fmt(-R * .45)} ${fmt(-R * .2)} Z`,
						fill: land,
						opacity: .88
					}),
					/* @__PURE__ */ jsx("path", {
						d: `M ${fmt(cx + R * .05)} ${fmt(cy - R * .1)} q ${fmt(R * .3)} ${fmt(-R * .05)} ${fmt(R * .4)} ${fmt(R * .25)} q ${fmt(-R * .05)} ${fmt(R * .45)} ${fmt(-R * .3)} ${fmt(R * .5)} q ${fmt(-R * .25)} ${fmt(-R * .1)} ${fmt(-R * .1)} ${fmt(-R * .7)} Z`,
						fill: land,
						opacity: .82
					}),
					/* @__PURE__ */ jsx("ellipse", {
						cx: fmt(cx),
						cy: fmt(cy - R * .92),
						rx: fmt(R * .6),
						ry: fmt(R * .16),
						fill: "#E2E8F0",
						opacity: .35
					}),
					/* @__PURE__ */ jsx("ellipse", {
						cx: fmt(cx),
						cy: fmt(cy + R * .92),
						rx: fmt(R * .66),
						ry: fmt(R * .18),
						fill: "#F1F5F9",
						opacity: .4
					})
				]
			}),
			/* @__PURE__ */ jsx("circle", {
				cx: fmt(cx),
				cy: fmt(cy),
				r: fmt(R),
				fill: `url(#${uid}-rim)`
			}),
			/* @__PURE__ */ jsx("circle", {
				cx: fmt(cx),
				cy: fmt(cy),
				r: fmt(R),
				fill: `url(#${uid}-shine)`
			})
		]
	});
}
/** Sun, glowing core with a corona of rays. */
function SunGlyph({ center, r }) {
	const c = useCoords();
	const [cx, cy] = c.toPx(center.x, center.y);
	const R = c.sx(r);
	const uid = useId().replace(/:/g, "");
	const rays = Array.from({ length: 12 }, (_, i) => {
		const a = i * Math.PI / 6;
		return {
			x1: fmt(cx + Math.cos(a) * R * 1.15),
			y1: fmt(cy + Math.sin(a) * R * 1.15),
			x2: fmt(cx + Math.cos(a) * R * 1.5),
			y2: fmt(cy + Math.sin(a) * R * 1.5)
		};
	});
	return /* @__PURE__ */ jsxs("g", {
		style: { pointerEvents: "none" },
		children: [
			/* @__PURE__ */ jsxs("defs", { children: [/* @__PURE__ */ jsxs("radialGradient", {
				id: `${uid}-core`,
				cx: "42%",
				cy: "38%",
				r: "60%",
				children: [
					/* @__PURE__ */ jsx("stop", {
						offset: "0%",
						stopColor: "#FEF9C3"
					}),
					/* @__PURE__ */ jsx("stop", {
						offset: "45%",
						stopColor: "#FDB813"
					}),
					/* @__PURE__ */ jsx("stop", {
						offset: "100%",
						stopColor: "#F97316"
					})
				]
			}), /* @__PURE__ */ jsxs("radialGradient", {
				id: `${uid}-glow`,
				cx: "50%",
				cy: "50%",
				r: "50%",
				children: [
					/* @__PURE__ */ jsx("stop", {
						offset: "55%",
						stopColor: "rgba(253,184,19,0)"
					}),
					/* @__PURE__ */ jsx("stop", {
						offset: "80%",
						stopColor: "rgba(253,184,19,0.25)"
					}),
					/* @__PURE__ */ jsx("stop", {
						offset: "100%",
						stopColor: "rgba(253,184,19,0)"
					})
				]
			})] }),
			/* @__PURE__ */ jsx("circle", {
				cx: fmt(cx),
				cy: fmt(cy),
				r: fmt(R * 1.8),
				fill: `url(#${uid}-glow)`
			}),
			rays.map((p, i) => /* @__PURE__ */ jsx("line", {
				x1: p.x1,
				y1: p.y1,
				x2: p.x2,
				y2: p.y2,
				stroke: "#FDB813",
				strokeWidth: fmt(R * .14),
				strokeLinecap: "round",
				opacity: .75
			}, i)),
			/* @__PURE__ */ jsx("circle", {
				cx: fmt(cx),
				cy: fmt(cy),
				r: fmt(R),
				fill: `url(#${uid}-core)`
			}),
			/* @__PURE__ */ jsx("circle", {
				cx: fmt(cx - R * .3),
				cy: fmt(cy - R * .32),
				r: fmt(R * .32),
				fill: "rgba(255,255,255,0.45)"
			})
		]
	});
}
/** Satellite, a body with two solar-panel wings and a dish. */
function SatelliteGlyph({ center, size, tilt = -.4 }) {
	const c = useCoords();
	const [cx, cy] = c.toPx(center.x, center.y);
	const s = c.sx(size);
	const deg = tilt * 180 / Math.PI;
	return /* @__PURE__ */ jsxs("g", {
		style: { pointerEvents: "none" },
		transform: `translate(${fmt(cx)},${fmt(cy)}) rotate(${fmt(deg)})`,
		children: [
			/* @__PURE__ */ jsx("rect", {
				x: fmt(-s * 2.1),
				y: fmt(-s * .55),
				width: fmt(s * 1.3),
				height: fmt(s * 1.1),
				rx: fmt(s * .1),
				fill: "#2563EB",
				stroke: "#1E3A8A",
				strokeWidth: fmt(s * .08)
			}),
			/* @__PURE__ */ jsx("rect", {
				x: fmt(s * .8),
				y: fmt(-s * .55),
				width: fmt(s * 1.3),
				height: fmt(s * 1.1),
				rx: fmt(s * .1),
				fill: "#2563EB",
				stroke: "#1E3A8A",
				strokeWidth: fmt(s * .08)
			}),
			/* @__PURE__ */ jsx("line", {
				x1: fmt(-s * .8),
				y1: 0,
				x2: fmt(-s * .45),
				y2: 0,
				stroke: "#94A3B8",
				strokeWidth: fmt(s * .1)
			}),
			/* @__PURE__ */ jsx("line", {
				x1: fmt(s * .45),
				y1: 0,
				x2: fmt(s * .8),
				y2: 0,
				stroke: "#94A3B8",
				strokeWidth: fmt(s * .1)
			}),
			/* @__PURE__ */ jsx("rect", {
				x: fmt(-s * .5),
				y: fmt(-s * .6),
				width: fmt(s),
				height: fmt(s * 1.2),
				rx: fmt(s * .14),
				fill: "#E5E7EB",
				stroke: "#9CA3AF",
				strokeWidth: fmt(s * .08)
			}),
			/* @__PURE__ */ jsx("ellipse", {
				cx: 0,
				cy: fmt(-s * .8),
				rx: fmt(s * .42),
				ry: fmt(s * .18),
				fill: "#F8FAFC",
				stroke: "#9CA3AF",
				strokeWidth: fmt(s * .06)
			}),
			/* @__PURE__ */ jsx("line", {
				x1: 0,
				y1: fmt(-s * .6),
				x2: 0,
				y2: fmt(-s * .82),
				stroke: "#9CA3AF",
				strokeWidth: fmt(s * .06)
			})
		]
	});
}

//#endregion
export { EarthGlyph, SatelliteGlyph, SunGlyph };