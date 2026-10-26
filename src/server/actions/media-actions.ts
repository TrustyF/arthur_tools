"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import { db } from "@/server/db/client";
import {
	MAX_MEDIA_UPLOAD_BYTES,
	processMedia,
} from "@/server/images/process-media";
import { mediaUsage } from "@/server/media/media-usage";
import { getMediaStorage } from "@/server/storage/media-storage";

// One item of the library (admin/media, and the editor's picker).
export type LibraryMedia = {
	id: string;
	url: string;
	// File name without extension, as a starting alt text.
	alt: string;
	width: number;
	height: number;
};

export type UploadMediaResult = LibraryMedia | { error: string };

function altFor(fileName: string): string {
	return fileName.replace(/\.[^.]+$/, "");
}

// Adds one file to the library. Called from the library page, the editor's
// picker, and pasting or dropping into the description.
export async function uploadMedia(
	formData: FormData,
): Promise<UploadMediaResult> {
	await requireAdmin();

	const file = formData.get("file");
	if (!(file instanceof File) || file.size === 0) {
		return { error: "No file received." };
	}
	if (file.size > MAX_MEDIA_UPLOAD_BYTES) {
		return { error: "Images and GIFs must be under 20 MB." };
	}

	let processed: Awaited<ReturnType<typeof processMedia>>;
	try {
		processed = await processMedia(await file.arrayBuffer());
	} catch {
		return { error: `Couldn't read "${file.name}" as an image.` };
	}

	const storage = getMediaStorage();
	const key = `media/${randomUUID()}.webp`;
	let url: string;
	try {
		await storage.write(key, processed.data, "image/webp");
		url = storage.urlFor(key);
	} catch (err) {
		console.error("Media upload to storage failed", err);
		return {
			error: "Couldn't store the image. Check the media storage settings.",
		};
	}

	const fileName = file.name.slice(0, 200);
	const { id } = await db.media.create({
		data: {
			key,
			width: processed.width,
			height: processed.height,
			fileName,
		},
		select: { id: true },
	});
	revalidatePath("/admin/media");
	return {
		id,
		url,
		alt: altFor(fileName),
		width: processed.width,
		height: processed.height,
	};
}

// Newest first, for the editor's picker.
export async function listMedia(): Promise<LibraryMedia[]> {
	await requireAdmin();
	const storage = getMediaStorage();
	const media = await db.media.findMany({ orderBy: { createDate: "desc" } });
	return media.map((item) => ({
		id: item.id,
		url: storage.urlFor(item.key),
		alt: altFor(item.fileName),
		width: item.width,
		height: item.height,
	}));
}

// Refused while any tool still shows the image, so nothing breaks silently.
export async function deleteMedia(
	id: string,
): Promise<{ error: string } | undefined> {
	await requireAdmin();
	const media = await db.media.findUnique({
		where: { id },
		select: { key: true },
	});
	if (!media) return undefined;

	const users = (await mediaUsage([media.key])).get(media.key) ?? [];
	if (users.length > 0) {
		return {
			error: `Still used by ${users.map((tool) => tool.name).join(", ")}.`,
		};
	}

	try {
		// Storage first: if that fails the row stays, so a retry can finish the job.
		await getMediaStorage().remove(media.key);
	} catch (err) {
		console.error("Media delete from storage failed", err);
		return { error: "Couldn't delete the file from media storage." };
	}
	await db.media.delete({ where: { id }, select: { id: true } });
	revalidatePath("/admin/media");
	return undefined;
}
