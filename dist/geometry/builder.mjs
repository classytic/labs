'use client';

import { geoSceneToDoc } from "./board/preset.mjs";
import { useMemo, useState } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { Axes, Dot, Grid, Stage, ToolIcon, isCircleVal, isLineVal, isVec2, renderElements, resolve } from "@classytic/stage";

//#region src/geometry/builder.tsx
/**
* GeometryBuilder, a visual, click-to-build editor for a `GeometryBoard` scene.
*
* Pick a tool, click the board: drop points, connect them into segments/lines,
* draw circles (centre → through-point), mark the intersection of two
* circles/lines, add midpoints and distance measures, drag points to move them,
* or delete. It emits the SAME declarative `GeoElement[]` scene the board renders.
*
* Now on the @classytic/stage engine: the construction is converted to a SceneDoc
* and rendered with stage's resolver + `renderElements` (SVG, accessible, real
* draggable points), the canvas geometry math is gone. `GeometryBoard` is the
* read-only render of this editor's output.
*/
const TOOLS = [
	{
		id: "select",
		icon: "select",
		label: "move",
		hint: "drag a point to move it"
	},
	{
		id: "point",
		icon: "point",
		label: "point",
		hint: "click empty space to place a point"
	},
	{
		id: "segment",
		icon: "segment",
		label: "segment",
		hint: "click two points"
	},
	{
		id: "line",
		icon: "line",
		label: "line",
		hint: "click two points"
	},
	{
		id: "circle",
		icon: "circle",
		label: "circle",
		hint: "click centre, then a point on it"
	},
	{
		id: "intersect",
		icon: "intersect",
		label: "intersect",
		hint: "click two circles/lines"
	},
	{
		id: "midpoint",
		icon: "midpoint",
		label: "midpoint",
		hint: "click two points"
	},
	{
		id: "measure",
		icon: "measure",
		label: "measure",
		hint: "click two points"
	},
	{
		id: "delete",
		icon: "delete",
		label: "delete",
		hint: "click a point to remove it"
	}
];
const VIEW = {
	xMin: -8,
	xMax: 8,
	yMin: -5.5,
	yMax: 5.5
};
const snap = (v) => Math.round(v * 2) / 2;
const POINT_KINDS = new Set([
	"point",
	"intersect",
	"midpoint"
]);
const nextPointId = (scene) => {
	const used = new Set(scene.filter((e) => e.type === "point").map((e) => e.id));
	for (const ch of "ABCDEFGHJKLMNOPQRSTUVWXYZ") if (!used.has(ch)) return ch;
	return `P${scene.length}`;
};
const nextId = (scene, prefix) => {
	let i = 1;
	const ids = new Set(scene.map((e) => e.id).filter(Boolean));
	while (ids.has(`${prefix}${i}`)) i++;
	return `${prefix}${i}`;
};
function GeometryBuilder({ scene = [], onChange, title = "Build a construction", height = 380 } = {}) {
	const [tool, setTool] = useState("point");
	const [pending, setPending] = useState([]);
	const set = (next) => onChange?.(next);
	const doc = useMemo(() => geoSceneToDoc(scene, VIEW), [scene]);
	const resolved = useMemo(() => resolve(doc), [doc]);
	const points = useMemo(() => {
		const m = /* @__PURE__ */ new Map();
		for (const el of scene) {
			if (!POINT_KINDS.has(el.type)) continue;
			const id = el.id;
			const v = resolved.values.get(id);
			if (isVec2(v)) m.set(id, v);
		}
		return m;
	}, [scene, resolved]);
	const pointAt = (mx, my) => {
		let best = null, bestD = .5;
		for (const [id, p] of points) {
			const d = Math.hypot(mx - p.x, my - p.y);
			if (d < bestD) {
				bestD = d;
				best = id;
			}
		}
		return best;
	};
	const elementAt = (mx, my) => {
		let best = null, bestD = .4;
		for (const el of scene) {
			const id = el.id;
			if (!id) continue;
			const v = resolved.values.get(id);
			if (isCircleVal(v)) {
				const d = Math.abs(Math.hypot(mx - v.center.x, my - v.center.y) - v.r);
				if (d < bestD) {
					bestD = d;
					best = id;
				}
			} else if (isLineVal(v) && v.kind === "line") {
				const dx = v.b.x - v.a.x, dy = v.b.y - v.a.y, L = Math.hypot(dx, dy) || 1;
				const dist = Math.abs((dy * (mx - v.a.x) - dx * (my - v.a.y)) / L);
				if (dist < bestD) {
					bestD = dist;
					best = id;
				}
			}
		}
		return best;
	};
	const onBuild = (p) => {
		const [mx, my] = p;
		if (tool === "select") return;
		if (tool === "point") {
			const id = nextPointId(scene);
			set([...scene, {
				type: "point",
				id,
				x: snap(mx),
				y: snap(my),
				draggable: true,
				label: id
			}]);
			return;
		}
		if (tool === "delete") {
			const eid = pointAt(mx, my) ?? elementAt(mx, my);
			if (eid) set(scene.filter((el) => el.id !== eid));
			return;
		}
		if (tool === "segment" || tool === "line" || tool === "midpoint" || tool === "measure") {
			const pid = pointAt(mx, my);
			if (!pid) return;
			const next = [...pending, pid];
			if (next.length < 2) {
				setPending(next);
				return;
			}
			const a = next[0], b = next[1];
			if (tool === "segment") set([...scene, {
				type: "segment",
				from: a,
				to: b,
				color: "var(--stage-good)"
			}]);
			else if (tool === "line") set([...scene, {
				type: "line",
				id: nextId(scene, "l"),
				through: [a, b],
				color: "var(--stage-fg)"
			}]);
			else if (tool === "midpoint") {
				const id = nextId(scene, "M");
				set([...scene, {
					type: "midpoint",
					id,
					of: [a, b],
					label: id
				}]);
			} else set([...scene, {
				type: "measure",
				kind: "distance",
				of: [a, b],
				label: `|${a}${b}|`
			}]);
			setPending([]);
			return;
		}
		if (tool === "circle") {
			const pid = pointAt(mx, my);
			if (!pid) return;
			const next = [...pending, pid];
			if (next.length < 2) {
				setPending(next);
				return;
			}
			set([...scene, {
				type: "circle",
				id: nextId(scene, "c"),
				center: next[0],
				through: next[1],
				color: "var(--stage-accent)"
			}]);
			setPending([]);
			return;
		}
		if (tool === "intersect") {
			const eid = elementAt(mx, my);
			if (!eid) return;
			const next = [...pending, eid];
			if (next.length < 2) {
				setPending(next);
				return;
			}
			const id1 = nextId(scene, "X");
			const add = [{
				type: "intersect",
				id: id1,
				of: [next[0], next[1]],
				pick: 0,
				label: id1,
				color: "var(--stage-warn)"
			}];
			const a = scene.find((el) => el.id === next[0]);
			const b = scene.find((el) => el.id === next[1]);
			if (a?.type === "circle" && b?.type === "circle") {
				const id2 = nextId([...scene, ...add], "X");
				add.push({
					type: "intersect",
					id: id2,
					of: [next[0], next[1]],
					pick: 1,
					label: id2,
					color: "var(--stage-warn)"
				});
			}
			set([...scene, ...add]);
			setPending([]);
		}
	};
	const onPointMove = (id, p, phase) => {
		const x = phase === "commit" ? snap(p.x) : p.x;
		const y = phase === "commit" ? snap(p.y) : p.y;
		set(scene.map((el) => el.type === "point" && el.id === id ? {
			...el,
			x,
			y
		} : el));
	};
	const hint = TOOLS.find((t) => t.id === tool)?.hint ?? "";
	return /* @__PURE__ */ jsxs("div", {
		className: "not-prose my-4 overflow-hidden rounded-xl border border-border/70 bg-card",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "flex flex-wrap items-center gap-1.5 border-b border-border/60 bg-muted/30 px-3 py-2",
				children: [
					/* @__PURE__ */ jsx("span", {
						className: "mr-1 text-sm font-semibold",
						children: title
					}),
					TOOLS.map((t) => /* @__PURE__ */ jsxs("button", {
						type: "button",
						onClick: () => {
							setTool(t.id);
							setPending([]);
						},
						className: ["inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition", tool === t.id ? "bg-primary text-primary-foreground" : "border border-border/60 bg-background text-foreground hover:bg-muted"].join(" "),
						children: [/* @__PURE__ */ jsx(ToolIcon, { name: t.icon }), t.label]
					}, t.id)),
					/* @__PURE__ */ jsx("button", {
						type: "button",
						onClick: () => set([]),
						className: "ml-auto rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-destructive",
						children: "clear"
					})
				]
			}),
			/* @__PURE__ */ jsxs("p", {
				className: "px-3 pt-1.5 text-xs text-muted-foreground",
				children: [hint, pending.length ? ` · ${pending.length} selected` : ""]
			}),
			/* @__PURE__ */ jsxs(Stage, {
				view: VIEW,
				height,
				onPointerMath: onBuild,
				ariaLabel: `Geometry construction editor, ${tool} tool`,
				className: "cursor-crosshair",
				children: [
					/* @__PURE__ */ jsx(Grid, {}),
					/* @__PURE__ */ jsx(Axes, {}),
					renderElements(doc, resolved, {
						draggablePoints: tool === "select",
						onPointMove
					}),
					pending.map((id) => {
						const p = points.get(id);
						return p ? /* @__PURE__ */ jsx(Dot, {
							x: p.x,
							y: p.y,
							r: 8,
							color: "var(--stage-warn)",
							opacity: .6
						}, `sel-${id}`) : null;
					})
				]
			})
		]
	});
}

//#endregion
export { GeometryBuilder };