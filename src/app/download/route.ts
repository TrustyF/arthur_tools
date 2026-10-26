import { db } from "@/server/db/client";
import { BUNDLE_FILE_NAME, buildBundle } from "@/server/tools/tool-bundle";
import { recordToolStat, shouldCount } from "@/server/tools/tool-stats";

// Every published tool as one Houdini package with its own shelf; see
// server/tools/tool-bundle.ts for the layout and the /help#bundle section.
export async function GET(req: Request) {
	const tools = await db.tool.findMany({
		where: { isPublished: true },
		// Shelf order: pinned first, then alphabetical.
		orderBy: [{ isPinned: "desc" }, { name: "asc" }],
		select: {
			id: true,
			slug: true,
			name: true,
			summary: true,
			language: true,
			context: true,
			houdiniIcon: true,
			customIcon: true,
			code: true,
			shortcut: true,
		},
	});

	// Taking the bundle takes every tool in it, so each one's count goes up.
	if (await shouldCount(req)) {
		await Promise.all(
			tools.map((tool) => recordToolStat(tool.id, "downloads")),
		);
	}

	const zip = await buildBundle(tools);
	return new Response(new Uint8Array(zip), {
		headers: {
			"Content-Type": "application/zip",
			"Content-Disposition": `attachment; filename="${BUNDLE_FILE_NAME}"`,
			// Always built from the current tools, and every download is counted.
			"Cache-Control": "no-store",
		},
	});
}
