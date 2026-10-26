import type { Metadata } from "next";
import { ToolFormLoader } from "@/components/admin/tool-form-loader";
import { requireAdmin } from "@/lib/auth/require-admin";

export const metadata: Metadata = { title: "New tool" };

export default async function NewToolPage() {
	await requireAdmin();
	return <ToolFormLoader heading="New tool" />;
}
