"use client";

import dynamic from "next/dynamic";

// Browser-only: the form reads its local draft (localStorage) while creating
// its first state, which can't happen during server rendering.
export const ToolFormLoader = dynamic(
	() => import("./tool-form").then((mod) => mod.ToolForm),
	{ ssr: false, loading: () => <p>Loading editor…</p> },
);
