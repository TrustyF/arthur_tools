// Shelf-tool style names: category prefix, then the icon, e.g. "SOP_null".
export const HOUDINI_ICON_PATTERN = /^[A-Z0-9]+_[A-Za-z0-9_.-]+$/;

// Where import-houdini-icons.ts writes the rendered icons and the picker's name list.
export const HOUDINI_ICONS_URL = "/houdini-icons";
export const HOUDINI_ICON_MANIFEST_URL = `${HOUDINI_ICONS_URL}/manifest.json`;

// "SOP_null" → /houdini-icons/SOP/null.webp, mirroring icons.zip's layout.
export function houdiniIconSrc(name: string): string {
	const split = name.indexOf("_");
	return `${HOUDINI_ICONS_URL}/${name.slice(0, split)}/${name.slice(split + 1)}.webp`;
}

type IconFields = {
	slug: string;
	houdiniIcon: string;
	customIconDate: Date | null;
};

// Custom upload wins; the date query param busts caches when it's replaced.
export function toolIconSrc(tool: IconFields): string | undefined {
	if (tool.customIconDate) {
		return `/tools/${tool.slug}/icon?v=${tool.customIconDate.getTime()}`;
	}
	if (tool.houdiniIcon) return houdiniIconSrc(tool.houdiniIcon);
	return undefined;
}
