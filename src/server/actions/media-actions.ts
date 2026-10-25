"use server";

import { randomUUID } from "node:crypto";
import { requireAdmin } from "@/lib/auth/require-admin";
import { db } from "@/server/db/client";
import {
	MAX_MEDIA_UPLOAD_BYTES,
	processMedia,
} from "@/server/images/process-media";
import { getMediaStorage } from "@/server/storage/media-storage";

export type UploadMediaResult =
	| { url: string; alt: string }
	| { error: string };

// Called from the description editor (paste, drop or the button); the caller
// inserts the returned URL into the Markdown.
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
	await db.media.create({
		data: {
			key,
			width: processed.width,
			height: processed.height,
			fileName,
		},
		select: { id: true },
	});
	// File name without extension, as a starting alt text.
	return { url, alt: fileName.replace(/\.[^.]+$/, "") };
}
