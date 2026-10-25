import "server-only";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import {
	DeleteObjectCommand,
	PutObjectCommand,
	S3Client,
} from "@aws-sdk/client-s3";

// Where uploaded description images live: local disk in dev, the R2 bucket in
// production (MEDIA_STORAGE_DRIVER=r2). Keys look like "media/<id>.webp".
export interface MediaStorage {
	write(key: string, bytes: Buffer, contentType: string): Promise<void>;
	// Public URL stored in descriptions, so it must work from any page.
	urlFor(key: string): string;
	// Succeeds when the object is already gone (R2 deletes are idempotent too).
	remove(key: string): Promise<void>;
}

// Under data/ (gitignored); served by app/media/[file]/route.ts in dev.
const LOCAL_ROOT = path.resolve("data");

class LocalMediaStorage implements MediaStorage {
	async write(key: string, bytes: Buffer): Promise<void> {
		const target = path.join(LOCAL_ROOT, key);
		await mkdir(path.dirname(target), { recursive: true });
		await writeFile(target, bytes);
	}

	urlFor(key: string): string {
		return `/${key}`;
	}

	async remove(key: string): Promise<void> {
		await rm(path.join(LOCAL_ROOT, key), { force: true });
	}
}

function requireEnv(name: string): string {
	const value = process.env[name];
	if (!value)
		throw new Error(`${name} is not set (needed for R2 media storage)`);
	return value;
}

class R2MediaStorage implements MediaStorage {
	private client: S3Client | undefined;

	// Built on first use, so a missing credential fails the upload, not the whole app.
	private getClient(): S3Client {
		this.client ??= new S3Client({
			region: "auto",
			endpoint: `https://${requireEnv("R2_ACCOUNT_ID")}.r2.cloudflarestorage.com`,
			credentials: {
				accessKeyId: requireEnv("R2_ACCESS_KEY_ID"),
				secretAccessKey: requireEnv("R2_SECRET_ACCESS_KEY"),
			},
		});
		return this.client;
	}

	async write(key: string, bytes: Buffer, contentType: string): Promise<void> {
		await this.getClient().send(
			new PutObjectCommand({
				Bucket: requireEnv("R2_BUCKET_NAME"),
				Key: key,
				Body: bytes,
				ContentType: contentType,
				// Keys are never reused, so the object can be cached forever.
				CacheControl: "public, max-age=31536000, immutable",
			}),
		);
	}

	urlFor(key: string): string {
		return `${requireEnv("R2_PUBLIC_URL").replace(/\/$/, "")}/${key}`;
	}

	async remove(key: string): Promise<void> {
		await this.getClient().send(
			new DeleteObjectCommand({
				Bucket: requireEnv("R2_BUCKET_NAME"),
				Key: key,
			}),
		);
	}
}

export function isR2MediaStorage(): boolean {
	return process.env.MEDIA_STORAGE_DRIVER === "r2";
}

let storage: MediaStorage | undefined;

export function getMediaStorage(): MediaStorage {
	storage ??= isR2MediaStorage()
		? new R2MediaStorage()
		: new LocalMediaStorage();
	return storage;
}

// Dev only: the local driver's files, for the /media route.
export async function readLocalMedia(key: string): Promise<Buffer | undefined> {
	const target = path.join(LOCAL_ROOT, key);
	// Keys come from the URL here; refuse anything that escapes data/.
	if (!target.startsWith(LOCAL_ROOT + path.sep)) return undefined;
	return readFile(target).catch(() => undefined);
}
