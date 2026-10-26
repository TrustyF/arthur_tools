"use client";

import { X } from "lucide-react";
import { type KeyboardEvent, useEffect, useRef, useState } from "react";
import { type LibraryMedia, listMedia } from "@/server/actions/media-actions";
import styles from "./media.module.sass";
import { MediaUploadButton } from "./media-upload-button";

type MediaPickerProps = {
	isOpen: boolean;
	title: string;
	onClose: () => void;
	// The picker stays open; the caller closes it if one pick is enough.
	onSelect: (media: LibraryMedia) => void;
};

// Enter in the search box would otherwise submit the surrounding tool form.
function blockEnter(event: KeyboardEvent<HTMLInputElement>) {
	if (event.key === "Enter") event.preventDefault();
}

// The media library as a modal: pick an existing image or upload new ones.
export function MediaPicker({
	isOpen,
	title,
	onClose,
	onSelect,
}: MediaPickerProps) {
	const dialogRef = useRef<HTMLDialogElement>(null);
	const [media, setMedia] = useState<LibraryMedia[]>();
	const [query, setQuery] = useState("");

	useEffect(() => {
		const dialog = dialogRef.current;
		if (!dialog) return;
		if (isOpen && !dialog.open) {
			dialog.showModal();
			// Refetched on every open, so uploads from elsewhere show up.
			void listMedia().then(setMedia);
		} else if (!isOpen && dialog.open) {
			dialog.close();
		}
	}, [isOpen]);

	const lower = query.toLowerCase();
	const shown = media?.filter((item) => item.alt.toLowerCase().includes(lower));

	return (
		<dialog
			ref={dialogRef}
			className={styles.dialog}
			// Escape closes the dialog natively; keep the caller's state in step.
			onClose={onClose}
			onClick={(e) => {
				// A click on the backdrop lands on the dialog element itself.
				if (e.target === e.currentTarget) onClose();
			}}>
			<div className={styles.dialogHeader}>
				<h2>{title}</h2>
				<button
					type="button"
					className={styles.iconButton}
					aria-label="Close"
					onClick={onClose}>
					<X size={16} />
				</button>
			</div>
			<div className={styles.toolbar}>
				<input
					type="search"
					className={styles.search}
					placeholder="Filter by name"
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					onKeyDown={blockEnter}
				/>
				<MediaUploadButton
					onUploaded={(item) => setMedia((prev) => [item, ...(prev ?? [])])}
				/>
			</div>
			{!shown ? (
				<p className={styles.hint}>Loading library…</p>
			) : shown.length === 0 ? (
				<p className={styles.hint}>
					{media?.length ? "Nothing matches." : "The library is empty."}
				</p>
			) : (
				<div className={styles.grid}>
					{shown.map((item) => (
						<button
							key={item.id}
							type="button"
							className={styles.tile}
							title={item.alt}
							onClick={() => onSelect(item)}>
							{/* Library images come in any size; next/image needs them up front. */}
							{/* eslint-disable-next-line @next/next/no-img-element */}
							<img src={item.url} alt={item.alt} loading="lazy" />
							<span>{item.alt || "Untitled"}</span>
						</button>
					))}
				</div>
			)}
		</dialog>
	);
}
