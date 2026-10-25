"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import styles from "./code-block.module.sass";

type CopyButtonProps = {
	text: string;
	// When set, each copy is reported there (see api/tools/[slug]/events).
	eventsUrl?: string | undefined;
};

export function CopyButton({ text, eventsUrl }: CopyButtonProps) {
	const [copied, setCopied] = useState(false);

	async function copy() {
		await navigator.clipboard.writeText(text);
		setCopied(true);
		setTimeout(() => setCopied(false), 1500);
		if (eventsUrl) {
			void fetch(eventsUrl, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ event: "copy" }),
				keepalive: true,
			}).catch(() => {});
		}
	}

	return (
		<button type="button" className={styles.action} onClick={copy}>
			{copied ? <Check size={14} /> : <Copy size={14} />}
			{copied ? "Copied" : "Copy"}
		</button>
	);
}
