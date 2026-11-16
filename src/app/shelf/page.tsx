import type { Metadata } from "next";
import Link from "next/link";
import { ShelfBuilderLoader } from "@/components/tools/shelf-builder-loader";
import { db } from "@/server/db/client";
import styles from "./shelf.module.sass";

export const metadata: Metadata = {
	title: "Shelf",
	description: "Select Python scripts and download them as a shelf package.",
};

export default async function ShelfPage() {
	const tools = await db.tool.findMany({
		// Only Python scripts go on the shelf; VEX snippets are pasted into wrangles.
		where: { isPublished: true, language: "PYTHON" },
		// Same order as the shelf in the download (app/download/route.ts).
		orderBy: [{ isPinned: "desc" }, { name: "asc" }],
		select: {
			slug: true,
			name: true,
			summary: true,
			language: true,
			houdiniIcon: true,
			customIconDate: true,
			isPinned: true,
		},
	});

	return (
		<>
			<section className={styles.intro}>
				<h1>Shelf</h1>
				<p>
					Drag tools onto the shelf, then download it as a Houdini package.{" "}
					<Link href="/help#bundle">Install steps</Link>
				</p>
			</section>
			{tools.length === 0 ? (
				<p className={styles.empty}>No tools here yet.</p>
			) : (
				<ShelfBuilderLoader tools={tools} />
			)}
		</>
	);
}
