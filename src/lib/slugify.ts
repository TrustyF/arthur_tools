export function slugify(value: string): string {
	return (
		value
			// Split accented letters into base + combining mark, then drop the marks.
			.normalize("NFKD")
			.replace(/[̀-ͯ]/g, "")
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-+|-+$/g, "")
	);
}
