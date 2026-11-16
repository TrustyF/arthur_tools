"use client";

import { type ChangeEvent, useState } from "react";
import {
	ASSET_EXTENSIONS,
	assetFileProblem,
	formatBytes,
} from "@/lib/tool-asset";
import styles from "./form.module.sass";

type HdaFileFieldProps = {
	// The tool's current file, when editing an HDA that has one.
	current?: { fileName: string; size: number } | undefined;
};

// Replaces the Code box for HDAs. A picked file is checked right away so an
// oversized one never reaches the server action's body size limit.
export function HdaFileField({ current }: HdaFileFieldProps) {
	const [picked, setPicked] = useState<{ name: string; size: number }>();
	const [problem, setProblem] = useState<string>();

	function onChange(event: ChangeEvent<HTMLInputElement>) {
		const file = event.target.files?.[0];
		const issue = file && assetFileProblem(file);
		if (issue) {
			// Cleared so the bad file isn't submitted with the form.
			event.target.value = "";
			setPicked(undefined);
			setProblem(issue);
			return;
		}
		setProblem(undefined);
		setPicked(file ? { name: file.name, size: file.size } : undefined);
	}

	return (
		<div className={`${styles.field} ${styles.codeField}`}>
			HDA file
			{current && !picked && (
				<p className={styles.hint}>
					Current: {current.fileName} ({formatBytes(current.size)})
				</p>
			)}
			{picked && (
				<p className={styles.hint}>
					New: {picked.name} ({formatBytes(picked.size)})
				</p>
			)}
			<input
				type="file"
				name="asset"
				accept={ASSET_EXTENSIONS.join(",")}
				onChange={onChange}
				required={!current}
			/>
			{problem && <p className={styles.error}>{problem}</p>}
			<span className={styles.hint}>
				{current
					? "Uploading a file adds a new version; older ones stay downloadable."
					: "The .hda or .otl file exported from Houdini."}
			</span>
		</div>
	);
}
