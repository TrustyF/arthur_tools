import { Download } from "lucide-react";
import { highlightCode } from "@/lib/highlight/highlight";
import styles from "./code-block.module.sass";
import { CopyButton } from "./copy-button";

type CodeBlockProps = {
	code: string;
	lang: string;
	fileName: string;
	downloadHref?: string;
};

export async function CodeBlock({
	code,
	lang,
	fileName,
	downloadHref,
}: CodeBlockProps) {
	const html = await highlightCode(code, lang);

	return (
		<div className={styles.wrapper}>
			<div className={styles.toolbar}>
				<span className={styles.fileName}>{fileName}</span>
				<div className={styles.actions}>
					<CopyButton text={code} />
					{downloadHref && (
						<a href={downloadHref} className={styles.action} download>
							<Download size={14} />
							Download
						</a>
					)}
				</div>
			</div>
			<div
				className={styles.code}
				// biome-ignore lint/security/noDangerouslySetInnerHtml: Shiki output, which escapes the source
				dangerouslySetInnerHTML={{ __html: html }}
			/>
		</div>
	);
}
