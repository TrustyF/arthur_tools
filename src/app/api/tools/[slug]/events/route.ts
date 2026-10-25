import { type } from "arktype";
import { db } from "@/server/db/client";
import {
	recordToolStat,
	shouldCount,
	type ToolStat,
} from "@/server/tools/tool-stats";

const eventBody = type({ event: "'view' | 'copy'" });

const STAT_FOR_EVENT: Record<typeof eventBody.infer.event, ToolStat> = {
	view: "views",
	copy: "downloads",
};

// Client-reported events from the tool page (view-tracker.tsx, copy-button.tsx).
// A copy counts as a download, same as /tools/[slug]/raw's server-side count.
export async function POST(
	req: Request,
	ctx: RouteContext<"/api/tools/[slug]/events">,
) {
	const body = eventBody(await req.json().catch(() => undefined));
	if (body instanceof type.errors) {
		return new Response(body.summary, { status: 400 });
	}

	const { slug } = await ctx.params;
	const tool = await db.tool.findFirst({
		where: { slug, isPublished: true },
		select: { id: true },
	});
	if (!tool) return new Response("Not found", { status: 404 });

	if (await shouldCount(req)) {
		await recordToolStat(tool.id, STAT_FOR_EVENT[body.event]);
	}
	return new Response(null, { status: 204 });
}
