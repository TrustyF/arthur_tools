"use client";

import { useRouter } from "next/navigation";
import { MediaUploadButton } from "./media-upload-button";

// The library page's upload: re-renders the page's grid as each file lands.
export function LibraryUpload() {
	const router = useRouter();
	return <MediaUploadButton onUploaded={() => router.refresh()} />;
}
