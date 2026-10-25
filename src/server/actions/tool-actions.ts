"use server";

import { Prisma } from "@prisma/client";
import { type } from "arktype";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";
import { toolFromFormData, toolInput } from "@/lib/tool-schema";
import { db } from "@/server/db/client";
import {
	MAX_ICON_UPLOAD_BYTES,
	processIcon,
} from "@/server/images/process-icon";

export type ToolFormState = { error: string } | undefined;

type IconData = Pick<
	Prisma.ToolUncheckedCreateInput,
	"customIcon" | "customIconDate"
>;

// An untouched file input submits a zero-byte File, meaning "keep the current icon".
async function customIconData(
	formData: FormData,
): Promise<IconData | { error: string }> {
	const file = formData.get("customIcon");
	if (file instanceof File && file.size > 0) {
		if (file.size > MAX_ICON_UPLOAD_BYTES) {
			return { error: "Icon images must be under 5 MB." };
		}
		try {
			const icon = await processIcon(await file.arrayBuffer());
			return { customIcon: new Uint8Array(icon), customIconDate: new Date() };
		} catch {
			return { error: "Couldn't read that image file." };
		}
	}
	if (formData.get("removeCustomIcon") === "on") {
		return { customIcon: null, customIconDate: null };
	}
	return {};
}

// Creates when the form has no id, updates otherwise.
export async function saveTool(
	_prev: ToolFormState,
	formData: FormData,
): Promise<ToolFormState> {
	await requireAdmin();

	const parsed = toolInput(toolFromFormData(formData));
	if (parsed instanceof type.errors) return { error: parsed.summary };

	const icon = await customIconData(formData);
	if ("error" in icon) return icon;
	const data = { ...parsed, ...icon };

	const id = formData.get("id");
	try {
		if (typeof id === "string" && id) {
			// Fetch the old slug first so a rename also refreshes the old URL.
			const previous = await db.tool.findUnique({
				where: { id },
				select: { slug: true },
			});
			await db.tool.update({ where: { id }, data, select: { id: true } });
			if (previous) revalidatePath(`/tools/${previous.slug}`);
		} else {
			await db.tool.create({ data, select: { id: true } });
		}
	} catch (err) {
		if (
			err instanceof Prisma.PrismaClientKnownRequestError &&
			err.code === "P2002"
		) {
			return { error: `The slug "${parsed.slug}" is already taken.` };
		}
		throw err;
	}

	revalidatePath("/");
	revalidatePath(`/tools/${parsed.slug}`);
	redirect("/admin");
}

export async function deleteTool(id: string): Promise<void> {
	await requireAdmin();
	const tool = await db.tool.delete({ where: { id }, select: { slug: true } });
	revalidatePath("/");
	revalidatePath(`/tools/${tool.slug}`);
	redirect("/admin");
}
