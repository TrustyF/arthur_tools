// Usage: npm run import_houdini_icons -- <path>
// <path>: a Houdini install ($HFS), its houdini/config/Icons/icons.zip, or an extracted copy.

// Renders each CATEGORY/name.svg to public/houdini-icons as WebP, plus manifest.json
// (the picker's name list). Re-run after upgrading Houdini; it replaces the last import.
import { existsSync, statSync } from "node:fs";
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import AdmZip from "adm-zip";
import sharp from "sharp";
import {
	HOUDINI_ICON_PATTERN,
	HOUDINI_ICONS_URL,
	houdiniIconSrc,
} from "@/lib/tool-icon";

const PUBLIC_DIR = path.resolve(process.cwd(), "public");
const OUT_DIR = path.join(PUBLIC_DIR, HOUDINI_ICONS_URL);
// Houdini's alias list ("SOP_null := COMMON_null;"), at the archive root.
const MAPPING_FILE = "IconMapping";
// Icons display at ≤36px; 96px stays sharp on 2x screens. Houdini's SVGs run
// up to ~500KB each (175MB total), the rendered WebPs a few KB.
const RENDER_SIZE = 96;
const RENDER_CONCURRENCY = 8;

type Read = () => Promise<Buffer>;
type Source = { icons: Map<string, Read>; mapping: string | undefined };

function resolveSource(input: string): string {
	const candidates = [
		path.join(input, "houdini", "config", "Icons", "icons.zip"),
		path.join(input, "icons.zip"),
	];
	if (statSync(input).isDirectory()) {
		return candidates.find((c) => existsSync(c)) ?? input;
	}
	return input;
}

// "SOP/null.svg" → "SOP_null", or undefined for anything that isn't a
// top-level category icon (nested folders, PNGs, readmes, ...).
function iconName(relPath: string): string | undefined {
	const parts = relPath.split(/[\\/]/);
	const [category, file] = parts;
	if (parts.length !== 2 || !category || !file?.endsWith(".svg")) return;
	const name = `${category}_${file.slice(0, -".svg".length)}`;
	return HOUDINI_ICON_PATTERN.test(name) ? name : undefined;
}

function fromZip(zipPath: string): Source {
	const zip = new AdmZip(zipPath);
	const icons = new Map<string, Read>();
	for (const entry of zip.getEntries()) {
		const name = entry.isDirectory ? undefined : iconName(entry.entryName);
		if (name) icons.set(name, async () => entry.getData());
	}
	const mapping = zip.getEntry(MAPPING_FILE)?.getData().toString("utf8");
	return { icons, mapping };
}

async function fromDir(dir: string): Promise<Source> {
	const entries = await readdir(dir, { recursive: true, withFileTypes: true });
	const icons = new Map<string, Read>();
	for (const entry of entries) {
		if (!entry.isFile()) continue;
		const full = path.join(entry.parentPath, entry.name);
		const name = iconName(path.relative(dir, full));
		if (name) icons.set(name, () => readFile(full));
	}
	const mappingPath = path.join(dir, MAPPING_FILE);
	const mapping = existsSync(mappingPath)
		? await readFile(mappingPath, "utf8")
		: undefined;
	return { icons, mapping };
}

// Houdini applies these unconditionally, so an alias replaces any same-named
// icon. Chains (A := B; B := C;) are followed; cycles and dead ends are skipped.
function applyAliases(icons: Map<string, Read>, mapping: string): number {
	const aliases = new Map<string, string>();
	for (const match of mapping.matchAll(/^\s*(\S+)\s*:=\s*(\S+?)\s*;/gm)) {
		const [, from, to] = match;
		if (from && to && HOUDINI_ICON_PATTERN.test(from)) aliases.set(from, to);
	}

	let applied = 0;
	for (const from of aliases.keys()) {
		let target = from;
		const seen = new Set<string>();
		while (aliases.has(target) && !seen.has(target)) {
			seen.add(target);
			target = aliases.get(target) as string;
		}
		const read = icons.get(target);
		if (read && target !== from) {
			icons.set(from, read);
			applied++;
		}
	}
	return applied;
}

// A few Illustrator exports declare xmlns:ns0="&#38;#38;ns_ai;", which Houdini
// tolerates but librsvg rejects. The prefixes are used, so swap in a valid URI.
function repairNamespaces(svg: Buffer): Buffer {
	const text = svg.toString("utf8");
	const fixed = text.replace(
		/(xmlns:[\w.-]+=")[^"]*&[^"]*"/g,
		'$1urn:x-invalid"',
	);
	return fixed === text ? svg : Buffer.from(fixed);
}

async function main() {
	const input = process.argv[2];
	if (!input || !existsSync(input)) {
		console.error(
			"Usage: npm run import_houdini_icons -- <HFS | icons.zip | folder>",
		);
		process.exit(1);
	}

	const source = resolveSource(input);
	const { icons, mapping } = source.endsWith(".zip")
		? fromZip(source)
		: await fromDir(source);
	if (icons.size === 0) {
		console.error(`No CATEGORY/name.svg icons found in ${source}`);
		process.exit(1);
	}
	const aliased = mapping ? applyAliases(icons, mapping) : 0;

	await rm(OUT_DIR, { recursive: true, force: true });

	// Aliases share their target's Read, so each source SVG renders once.
	const renders = new Map<Read, Promise<Buffer>>();
	const render = (read: Read) => {
		let result = renders.get(read);
		if (!result) {
			result = read().then((svg) =>
				sharp(repairNamespaces(svg), { density: 300 })
					.resize(RENDER_SIZE, RENDER_SIZE, {
						fit: "contain",
						background: { r: 0, g: 0, b: 0, alpha: 0 },
					})
					.webp({ quality: 90 })
					.toBuffer(),
			);
			renders.set(read, result);
		}
		return result;
	};

	const names: string[] = [];
	const failed: string[] = [];
	const queue = [...icons];
	async function worker() {
		for (let item = queue.pop(); item; item = queue.pop()) {
			const [name, read] = item;
			try {
				const image = await render(read);
				// Same path the site requests, so import and lookup can't drift apart.
				const target = path.join(PUBLIC_DIR, houdiniIconSrc(name));
				await mkdir(path.dirname(target), { recursive: true });
				await writeFile(target, image);
				names.push(name);
			} catch {
				failed.push(name);
			}
		}
	}
	await Promise.all(Array.from({ length: RENDER_CONCURRENCY }, worker));

	names.sort();
	await writeFile(path.join(OUT_DIR, "manifest.json"), JSON.stringify(names));

	console.log(
		`Imported ${names.length} icons (${aliased} via IconMapping aliases) from ${source}`,
	);
	if (failed.length > 0) {
		console.warn(`Skipped ${failed.length} unrenderable: ${failed.join(", ")}`);
	}
}

main();
