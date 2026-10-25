"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import styles from "./code-block.module.sass";

export function CopyButton({ text }: { text: string }) {
	const [copied, setCopied] = useState(false);

	async function copy() {
		await navigator.clipboard.writeText(text);
		setCopied(true);
		setTimeout(() => setCopied(false), 1500);
	}

	return (
		<button type="button" className={styles.action} onClick={copy}>
			{copied ? <Check size={14} /> : <Copy size={14} />}
			{copied ? "Copied" : "Copy"}
		</button>
	);
}
