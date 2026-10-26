"use client";

import { Images } from "lucide-react";
import { useRef, useState } from "react";
import { MediaPicker } from "@/components/media/media-picker";
import styles from "./form.module.sass";

// The card's hover preview, picked from the media library; the tool form only
// submits its URL.
export function PreviewField({ defaultValue }: { defaultValue: string }) {
	const urlRef = useRef<HTMLInputElement>(null);
	const [url, setUrl] = useState(defaultValue);
	const [isPickerOpen, setIsPickerOpen] = useState(false);

	function setValue(next: string) {
		setUrl(next);
		const el = urlRef.current;
		if (!el) return;
		el.value = next;
		// Hidden inputs fire no input event; the form's draft autosave needs one.
		el.dispatchEvent(new Event("input", { bubbles: true }));
	}

	return (
		<div className={styles.field}>
			<div className={styles.fieldHeader}>
				<span>Hover preview</span>
				<div className={styles.fieldActions}>
					{url && (
						<button
							type="button"
							className={styles.inlineButton}
							onClick={() => setValue("")}>
							Remove
						</button>
					)}
					<button
						type="button"
						className={styles.inlineButton}
						onClick={() => setIsPickerOpen(true)}>
						<Images size={14} />
						{url ? "Change" : "Choose GIF"}
					</button>
				</div>
				<input
					ref={urlRef}
					type="hidden"
					name="previewUrl"
					defaultValue={defaultValue}
				/>
			</div>
			{url ? (
				// Any size and aspect ratio; next/image needs dimensions up front.
				// eslint-disable-next-line @next/next/no-img-element
				<img src={url} alt="" className={styles.previewImage} />
			) : (
				<span className={styles.hint}>
					Plays when hovering the tool&apos;s card. A short GIF of it in use.
				</span>
			)}
			<MediaPicker
				isOpen={isPickerOpen}
				title="Hover preview"
				onClose={() => setIsPickerOpen(false)}
				onSelect={(media) => {
					setIsPickerOpen(false);
					setValue(media.url);
				}}
			/>
		</div>
	);
}
