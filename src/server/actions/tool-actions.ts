"use server";

import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { type } from "arktype";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";
import { DEFAULT_RETURN_PATH, safeReturnPath } from "@/lib/return-to";
import { assetFileProblem, safeAssetFileName } from "@/lib/tool-asset";
import { toolFromFormData, toolInput } from "@/lib/tool-schema";
import { db } from "@/server/db/client";
import {
	MAX_ICON_UPLOAD_BYTES,
	processIcon,
} from "@/server/images/process-icon";
import { getMediaStorage } from "@/server/storage/media-storage";

// A successful save returns where to go rather than calling redirect(), so the
// form can clear its local draft first and only then navigate.
export type ToolFormState = { error: string } | { savedTo: string } | undefined;

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

type AssetData = Pick<
	Prisma.ToolUncheckedCreateInput,
	"assetKey" | "assetFileName" | "assetSize"
>;

// HDAs: stores a newly picked file under a new key (older versions' files stay)
// and returns its fields; {} when the input was left empty (a zero-byte File).
async function assetData(
	formData: FormData,
): Promise<AssetData | { error: string }> {
	const file = formData.get("asset");
	if (!(file instanceof File) || file.size === 0) return {};
	const problem = assetFileProblem(file);
	if (problem) return { error: problem };

	const assetFileName = safeAssetFileName(file.name);
	const assetKey = `hda/${randomUUID()}/${assetFileName}`;
	try {
		await getMediaStorage().write(
			assetKey,
			Buffer.from(await file.arrayBuffer()),
			"application/octet-stream",
		);
	} catch (err) {
		console.error("HDA upload to storage failed", err);
		return {
			error: "Couldn't store the HDA. Check the media storage settings.",
		};
	}
	return { assetKey, assetFileName, assetSize: file.size };
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
	const isHda = parsed.language === "HDA";
	const asset: AssetData | { error: string } = isHda
		? await assetData(formData)
		: // Switching an HDA to a code tool drops its file from the tool (the
			// versions keep theirs).
			{ assetKey: "", assetFileName: "", assetSize: 0 };
	if ("error" in asset) return asset;
	const data = { ...parsed, ...icon, ...asset };
	// A new HDA file, as the fields of the version it starts.
	const newFile = isHda && asset.assetKey ? asset : undefined;
	// The version's "commit message"; only recorded when the code or file changed.
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
					assetKey: true,
					versions: {
						orderBy: { number: "desc" },
						take: 1,
						select: { number: true },
					},
				},
			});
			if (!previous) return { error: "This tool no longer exists." };
			previousSlug = previous.slug;
			if (isHda && !newFile && !previous.assetKey) {
				return { error: "Pick the HDA file to upload." };
			}

			const nextNumber = (previous.versions[0]?.number ?? 0) + 1;
			await db.$transaction([
				db.tool.update({ where: { id }, data, select: { id: true } }),
				...(previous.code === data.code && !newFile
					? []
					: [
							db.toolVersion.create({
								data: {
									toolId: id,
									number: nextNumber,
									code: data.code,
									...newFile,
									note,
								},
								select: { id: true },
							}),
						]),
			]);
			revalidatePath(`/tools/${previous.slug}`);
		} else {
			if (isHda && !newFile) return { error: "Pick the HDA file to upload." };
			await db.tool.create({
				data: {
					...data,
					versions: {
						create: {
							number: 1,
							code: data.code,
							...newFile,
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
		// Anything else is unexpected: report it on the form instead of replacing
		// the page with Next's error screen (the draft survives either way).
		console.error("saveTool failed", err);
		const reason = err instanceof Error ? err.message : String(err);
		return { error: `Couldn't save the tool: ${reason}` };
	}

	revalidatePath("/");
	revalidatePath(`/tools/${parsed.slug}`);
	// Back to where Edit was clicked; if that was this tool's own page, follow a
	// renamed slug, and fall back to the admin list if it's no longer public.
	if (previousSlug && returnTo === `/tools/${previousSlug}`) {
		return {
			savedTo: parsed.isPublished
				? `/tools/${parsed.slug}`
				: DEFAULT_RETURN_PATH,
		};
	}
	return { savedTo: returnTo };
}

export async function deleteTool(id: string, returnTo?: string): Promise<void> {
	await requireAdmin();
	const tool = await db.tool.delete({
		where: { id },
		select: { slug: true, versions: { select: { assetKey: true } } },
	});
	// HDA files of every version; a failure only leaves an orphaned file.
	const storage = getMediaStorage();
	await Promise.all(
		tool.versions
			.filter((version) => version.assetKey)
			.map((version) =>
				storage.remove(version.assetKey).catch((err: unknown) => {
					console.error("HDA delete from storage failed", err);
				}),
			),
	);
	revalidatePath("/");
	revalidatePath(`/tools/${tool.slug}`);
	// The tool's own page is gone now; the home page is the nearest thing.
	const target = safeReturnPath(returnTo) ?? DEFAULT_RETURN_PATH;
	redirect(target === `/tools/${tool.slug}` ? "/" : target);
}
