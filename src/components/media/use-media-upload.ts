"use client";

import { useState } from "react";
import { type LibraryMedia, uploadMedia } from "@/server/actions/media-actions";

// Uploads images one at a time into the library, reporting progress as text.
export function useMediaUpload(onUploaded: (media: LibraryMedia) => void) {
	const [status, setStatus] = useState<string>();
	const [isError, setIsError] = useState(false);

	async function upload(files: File[]) {
		const images = files.filter((file) => file.type.startsWith("image/"));
		if (images.length === 0) return;
		setIsError(false);

		for (const [i, file] of images.entries()) {
			setStatus(
				images.length > 1
					? `Uploading ${file.name} (${i + 1}/${images.length})…`
					: `Uploading ${file.name}…`,
			);
			const body = new FormData();
			body.set("file", file);
			const result = await uploadMedia(body);
			if ("error" in result) {
				setStatus(result.error);
				setIsError(true);
				return;
			}
			onUploaded(result);
		}
		setStatus(undefined);
	}

	return { upload, status, isError };
}
