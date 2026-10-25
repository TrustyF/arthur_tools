import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ToolFormLoader } from "@/components/admin/tool-form-loader";
import { requireAdmin } from "@/lib/auth/require-admin";
import { safeReturnPath } from "@/lib/return-to";
import { db } from "@/server/db/client";
import styles from "../../../admin.module.sass";

export const metadata: Metadata = { title: "Edit tool" };

export default async function EditToolPage(
	props: PageProps<"/admin/tools/[id]/edit">,
) {
	await requireAdmin();
	const [{ id }, searchParams] = await Promise.all([
		props.params,
		props.searchParams,
	]);
	const tool = await db.tool.findUnique({ where: { id } });
	if (!tool) notFound();

	return (
		<>
			<h1 className={styles.title}>Edit {tool.name}</h1>
			<ToolFormLoader
				tool={tool}
				returnTo={safeReturnPath(searchParams.from)}
			/>
		</>
	);
}
