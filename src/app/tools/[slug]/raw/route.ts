import { toolFileName } from "@/lib/tool-language";
import { db } from "@/server/db/client";
import {
	getMediaStorage,
	isR2MediaStorage,
	readLocalMedia,
} from "@/server/storage/media-storage";
import { recordToolStat, shouldCount } from "@/server/tools/tool-stats";

// Every download must reach the server to be counted.
const NO_STORE = "no-store";

export async function GET(
	req: Request,
	ctx: RouteContext<"/tools/[slug]/raw">,
) {
	const { slug } = await ctx.params;
	const tool = await db.tool.findFirst({ where: { slug, isPublished: true } });
	if (!tool) return new Response("Not found", { status: 404 });

	if (tool.language === "HDA") return downloadHda(req, tool);

	if (await shouldCount(req)) await recordToolStat(tool.id, "downloads");

	const fileName = toolFileName(tool.slug, tool.language);
	return new Response(tool.code, {
		headers: {
			"Content-Type": "text/plain; charset=utf-8",
			"Content-Disposition": `attachment; filename="${fileName}"`,
			"Cache-Control": NO_STORE,
		},
	});
}

// The tool's current file, or ?v=<n> for an older version's (history pages).
async function downloadHda(
	req: Request,
	tool: { id: string; assetKey: string; assetFileName: string },
) {
	const version = new URL(req.url).searchParams.get("v");
	let file = { key: tool.assetKey, name: tool.assetFileName };
	if (version) {
		const number = Number(version);
		if (!Number.isInteger(number)) {
			return new Response("Not found", { status: 404 });
		}
		const row = await db.toolVersion.findUnique({
			where: { toolId_number: { toolId: tool.id, number } },
			select: { assetKey: true, assetFileName: true },
		});
		if (!row?.assetKey) return new Response("Not found", { status: 404 });
		file = { key: row.assetKey, name: row.assetFileName };
	}
	if (!file.key) return new Response("Not found", { status: 404 });

	if (await shouldCount(req)) await recordToolStat(tool.id, "downloads");

	// R2 serves the file itself; its key ends in the file name.
	if (isR2MediaStorage()) {
		return new Response(null, {
			status: 302,
			headers: {
				Location: getMediaStorage().urlFor(file.key),
				"Cache-Control": NO_STORE,
			},
		});
	}

	const bytes = await readLocalMedia(file.key);
	if (!bytes) return new Response("Not found", { status: 404 });
	return new Response(new Uint8Array(bytes), {
		headers: {
			"Content-Type": "application/octet-stream",
			"Content-Disposition": `attachment; filename="${file.name}"`,
			"Cache-Control": NO_STORE,
		},
	});
}
