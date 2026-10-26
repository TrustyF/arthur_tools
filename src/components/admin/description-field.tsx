"use client";

import { Images } from "lucide-react";
import { type ClipboardEvent, type DragEvent, useRef, useState } from "react";
import { MediaPicker } from "@/components/media/media-picker";
import { useMediaUpload } from "@/components/media/use-media-upload";
import type { LibraryMedia } from "@/server/actions/media-actions";
import styles from "./form.module.sass";

// Markdown alt text can't contain brackets; "|" is the size hint's separator
// (lib/image-size.ts), left empty for the author to fill in.
function markdownImage({ url, alt }: LibraryMedia): string {
	return `![${alt.replace(/[[\]|]/g, "")}|](${url})`;
}

export function DescriptionField({ defaultValue }: { defaultValue: string }) {
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const [isPickerOpen, setIsPickerOpen] = useState(false);
	// Pasted and dropped files go into the library and straight into the text.
	const { upload, status, isError } = useMediaUpload(insertImage);

	// Blank lines make it its own paragraph, spaced from the text around it.
	function insertImage(media: LibraryMedia) {
		const el = textareaRef.current;
		if (!el) return;
		const text = `\n\n${markdownImage(media)}\n\n`;
		el.setRangeText(text, el.selectionStart, el.selectionEnd, "end");
		// setRangeText fires no input event; the form's draft autosave needs one.
		el.dispatchEvent(new Event("input", { bubbles: true }));
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
					onClick={() => setIsPickerOpen(true)}>
					<Images size={14} />
					Insert image
				</button>
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
					"Markdown. Paste or drop images to upload. Size after the |: |400, |x300, |400x300."}
			</span>
			<MediaPicker
				isOpen={isPickerOpen}
				title="Insert image"
				onClose={() => setIsPickerOpen(false)}
				onSelect={(media) => {
					setIsPickerOpen(false);
					insertImage(media);
				}}
			/>
		</div>
	);
}
