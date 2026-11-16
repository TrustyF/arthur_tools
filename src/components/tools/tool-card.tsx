import type { Tool } from "@prisma/client";
import { Download, Heart, Pencil } from "lucide-react";
import Link from "next/link";
import { HoverPreviewCard } from "./hover-preview-card";
import styles from "./tool-card.module.sass";
import { ToolIcon } from "./tool-icon";

type ToolCardProps = {
	tool: Pick<
		Tool,
		| "slug"
		| "name"
		| "summary"
		| "houdiniIcon"
		| "customIconDate"
		| "isPinned"
		| "previewUrl"
	>;
	// Download and Copy button uses combined (ToolStats.downloads).
	downloads: number;
	// Admins only: links to the tool's editor.
	editHref?: string | undefined;
};

// Links can't nest, so the title link stretches over the whole card (see
// .titleLink) and the edit link sits above it.
export function ToolCard({ tool, downloads, editHref }: ToolCardProps) {
	return (
		<HoverPreviewCard previewUrl={tool.previewUrl}>
			<ToolIcon tool={tool} size={36} className={styles.icon} />
			<div className={styles.name}>
				<h2>
					<Link href={`/tools/${tool.slug}`} className={styles.titleLink}>
						{tool.name}
					</Link>
				</h2>
				{tool.isPinned && (
					<Heart
						size={14}
						fill="currentColor"
						className={styles.pin}
						aria-label="Pinned"
					/>
				)}
			</div>
			{editHref && (
				<Link
					href={editHref}
					className={styles.edit}
					aria-label={`Edit ${tool.name}`}
					title="Edit">
					<Pencil size={14} />
				</Link>
			)}
			{downloads > 0 && (
				<span
					className={styles.downloads}
					title={`${downloads} ${downloads === 1 ? "download" : "downloads"}`}>
					<Download size={13} aria-hidden />
					{downloads}
				</span>
			)}
			{tool.summary && <p className={styles.summary}>{tool.summary}</p>}
		</HoverPreviewCard>
	);
}
