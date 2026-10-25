import { LANGUAGE_EXTENSION } from "@/lib/tool-language";
import { db } from "@/server/db/client";

export async function GET(
	_req: Request,
	ctx: RouteContext<"/tools/[slug]/raw">,
) {
	const { slug } = await ctx.params;
	const tool = await db.tool.findFirst({ where: { slug, isPublished: true } });
	if (!tool) return new Response("Not found", { status: 404 });

	const fileName = `${tool.slug}.${LANGUAGE_EXTENSION[tool.language]}`;
	return new Response(tool.code, {
		headers: {
			"Content-Type": "text/plain; charset=utf-8",
			"Content-Disposition": `attachment; filename="${fileName}"`,
		},
	});
}
