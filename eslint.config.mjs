import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import checkFile from "eslint-plugin-check-file";
import { rules as commentLengthRules } from "./eslint-rules/comment-length.mjs";

const eslintConfig = defineConfig([
	...nextVitals,
	...nextTs,
	{
		plugins: {
			"check-file": checkFile,
			"comment-length": { rules: commentLengthRules },
		},
		rules: {
			"comment-length/flag-long": "warn",
			"comment-length/no-very-long": "warn",
			"check-file/filename-naming-convention": [
				"error",
				{
					"**/*.{jsx,tsx}": "KEBAB_CASE",
					"**/*.{js,ts}": "KEBAB_CASE",
				},
				{ ignoreMiddleExtensions: true },
			],
			"check-file/folder-naming-convention": [
				"error",
				{
					"src/**/": "NEXT_JS_APP_ROUTER_CASE",
				},
			],
		},
	},
	// eslint-config-next's default ignores, made recursive so nested copies
	// (e.g. .claude/worktrees/*) are excluded too — flat config ignores .gitignore.
	globalIgnores([
		"**/.next/**",
		"**/out/**",
		"**/build/**",
		"**/next-env.d.ts",
		".claude/**",
	]),
]);

export default eslintConfig;
