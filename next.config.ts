import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	// Self-hosted uses traced standalone bundle (see Dockerfile).
	output: "standalone",
	reactCompiler: true,
	experimental: {
		serverActions: {
			// 1MB default is too small for icon uploads (capped at 5MB in process-icon.ts).
			bodySizeLimit: "6mb",
		},
	},
	images: {
		// Icons are already tiny (pre-sized WebP or Houdini SVGs); skips the
		// optimizer and its SVG restriction.
		unoptimized: true,
	},
};

export default nextConfig;
