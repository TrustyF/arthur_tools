// Obsidian-style max size in px in image alt text: ![alt|400], ![alt|400x300],
// ![alt|x300]. A bare "|" (what uploads insert) means no limit.
const SIZE_HINT = /^(.*?)\|\s*(\d*)\s*(?:x\s*(\d*))?\s*$/;

export type ImageAlt = {
	alt: string;
	maxWidth: number | undefined;
	maxHeight: number | undefined;
};

export function parseImageAlt(raw: string): ImageAlt {
	const match = SIZE_HINT.exec(raw);
	if (!match) return { alt: raw, maxWidth: undefined, maxHeight: undefined };
	const [, alt = "", width, height] = match;
	return {
		alt: alt.trim(),
		maxWidth: width ? Number(width) : undefined,
		maxHeight: height ? Number(height) : undefined,
	};
}
