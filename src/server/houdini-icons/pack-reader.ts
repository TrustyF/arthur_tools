import "server-only";
import { type FileHandle, open } from "node:fs/promises";
import {
	HOUDINI_ICON_PACK_PATH,
	type PackIndex,
	readPackIndex,
} from "@/lib/houdini-icon-pack";

type LoadedPack = { index: PackIndex; dataStart: number; mtimeMs: number };

let loaded: LoadedPack | undefined;

// Index and bytes come from one open file, so a pack swapped in mid-request can't
// mix old and new; a changed file reloads the index. Undefined until imported.
async function withPack<T>(
	read: (file: FileHandle, pack: LoadedPack) => Promise<T>,
): Promise<T | undefined> {
	const file = await open(HOUDINI_ICON_PACK_PATH, "r").catch(() => undefined);
	if (!file) return undefined;
	try {
		const { mtimeMs } = await file.stat();
		if (loaded?.mtimeMs !== mtimeMs) {
			loaded = { ...readPackIndex(file.fd), mtimeMs };
		}
		return await read(file, loaded);
	} finally {
		await file.close();
	}
}

export function getHoudiniIconNames(): Promise<string[] | undefined> {
	return withPack(async (_file, pack) => Object.keys(pack.index).sort());
}

export async function readHoudiniIcon(
	name: string,
): Promise<Buffer | undefined> {
	const icon = await withPack(async (file, pack) => {
		const entry = pack.index[name];
		if (!entry) return undefined;
		const [offset, length] = entry;
		const buffer = Buffer.alloc(length);
		await file.read(buffer, 0, length, pack.dataStart + offset);
		return buffer;
	});
	return icon ?? undefined;
}
