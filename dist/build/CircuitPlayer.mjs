'use client';

import { getPart } from "./registry.mjs";
import { CircuitScene } from "./CircuitScene.mjs";
import { useMemo, useState } from "react";
import { jsx } from "react/jsx-runtime";

//#region src/build/CircuitPlayer.tsx
/**
* CircuitPlayer — a CircuitScene you can operate. The authored `doc` is the source of truth (so a
* parent can drive it, e.g. a slider that changes a resistor's ohms), and the learner's taps
* (close a switch, flip a component) are kept as a small per-part OVERLAY on top. That way an
* external doc change is adopted live AND the user's taps survive it. The engine re-solves on
* every change; CircuitScene stays a pure render.
*/
const applyOverlay = (doc, overlay) => ({
	...doc,
	parts: doc.parts.map((p) => overlay[p.id] ? {
		...p,
		props: {
			...p.props,
			...overlay[p.id]
		}
	} : p)
});
function CircuitPlayer({ doc: authored, flow = true, ariaLabel, onChange }) {
	const [overlay, setOverlay] = useState({});
	const doc = useMemo(() => applyOverlay(authored, overlay), [authored, overlay]);
	const tap = (partId) => {
		const part = doc.parts.find((p) => p.id === partId);
		if (!part) return;
		const patch = getPart(part.kind)?.tap?.(part);
		if (!patch) return;
		const next = {
			...overlay,
			[partId]: {
				...overlay[partId] ?? {},
				...patch
			}
		};
		setOverlay(next);
		onChange?.(applyOverlay(authored, next));
	};
	return /* @__PURE__ */ jsx(CircuitScene, {
		doc,
		flow,
		ariaLabel,
		onPartTap: tap
	});
}

//#endregion
export { CircuitPlayer };