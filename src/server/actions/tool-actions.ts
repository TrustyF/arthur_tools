"use server";

import { Prisma } from "@prisma/client";
import { type } from "arktype";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";
import { DEFAULT_RETURN_PATH, safeReturnPath } from "@/lib/return-to";
import { toolFromFormData, toolInput } from "@/lib/tool-schema";
import { db } from "@/server/db/client";
import {
	MAX_ICON_UPLOAD_BYTES,
	processIcon,
} from "@/server/images/process-icon";

export type ToolFormState = { error: string } | undefined;

const MAX_NOTE_LENGTH = 200;

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
	// The version's "commit message"; only recorded when the code changed.
	const note = String(formData.get("changeNote") ?? "")
		.trim()
		.slice(0, MAX_NOTE_LENGTH);

	const returnTo =
		safeReturnPath(formData.get("returnTo")) ?? DEFAULT_RETURN_PATH;
	let previousSlug: string | undefined;

	const id = formData.get("id");
	try {
		if (typeof id === "string" && id) {
			// The old slug lets a rename refresh the old URL too.
			const previous = await db.tool.findUnique({
				where: { id },
				select: {
					slug: true,
					code: true,
					versions: {
						orderBy: { number: "desc" },
						take: 1,
						select: { number: true },
					},
				},
			});
			if (!previous) return { error: "This tool no longer exists." };
			previousSlug = previous.slug;

			const nextNumber = (previous.versions[0]?.number ?? 0) + 1;
			await db.$transaction([
				db.tool.update({ where: { id }, data, select: { id: true } }),
				...(previous.code === data.code
					? []
					: [
							db.toolVersion.create({
								data: { toolId: id, number: nextNumber, code: data.code, note },
								select: { id: true },
							}),
						]),
			]);
			revalidatePath(`/tools/${previous.slug}`);
		} else {
			await db.tool.create({
				data: {
					...data,
					versions: {
						create: {
							number: 1,
							code: data.code,
							note: note || "Initial version",
						},
					},
				},
				select: { id: true },
			});
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
	// Back to where Edit was clicked; if that was this tool's own page, follow a
	// renamed slug, and fall back to the admin list if it's no longer public.
	if (previousSlug && returnTo === `/tools/${previousSlug}`) {
		redirect(
			parsed.isPublished ? `/tools/${parsed.slug}` : DEFAULT_RETURN_PATH,
		);
	}
	redirect(returnTo);
}

export async function deleteTool(id: string, returnTo?: string): Promise<void> {
	await requireAdmin();
	const tool = await db.tool.delete({ where: { id }, select: { slug: true } });
	revalidatePath("/");
	revalidatePath(`/tools/${tool.slug}`);
	// The tool's own page is gone now; the home page is the nearest thing.
	const target = safeReturnPath(returnTo) ?? DEFAULT_RETURN_PATH;
	redirect(target === `/tools/${tool.slug}` ? "/" : target);
}
