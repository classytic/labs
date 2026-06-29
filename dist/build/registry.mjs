//#region src/build/registry.ts
const REGISTRY = /* @__PURE__ */ new Map();
function registerPart(def) {
	REGISTRY.set(def.kind, def);
}
function getPart(kind) {
	return REGISTRY.get(kind);
}
/** Every registered part (drives the builder palette). */
function listParts() {
	return [...REGISTRY.values()];
}

//#endregion
export { getPart, listParts, registerPart };