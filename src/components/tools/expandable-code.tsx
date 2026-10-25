"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { type CSSProperties, useRef, useState } from "react";
import styles from "./code-block.module.sass";

// Longer code starts clipped to this many lines.
const COLLAPSED_LINES = 20;

type ExpandableCodeProps = {
	html: string;
	lineCount: number;
};

export function ExpandableCode({ html, lineCount }: ExpandableCodeProps) {
	const [isExpanded, setIsExpanded] = useState(false);
	const areaRef = useRef<HTMLDivElement>(null);
	const isCollapsible = lineCount > COLLAPSED_LINES;
	const isCollapsed = isCollapsible && !isExpanded;

	function toggle() {
		setIsExpanded(!isExpanded);
		// Collapsing a long block can leave the reader below it; bring its top back.
		const area = areaRef.current;
		if (isExpanded && area && area.getBoundingClientRect().top < 0) {
			area.scrollIntoView({ block: "start" });
		}
	}

	return (
		<>
			<div
				ref={areaRef}
				className={
					isCollapsed ? `${styles.area} ${styles.collapsed}` : styles.area
				}
				style={{ "--collapsed-lines": COLLAPSED_LINES } as CSSProperties}>
				<div
					className={styles.code}
					// biome-ignore lint/security/noDangerouslySetInnerHtml: Shiki output, which escapes the source
					dangerouslySetInnerHTML={{ __html: html }}
				/>
			</div>
			{isCollapsible && (
				<button
					type="button"
					className={styles.toggle}
					onClick={toggle}
					aria-expanded={isExpanded}>
					{isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
					{isExpanded ? "Collapse" : `Show all ${lineCount} lines`}
				</button>
			)}
		</>
	);
}
