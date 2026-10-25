import "server-only";
import { cache } from "react";
import { db } from "@/server/db/client";

// A published tool with every version oldest-first, shared by the history
// pages (and their generateMetadata) so it's fetched once per request.
export const getToolHistory = cache((slug: string) =>
	db.tool.findFirst({
		where: { slug, isPublished: true },
		select: {
			slug: true,
			name: true,
			language: true,
			versions: {
				orderBy: { number: "asc" },
				select: { number: true, code: true, note: true, createDate: true },
			},
		},
	}),
);

export function formatVersionDate(date: Date): string {
	return date.toISOString().slice(0, 16).replace("T", " ");
}
