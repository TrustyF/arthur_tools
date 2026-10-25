import { Download } from "lucide-react";
import { highlightCode } from "@/lib/highlight/highlight";
import styles from "./code-block.module.sass";
import { CopyButton } from "./copy-button";
import { ExpandableCode } from "./expandable-code";

type CodeBlockProps = {
	code: string;
	lang: string;
	fileName: string;
	downloadHref?: string;
	// Where the Copy button reports copies (counted as downloads); omit to skip.
	eventsUrl?: string;
};

export async function CodeBlock({
	code,
	lang,
	fileName,
	downloadHref,
	eventsUrl,
}: CodeBlockProps) {
	const html = await highlightCode(code, lang);

	return (
		<div className={styles.wrapper}>
			<div className={styles.toolbar}>
				<span className={styles.fileName}>{fileName}</span>
				<div className={styles.actions}>
					<CopyButton text={code} eventsUrl={eventsUrl} />
					{downloadHref && (
						<a href={downloadHref} className={styles.action} download>
							<Download size={14} />
							Download
						</a>
					)}
				</div>
			</div>
			<ExpandableCode html={html} lineCount={code.split("\n").length} />
		</div>
	);
}
