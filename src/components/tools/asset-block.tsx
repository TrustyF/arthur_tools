import { Download } from "lucide-react";
import { formatBytes } from "@/lib/tool-asset";
import styles from "./code-block.module.sass";

type AssetBlockProps = {
	fileName: string;
	size: number;
	downloadHref: string;
};

// An HDA's file where code tools show their CodeBlock: name, size, download.
export function AssetBlock({ fileName, size, downloadHref }: AssetBlockProps) {
	return (
		<div className={styles.wrapper}>
			<div className={`${styles.toolbar} ${styles.toolbarOnly}`}>
				<span>
					<span className={styles.fileName}>{fileName}</span>
					<span className={styles.fileSize}>{formatBytes(size)}</span>
				</span>
				<div className={styles.actions}>
					<a href={downloadHref} className={styles.action} download>
						<Download size={14} />
						Download
					</a>
				</div>
			</div>
		</div>
	);
}
