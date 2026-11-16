// HDA files (Tool.assetKey), shared by the editor's file field and saveTool.

// Below next.config.ts's 21 MB serverActions.bodySizeLimit, which also has to
// carry the rest of the form. The editor checks this before submitting.
export const MAX_ASSET_BYTES = 20 * 1024 * 1024;

// Houdini's asset library extensions (nc/lc: non-commercial and Indie files).
export const ASSET_EXTENSIONS = [
	".hda",
	".otl",
	".hdanc",
	".otlnc",
	".hdalc",
	".otllc",
] as const;

export function hasAssetExtension(fileName: string): boolean {
	const lower = fileName.toLowerCase();
	return ASSET_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

// Why a picked file can't be uploaded, or undefined when it's fine.
export function assetFileProblem(file: {
	name: string;
	size: number;
}): string | undefined {
	if (!hasAssetExtension(file.name)) {
		return `"${file.name}" isn't an HDA (${ASSET_EXTENSIONS.join(", ")}).`;
	}
	if (file.size > MAX_ASSET_BYTES) {
		return `HDAs must be under ${formatBytes(MAX_ASSET_BYTES)}; "${file.name}" is ${formatBytes(file.size)}.`;
	}
	return undefined;
}

// The download name, so only URL- and header-safe characters. Houdini names
// like "arthur.netbox.1.0.hda" pass through unchanged.
export function safeAssetFileName(fileName: string): string {
	return fileName
		.replace(/[^\w.-]+/g, "_")
		.replace(/^[._]+/, "")
		.slice(-120);
}

export function formatBytes(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
