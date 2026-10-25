import type { Metadata } from "next";
import { ToolForm } from "@/components/admin/tool-form";
import { requireAdmin } from "@/lib/auth/require-admin";
import styles from "../../admin.module.sass";

export const metadata: Metadata = { title: "New tool" };

export default async function NewToolPage() {
	await requireAdmin();
	return (
		<>
			<h1 className={styles.title}>New tool</h1>
			<ToolForm />
		</>
	);
}
