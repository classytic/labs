'use client';

import { toRad } from "../../core/util.mjs";
import { CheckButton, Chip, Slider, StatusPill } from "../../kit/controls.mjs";
import { Control, ControlBar, Field, LabFrame, LiveRegion } from "../../kit/frame.mjs";
import { useCheckpoint } from "../../kit/pedagogy.mjs";
import { AngleArc, RightAngleMark } from "../../kit/diagram.mjs";
import { useReducedMotion } from "../../kit/anim.mjs";
import { useRef, useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
import { Label, Polygon, Segment, Stage, Vector, useFrameLoop, useInView } from "@classytic/stage";

//#region src/physics/ramp-forces/preset.tsx
/**
* RampForcesLab, "Tilt the Ramp", where gravity gets a share (F = ma) AND you
* can push/pull the crate.
*
* Tilt the incline and the weight SPLITS into a down-slope share (mg sinθ) and a
* press-in share (mg cosθ = the normal N, which visibly shrinks as you tilt, the
* headline misconception). Add an applied force (push up-slope / pull down) and
* watch the SUM of forces: static friction holds it (adjusting up to μs·N) until
* the drive exceeds that grip, then kinetic friction (μk·N, weaker) takes over
* and it accelerates, a = net/m. A force-ledger bar shows every along-slope
* force adding to the net, so "the forces add up" is visual, not just stated.
*
* Up-slope is the POSITIVE axis throughout. Tokenized SVG; reuses the diagram kit;
* honours prefers-reduced-motion.
*/
const L = 4.2;
const HS = .52;
const WLEN = 2.4;
const LANE = .17;
const C_MG = "var(--stage-fg)";
const C_N = "var(--stage-accent-2)";
const C_FRIC = "var(--stage-warn)";
const C_GRAV = "color-mix(in oklab, var(--stage-fg) 50%, transparent)";
const C_APPLIED = "var(--stage-accent)";
const C_NET = "var(--stage-good)";
/** One signed force bar on the along-slope ledger (left = down-slope, right = up). */
function LedgerBar({ label, v, max, color, bold }) {
	const pct = Math.min(50, Math.abs(v) / (max || 1) * 50);
	const up = v >= 0;
	return /* @__PURE__ */ jsxs("div", {
		style: {
			display: "flex",
			alignItems: "center",
			gap: 8,
			fontSize: 12
		},
		children: [
			/* @__PURE__ */ jsx("span", {
				style: {
					width: 78,
					color: "var(--stage-muted)",
					fontWeight: bold ? 700 : 500
				},
				children: label
			}),
			/* @__PURE__ */ jsxs("div", {
				style: {
					position: "relative",
					flex: 1,
					height: bold ? 16 : 12
				},
				children: [/* @__PURE__ */ jsx("div", { style: {
					position: "absolute",
					left: "50%",
					top: -2,
					bottom: -2,
					width: 1,
					background: "var(--stage-grid)"
				} }), /* @__PURE__ */ jsx("div", { style: {
					position: "absolute",
					top: 1,
					bottom: 1,
					[up ? "left" : "right"]: "50%",
					width: `${pct}%`,
					background: color,
					borderRadius: 3,
					opacity: bold ? 1 : .85
				} })]
			}),
			/* @__PURE__ */ jsxs("span", {
				style: {
					width: 60,
					textAlign: "right",
					fontVariantNumeric: "tabular-nums",
					fontWeight: bold ? 700 : 600
				},
				children: [
					Math.abs(v) < .5 ? "0" : Math.abs(v).toFixed(0),
					"N",
					Math.abs(v) < .5 ? "" : up ? " ↑" : " ↓"
				]
			})
		]
	});
}
function RampForcesLab({ angleDeg = 25, mass = 2, friction = .4, frictionKinetic = .3, appliedN = 0, g = 9.8, showComponents = false, title = "Tilt the Ramp: split the weight, add a push, sum the forces", prompt = "Tilt it, then push or pull: static friction holds until the forces win, then it slides at a = net/m.", objectives, controlConfig }) {
	const [deg, setDeg] = useState(angleDeg);
	const [mus, setMus] = useState(friction);
	const [mukRaw, setMuk] = useState(frictionKinetic);
	const [m, setM] = useState(mass);
	const [applied, setApplied] = useState(appliedN);
	const [comps, setComps] = useState(showComponents);
	const [p, setP] = useState(.55);
	const [sliding, setSliding] = useState(false);
	const [landed, setLanded] = useState(false);
	const startRef = useRef(null);
	const p0 = useRef(.55);
	const reduce = useReducedMotion();
	const { ref: viewRef, inView } = useInView();
	useCheckpoint({
		solved: landed,
		activity: "ramp-forces"
	});
	const th = toRad(deg);
	const cos = Math.cos(th), sin = Math.sin(th);
	const muk = Math.min(mukRaw, mus);
	const W = m * g, N = m * g * cos;
	const gravAlong = m * g * sin;
	const drive = applied - gravAlong;
	const fsMax = mus * N;
	const held = Math.abs(drive) <= fsMax + 1e-9;
	const fk = muk * N;
	const frictionUp = held ? -drive : drive > 0 ? -fk : fk;
	const net = drive + frictionUp;
	const aSigned = net / m;
	const a = Math.abs(aSigned);
	const slidesUp = net > 0;
	const ledgerMax = Math.max(gravAlong, Math.abs(applied), Math.abs(frictionUp), Math.abs(net), 1);
	const Ctop = {
		x: L * cos,
		y: L * sin
	};
	const baseCorner = {
		x: L * cos,
		y: 0
	};
	const u = {
		x: cos,
		y: sin
	};
	const nrm = {
		x: -sin,
		y: cos
	};
	const dn = {
		x: -cos,
		y: -sin
	};
	const surf = {
		x: p * Ctop.x,
		y: p * Ctop.y
	};
	const O = {
		x: surf.x + nrm.x * HS,
		y: surf.y + nrm.y * HS
	};
	const sc = WLEN / (W || 1);
	const arrow = (dir, mag) => ({
		x: dir.x * mag * sc,
		y: dir.y * mag * sc
	});
	const add = (p1, p2) => ({
		x: p1.x + p2.x,
		y: p1.y + p2.y
	});
	const lane = (k) => ({
		x: O.x + nrm.x * LANE * k,
		y: O.y + nrm.y * LANE * k
	});
	const beyond = (tip, dir, off = 15) => {
		const d = Math.hypot(dir.x, dir.y) || 1;
		return {
			x: tip.x,
			y: tip.y,
			dx: dir.x / d * off,
			dy: -dir.y / d * off
		};
	};
	const crate = [
		{
			x: O.x - HS * u.x - HS * nrm.x,
			y: O.y - HS * u.y - HS * nrm.y
		},
		{
			x: O.x + HS * u.x - HS * nrm.x,
			y: O.y + HS * u.y - HS * nrm.y
		},
		{
			x: O.x + HS * u.x + HS * nrm.x,
			y: O.y + HS * u.y + HS * nrm.y
		},
		{
			x: O.x - HS * u.x + HS * nrm.x,
			y: O.y - HS * u.y + HS * nrm.y
		}
	];
	const mgTip = {
		x: O.x,
		y: O.y - WLEN
	};
	const nTip = add(surf, arrow(nrm, N));
	const appDir = applied >= 0 ? u : dn;
	const appTail = lane(1);
	const appTip = add(appTail, arrow(appDir, Math.abs(applied)));
	const fricDir = frictionUp >= 0 ? u : dn;
	const fricTail = lane(-1);
	const fricTip = add(fricTail, arrow(fricDir, Math.abs(frictionUp)));
	const gravTip = add(O, arrow(dn, gravAlong));
	useFrameLoop((f) => {
		if (startRef.current === null) startRef.current = f.timeMs;
		const t = (f.timeMs - startRef.current) / 1e3;
		const np = p0.current + .5 * aSigned * t * t / L;
		if (np <= 0 || np >= 1) {
			setP(Math.max(0, Math.min(1, np)));
			setSliding(false);
			setLanded(true);
		} else setP(np);
	}, { running: sliding && inView });
	const release = () => {
		if (held) return;
		p0.current = p;
		startRef.current = null;
		if (reduce) {
			setP(slidesUp ? 1 : 0);
			setLanded(true);
			return;
		}
		setSliding(true);
	};
	const reset = (set) => (n) => {
		set(n);
		setSliding(false);
		setP(.55);
		p0.current = .55;
		setLanded(false);
	};
	const figure = /* @__PURE__ */ jsx("div", {
		ref: viewRef,
		className: "lab-playwrap",
		style: {
			borderRadius: 14,
			overflow: "hidden",
			background: "var(--stage-bg)",
			border: "1px solid var(--stage-grid)"
		},
		children: /* @__PURE__ */ jsxs(Stage, {
			view: {
				xMin: -2,
				xMax: 8.1,
				yMin: -3.2,
				yMax: 5.2
			},
			height: 300,
			preserveAspect: true,
			ariaLabel: `Ramp at ${deg} degrees, applied force ${applied} newtons; ${held ? "held by friction" : `sliding ${slidesUp ? "up" : "down"} at ${a.toFixed(1)} metres per second squared`}`,
			children: [
				/* @__PURE__ */ jsx(Segment, {
					from: {
						x: -3,
						y: 0
					},
					to: {
						x: 5.2,
						y: 0
					},
					color: "var(--stage-fg)",
					opacity: .5,
					weight: 2
				}),
				/* @__PURE__ */ jsx(Polygon, {
					points: [
						{
							x: 0,
							y: 0
						},
						baseCorner,
						Ctop
					],
					color: "var(--stage-metal)",
					fill: "var(--stage-metal)",
					fillOpacity: .16,
					weight: 2
				}),
				/* @__PURE__ */ jsx(AngleArc, {
					at: {
						x: 0,
						y: 0
					},
					from: {
						x: 1,
						y: 0
					},
					to: u,
					rPx: 30,
					label: `${deg}°`,
					color: "var(--stage-fg)"
				}),
				/* @__PURE__ */ jsx(Polygon, {
					points: crate,
					color: "color-mix(in oklab, var(--stage-accent-2) 60%, black)",
					fill: "var(--stage-accent-2)",
					fillOpacity: .9,
					weight: 1.5
				}),
				/* @__PURE__ */ jsx(Vector, {
					tail: O,
					tip: mgTip,
					color: C_MG,
					weight: 2.5
				}),
				/* @__PURE__ */ jsx(Label, {
					...beyond(mgTip, {
						x: 0,
						y: -1
					}),
					text: `mg ${W.toFixed(0)}N`,
					color: C_MG,
					size: 11
				}),
				/* @__PURE__ */ jsx(Vector, {
					tail: surf,
					tip: nTip,
					color: C_N,
					weight: 2.5
				}),
				/* @__PURE__ */ jsx(Label, {
					...beyond(nTip, nrm),
					text: comps ? `N = mg cosθ ${N.toFixed(0)}N` : `N ${N.toFixed(0)}N`,
					color: C_N,
					size: 11
				}),
				comps && gravAlong > .5 && /* @__PURE__ */ jsxs(Fragment$1, { children: [
					/* @__PURE__ */ jsx(Vector, {
						tail: O,
						tip: gravTip,
						color: C_GRAV,
						weight: 2.5
					}),
					/* @__PURE__ */ jsx(Label, {
						...beyond(gravTip, dn),
						text: `mg sinθ ${gravAlong.toFixed(0)}N`,
						color: C_GRAV,
						size: 11
					}),
					/* @__PURE__ */ jsx(RightAngleMark, {
						at: surf,
						u,
						v: nrm
					})
				] }),
				Math.abs(frictionUp) > .5 && /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx(Vector, {
					tail: fricTail,
					tip: fricTip,
					color: C_FRIC,
					weight: 2.5
				}), /* @__PURE__ */ jsx(Label, {
					...beyond(fricTip, fricDir),
					text: `${held ? "fₛ" : "fₖ"} ${Math.abs(frictionUp).toFixed(0)}N`,
					color: C_FRIC,
					size: 11
				})] }),
				Math.abs(applied) > .5 && /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx(Vector, {
					tail: appTail,
					tip: appTip,
					color: C_APPLIED,
					weight: 3
				}), /* @__PURE__ */ jsx(Label, {
					...beyond(appTip, appDir),
					text: `push ${Math.abs(applied).toFixed(0)}N`,
					color: C_APPLIED,
					size: 11
				})] })
			]
		})
	});
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt,
		objectives,
		aside: /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsxs("div", {
			style: {
				padding: "10px 12px",
				borderRadius: 12,
				border: "1px solid var(--stage-grid)",
				background: "color-mix(in oklab, var(--stage-fg) 3%, transparent)"
			},
			children: [/* @__PURE__ */ jsxs("div", {
				style: {
					display: "flex",
					justifyContent: "space-between",
					fontSize: 11,
					color: "var(--stage-muted)",
					marginBottom: 6
				},
				children: [
					/* @__PURE__ */ jsx("span", { children: "← down-slope" }),
					/* @__PURE__ */ jsx("span", { children: "sum of forces along the ramp" }),
					/* @__PURE__ */ jsx("span", { children: "up-slope →" })
				]
			}), /* @__PURE__ */ jsxs("div", {
				style: {
					display: "flex",
					flexDirection: "column",
					gap: 5
				},
				children: [
					/* @__PURE__ */ jsx(LedgerBar, {
						label: "gravity",
						v: -gravAlong,
						max: ledgerMax,
						color: C_GRAV
					}),
					/* @__PURE__ */ jsx(LedgerBar, {
						label: "applied",
						v: applied,
						max: ledgerMax,
						color: C_APPLIED
					}),
					/* @__PURE__ */ jsx(LedgerBar, {
						label: held ? "friction (static)" : "friction (kinetic)",
						v: frictionUp,
						max: ledgerMax,
						color: C_FRIC
					}),
					/* @__PURE__ */ jsx(LedgerBar, {
						label: "= net",
						v: held ? 0 : net,
						max: ledgerMax,
						color: held ? "var(--stage-good)" : C_NET,
						bold: true
					})
				]
			})]
		}), /* @__PURE__ */ jsx(LiveRegion, { children: `At ${deg} degrees with ${applied} newtons applied: net ${held ? 0 : net.toFixed(0)} newtons, ${held ? "held by friction" : `slides ${slidesUp ? "up" : "down"} at ${a.toFixed(1)} metres per second squared`}.` })] }),
		controls: /* @__PURE__ */ jsxs(Fragment$1, { children: [
			/* @__PURE__ */ jsxs(ControlBar, { children: [
				/* @__PURE__ */ jsx(Control, {
					name: "release",
					children: /* @__PURE__ */ jsx(CheckButton, {
						onClick: release,
						disabled: held,
						children: "▶ Release"
					})
				}),
				/* @__PURE__ */ jsx(Control, {
					name: "components",
					children: /* @__PURE__ */ jsx(Chip, {
						selected: comps,
						onClick: () => setComps((c) => !c),
						children: "components"
					})
				}),
				/* @__PURE__ */ jsx(StatusPill, {
					ok: !held,
					children: held ? "balanced, friction holds it" : `slides ${slidesUp ? "up" : "down"} · a = ${a.toFixed(1)} m/s²`
				}),
				/* @__PURE__ */ jsxs("span", {
					style: {
						marginLeft: "auto",
						display: "inline-flex",
						gap: 14,
						fontVariantNumeric: "tabular-nums",
						fontWeight: 600
					},
					children: [/* @__PURE__ */ jsxs("span", {
						style: { color: C_N },
						children: ["N ", N.toFixed(0)]
					}), /* @__PURE__ */ jsxs("span", {
						style: { color: C_FRIC },
						children: ["fₛ max ", fsMax.toFixed(0)]
					})]
				})
			] }),
			/* @__PURE__ */ jsxs(ControlBar, { children: [
				/* @__PURE__ */ jsx(Field, {
					label: "angle",
					name: "angle",
					value: `${deg}°`,
					children: /* @__PURE__ */ jsx(Slider, {
						value: deg,
						min: 0,
						max: 75,
						step: 1,
						onChange: reset(setDeg),
						ariaLabel: "incline angle (degrees)"
					})
				}),
				/* @__PURE__ */ jsx(Field, {
					label: "push",
					name: "push",
					value: applied === 0 ? "0" : `${Math.abs(applied)}N ${applied > 0 ? "↑" : "↓"}`,
					children: /* @__PURE__ */ jsx(Slider, {
						value: applied,
						min: -30,
						max: 30,
						step: 1,
						onChange: reset(setApplied),
						ariaLabel: "applied force along the slope (newtons; positive up)"
					})
				}),
				/* @__PURE__ */ jsx(Field, {
					label: "mass",
					name: "mass",
					value: `${m} kg`,
					children: /* @__PURE__ */ jsx(Slider, {
						value: m,
						min: 1,
						max: 10,
						step: .5,
						onChange: reset(setM),
						ariaLabel: "crate mass (kg)"
					})
				})
			] }),
			/* @__PURE__ */ jsxs(ControlBar, { children: [/* @__PURE__ */ jsx(Field, {
				label: "μₛ static",
				name: "frictionStatic",
				value: mus.toFixed(2),
				children: /* @__PURE__ */ jsx(Slider, {
					value: mus,
					min: 0,
					max: 1,
					step: .05,
					onChange: reset(setMus),
					ariaLabel: "static friction coefficient"
				})
			}), /* @__PURE__ */ jsx(Field, {
				label: "μₖ kinetic",
				name: "frictionKinetic",
				value: muk.toFixed(2),
				children: /* @__PURE__ */ jsx(Slider, {
					value: mukRaw,
					min: 0,
					max: 1,
					step: .05,
					onChange: reset(setMuk),
					ariaLabel: "kinetic friction coefficient"
				})
			})] })
		] }),
		controlConfig,
		children: figure
	});
}

//#endregion
export { RampForcesLab };