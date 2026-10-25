import { auth } from "@/auth";
import { db } from "@/server/db/client";

export async function GET(
	_req: Request,
	ctx: RouteContext<"/tools/[slug]/icon">,
) {
	const { slug } = await ctx.params;
	const tool = await db.tool.findUnique({
		where: { slug },
		select: { customIcon: true, isPublished: true },
	});
	if (!tool?.customIcon) return new Response("Not found", { status: 404 });

	// Drafts' icons are only for the admin list and edit form.
	if (!tool.isPublished) {
		const session = await auth();
		if (session?.user?.role !== "ADMIN") {
			return new Response("Not found", { status: 404 });
		}
	}

	return new Response(tool.customIcon, {
		headers: {
			"Content-Type": "image/webp",
			// URLs carry ?v=<customIconDate>, so a replaced icon gets a new URL.
			"Cache-Control": tool.isPublished
				? "public, max-age=31536000, immutable"
				: "private, no-store",
		},
	});
}
