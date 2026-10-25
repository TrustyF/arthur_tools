import type { ToolLanguage } from "@prisma/client";
import { LANGUAGE_LABEL } from "@/lib/tool-language";
import styles from "./language-badge.module.sass";

export function LanguageBadge({ language }: { language: ToolLanguage }) {
	return (
		<span className={`${styles.badge} ${styles[language.toLowerCase()]}`}>
			{LANGUAGE_LABEL[language]}
		</span>
	);
}
