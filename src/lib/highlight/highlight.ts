import "server-only";
import {
	type BundledLanguage,
	createHighlighter,
	type Highlighter,
	type ThemedToken,
} from "shiki";
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

// One token array per source line, for views that lay lines out themselves (diffs).
export async function highlightLines(
	code: string,
	lang: string,
): Promise<ThemedToken[][]> {
	const highlighter = await getHighlighter();
	// Typed to Shiki's bundled names only; custom grammars like "vex" work at runtime.
	return highlighter.codeToTokensBase(code, {
		lang: lang as BundledLanguage,
		theme: THEME,
	});
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
