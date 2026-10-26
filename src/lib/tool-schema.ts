import { type } from "arktype";
import { slugify } from "@/lib/slugify";
import { HOUDINI_ICON_PATTERN } from "@/lib/tool-icon";

const houdiniIcon = type("string <= 100").narrow(
	(name, ctx) =>
		name === "" ||
		HOUDINI_ICON_PATTERN.test(name) ||
		ctx.mustBe("a Houdini icon name like SOP_null"),
);

// Set by the editor's upload button: a media URL (see media-storage.ts), so
// site-relative in dev and the R2 bucket's https URL in production.
const previewUrl = type("string <= 500").narrow(
	(url, ctx) =>
		url === "" ||
		/^(\/|https:\/\/)\S+$/.test(url) ||
		ctx.mustBe("an uploaded image URL"),
);

export const toolInput = type({
	name: "0 < string <= 120",
	slug: "0 < string <= 120",
	summary: "string <= 300",
	description: "string",
	language: "'PYTHON' | 'VEX'",
	context: "string <= 120",
	houdiniVersion: "string <= 20",
	code: "string > 0",
	houdiniIcon,
	previewUrl,
	tags: "string[]",
	isPublished: "boolean",
	isPinned: "boolean",
});

export type ToolInput = typeof toolInput.infer;

// Browsers submit textarea newlines as CRLF; stored code should be LF.
function raw(formData: FormData, key: string): string {
	const value = formData.get(key);
	return typeof value === "string" ? value.replace(/\r\n?/g, "\n") : "";
}

function field(formData: FormData, key: string): string {
	return raw(formData, key).trim();
}

// Raw form fields → candidate object for toolInput. A blank slug falls back
// to the name; tags are comma-separated and lowercased so filters match.
export function toolFromFormData(formData: FormData): unknown {
	const name = field(formData, "name");
	return {
		name,
		slug: slugify(field(formData, "slug") || name),
		summary: field(formData, "summary"),
		description: field(formData, "description"),
		language: field(formData, "language"),
		context: field(formData, "context"),
		houdiniVersion: field(formData, "houdiniVersion"),
		// Not trimmed: leading indentation is meaningful in Python.
		code: raw(formData, "code").replace(/\s+$/, ""),
		houdiniIcon: field(formData, "houdiniIcon"),
		previewUrl: field(formData, "previewUrl"),
		tags: [
			...new Set(
				field(formData, "tags")
					.split(",")
					.map((tag) => tag.trim().toLowerCase())
					.filter(Boolean),
			),
		],
		isPublished: formData.get("isPublished") === "on",
		isPinned: formData.get("isPinned") === "on",
	};
}
