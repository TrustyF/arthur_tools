"use client";

import { ImagePlus } from "lucide-react";
import { type ClipboardEvent, type DragEvent, useRef, useState } from "react";
import { uploadMedia } from "@/server/actions/media-actions";
import styles from "./form.module.sass";

// Markdown alt text can't contain brackets.
function markdownImage(url: string, alt: string): string {
	return `![${alt.replace(/[[\]]/g, "")}](${url})`;
}

export function DescriptionField({ defaultValue }: { defaultValue: string }) {
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [status, setStatus] = useState<string>();
	const [isError, setIsError] = useState(false);

	// Uploads one at a time, each inserted as its own block at the cursor.
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
			// Blank lines make it its own paragraph, spaced from the text around it.
			insertAtCursor(`\n\n${markdownImage(result.url, result.alt)}\n\n`);
		}
		setStatus(undefined);
	}

	function insertAtCursor(text: string) {
		const el = textareaRef.current;
		if (!el) return;
		el.setRangeText(text, el.selectionStart, el.selectionEnd, "end");
		el.focus();
	}

	function onPaste(event: ClipboardEvent<HTMLTextAreaElement>) {
		const files = [...event.clipboardData.files];
		if (files.some((file) => file.type.startsWith("image/"))) {
			event.preventDefault();
			void upload(files);
		}
	}

	function onDrop(event: DragEvent<HTMLTextAreaElement>) {
		const files = [...event.dataTransfer.files];
		if (files.length > 0) {
			event.preventDefault();
			void upload(files);
		}
	}

	return (
		<div className={styles.field}>
			<div className={styles.fieldHeader}>
				<label htmlFor="description">Description</label>
				<button
					type="button"
					className={styles.inlineButton}
					onClick={() => fileInputRef.current?.click()}>
					<ImagePlus size={14} />
					Add image/GIF
				</button>
				{/* No name: picked files go through uploadMedia, not the tool form. */}
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
			</div>
			<textarea
				ref={textareaRef}
				id="description"
				name="description"
				rows={8}
				defaultValue={defaultValue}
				onPaste={onPaste}
				onDrop={onDrop}
			/>
			<span className={isError ? styles.error : styles.hint}>
				{status ??
					"Markdown. Paste or drop images and GIFs to upload them (up to 20 MB)."}
			</span>
		</div>
	);
}
