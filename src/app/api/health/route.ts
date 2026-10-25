import { db } from "@/server/db/client";

// "Healthy" means the app can serve and reach the database, not just that the
// process started — docker-compose's healthcheck and cloudflared wait on it.
export async function GET() {
	try {
		await db.$queryRaw`SELECT 1`;
		return Response.json({ ok: true });
	} catch {
		return Response.json({ ok: false }, { status: 503 });
	}
}
