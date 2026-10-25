// Usage: npm run cleanup_media [-- --apply]   (dry run unless --apply; weekly cron on thinkguy)
// Deletes uploaded description images that no tool's description uses any more.
import { db } from "@/server/db/client";
import { getMediaStorage } from "@/server/storage/media-storage";

// Uploads from an editor that hasn't been saved yet aren't referenced anywhere;
// leave anything this recent alone.
const GRACE_HOURS = 24;

async function main() {
	const apply = process.argv.includes("--apply");
	const cutoff = new Date(Date.now() - GRACE_HOURS * 60 * 60 * 1000);

	const [tools, candidates] = await Promise.all([
		db.tool.findMany({ select: { description: true } }),
		db.media.findMany({
			where: { createDate: { lt: cutoff } },
			select: { id: true, key: true, fileName: true, createDate: true },
			orderBy: { createDate: "asc" },
		}),
	]);

	// Zero tools almost certainly means the wrong database, not "nothing in use".
	if (tools.length === 0 && candidates.length > 0) {
		throw new Error("No tools found; refusing to treat every image as unused.");
	}

	// Keys rather than URLs, so a change of CDN domain doesn't orphan everything.
	const descriptions = tools.map((tool) => tool.description).join("\n");
	const orphans = candidates.filter(
		(media) => !descriptions.includes(media.key),
	);

	console.log(
		`${candidates.length} images older than ${GRACE_HOURS}h, ${orphans.length} unused` +
			(apply ? "" : " (dry run: pass --apply to delete)"),
	);

	const storage = getMediaStorage();
	let failed = 0;
	for (const media of orphans) {
		const label = `${media.key} (${media.fileName || "unnamed"}, ${media.createDate.toISOString().slice(0, 10)})`;
		if (!apply) {
			console.log(`  would delete ${label}`);
			continue;
		}
		try {
			// Storage first: if that fails the row stays, so the next run retries.
			await storage.remove(media.key);
			await db.media.delete({ where: { id: media.id } });
			console.log(`  deleted ${label}`);
		} catch (err) {
			failed++;
			console.error(`  FAILED ${label}:`, err);
		}
	}

	if (failed > 0) {
		throw new Error(`${failed} of ${orphans.length} deletions failed`);
	}
}

main()
	.catch((err) => {
		console.error(err);
		process.exitCode = 1;
	})
	.finally(() => db.$disconnect());
