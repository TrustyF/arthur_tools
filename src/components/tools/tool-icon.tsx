import Image from "next/image";
import { toolIconSrc } from "@/lib/tool-icon";
import styles from "./tool-icon.module.sass";

type ToolIconProps = {
	tool: Parameters<typeof toolIconSrc>[0];
	size: number;
	// Extra class, e.g. for grid placement.
	className?: string | undefined;
};

// Renders nothing when the tool has neither a custom nor a Houdini icon.
export function ToolIcon({ tool, size, className }: ToolIconProps) {
	const src = toolIconSrc(tool);
	if (!src) return null;
	return (
		<Image
			src={src}
			alt=""
			width={size}
			height={size}
			className={className ? `${styles.icon} ${className}` : styles.icon}
		/>
	);
}
