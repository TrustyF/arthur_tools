import type { Metadata } from "next";
import Link from "next/link";
import { LibraryUpload } from "@/components/media/library-upload";
import { DeleteMediaButton } from "@/components/media/delete-media-button";
import mediaStyles from "@/components/media/media.module.sass";
import { requireAdmin } from "@/lib/auth/require-admin";
import { db } from "@/server/db/client";
import { mediaUsage } from "@/server/media/media-usage";
import { getMediaStorage } from "@/server/storage/media-storage";
import styles from "../admin.module.sass";

export const metadata: Metadata = { title: "Media library" };

export default async function MediaLibraryPage() {
	await requireAdmin();
	const media = await db.media.findMany({ orderBy: { createDate: "desc" } });
	const usage = await mediaUsage(media.map((item) => item.key));
	const storage = getMediaStorage();

	return (
		<>
			<div className={styles.header}>
				<h1>Media library</h1>
				<LibraryUpload />
			</div>

			{media.length === 0 ? (
				<p className={styles.empty}>No images yet.</p>
			) : (
				<div className={mediaStyles.grid}>
					{media.map((item) => {
						const users = usage.get(item.key) ?? [];
						return (
							<figure key={item.id} className={mediaStyles.tile}>
								{/* Library images come in any size; next/image needs them up front. */}
								{/* eslint-disable-next-line @next/next/no-img-element */}
								<img
									src={storage.urlFor(item.key)}
									alt={item.fileName}
									loading="lazy"
								/>
								<span title={item.fileName}>{item.fileName || "Untitled"}</span>
								<span className={mediaStyles.hint}>
									{item.width}×{item.height} ·{" "}
									{item.createDate.toISOString().slice(0, 10)}
								</span>
								<div className={mediaStyles.usage}>
									{users.length === 0 ? (
										<span className={mediaStyles.hint}>Unused</span>
									) : (
										users.map((tool) => (
											<Link key={tool.id} href={`/admin/tools/${tool.id}/edit`}>
												{tool.name}
											</Link>
										))
									)}
								</div>
								{users.length === 0 && <DeleteMediaButton id={item.id} />}
							</figure>
						);
					})}
				</div>
			)}
		</>
	);
}
