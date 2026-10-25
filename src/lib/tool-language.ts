import type { ToolLanguage } from "@prisma/client";

export const TOOL_LANGUAGES = [
	"PYTHON",
	"VEX",
] as const satisfies readonly ToolLanguage[];

export const LANGUAGE_LABEL: Record<ToolLanguage, string> = {
	PYTHON: "Python",
	VEX: "VEX",
};

// Shiki language ids; "vex" is the custom grammar in highlight/vex-grammar.ts.
export const LANGUAGE_HIGHLIGHT_ID: Record<ToolLanguage, string> = {
	PYTHON: "python",
	VEX: "vex",
};

// Used for the downloaded file's name (.vfl is VEX's source extension).
export const LANGUAGE_EXTENSION: Record<ToolLanguage, string> = {
	PYTHON: "py",
	VEX: "vfl",
};

// Download/display name. Python files use underscores so the name is importable:
// /help has shelf tools run them with runpy.run_module("padded_netbox").
export function toolFileName(slug: string, language: ToolLanguage): string {
	const base = language === "PYTHON" ? slug.replaceAll("-", "_") : slug;
	return `${base}.${LANGUAGE_EXTENSION[language]}`;
}

// The /help section explaining how to use each kind of tool (section ids in app/help).
export const HELP_ANCHOR: Record<ToolLanguage, string> = {
	PYTHON: "/help#python",
	VEX: "/help#vex",
};

export function parseLanguage(value: unknown): ToolLanguage | undefined {
	return TOOL_LANGUAGES.find((lang) => lang === value);
}
