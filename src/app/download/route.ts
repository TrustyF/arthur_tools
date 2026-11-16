import { db } from "@/server/db/client";
import { BUNDLE_FILE_NAME, buildBundle } from "@/server/tools/tool-bundle";
import { recordToolStat, shouldCount } from "@/server/tools/tool-stats";

// Published Python scripts as one Houdini package with its own shelf (tool-bundle.ts).
// ?tools=slug-a,slug-b (from /shelf) limits it to those tools, in that order.
export async function GET(req: Request) {
	const picked = new URL(req.url).searchParams.get("tools");
	const slugs = picked
		?.split(",")
		.map((slug) => slug.trim())
		.filter(Boolean);
	if (slugs && slugs.length === 0) {
		return new Response("No tools picked.", { status: 400 });
	}

	const found = await db.tool.findMany({
		where: {
			isPublished: true,
			language: "PYTHON",
			...(slugs ? { slug: { in: slugs } } : {}),
		},
		// Order for the full download: pinned first, then alphabetical.
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

	// Picked tools keep the order they were given in.
	const tools = slugs
		? found.toSorted((a, b) => slugs.indexOf(a.slug) - slugs.indexOf(b.slug))
		: found;

	// Unknown or unpublished slugs only: nothing to put on the shelf.
	if (tools.length === 0) {
		return new Response("None of those tools exist.", { status: 404 });
	}

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
