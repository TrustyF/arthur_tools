import "server-only";
import sharp from "sharp";

export const MAX_MEDIA_UPLOAD_BYTES = 20 * 1024 * 1024;
// Wide enough for the content column on 2x screens; larger recordings shrink.
const MAX_WIDTH = 1280;

export type ProcessedMedia = { data: Buffer; width: number; height: number };

// GIF → animated WebP (much smaller, plays everywhere current), anything else
// sharp reads → WebP. Throws on unreadable input.
export async function processMedia(
	input: ArrayBuffer,
): Promise<ProcessedMedia> {
	const { data, info } = await sharp(Buffer.from(input), { animated: true })
		.resize({ width: MAX_WIDTH, withoutEnlargement: true })
		.webp({ quality: 80, effort: 4 })
		.toBuffer({ resolveWithObject: true });
	// Animated output reports the whole frame strip as `height`; pageHeight is one frame.
	return { data, width: info.width, height: info.pageHeight ?? info.height };
}
