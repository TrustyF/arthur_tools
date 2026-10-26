"use client";

import { Upload } from "lucide-react";
import { useRef } from "react";
import type { LibraryMedia } from "@/server/actions/media-actions";
import styles from "./media.module.sass";
import { useMediaUpload } from "./use-media-upload";

type MediaUploadButtonProps = {
	onUploaded: (media: LibraryMedia) => void;
};

export function MediaUploadButton({ onUploaded }: MediaUploadButtonProps) {
	const fileInputRef = useRef<HTMLInputElement>(null);
	const { upload, status, isError } = useMediaUpload(onUploaded);

	return (
		<div className={styles.uploadRow}>
			<button
				type="button"
				className={styles.button}
				onClick={() => fileInputRef.current?.click()}>
				<Upload size={14} />
				Upload
			</button>
			{/* No name: inside the tool form, but never submitted with it. */}
			<input
				ref={fileInputRef}
				type="file"
				accept="image/gif,image/png,image/jpeg,image/webp"
				multiple
				hidden
				onChange={(e) => {
					void upload([...(e.target.files ?? [])]);
					e.target.value = "";
				}}
			/>
			<span className={isError ? styles.error : styles.hint}>
				{status ?? "GIFs, PNG, JPEG or WebP, up to 20 MB each."}
			</span>
		</div>
	);
}
