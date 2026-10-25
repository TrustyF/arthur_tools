import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { CodeBlock } from "@/components/tools/code-block";
import { LanguageBadge } from "@/components/tools/language-badge";
import { ToolIcon } from "@/components/tools/tool-icon";
import { LANGUAGE_EXTENSION, LANGUAGE_HIGHLIGHT_ID } from "@/lib/tool-language";
import { db } from "@/server/db/client";
import styles from "./tool.module.sass";

// Shared by generateMetadata and the page so the row is fetched once per request.
const getTool = cache((slug: string) =>
	db.tool.findFirst({ where: { slug, isPublished: true } }),
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
	const tool = await getTool(slug);
	if (!tool) notFound();

	const fileName = `${tool.slug}.${LANGUAGE_EXTENSION[tool.language]}`;

	return (
		<article className={styles.page}>
			<header className={styles.header}>
				<div className={styles.title}>
					<ToolIcon tool={tool} size={36} />
					<h1>{tool.name}</h1>
					<LanguageBadge language={tool.language} />
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
					<div>
						<dt>Updated</dt>
						<dd>{tool.updateDate.toISOString().slice(0, 10)}</dd>
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

			{tool.description && (
				<p className={styles.description}>{tool.description}</p>
			)}

			<CodeBlock
				code={tool.code}
				lang={LANGUAGE_HIGHLIGHT_ID[tool.language]}
				fileName={fileName}
				downloadHref={`/tools/${tool.slug}/raw`}
			/>
		</article>
	);
}
