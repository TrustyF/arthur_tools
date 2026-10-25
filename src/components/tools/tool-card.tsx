import type { Tool } from "@prisma/client";
import Link from "next/link";
import { LanguageBadge } from "./language-badge";
import styles from "./tool-card.module.sass";
import { ToolIcon } from "./tool-icon";

type ToolCardProps = {
	tool: Pick<
		Tool,
		| "slug"
		| "name"
		| "summary"
		| "language"
		| "context"
		| "tags"
		| "houdiniIcon"
		| "customIconDate"
	>;
};

export function ToolCard({ tool }: ToolCardProps) {
	return (
		<Link href={`/tools/${tool.slug}`} className={styles.card}>
			<div className={styles.header}>
				<div className={styles.name}>
					<ToolIcon tool={tool} size={24} />
					<h2>{tool.name}</h2>
				</div>
				<LanguageBadge language={tool.language} />
			</div>
			{tool.summary && <p className={styles.summary}>{tool.summary}</p>}
			<div className={styles.meta}>
				{tool.context && <span>{tool.context}</span>}
				{tool.tags.map((tag) => (
					<span key={tag} className={styles.tag}>
						#{tag}
					</span>
				))}
			</div>
		</Link>
	);
}
