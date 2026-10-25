import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { diffCode } from "@/lib/code-diff";
import { formatVersionDate, getToolHistory } from "@/server/tools/tool-history";
import styles from "./history.module.sass";

export async function generateMetadata(
	props: PageProps<"/tools/[slug]/history">,
): Promise<Metadata> {
	const { slug } = await props.params;
	const tool = await getToolHistory(slug);
	return tool ? { title: `${tool.name} history` } : {};
}

export default async function HistoryPage(
	props: PageProps<"/tools/[slug]/history">,
) {
	const { slug } = await props.params;
	const tool = await getToolHistory(slug);
	if (!tool) notFound();

	// Each version's +/- counts against the one before it, newest first.
	const rows = tool.versions
		.map((version, i) => ({
			...version,
			diff: diffCode(tool.versions[i - 1]?.code ?? "", version.code),
		}))
		.reverse();
	const latest = rows[0]?.number;

	return (
		<div className={styles.page}>
			<Link href={`/tools/${tool.slug}`} className={styles.back}>
				← {tool.name}
			</Link>
			<h1>History</h1>

			<ol className={styles.list}>
				{rows.map((row) => (
					<li key={row.number}>
						<Link
							href={`/tools/${tool.slug}/history/${row.number}`}
							className={styles.row}>
							<span className={styles.version}>v{row.number}</span>
							<span className={styles.note}>
								{row.note || <span className={styles.noNote}>No note</span>}
								{row.number === latest && (
									<span className={styles.current}>current</span>
								)}
							</span>
							<span className={styles.stats}>
								<span className={styles.statAdded}>+{row.diff.added}</span>
								<span className={styles.statRemoved}>−{row.diff.removed}</span>
							</span>
							<time
								className={styles.date}
								dateTime={row.createDate.toISOString()}>
								{formatVersionDate(row.createDate)}
							</time>
						</Link>
					</li>
				))}
			</ol>
		</div>
	);
}
