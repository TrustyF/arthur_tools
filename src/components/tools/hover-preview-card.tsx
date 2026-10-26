"use client";

import { type ReactNode, useRef, useState } from "react";
import styles from "./tool-card.module.sass";

type HoverPreviewCardProps = {
	// Tool.previewUrl; empty renders a plain card.
	previewUrl: string;
	children: ReactNode;
};

// Mounted only on mouse hover. Browsers share one animation per image URL, so
// each hover gets a fresh blob: URL of the same bytes to restart the GIF.
export function HoverPreviewCard({
	previewUrl,
	children,
}: HoverPreviewCardProps) {
	const [src, setSrc] = useState<string>();
	const blob = useRef<Promise<Blob | undefined>>(undefined);
	const isHovered = useRef(false);

	// Needs CORS on the media bucket in production; without it the preview
	// still shows, it just doesn't restart.
	function loadBlob() {
		blob.current ??= fetch(previewUrl)
			.then((res) => (res.ok ? res.blob() : undefined))
			.catch(() => undefined);
		return blob.current;
	}

	async function show() {
		isHovered.current = true;
		const loaded = blob.current && (await blob.current);
		// The pointer may have left while the blob was still downloading.
		if (!isHovered.current) return;
		if (loaded) {
			setSrc(URL.createObjectURL(loaded));
			return;
		}
		// First hover: the plain URL plays from the start anyway.
		setSrc(previewUrl);
		void loadBlob();
	}

	function hide() {
		isHovered.current = false;
		if (src?.startsWith("blob:")) URL.revokeObjectURL(src);
		setSrc(undefined);
	}

	return (
		<article
			className={styles.card}
			onPointerEnter={(e) => {
				if (previewUrl && e.pointerType === "mouse") void show();
			}}
			onPointerLeave={hide}>
			{children}
			{src && (
				<div className={styles.preview} aria-hidden>
					{/* Any size and aspect ratio; next/image needs dimensions up front. */}
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img src={src} alt="" />
				</div>
			)}
		</article>
	);
}
