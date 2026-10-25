import "server-only";
import sharp from "sharp";

export const ICON_SIZE = 128;
export const MAX_ICON_UPLOAD_BYTES = 5 * 1024 * 1024;

// Any image sharp reads (PNG, JPEG, WebP, SVG, ...) → square WebP, letterboxed
// on transparency so non-square uploads aren't cropped. Throws on unreadable input.
export function processIcon(input: ArrayBuffer): Promise<Buffer> {
	return sharp(Buffer.from(input), { density: 300 })
		.resize(ICON_SIZE, ICON_SIZE, {
			fit: "contain",
			background: { r: 0, g: 0, b: 0, alpha: 0 },
		})
		.webp({ quality: 90 })
		.toBuffer();
}
