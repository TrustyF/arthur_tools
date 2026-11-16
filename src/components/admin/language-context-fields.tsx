"use client";

import type { ToolLanguage } from "@prisma/client";
import { useState } from "react";
import { TOOL_CONTEXTS } from "@/lib/tool-context";
import {
	LANGUAGE_LABEL,
	parseLanguage,
	TOOL_LANGUAGES,
} from "@/lib/tool-language";
import styles from "./form.module.sass";

type LanguageContextFieldsProps = {
	// Held by tool-form.tsx, which swaps the Code box for a file field on HDAs.
	language: ToolLanguage;
	onLanguageChange: (language: ToolLanguage) => void;
	defaultContext: string;
};

// Language and Context together: the context options follow the language.
export function LanguageContextFields({
	language,
	onLanguageChange,
	defaultContext,
}: LanguageContextFieldsProps) {
	const [context, setContext] = useState(defaultContext);
	const options = TOOL_CONTEXTS[language];
	// A value from before the list (or from the other language) stays selectable.
	const isLegacy = context !== "" && !options.includes(context);

	return (
		<>
			<label className={styles.field}>
				Language
				<select
					name="language"
					value={language}
					onChange={(e) => {
						const next = parseLanguage(e.target.value) ?? "VEX";
						onLanguageChange(next);
						if (!TOOL_CONTEXTS[next].includes(context)) setContext("");
					}}>
					{TOOL_LANGUAGES.map((lang) => (
						<option key={lang} value={lang}>
							{LANGUAGE_LABEL[lang]}
						</option>
					))}
				</select>
			</label>
			<label className={styles.field}>
				Context
				<select
					name="context"
					value={context}
					onChange={(e) => setContext(e.target.value)}>
					<option value="">None</option>
					{isLegacy && <option value={context}>{context}</option>}
					{options.map((option) => (
						<option key={option} value={option}>
							{option}
						</option>
					))}
				</select>
			</label>
		</>
	);
}
