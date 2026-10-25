"use client";

import Image from "next/image";
import { type KeyboardEvent, useState } from "react";
import { HOUDINI_ICON_MANIFEST_URL, houdiniIconSrc } from "@/lib/tool-icon";
import styles from "./houdini-icon-picker.module.sass";

// Houdini ships a few thousand icons; rendering them all at once is sluggish.
const MAX_RESULTS = 120;

type Manifest = string[] | "loading" | "missing";

function matches(name: string, query: string): boolean {
	const lower = name.toLowerCase();
	return query
		.toLowerCase()
		.split(/\s+/)
		.every((part) => lower.includes(part));
}

// Enter in the search box would otherwise submit the whole tool form.
function blockEnter(event: KeyboardEvent<HTMLInputElement>) {
	if (event.key === "Enter") event.preventDefault();
}

export function HoudiniIconPicker({ defaultValue }: { defaultValue: string }) {
	const [value, setValue] = useState(defaultValue);
	const [isOpen, setIsOpen] = useState(false);
	const [query, setQuery] = useState("");
	const [manifest, setManifest] = useState<Manifest>("loading");

	async function open() {
		setIsOpen(true);
		if (manifest !== "loading") return;
		const res = await fetch(HOUDINI_ICON_MANIFEST_URL);
		setManifest(res.ok ? ((await res.json()) as string[]) : "missing");
	}

	function choose(name: string) {
		setValue(name);
		setIsOpen(false);
	}

	const results =
		typeof manifest === "string"
			? []
			: manifest.filter((name) => matches(name, query)).slice(0, MAX_RESULTS);

	return (
		<div className={styles.picker}>
			<input type="hidden" name="houdiniIcon" value={value} />
			<div className={styles.current}>
				{value ? (
					<>
						<Image src={houdiniIconSrc(value)} alt="" width={28} height={28} />
						<code>{value}</code>
					</>
				) : (
					<span className={styles.none}>No Houdini icon</span>
				)}
				<button type="button" onClick={isOpen ? () => setIsOpen(false) : open}>
					{isOpen ? "Close" : "Choose…"}
				</button>
				{value && (
					<button type="button" onClick={() => setValue("")}>
						Clear
					</button>
				)}
			</div>

			{isOpen && (
				<div className={styles.panel}>
					{manifest === "missing" ? (
						<p className={styles.none}>
							No Houdini icons imported yet — run{" "}
							<code>npm run import_houdini_icons -- &lt;path&gt;</code>.
						</p>
					) : (
						<>
							<input
								type="search"
								className={styles.search}
								placeholder="Search icons, e.g. sop null"
								value={query}
								onChange={(e) => setQuery(e.target.value)}
								onKeyDown={blockEnter}
								// biome-ignore lint/a11y/noAutofocus: panel opens on explicit click
								autoFocus
							/>
							<div className={styles.grid}>
								{results.map((name) => (
									<button
										key={name}
										type="button"
										title={name}
										className={name === value ? styles.selected : undefined}
										onClick={() => choose(name)}>
										<Image
											src={houdiniIconSrc(name)}
											alt={name}
											width={32}
											height={32}
										/>
									</button>
								))}
							</div>
							{manifest === "loading" && (
								<p className={styles.none}>Loading icons…</p>
							)}
						</>
					)}
				</div>
			)}
		</div>
	);
}
