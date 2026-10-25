import type { ThemedToken } from "shiki";
import { type CodeDiff, type DiffRow, diffCode } from "@/lib/code-diff";
import { highlightLines } from "@/lib/highlight/highlight";
import styles from "./diff-view.module.sass";

type DiffViewProps = {
	oldCode: string;
	newCode: string;
	lang: string;
	fileName: string;
};

const MARKER: Record<DiffRow["kind"], string> = {
	context: " ",
	added: "+",
	removed: "-",
};

function Line({ tokens }: { tokens: ThemedToken[] | undefined }) {
	return (
		<>
			{tokens?.map((token, i) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: tokens never reorder
				<span key={i} style={{ color: token.color }}>
					{token.content}
				</span>
			))}
		</>
	);
}

// GitHub-style unified diff: old/new line numbers, +/- rows, highlighted code.
export async function DiffView({
	oldCode,
	newCode,
	lang,
	fileName,
}: DiffViewProps) {
	const diff: CodeDiff = diffCode(oldCode, newCode);
	const [oldLines, newLines] = await Promise.all([
		highlightLines(oldCode, lang),
		highlightLines(newCode, lang),
	]);

	return (
		<div className={styles.wrapper}>
			<div className={styles.toolbar}>
				<span className={styles.fileName}>{fileName}</span>
				<span className={styles.stats}>
					<span className={styles.statAdded}>+{diff.added}</span>
					<span className={styles.statRemoved}>−{diff.removed}</span>
				</span>
			</div>
			{diff.hunks.length === 0 ? (
				<p className={styles.empty}>No code changes.</p>
			) : (
				<div className={styles.scroll}>
					<table className={styles.table}>
						{diff.hunks.map((hunk) => (
							<tbody key={hunk.header}>
								<tr className={styles.hunk}>
									<td colSpan={4}>{hunk.header}</td>
								</tr>
								{hunk.rows.map((row) => {
									const oldNumber =
										"oldNumber" in row ? row.oldNumber : undefined;
									const newNumber =
										"newNumber" in row ? row.newNumber : undefined;
									const tokens =
										row.kind === "removed"
											? oldLines[row.oldNumber - 1]
											: newLines[row.newNumber - 1];
									return (
										<tr
											key={`${oldNumber}-${newNumber}`}
											className={styles[row.kind]}>
											<td className={styles.number}>{oldNumber}</td>
											<td className={styles.number}>{newNumber}</td>
											<td className={styles.marker}>{MARKER[row.kind]}</td>
											<td className={styles.code}>
												<Line tokens={tokens} />
											</td>
										</tr>
									);
								})}
							</tbody>
						))}
					</table>
				</div>
			)}
		</div>
	);
}
