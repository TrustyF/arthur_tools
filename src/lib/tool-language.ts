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

export function parseLanguage(value: unknown): ToolLanguage | undefined {
	return TOOL_LANGUAGES.find((lang) => lang === value);
}
