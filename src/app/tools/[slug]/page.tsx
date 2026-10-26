import { CircleHelp, Pencil } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { auth } from "@/auth";
import { editHref } from "@/lib/return-to";
import { CodeBlock } from "@/components/tools/code-block";
import { Description } from "@/components/tools/description";
import { LanguageBadge } from "@/components/tools/language-badge";
import { ToolIcon } from "@/components/tools/tool-icon";
import { ViewTracker } from "@/components/tools/view-tracker";
import {
	HELP_ANCHOR,
	toolFileName,
	LANGUAGE_HIGHLIGHT_ID,
} from "@/lib/tool-language";
import { db } from "@/server/db/client";
import styles from "./tool.module.sass";

// Shared by generateMetadata and the page so the row is fetched once per request.
const getTool = cache((slug: string) =>
	db.tool.findFirst({
		where: { slug, isPublished: true },
		include: { _count: { select: { versions: true } } },
	}),
);

export async function generateMetadata(
	props: PageProps<"/tools/[slug]">,
): Promise<Metadata> {
	const { slug } = await props.params;
	const tool = await getTool(slug);
	if (!tool) return {};
	return { title: tool.name, description: tool.summary };
}

export default async function ToolPage(props: PageProps<"/tools/[slug]">) {
	const { slug } = await props.params;
	const [tool, session] = await Promise.all([getTool(slug), auth()]);
	if (!tool) notFound();
	const isAdmin = session?.user?.role === "ADMIN";

	const fileName = toolFileName(tool.slug, tool.language);
	const eventsUrl = `/api/tools/${tool.slug}/events`;

	return (
		<article className={styles.page}>
			<header className={styles.header}>
				<div className={styles.title}>
					<ToolIcon tool={tool} size={36} />
					<h1>{tool.name}</h1>
					<LanguageBadge language={tool.language} />
					{isAdmin && (
						<Link
							href={editHref(tool.id, `/tools/${tool.slug}`)}
							className={styles.edit}>
							<Pencil size={14} />
							Edit
						</Link>
					)}
				</div>
				{tool.summary && <p className={styles.summary}>{tool.summary}</p>}
				<dl className={styles.meta}>
					{tool.context && (
						<div>
							<dt>Context</dt>
							<dd>{tool.context}</dd>
						</div>
					)}
					{tool.houdiniVersion && (
						<div>
							<dt>Houdini</dt>
							<dd>{tool.houdiniVersion}+</dd>
						</div>
					)}
					{/* What to type in a shelf tool's Icon field (see /help#python). */}
					{tool.language === "PYTHON" && tool.houdiniIcon && (
						<div>
							<dt>Shelf icon</dt>
							<dd>
								<code className={styles.iconName}>{tool.houdiniIcon}</code>
							</dd>
						</div>
					)}
					{tool.shortcut && (
						<div>
							<dt>Suggested shortcut</dt>
							<dd>
								<kbd className={styles.shortcut}>{tool.shortcut}</kbd>
							</dd>
						</div>
					)}
					<div>
						<dt>Updated</dt>
						<dd>{tool.updateDate.toISOString().slice(0, 10)}</dd>
					</div>
					<div>
						<dt>History</dt>
						<dd>
							<Link
								href={`/tools/${tool.slug}/history`}
								className={styles.link}>
								{tool._count.versions === 1
									? "1 version"
									: `${tool._count.versions} versions`}
							</Link>
						</dd>
					</div>
				</dl>
				{tool.tags.length > 0 && (
					<div className={styles.tags}>
						{tool.tags.map((tag) => (
							<Link key={tag} href={`/?tag=${encodeURIComponent(tag)}`}>
								#{tag}
							</Link>
						))}
					</div>
				)}
			</header>

			{tool.description && <Description markdown={tool.description} />}

			<div className={styles.code}>
				<Link href={HELP_ANCHOR[tool.language]} className={styles.howTo}>
					<CircleHelp size={14} />
					{tool.language === "PYTHON"
						? "How to add this to a shelf"
						: "How to use this in a wrangle"}
				</Link>
				<CodeBlock
					code={tool.code}
					lang={LANGUAGE_HIGHLIGHT_ID[tool.language]}
					fileName={fileName}
					downloadHref={`/tools/${tool.slug}/raw`}
					eventsUrl={eventsUrl}
				/>
			</div>
			<ViewTracker eventsUrl={eventsUrl} />
		</article>
	);
}
