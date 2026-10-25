import type { LanguageRegistration } from "shiki";

// Shiki ships no VEX grammar; this covers the C-like core plus VEX's
// typed @attribute bindings and the common snippet/channel functions.
export const vexGrammar: LanguageRegistration = {
	name: "vex",
	scopeName: "source.vex",
	aliases: ["vfl"],
	patterns: [
		{ include: "#comments" },
		{ include: "#preprocessor" },
		{ include: "#strings" },
		{ include: "#attributes" },
		{ include: "#numbers" },
		{ include: "#keywords" },
		{ include: "#types" },
		{ include: "#constants" },
		{ include: "#functions" },
		{ include: "#operators" },
	],
	repository: {
		comments: {
			patterns: [
				{ name: "comment.line.double-slash.vex", match: "//.*$" },
				{ name: "comment.block.vex", begin: "/\\*", end: "\\*/" },
			],
		},
		preprocessor: {
			name: "meta.preprocessor.vex",
			match:
				"^\\s*#\\s*(include|define|undef|if|ifdef|ifndef|else|elif|endif|pragma)\\b.*$",
			captures: { 1: { name: "keyword.control.directive.vex" } },
		},
		strings: {
			patterns: [
				{
					name: "string.quoted.double.vex",
					begin: '"',
					end: '"',
					patterns: [{ name: "constant.character.escape.vex", match: "\\\\." }],
				},
				{
					name: "string.quoted.single.vex",
					begin: "'",
					end: "'",
					patterns: [{ name: "constant.character.escape.vex", match: "\\\\." }],
				},
			],
		},
		// f@pscale, v[]@offsets, @P, @ptnum, ...
		attributes: {
			// Not variable.other.*: most themes leave that scope uncolored.
			name: "variable.attribute.vex",
			match: "(?:\\b[fuvp234isd](?:\\[\\])?)?@[A-Za-z_][A-Za-z0-9_]*",
		},
		numbers: {
			name: "constant.numeric.vex",
			match:
				"\\b(?:0[xX][0-9a-fA-F]+|(?:\\d+\\.?\\d*|\\.\\d+)(?:[eE][+-]?\\d+)?)\\b",
		},
		keywords: {
			name: "keyword.control.vex",
			match:
				"\\b(if|else|for|foreach|while|do|break|continue|return|forpoints|illuminance|gather)\\b",
		},
		types: {
			patterns: [
				{
					name: "storage.type.vex",
					match:
						"\\b(int|float|vector|vector2|vector4|matrix|matrix2|matrix3|string|dict|bsdf|void|struct|function)\\b",
				},
				{
					name: "storage.modifier.vex",
					match:
						"\\b(const|export|typedef|sop|cvex|surface|displacement|light|shadow|fog|chop|cop2|pop)\\b",
				},
			],
		},
		constants: {
			name: "constant.language.vex",
			match: "\\b(M_PI|M_TWO_PI|M_PI_2|M_E|PI)\\b",
		},
		functions: {
			match: "\\b([A-Za-z_][A-Za-z0-9_]*)\\s*(?=\\()",
			captures: { 1: { name: "entity.name.function.vex" } },
		},
		operators: {
			name: "keyword.operator.vex",
			match: "[-+*/%=!<>&|^~?:]+",
		},
	},
};
