import "server-only";
import { createHighlighter, type Highlighter } from "shiki";
import { vexGrammar } from "./vex-grammar";

const THEME = "github-dark-default";

// One highlighter per server process — creating it loads every grammar.
let highlighterPromise: Promise<Highlighter> | undefined;

function getHighlighter(): Promise<Highlighter> {
	highlighterPromise ??= createHighlighter({
		themes: [THEME],
		langs: ["python", vexGrammar],
	});
	return highlighterPromise;
}

export async function highlightCode(
	code: string,
	lang: string,
): Promise<string> {
	const highlighter = await getHighlighter();
	return highlighter.codeToHtml(code, {
		lang,
		theme: THEME,
		transformers: [
			{
				// Drop the theme's inline background so the block uses --code-bg.
				pre(node) {
					delete node.properties.style;
				},
			},
		],
	});
}
