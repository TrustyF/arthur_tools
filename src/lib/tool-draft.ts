import type { Tool } from "@prisma/client";

// Unsaved editor state in localStorage, so a crash, reload or mid-edit deploy
// keeps the work. Files can't be stored: a picked custom icon must be re-chosen.
export type DraftValues = {
	changeNote: string;
	name: string;
	slug: string;
	language: string;
	context: string;
	houdiniVersion: string;
	houdiniIcon: string;
	previewUrl: string;
	shortcut: string;
	summary: string;
	tags: string;
	description: string;
	code: string;
	isPublished: boolean;
	isPinned: boolean;
};

export type Draft = { values: DraftValues; savedAt: number };

const TEXT_FIELDS = [
	"changeNote",
	"name",
	"slug",
	"language",
	"context",
	"houdiniVersion",
	"houdiniIcon",
	"previewUrl",
	"shortcut",
	"summary",
	"tags",
	"description",
	"code",
] as const;

export function draftKey(toolId: string | undefined): string {
	return `tool-draft:${toolId ?? "new"}`;
}

export function initialValues(
	tool: Omit<Tool, "customIcon"> | undefined,
): DraftValues {
	return {
		changeNote: "",
		name: tool?.name ?? "",
		slug: tool?.slug ?? "",
		language: tool?.language ?? "VEX",
		context: tool?.context ?? "",
		houdiniVersion: tool?.houdiniVersion ?? "",
		houdiniIcon: tool?.houdiniIcon ?? "",
		previewUrl: tool?.previewUrl ?? "",
		shortcut: tool?.shortcut ?? "",
		summary: tool?.summary ?? "",
		tags: tool?.tags.join(", ") ?? "",
		description: tool?.description ?? "",
		code: tool?.code ?? "",
		isPublished: tool?.isPublished ?? false,
		isPinned: tool?.isPinned ?? false,
	};
}

export function valuesFromForm(form: HTMLFormElement): DraftValues {
	const data = new FormData(form);
	const text = (name: string) => {
		const value = data.get(name);
		return typeof value === "string" ? value : "";
	};
	const values = Object.fromEntries(
		TEXT_FIELDS.map((name) => [name, text(name)]),
	) as Omit<DraftValues, "isPublished" | "isPinned">;
	return {
		...values,
		isPublished: data.get("isPublished") === "on",
		isPinned: data.get("isPinned") === "on",
	};
}

export function sameValues(a: DraftValues, b: DraftValues): boolean {
	return JSON.stringify(a) === JSON.stringify(b);
}

// Storage can throw (private windows, blocked site data); drafts are a
// convenience, so failures are ignored rather than breaking the editor.
export function readDraft(key: string): Draft | undefined {
	try {
		const raw = localStorage.getItem(key);
		return raw ? (JSON.parse(raw) as Draft) : undefined;
	} catch {
		return undefined;
	}
}

export function writeDraft(key: string, values: DraftValues): void {
	try {
		const draft: Draft = { values, savedAt: Date.now() };
		localStorage.setItem(key, JSON.stringify(draft));
	} catch {}
}

export function removeDraft(key: string): void {
	try {
		localStorage.removeItem(key);
	} catch {}
}
