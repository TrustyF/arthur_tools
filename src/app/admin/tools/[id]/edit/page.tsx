import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ToolForm } from "@/components/admin/tool-form";
import { requireAdmin } from "@/lib/auth/require-admin";
import { db } from "@/server/db/client";
import styles from "../../../admin.module.sass";

export const metadata: Metadata = { title: "Edit tool" };

export default async function EditToolPage(
	props: PageProps<"/admin/tools/[id]/edit">,
) {
	await requireAdmin();
	const { id } = await props.params;
	const tool = await db.tool.findUnique({ where: { id } });
	if (!tool) notFound();

	return (
		<>
			<h1 className={styles.title}>Edit {tool.name}</h1>
			<ToolForm tool={tool} />
		</>
	);
}
