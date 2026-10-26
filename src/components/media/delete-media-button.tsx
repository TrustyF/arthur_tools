"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteMedia } from "@/server/actions/media-actions";
import styles from "./media.module.sass";

// Only rendered for unused images; deleteMedia re-checks in case a tool
// started using it since the page loaded.
export function DeleteMediaButton({ id }: { id: string }) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [error, setError] = useState<string>();

	return (
		<>
			<button
				type="button"
				className={`${styles.button} ${styles.danger}`}
				disabled={isPending}
				onClick={() => {
					if (!confirm("Delete this image for good?")) return;
					startTransition(async () => {
						const result = await deleteMedia(id);
						if (result) setError(result.error);
						else router.refresh();
					});
				}}>
				<Trash2 size={13} />
				{isPending ? "Deleting…" : "Delete"}
			</button>
			{error && <span className={styles.error}>{error}</span>}
		</>
	);
}
