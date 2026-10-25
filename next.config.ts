import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	// Self-hosted uses traced standalone bundle (see Dockerfile).
	output: "standalone",
	reactCompiler: true,
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

export default nextConfig;
