//#region src/logic/registry.ts
const REGISTRY = /* @__PURE__ */ new Map();
function registerGate(def) {
	REGISTRY.set(def.kind, def);
}
function getGate(kind) {
	return REGISTRY.get(kind);
}
/** Every registered gate (drives a builder palette). */
function listGates() {
	return [...REGISTRY.values()];
}

//#endregion
export { getGate, listGates, registerGate };