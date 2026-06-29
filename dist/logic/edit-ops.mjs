import { getGate } from "./registry.mjs";

//#region src/logic/edit-ops.ts
/**
* Pure, immutable transforms for the LogicEditor — every edit returns a NEW LogicDoc so the
* editor stays undoable/serializable (mirrors the analog builder's editor-ops). A "node" is an
* input, a gate, or an output. Wires are implicit: a gate input slot (or an output) simply
* names the source node that feeds it, so connecting = writing that id and deleting a node =
* clearing every reference to it.
*/
const LETTERS = "ABCDEFGHJKLMN";
function freshId(doc, prefix) {
	const used = new Set([
		...doc.inputs,
		...doc.gates,
		...doc.outputs
	].map((n) => n.id));
	let k = 1;
	while (used.has(`${prefix}${k}`)) k++;
	return `${prefix}${k}`;
}
/** Add an input / output / gate (kind = 'input' | 'output' | a registered gate kind). */
function addNode(doc, kind, at) {
	if (kind === "input") {
		const id = freshId(doc, "in");
		const label = LETTERS[doc.inputs.length] ?? id;
		return {
			doc: {
				...doc,
				inputs: [...doc.inputs, {
					id,
					label,
					value: false,
					x: at.x,
					y: at.y
				}]
			},
			id
		};
	}
	if (kind === "output") {
		const id = freshId(doc, "out");
		const label = doc.outputs.length === 0 ? "Y" : `Y${doc.outputs.length}`;
		return {
			doc: {
				...doc,
				outputs: [...doc.outputs, {
					id,
					in: "",
					label,
					x: at.x,
					y: at.y
				}]
			},
			id
		};
	}
	const arity = getGate(kind)?.arity ?? 2;
	const id = freshId(doc, "g");
	return {
		doc: {
			...doc,
			gates: [...doc.gates, {
				id,
				kind,
				in: Array(arity).fill(""),
				x: at.x,
				y: at.y
			}]
		},
		id
	};
}
/** Move any node to a new position. */
function moveNode(doc, id, at) {
	const set = (n) => n.id === id ? {
		...n,
		x: at.x,
		y: at.y
	} : n;
	return {
		...doc,
		inputs: doc.inputs.map(set),
		gates: doc.gates.map(set),
		outputs: doc.outputs.map(set)
	};
}
/** Wire a source node into a sink (a gate input slot, or an output). No-op for invalid pairs. */
function connect(doc, fromId, sink) {
	if (!fromId || fromId === sink.nodeId) return doc;
	if (!(doc.inputs.some((i) => i.id === fromId) || doc.gates.some((g) => g.id === fromId))) return doc;
	return {
		...doc,
		gates: doc.gates.map((g) => g.id === sink.nodeId ? {
			...g,
			in: g.in.map((v, i) => i === (sink.slot ?? 0) ? fromId : v)
		} : g),
		outputs: doc.outputs.map((o) => o.id === sink.nodeId ? {
			...o,
			in: fromId
		} : o)
	};
}
/** Clear the wire feeding a sink slot. */
function disconnect(doc, sink) {
	return {
		...doc,
		gates: doc.gates.map((g) => g.id === sink.nodeId ? {
			...g,
			in: g.in.map((v, i) => i === (sink.slot ?? 0) ? "" : v)
		} : g),
		outputs: doc.outputs.map((o) => o.id === sink.nodeId ? {
			...o,
			in: ""
		} : o)
	};
}
/** Delete a node and clear every reference to it. */
function deleteNode(doc, id) {
	return {
		...doc,
		inputs: doc.inputs.filter((i) => i.id !== id),
		gates: doc.gates.filter((g) => g.id !== id).map((g) => ({
			...g,
			in: g.in.map((v) => v === id ? "" : v)
		})),
		outputs: doc.outputs.filter((o) => o.id !== id).map((o) => o.in === id ? {
			...o,
			in: ""
		} : o)
	};
}
/** Toggle / set a primary input's value. */
function setInputValue(doc, id, value) {
	return {
		...doc,
		inputs: doc.inputs.map((i) => i.id === id ? {
			...i,
			value
		} : i)
	};
}
function toggleInput(doc, id) {
	return {
		...doc,
		inputs: doc.inputs.map((i) => i.id === id ? {
			...i,
			value: !i.value
		} : i)
	};
}
/** Rename a node's label (any node type). */
function relabel(doc, id, label) {
	const set = (n) => n.id === id ? {
		...n,
		label
	} : n;
	return {
		...doc,
		inputs: doc.inputs.map(set),
		gates: doc.gates.map(set),
		outputs: doc.outputs.map(set)
	};
}
/** Set / clear an output's goal value (for graded build challenges). */
function setGoal(doc, outId, goal) {
	return {
		...doc,
		outputs: doc.outputs.map((o) => o.id === outId ? {
			...o,
			goal
		} : o)
	};
}

//#endregion
export { addNode, connect, deleteNode, disconnect, moveNode, relabel, setGoal, setInputValue, toggleInput };