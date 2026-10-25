import {
	isR2MediaStorage,
	readLocalMedia,
} from "@/server/storage/media-storage";

// Dev only: serves the local media driver's files at /media/<uuid>.webp. In
// production the stored URLs point at the R2 bucket, never here.
export async function GET(_req: Request, ctx: RouteContext<"/media/[file]">) {
	const { file } = await ctx.params;
	if (isR2MediaStorage() || !file.endsWith(".webp")) {
		return new Response("Not found", { status: 404 });
	}

	const bytes = await readLocalMedia(`media/${file}`);
	if (!bytes) return new Response("Not found", { status: 404 });

	return new Response(new Uint8Array(bytes), {
		headers: {
			"Content-Type": "image/webp",
			"Cache-Control": "public, max-age=31536000, immutable",
		},
	});
}
