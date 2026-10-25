import "server-only";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { db } from "@/server/db/client";

export type ToolStat = "views" | "downloads";

// Crawlers, link unfurlers and scripted clients; not exhaustive, just the
// obvious ones. Real browsers never send these words.
const BOT_PATTERN =
	/bot|crawl|spider|slurp|preview|headless|curl|wget|python-requests|httpclient/i;

// Skips bots and the admin's own visits, so counts reflect other people.
export async function shouldCount(req: Request): Promise<boolean> {
	const userAgent = req.headers.get("user-agent") ?? "";
	if (!userAgent || BOT_PATTERN.test(userAgent)) return false;
	const session = await auth();
	return session?.user?.role !== "ADMIN";
}

// Raw upsert: atomic under concurrent hits, and creates the row on first use.
export async function recordToolStat(
	toolId: string,
	stat: ToolStat,
): Promise<void> {
	// `stat` is the ToolStat union, never user text, so raw is safe here.
	const column = Prisma.raw(`"${stat}"`);
	await db.$executeRaw`
		INSERT INTO "ToolStats" ("toolId", ${column}) VALUES (${toolId}, 1)
		ON CONFLICT ("toolId") DO UPDATE SET ${column} = "ToolStats".${column} + 1`;
}
