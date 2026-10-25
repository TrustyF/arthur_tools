import { createHash } from "node:crypto";
import { closeSync, openSync, readSync } from "node:fs";
import path from "node:path";

// Layout: "HIP1" | uint32 LE index length | index JSON | image bytes.
// One file, so swapping it in (rename) can never pair an index with the wrong data.
const MAGIC = "HIP1";
const HEADER_BYTES = 8;

// name → [offset, length], offsets counted from the start of the image bytes.
export type PackIndex = Record<string, [number, number]>;

// Relative to the working directory: the repo root locally, /app in the container.
export const HOUDINI_ICON_PACK_PATH = path.resolve(
	process.env.HOUDINI_ICON_PACK ?? "data/houdini-icons.pack",
);

// Identical images (aliases, and the odd duplicate icon) are stored once.
export function buildPack(icons: Map<string, Buffer>): Buffer {
	const index: PackIndex = {};
	const stored = new Map<string, [number, number]>();
	const chunks: Buffer[] = [];
	let size = 0;

	for (const [name, image] of icons) {
		const hash = createHash("sha1").update(image).digest("hex");
		let entry = stored.get(hash);
		if (!entry) {
			entry = [size, image.length];
			stored.set(hash, entry);
			chunks.push(image);
			size += image.length;
		}
		index[name] = entry;
	}

	const indexBytes = Buffer.from(JSON.stringify(index));
	const header = Buffer.alloc(HEADER_BYTES);
	header.write(MAGIC, 0, "ascii");
	header.writeUInt32LE(indexBytes.length, 4);
	return Buffer.concat([header, indexBytes, ...chunks]);
}

function readAt(fd: number, position: number, length: number): Buffer {
	const buffer = Buffer.alloc(length);
	readSync(fd, buffer, 0, length, position);
	return buffer;
}

// Reads only the header and index from an open file; images are read later by offset.
export function readPackIndex(fd: number): {
	index: PackIndex;
	dataStart: number;
} {
	const header = readAt(fd, 0, HEADER_BYTES);
	if (header.toString("ascii", 0, 4) !== MAGIC) {
		throw new Error("Not a Houdini icon pack");
	}
	const indexLength = header.readUInt32LE(4);
	const index = JSON.parse(
		readAt(fd, HEADER_BYTES, indexLength).toString("utf8"),
	) as PackIndex;
	return { index, dataStart: HEADER_BYTES + indexLength };
}

// For scripts checking a pack they just wrote.
export function readPackIndexFromPath(filePath: string) {
	const fd = openSync(filePath, "r");
	try {
		return readPackIndex(fd);
	} finally {
		closeSync(fd);
	}
}
