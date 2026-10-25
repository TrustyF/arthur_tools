import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DiffView } from "@/components/tools/diff-view";
import { toolFileName, LANGUAGE_HIGHLIGHT_ID } from "@/lib/tool-language";
import { formatVersionDate, getToolHistory } from "@/server/tools/tool-history";
import styles from "../history.module.sass";

async function load(props: PageProps<"/tools/[slug]/history/[version]">) {
	const { slug, version } = await props.params;
	const tool = await getToolHistory(slug);
	const number = Number(version);
	const index = tool?.versions.findIndex((v) => v.number === number) ?? -1;
	if (!tool || index === -1) return undefined;
	return {
		tool,
		current: tool.versions[index],
		previous: tool.versions[index - 1],
		next: tool.versions[index + 1],
	};
}

export async function generateMetadata(
	props: PageProps<"/tools/[slug]/history/[version]">,
): Promise<Metadata> {
	const loaded = await load(props);
	return loaded?.current
		? { title: `${loaded.tool.name} v${loaded.current.number}` }
		: {};
}

export default async function VersionPage(
	props: PageProps<"/tools/[slug]/history/[version]">,
) {
	const loaded = await load(props);
	if (!loaded?.current) notFound();
	const { tool, current, previous, next } = loaded;
	const history = `/tools/${tool.slug}/history`;

	return (
		<div className={styles.page}>
			<Link href={history} className={styles.back}>
				← {tool.name} history
			</Link>
			<header className={styles.versionHeader}>
				<h1>
					v{current.number}
					{current.note && (
						<span className={styles.versionNote}> · {current.note}</span>
					)}
				</h1>
				<p className={styles.versionMeta}>
					<time dateTime={current.createDate.toISOString()}>
						{formatVersionDate(current.createDate)}
					</time>
					{previous
						? ` · compared with v${previous.number}`
						: " · first version"}
				</p>
				<nav className={styles.pager}>
					{previous && (
						<Link href={`${history}/${previous.number}`}>
							← v{previous.number}
						</Link>
					)}
					{next && (
						<Link href={`${history}/${next.number}`}>v{next.number} →</Link>
					)}
				</nav>
			</header>

			<DiffView
				oldCode={previous?.code ?? ""}
				newCode={current.code}
				lang={LANGUAGE_HIGHLIGHT_ID[tool.language]}
				fileName={toolFileName(tool.slug, tool.language)}
			/>
		</div>
	);
}
