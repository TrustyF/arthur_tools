import { createHash } from "node:crypto";
import type { NextConfig } from "next";
import { PHASE_PRODUCTION_BUILD } from "next/constants";

// Function form so the deployment id is stamped only during `next build`;
// `next dev` leaves it unset.
export default function config(phase: string): NextConfig {
	// A new id per build makes Next reload a page left open across a deploy instead
	// of calling actions that no longer exist; the editor's local draft survives it.
	const deploymentId =
		phase === PHASE_PRODUCTION_BUILD
			? createHash("sha256")
					.update(new Date().toISOString())
					.digest("hex")
					.slice(0, 16)
			: undefined;

	return {
		// Self-hosted uses traced standalone bundle (see Dockerfile).
		output: "standalone",
		reactCompiler: true,
		...(deploymentId ? { deploymentId } : {}),
		experimental: {
			serverActions: {
				// 1MB default is too small for uploads: icons cap at 5MB (process-icon.ts),
				// description GIFs at 20MB (process-media.ts).
				bodySizeLimit: "21mb",
			},
		},
		images: {
			// Icons are already tiny (pre-sized WebP or Houdini SVGs); skips the
			// optimizer and its SVG restriction.
			unoptimized: true,
		},
	};
}
