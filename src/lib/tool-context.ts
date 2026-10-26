import type { ToolLanguage } from "@prisma/client";

// Where a tool runs, offered per language in the editor. Stored as plain text
// (Tool.context), so renaming an entry here leaves old tools' values alone.
export const TOOL_CONTEXTS: Record<ToolLanguage, readonly string[]> = {
	VEX: [
		"Attribute Wrangle (points)",
		"Attribute Wrangle (primitives)",
		"Attribute Wrangle (vertices)",
		"Attribute Wrangle (detail)",
		"Volume Wrangle",
		"Deformation Wrangle",
		"POP Wrangle",
		"Gas Field Wrangle",
		"Parameter expression",
	],
	PYTHON: [
		"Shelf tool",
		"Python SOP",
		"Python Source Editor",
		"Python Shell",
		"HDA Python Module",
		"Parameter callback",
		"Parameter expression",
		"Startup script",
	],
};
