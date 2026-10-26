"use client";

import { type ReactNode, useState } from "react";
import styles from "./tool-card.module.sass";

type HoverPreviewCardProps = {
	// Tool.previewUrl; empty renders a plain card.
	previewUrl: string;
	children: ReactNode;
};

// Mounted only while a mouse is over the card: nothing downloads until someone
// hovers, and the GIF restarts from its first frame each time.
export function HoverPreviewCard({
	previewUrl,
	children,
}: HoverPreviewCardProps) {
	const [isHovered, setIsHovered] = useState(false);

	return (
		<article
			className={styles.card}
			onPointerEnter={(e) => {
				if (previewUrl && e.pointerType === "mouse") setIsHovered(true);
			}}
			onPointerLeave={() => setIsHovered(false)}>
			{children}
			{isHovered && (
				<div className={styles.preview} aria-hidden>
					{/* Any size and aspect ratio; next/image needs dimensions up front. */}
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img src={previewUrl} alt="" />
				</div>
			)}
		</article>
	);
}
