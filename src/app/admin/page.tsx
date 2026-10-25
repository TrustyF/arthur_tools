import type { Metadata } from "next";
import Link from "next/link";
import { LanguageBadge } from "@/components/tools/language-badge";
import { ToolIcon } from "@/components/tools/tool-icon";
import { requireAdmin } from "@/lib/auth/require-admin";
import { db } from "@/server/db/client";
import styles from "./admin.module.sass";

export const metadata: Metadata = { title: "Admin" };

export default async function AdminPage() {
	await requireAdmin();
	const tools = await db.tool.findMany({
		orderBy: { updateDate: "desc" },
		select: {
			id: true,
			slug: true,
			name: true,
			language: true,
			isPublished: true,
			updateDate: true,
			houdiniIcon: true,
			customIconDate: true,
		},
	});

	return (
		<>
			<div className={styles.header}>
				<h1>Tools</h1>
				<Link href="/admin/tools/new" className={styles.newButton}>
					New tool
				</Link>
			</div>

			{tools.length === 0 ? (
				<p className={styles.empty}>No tools yet.</p>
			) : (
				<table className={styles.table}>
					<thead>
						<tr>
							<th>Name</th>
							<th>Language</th>
							<th>Status</th>
							<th>Updated</th>
						</tr>
					</thead>
					<tbody>
						{tools.map((tool) => (
							<tr key={tool.id}>
								<td>
									<Link
										href={`/admin/tools/${tool.id}/edit`}
										className={styles.nameCell}>
										<ToolIcon tool={tool} size={20} />
										{tool.name}
									</Link>
								</td>
								<td>
									<LanguageBadge language={tool.language} />
								</td>
								<td>
									{tool.isPublished ? (
										<Link
											href={`/tools/${tool.slug}`}
											className={styles.published}>
											Published
										</Link>
									) : (
										<span className={styles.draft}>Draft</span>
									)}
								</td>
								<td>{tool.updateDate.toISOString().slice(0, 10)}</td>
							</tr>
						))}
					</tbody>
				</table>
			)}
		</>
	);
}
