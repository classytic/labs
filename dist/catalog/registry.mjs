//#region src/catalog/registry.ts
const TEMPLATES = /* @__PURE__ */ new Map();
function registerLabTemplate(t) {
	TEMPLATES.set(t.id, t);
}
function listLabTemplates() {
	return [...TEMPLATES.values()];
}
function listLabTemplatesByCategory(category) {
	return listLabTemplates().filter((t) => t.category === category);
}
function getLabTemplate(id) {
	return TEMPLATES.get(id);
}
/**
* Validate params against the family's `paramsSchema` (zod), then build the
* SceneDoc. Returns typed errors so a marketplace/authoring UI can surface bad
* input WITHOUT producing a broken scene.
*/
function instantiateTemplate(id, params) {
	const t = TEMPLATES.get(id);
	if (!t) return {
		ok: false,
		error: `Unknown template: ${id}`
	};
	const merged = {
		...t.defaultParams,
		...params ?? {}
	};
	if (t.paramsSchema) {
		const parsed = t.paramsSchema.safeParse(merged);
		if (!parsed.success) {
			const issues = parsed.error.issues.map((i) => ({
				path: i.path.join("."),
				message: i.message
			}));
			return {
				ok: false,
				error: `Invalid params for "${id}": ${issues.map((i) => `${i.path || "(root)"} ${i.message}`).join("; ")}`,
				issues
			};
		}
	}
	const doc = t.factory(merged);
	if (t.pedagogy && !doc.meta?.pedagogy) doc.meta = {
		...doc.meta,
		pedagogy: t.pedagogy
	};
	return {
		ok: true,
		doc
	};
}

//#endregion
export { getLabTemplate, instantiateTemplate, listLabTemplates, listLabTemplatesByCategory, registerLabTemplate };