"use client";

import dynamic from "next/dynamic";

// Browser-only: the builder reads the saved shelf (localStorage) while creating
// its first state, which can't happen during server rendering.
export const ShelfBuilderLoader = dynamic(
	() => import("./shelf-builder").then((mod) => mod.ShelfBuilder),
	{ ssr: false, loading: () => <p>Loading…</p> },
);
