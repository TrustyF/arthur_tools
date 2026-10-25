import { LANGUAGE_EXTENSION } from "@/lib/tool-language";
import { db } from "@/server/db/client";
import { recordToolStat, shouldCount } from "@/server/tools/tool-stats";

export async function GET(
	req: Request,
	ctx: RouteContext<"/tools/[slug]/raw">,
) {
	const { slug } = await ctx.params;
	const tool = await db.tool.findFirst({ where: { slug, isPublished: true } });
	if (!tool) return new Response("Not found", { status: 404 });

	if (await shouldCount(req)) await recordToolStat(tool.id, "downloads");

	const fileName = `${tool.slug}.${LANGUAGE_EXTENSION[tool.language]}`;
	return new Response(tool.code, {
		headers: {
			"Content-Type": "text/plain; charset=utf-8",
			"Content-Disposition": `attachment; filename="${fileName}"`,
			// Every download must reach the server to be counted.
			"Cache-Control": "no-store",
		},
	});
}
