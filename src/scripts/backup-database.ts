// Usage: npm run --silent backup_database < dump-file (scripts/backup-database.sh).
// Uploads a pg_dump from stdin to the R2 backup bucket, then prunes old ones.
import {
	DeleteObjectCommand,
	ListObjectsV2Command,
	PutObjectCommand,
	S3Client,
} from "@aws-sdk/client-s3";

const PREFIX = "db/";
// Kept: the newest 5, the newest per week for 3 weeks, per month for 2 months,
// and per year forever (same rotation as review_website_nextjs).
const KEEP_NEWEST = 5;
const KEEP_WEEKS = 3;
const KEEP_MONTHS = 2;
// A real dump of this database is tens of KB; anything this small is a failed
// pg_dump, and uploading it would push a good backup out of the rotation.
const MIN_DUMP_BYTES = 1024;

type Backup = { key: string; date: Date };

function requireEnv(name: string): string {
	const value = process.env[name];
	if (!value) throw new Error(`${name} is not set (needed for R2 backups)`);
	return value;
}

// Separate bucket and token from the media bucket, so neither can touch the other.
function makeClient(): S3Client {
	return new S3Client({
		region: "auto",
		endpoint: `https://${requireEnv("R2_ACCOUNT_ID")}.r2.cloudflarestorage.com`,
		credentials: {
			accessKeyId: requireEnv("R2_BACKUP_ACCESS_KEY_ID"),
			secretAccessKey: requireEnv("R2_BACKUP_SECRET_ACCESS_KEY"),
		},
	});
}

// "db/2026-11-16T03-30-00.000Z.dump": colons aren't safe in every S3 tool.
function keyFor(date: Date): string {
	return `${PREFIX}${date.toISOString().replaceAll(":", "-")}.dump`;
}

function dateOf(key: string): Date | undefined {
	const stamp = key
		.slice(PREFIX.length)
		.replace(/\.dump$/, "")
		.replace(/T(\d\d)-(\d\d)-(\d\d)/, "T$1:$2:$3");
	const date = new Date(stamp);
	return Number.isNaN(date.getTime()) ? undefined : date;
}

async function readStdin(): Promise<Buffer> {
	const chunks: Buffer[] = [];
	for await (const chunk of process.stdin) chunks.push(Buffer.from(chunk));
	return Buffer.concat(chunks);
}

// Newest first.
async function listBackups(client: S3Client, bucket: string) {
	const backups: Backup[] = [];
	let token: string | undefined;
	do {
		const page = await client.send(
			new ListObjectsV2Command({
				Bucket: bucket,
				Prefix: PREFIX,
				ContinuationToken: token,
			}),
		);
		for (const object of page.Contents ?? []) {
			const date = object.Key && dateOf(object.Key);
			if (object.Key && date) backups.push({ key: object.Key, date });
		}
		token = page.IsTruncated ? page.NextContinuationToken : undefined;
	} while (token);
	return backups.sort((a, b) => b.date.getTime() - a.date.getTime());
}

// ISO week, e.g. "2026-W47" (weeks start on Monday).
function weekOf(d: Date): string {
	const day = new Date(
		Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
	);
	day.setUTCDate(day.getUTCDate() + 4 - (day.getUTCDay() || 7));
	const yearStart = Date.UTC(day.getUTCFullYear(), 0, 1);
	const week = Math.ceil(((day.getTime() - yearStart) / 86_400_000 + 1) / 7);
	return `${day.getUTCFullYear()}-W${week}`;
}

// The newest backup in each period, for the `limit` most recent periods.
function newestPerPeriod(
	backups: Backup[],
	period: (d: Date) => string,
	limit = Number.POSITIVE_INFINITY,
): Backup[] {
	const newest = new Map<string, Backup>();
	for (const backup of backups) {
		const key = period(backup.date);
		if (!newest.has(key)) newest.set(key, backup);
	}
	return [...newest.values()].slice(0, limit);
}

function backupsToKeep(backups: Backup[]): Set<string> {
	return new Set(
		[
			...backups.slice(0, KEEP_NEWEST),
			...newestPerPeriod(backups, weekOf, KEEP_WEEKS),
			...newestPerPeriod(
				backups,
				(d) => `${d.getUTCFullYear()}-${d.getUTCMonth()}`,
				KEEP_MONTHS,
			),
			...newestPerPeriod(backups, (d) => `${d.getUTCFullYear()}`),
		].map((backup) => backup.key),
	);
}

async function main() {
	const dump = await readStdin();
	if (dump.byteLength < MIN_DUMP_BYTES) {
		throw new Error(
			`Dump is only ${dump.byteLength} bytes; refusing to upload it.`,
		);
	}

	const bucket = requireEnv("R2_BACKUP_BUCKET_NAME");
	const client = makeClient();
	const key = keyFor(new Date());
	await client.send(
		new PutObjectCommand({ Bucket: bucket, Key: key, Body: dump }),
	);
	console.log(`Uploaded ${key} (${(dump.byteLength / 1024).toFixed(1)} KB).`);

	const backups = await listBackups(client, bucket);
	const keep = backupsToKeep(backups);
	const old = backups.filter((backup) => !keep.has(backup.key));
	for (const backup of old) {
		await client.send(
			new DeleteObjectCommand({ Bucket: bucket, Key: backup.key }),
		);
	}
	console.log(`Kept ${keep.size} backups, deleted ${old.length}.`);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
