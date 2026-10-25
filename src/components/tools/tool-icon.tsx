import Image from "next/image";
import { toolIconSrc } from "@/lib/tool-icon";
import styles from "./tool-icon.module.sass";

type ToolIconProps = {
	tool: Parameters<typeof toolIconSrc>[0];
	size: number;
};

// Renders nothing when the tool has neither a custom nor a Houdini icon.
export function ToolIcon({ tool, size }: ToolIconProps) {
	const src = toolIconSrc(tool);
	if (!src) return null;
	return (
		<Image
			src={src}
			alt=""
			width={size}
			height={size}
			className={styles.icon}
		/>
	);
}
