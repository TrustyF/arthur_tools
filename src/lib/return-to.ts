// Where the editor goes after save/cancel: the page whose Edit button opened it,
// carried as ?from=… (see editHref). Defaults to the admin list.
export const DEFAULT_RETURN_PATH = "/admin";

// Only same-site paths: "//evil.com" or "/\evil.com" would leave the site.
export function safeReturnPath(value: unknown): string | undefined {
	if (typeof value !== "string") return undefined;
	if (
		!value.startsWith("/") ||
		value.startsWith("//") ||
		value.includes("\\")
	) {
		return undefined;
	}
	return value;
}

export function editHref(toolId: string, from?: string): string {
	const base = `/admin/tools/${toolId}/edit`;
	return from ? `${base}?from=${encodeURIComponent(from)}` : base;
}
