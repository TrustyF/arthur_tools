import "server-only";
import { db } from "@/server/db/client";

export type MediaUser = { id: string; name: string };

// Which tools use each storage key, in a description or as the hover preview.
// Matched on keys rather than URLs, so a change of CDN domain changes nothing.
export async function mediaUsage(
	keys: string[],
): Promise<Map<string, MediaUser[]>> {
	const tools = await db.tool.findMany({
		select: { id: true, name: true, description: true, previewUrl: true },
		orderBy: { name: "asc" },
	});
	return new Map(
		keys.map((key) => [
			key,
			tools
				.filter(
					(tool) =>
						tool.description.includes(key) || tool.previewUrl.includes(key),
				)
				.map(({ id, name }) => ({ id, name })),
		]),
	);
}
