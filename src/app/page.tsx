import type { Prisma } from "@prisma/client";
import { Braces, Hammer, Package, SquareTerminal } from "lucide-react";
import Link from "next/link";
import { auth } from "@/auth";
import { SHOW_BUNDLE } from "@/lib/bundle";
import { editHref } from "@/lib/return-to";
import { ToolCard } from "@/components/tools/tool-card";
import { LANGUAGE_LABEL, TOOL_LANGUAGES } from "@/lib/tool-language";
import { db } from "@/server/db/client";
import styles from "./home.module.sass";

const LANGUAGE_ICON = {
	PYTHON: SquareTerminal,
	VEX: Braces,
	HDA: Package,
} as const;

export default async function Home(props: PageProps<"/">) {
	const searchParams = await props.searchParams;
	const tag =
		typeof searchParams.tag === "string" ? searchParams.tag : undefined;
	// This page with its filters, so saving an edit returns to the same view.
	const homePath = tag ? `/?${new URLSearchParams({ tag })}` : "/";

	const where: Prisma.ToolWhereInput = {
		isPublished: true,
		...(tag ? { tags: { has: tag } } : {}),
	};
	const session = await auth();
	const isAdmin = session?.user?.role === "ADMIN";
	const tools = await db.tool.findMany({
		where,
		// Pinned first (true sorts after false, hence desc), then most recently updated.
		orderBy: [{ isPinned: "desc" }, { updateDate: "desc" }],
		select: {
			id: true,
			slug: true,
			name: true,
			summary: true,
			houdiniIcon: true,
			customIconDate: true,
			isPinned: true,
			language: true,
			previewUrl: true,
			stats: { select: { downloads: true } },
		},
	});

	return (
		<>
			<section className={styles.intro}>
				<div>
					<h1>Houdini tools</h1>
					<p>Python scripts, VEX snippets and digital assets for Houdini.</p>
				</div>
				{SHOW_BUNDLE && (
					<Link href="/shelf" className={styles.buildShelf}>
						<Hammer size={15} aria-hidden />
						Build shelf
					</Link>
				)}
			</section>

			{tag && (
				<div className={styles.filters}>
					<span className={styles.tagFilter}>#{tag}</span>
					<Link href="/">Clear</Link>
				</div>
			)}

			{tools.length === 0 ? (
				<p className={styles.empty}>No tools here yet.</p>
			) : (
				TOOL_LANGUAGES.map((lang) => {
					const group = tools.filter((tool) => tool.language === lang);
					if (group.length === 0) return null;
					const Icon = LANGUAGE_ICON[lang];
					return (
						<section key={lang} className={styles.group}>
							<h2>
								<Icon
									size={18}
									aria-hidden
									className={styles[lang.toLowerCase()]}
								/>
								{LANGUAGE_LABEL[lang]}
							</h2>
							<div className={styles.list}>
								{group.map((tool) => (
									<ToolCard
										key={tool.id}
										tool={tool}
										downloads={tool.stats?.downloads ?? 0}
										editHref={isAdmin ? editHref(tool.id, homePath) : undefined}
									/>
								))}
							</div>
						</section>
					);
				})
			)}
		</>
	);
}
