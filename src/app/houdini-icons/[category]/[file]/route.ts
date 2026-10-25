import { readHoudiniIcon } from "@/server/houdini-icons/pack-reader";

// /houdini-icons/SOP/null.webp → "SOP_null" (the inverse of houdiniIconSrc).
export async function GET(
	_req: Request,
	ctx: RouteContext<"/houdini-icons/[category]/[file]">,
) {
	const { category, file } = await ctx.params;
	if (!file.endsWith(".webp")) {
		return new Response("Not found", { status: 404 });
	}
	const icon = await readHoudiniIcon(`${category}_${file.slice(0, -5)}`);
	if (!icon) return new Response("Not found", { status: 404 });

	return new Response(new Uint8Array(icon), {
		headers: {
			"Content-Type": "image/webp",
			// A week rather than immutable: a Houdini upgrade can redraw an icon
			// under the same URL. Cloudflare serves repeats from its edge cache.
			"Cache-Control": "public, max-age=604800",
		},
	});
}
