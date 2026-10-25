import type { Prisma } from "@prisma/client";
import Link from "next/link";
import { ToolCard } from "@/components/tools/tool-card";
import {
	LANGUAGE_LABEL,
	parseLanguage,
	TOOL_LANGUAGES,
} from "@/lib/tool-language";
import { db } from "@/server/db/client";
import styles from "./home.module.sass";

export default async function Home(props: PageProps<"/">) {
	const searchParams = await props.searchParams;
	const language = parseLanguage(searchParams.lang);
	const tag =
		typeof searchParams.tag === "string" ? searchParams.tag : undefined;

	const where: Prisma.ToolWhereInput = {
		isPublished: true,
		...(language ? { language } : {}),
		...(tag ? { tags: { has: tag } } : {}),
	};
	const tools = await db.tool.findMany({
		where,
		orderBy: { updateDate: "desc" },
		select: {
			id: true,
			slug: true,
			name: true,
			summary: true,
			language: true,
			context: true,
			tags: true,
			houdiniIcon: true,
			customIconDate: true,
		},
	});

	return (
		<>
			<section className={styles.intro}>
				<h1>Houdini tools</h1>
				<p>Python scripts and VEX snippets for Houdini.</p>
			</section>

			<div className={styles.filters}>
				<Link href="/" className={!language ? styles.active : undefined}>
					All
				</Link>
				{TOOL_LANGUAGES.map((lang) => (
					<Link
						key={lang}
						href={`/?lang=${lang}`}
						className={language === lang ? styles.active : undefined}>
						{LANGUAGE_LABEL[lang]}
					</Link>
				))}
				{tag && <span className={styles.tagFilter}>#{tag}</span>}
			</div>

			{tools.length === 0 ? (
				<p className={styles.empty}>No tools here yet.</p>
			) : (
				<div className={styles.grid}>
					{tools.map((tool) => (
						<ToolCard key={tool.id} tool={tool} />
					))}
				</div>
			)}
		</>
	);
}
