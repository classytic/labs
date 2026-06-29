'use client';

import { mulberry32, randInt } from "../../core/rng.mjs";
import { Callout, ControlBar, LabFrame } from "../../kit/frame.mjs";
import { HintLadder, useCheckpoint, useHints } from "../../kit/pedagogy.mjs";
import { CarGlyph, DoorGlyph, GoatGlyph } from "../../kit/gameshow.mjs";
import { useCallback, useEffect, useRef, useState } from "react";
import { Fragment as Fragment$1, jsx, jsxs } from "react/jsx-runtime";
import { useControlSurface, useFrameLoop, useInView } from "@classytic/stage";

//#region src/discrete/monty-hall/preset.tsx
/**
* MontyHallLab, the paradox as a GAME you play, not a chart you stare at. Three
* doors (one hides a car, the rest goats); you pick, Monty throws open a goat, and
* you choose to STAY or SWITCH and watch the door swing open on your fate. Every
* game you (and the auto-player) finish feeds two growing win-rate bars, so the
* shocking truth, switch ≈ 2/3, stay ≈ 1/3, is something you EARN by watching it
* happen, the law of large numbers built from felt experience.
*
* Doors/car/goat are stage glyphs (DoorGlyph swings open via CSS); the round logic
* is a small seeded state machine (replayable). Narration + controls + the tally
* bars are HTML around the SVG so nothing overlaps. Generalises to N doors (Monty
* opens all goats but one, so switching wins (N−1)/N).
*/
const DW = 116, DH = 188, GAP = 26, PAD = 16;
function MontyHallLab({ doors = 3, seed = 7, title = "The Monty Hall game", prompt, objectives, hints: hintList, controlId }) {
	const n = Math.max(3, Math.min(6, doors));
	const rng = useRef(mulberry32(seed));
	const hints = useHints(hintList);
	const timers = useRef([]);
	const [mounted, setMounted] = useState(false);
	const { ref: viewRef, inView } = useInView();
	const [phase, setPhase] = useState("pick");
	const [car, setCar] = useState(() => randInt(rng.current, 0, n - 1));
	const [pick, setPick] = useState(null);
	const [opened, setOpened] = useState([]);
	const [switchTo, setSwitchTo] = useState(null);
	const [finalPick, setFinalPick] = useState(null);
	const [strategy, setStrategy] = useState(null);
	const [revealAll, setRevealAll] = useState(false);
	const [tally, setTally] = useState({
		switchWins: 0,
		switchGames: 0,
		stayWins: 0,
		stayGames: 0
	});
	const [autoRunning, setAutoRunning] = useState(false);
	const autoLeft = useRef(0);
	const chunk = useRef(1);
	useEffect(() => {
		setMounted(true);
		return () => {
			timers.current.forEach(clearTimeout);
		};
	}, []);
	const after = (ms, fn) => {
		const id = window.setTimeout(fn, ms);
		timers.current.push(id);
	};
	const newGame = useCallback(() => {
		timers.current.forEach(clearTimeout);
		timers.current = [];
		setCar(randInt(rng.current, 0, n - 1));
		setPick(null);
		setOpened([]);
		setSwitchTo(null);
		setFinalPick(null);
		setStrategy(null);
		setRevealAll(false);
		setPhase("pick");
	}, [n]);
	const pickDoor = useCallback((i) => {
		if (phase !== "pick" || autoRunning) return;
		setPick(i);
		const others = Array.from({ length: n }, (_, k) => k).filter((k) => k !== i);
		const target = i === car ? others.filter((k) => k !== car)[randInt(rng.current, 0, others.length - 2)] : car;
		setSwitchTo(target);
		setOpened(Array.from({ length: n }, (_, k) => k).filter((k) => k !== i && k !== target));
		after(750, () => setPhase("revealed"));
	}, [
		phase,
		autoRunning,
		n,
		car
	]);
	const decide = useCallback((strat) => {
		if (phase !== "revealed" || pick == null || switchTo == null) return;
		const fp = strat === "switch" ? switchTo : pick;
		setFinalPick(fp);
		setStrategy(strat);
		setPhase("result");
		const won = fp === car;
		setTally((t) => strat === "switch" ? {
			...t,
			switchGames: t.switchGames + 1,
			switchWins: t.switchWins + (won ? 1 : 0)
		} : {
			...t,
			stayGames: t.stayGames + 1,
			stayWins: t.stayWins + (won ? 1 : 0)
		});
		after(600, () => setRevealAll(true));
	}, [
		phase,
		pick,
		switchTo,
		car
	]);
	const startAuto = useCallback((count) => {
		autoLeft.current = count;
		chunk.current = Math.max(1, Math.ceil(count / 120));
		setAutoRunning(true);
	}, []);
	const resetAll = useCallback(() => {
		setAutoRunning(false);
		autoLeft.current = 0;
		setTally({
			switchWins: 0,
			switchGames: 0,
			stayWins: 0,
			stayGames: 0
		});
		rng.current = mulberry32(seed);
		newGame();
	}, [seed, newGame]);
	useFrameLoop(() => {
		if (autoLeft.current <= 0) {
			if (autoRunning) setAutoRunning(false);
			return;
		}
		const c = Math.min(autoLeft.current, chunk.current);
		let sw = 0, st = 0;
		for (let k = 0; k < c; k++) {
			const cr = randInt(rng.current, 0, n - 1);
			const pk = randInt(rng.current, 0, n - 1);
			if (pk !== cr) sw++;
			if (pk === cr) st++;
		}
		autoLeft.current -= c;
		setTally((t) => ({
			switchWins: t.switchWins + sw,
			switchGames: t.switchGames + c,
			stayWins: t.stayWins + st,
			stayGames: t.stayGames + c
		}));
	}, { running: autoRunning && mounted && inView });
	const won = finalPick != null && finalPick === car;
	useCheckpoint({
		solved: tally.switchGames >= 1 && tally.stayGames >= 1,
		activity: `monty-hall:${title}`,
		hintsUsed: hints.count
	});
	useControlSurface(controlId, {
		pick: {
			type: "number",
			label: "pick door (0-based)",
			min: 0,
			max: n - 1,
			step: 1,
			get: () => pick ?? 0,
			set: (v) => pickDoor(v)
		},
		stay: {
			type: "action",
			label: "stay",
			invoke: () => decide("stay")
		},
		switch: {
			type: "action",
			label: "switch",
			invoke: () => decide("switch")
		},
		again: {
			type: "action",
			label: "play again",
			invoke: newGame
		},
		auto100: {
			type: "action",
			label: "auto-play 100",
			invoke: () => startAuto(100)
		},
		reset: {
			type: "action",
			label: "reset stats",
			invoke: resetAll
		}
	});
	const W = n * DW + (n - 1) * GAP + PAD * 2;
	const H = 220;
	const doorX = (i) => PAD + i * 142;
	const contentBox = (i) => ({
		x: doorX(i) + DW * .18,
		y: 53.6,
		w: DW * .64,
		h: DH * .62
	});
	const swRate = tally.switchGames ? tally.switchWins / tally.switchGames : 0;
	const stRate = tally.stayGames ? tally.stayWins / tally.stayGames : 0;
	const swTarget = (n - 1) / n, stTarget = 1 / n;
	const narration = () => {
		if (phase === "pick") return pick == null ? /* @__PURE__ */ jsxs(Fragment$1, { children: [
			"🎬 Pick a door, one hides the ",
			/* @__PURE__ */ jsx("b", { children: "car" }),
			", the others ",
			/* @__PURE__ */ jsx("b", { children: "goats" }),
			"."
		] }) : /* @__PURE__ */ jsxs(Fragment$1, { children: [
			"You chose ",
			/* @__PURE__ */ jsxs("b", { children: ["Door ", pick + 1] }),
			". Monty is opening a goat…"
		] });
		if (phase === "revealed") return /* @__PURE__ */ jsxs(Fragment$1, { children: [
			"Monty opened ",
			opened.map((d) => `Door ${d + 1}`).join(", "),
			", a goat! 🐐 Now: ",
			/* @__PURE__ */ jsx("b", { children: "stay" }),
			" with Door ",
			pick + 1,
			", or ",
			/* @__PURE__ */ jsx("b", { children: "switch" }),
			" to Door ",
			switchTo + 1,
			"?"
		] });
		return won ? /* @__PURE__ */ jsxs(Fragment$1, { children: [
			/* @__PURE__ */ jsx("b", {
				style: { color: "var(--stage-good)" },
				children: "🎉 You win the car!"
			}),
			" You ",
			strategy === "switch" ? "switched" : "stayed",
			"."
		] }) : /* @__PURE__ */ jsxs(Fragment$1, { children: [
			/* @__PURE__ */ jsx("b", {
				style: { color: "var(--stage-bad)" },
				children: "🐐 A goat."
			}),
			" You ",
			strategy === "switch" ? "switched" : "stayed",
			", the car was behind Door ",
			car + 1,
			"."
		] });
	};
	const btn = {
		padding: "9px 18px",
		borderRadius: 999,
		border: "1.5px solid var(--stage-grid)",
		background: "var(--stage-bg)",
		color: "var(--stage-fg)",
		fontWeight: 700,
		fontSize: 14,
		cursor: "pointer"
	};
	const btnHot = {
		...btn,
		borderColor: "var(--stage-good)",
		background: "color-mix(in oklab, var(--stage-good) 16%, transparent)"
	};
	const figure = /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsx("div", {
		style: {
			minHeight: 24,
			fontSize: 15,
			fontWeight: 500,
			margin: "4px 0 8px",
			textAlign: "center"
		},
		"aria-live": "polite",
		children: narration()
	}), /* @__PURE__ */ jsx("div", {
		ref: viewRef,
		className: "lab-playwrap",
		style: {
			borderRadius: 16,
			background: "color-mix(in oklab, var(--stage-accent) 6%, var(--stage-bg))",
			border: "1px solid var(--stage-grid)",
			padding: 8
		},
		children: /* @__PURE__ */ jsx("svg", {
			viewBox: `0 0 ${W} ${H}`,
			style: {
				width: "100%",
				maxWidth: W,
				height: "auto",
				display: "block",
				margin: "0 auto"
			},
			role: "img",
			"aria-label": `${n} doors; ${phase}`,
			children: Array.from({ length: n }, (_, i) => {
				const isOpen = revealAll || opened.includes(i) || finalPick === i ? 1 : 0;
				const cb = contentBox(i);
				return /* @__PURE__ */ jsx("g", {
					onClick: () => pickDoor(i),
					style: { cursor: phase === "pick" && !autoRunning ? "pointer" : "default" },
					role: "button",
					"aria-label": `door ${i + 1}`,
					children: /* @__PURE__ */ jsx(DoorGlyph, {
						x: doorX(i),
						y: PAD,
						w: DW,
						h: DH,
						label: i + 1,
						open: isOpen,
						picked: phase === "result" ? finalPick === i : pick === i,
						dim: phase === "result" && finalPick !== i && i !== car,
						children: i === car ? /* @__PURE__ */ jsx(CarGlyph, { ...cb }) : /* @__PURE__ */ jsx(GoatGlyph, { ...cb })
					})
				}, i);
			})
		})
	})] });
	const controls = /* @__PURE__ */ jsxs(ControlBar, { children: [/* @__PURE__ */ jsxs("div", {
		style: {
			display: "flex",
			gap: 10,
			justifyContent: "center",
			flexWrap: "wrap"
		},
		children: [
			phase === "revealed" && /* @__PURE__ */ jsxs(Fragment$1, { children: [/* @__PURE__ */ jsxs("button", {
				style: btn,
				onClick: () => decide("stay"),
				children: [
					"🛑 Stay (Door ",
					pick + 1,
					")"
				]
			}), /* @__PURE__ */ jsxs("button", {
				style: btnHot,
				onClick: () => decide("switch"),
				children: [
					"🔄 Switch (Door ",
					switchTo + 1,
					")"
				]
			})] }),
			phase === "result" && /* @__PURE__ */ jsx("button", {
				style: btnHot,
				onClick: newGame,
				children: "▶ Play again"
			}),
			phase === "pick" && pick == null && /* @__PURE__ */ jsx("span", {
				style: {
					fontSize: 13,
					color: "var(--stage-muted)"
				},
				children: "↑ tap a door to start"
			})
		]
	}), /* @__PURE__ */ jsxs("div", {
		style: {
			display: "flex",
			gap: 10,
			alignItems: "center",
			flexWrap: "wrap"
		},
		children: [
			/* @__PURE__ */ jsx("span", {
				style: {
					fontSize: 13,
					fontWeight: 600,
					color: "var(--stage-muted)"
				},
				children: "Too slow? Let the robot play:"
			}),
			/* @__PURE__ */ jsx("button", {
				style: btn,
				disabled: autoRunning,
				onClick: () => startAuto(100),
				children: "⚡ 100 games"
			}),
			/* @__PURE__ */ jsx("button", {
				style: btn,
				disabled: autoRunning,
				onClick: () => startAuto(1e3),
				children: "⚡ 1000 games"
			}),
			/* @__PURE__ */ jsx("button", {
				style: btn,
				onClick: resetAll,
				children: "↺ reset"
			}),
			autoRunning && /* @__PURE__ */ jsx("span", {
				style: {
					fontSize: 13,
					color: "var(--stage-good)"
				},
				children: "playing…"
			})
		]
	})] });
	return /* @__PURE__ */ jsx(LabFrame, {
		title,
		prompt,
		objectives,
		aside: /* @__PURE__ */ jsx(Callout, {
			tone: "result",
			children: /* @__PURE__ */ jsx("div", {
				style: {
					display: "grid",
					gap: 10
				},
				children: [[
					"switch",
					swRate,
					swTarget,
					tally.switchWins,
					tally.switchGames,
					"var(--stage-good)"
				], [
					"stay",
					stRate,
					stTarget,
					tally.stayWins,
					tally.stayGames,
					"var(--stage-muted)"
				]].map(([name, rate, target, wins, games, color]) => /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs("div", {
					style: {
						display: "flex",
						justifyContent: "space-between",
						fontSize: 13,
						fontWeight: 700,
						marginBottom: 3
					},
					children: [/* @__PURE__ */ jsxs("span", {
						style: {
							color,
							textTransform: "capitalize"
						},
						children: [name, " wins"]
					}), /* @__PURE__ */ jsxs("span", {
						style: {
							fontVariantNumeric: "tabular-nums",
							color: "var(--stage-muted)"
						},
						children: [
							games ? `${(rate * 100).toFixed(1)}%` : ", ",
							" · ",
							wins,
							"/",
							games,
							" ",
							/* @__PURE__ */ jsxs("span", {
								style: { opacity: .7 },
								children: [
									"(→ ",
									(target * 100).toFixed(0),
									"%)"
								]
							})
						]
					})]
				}), /* @__PURE__ */ jsxs("div", {
					style: {
						position: "relative",
						height: 16,
						borderRadius: 8,
						background: "color-mix(in oklab, var(--stage-grid) 60%, transparent)",
						overflow: "hidden"
					},
					children: [/* @__PURE__ */ jsx("div", { style: {
						width: `${rate * 100}%`,
						height: "100%",
						background: color,
						borderRadius: 8,
						transition: "width .12s linear"
					} }), /* @__PURE__ */ jsx("div", {
						style: {
							position: "absolute",
							top: -2,
							bottom: -2,
							left: `${target * 100}%`,
							width: 2,
							background: "var(--stage-fg)",
							opacity: .5
						},
						title: `target ${(target * 100).toFixed(0)}%`
					})]
				})] }, name))
			})
		}),
		controls,
		footer: /* @__PURE__ */ jsx(HintLadder, { hints }),
		children: figure
	});
}

//#endregion
export { MontyHallLab };