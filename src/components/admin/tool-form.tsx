"use client";

import type { Tool } from "@prisma/client";
import Link from "next/link";
import { type KeyboardEvent, startTransition, useActionState } from "react";
import { DEFAULT_RETURN_PATH } from "@/lib/return-to";
import { submitWithoutReset } from "@/lib/submit-without-reset";
import { LANGUAGE_LABEL, TOOL_LANGUAGES } from "@/lib/tool-language";
import { deleteTool, saveTool } from "@/server/actions/tool-actions";
import { CustomIconField } from "./custom-icon-field";
import { DescriptionField } from "./description-field";
import styles from "./form.module.sass";
import { HoudiniIconPicker } from "./houdini-icon-picker";

// Textareas move focus on Tab by default; insert a tab character instead.
function insertTab(event: KeyboardEvent<HTMLTextAreaElement>) {
	if (event.key !== "Tab" || event.shiftKey) return;
	event.preventDefault();
	const el = event.currentTarget;
	el.setRangeText("\t", el.selectionStart, el.selectionEnd, "end");
}

// customIcon's bytes are omitted by the db client; the form only needs customIconDate.
type ToolFormProps = {
	tool?: Omit<Tool, "customIcon">;
	// Where save, cancel and delete lead; see lib/return-to.ts.
	returnTo?: string | undefined;
};

export function ToolForm({ tool, returnTo }: ToolFormProps) {
	const [state, action, isPending] = useActionState(saveTool, undefined);

	return (
		<form onSubmit={submitWithoutReset(action)} className={styles.form}>
			{tool && <input type="hidden" name="id" value={tool.id} />}
			{returnTo && <input type="hidden" name="returnTo" value={returnTo} />}

			<div className={styles.actions}>
				<button type="submit" className={styles.primary} disabled={isPending}>
					{isPending ? "Saving…" : tool ? "Save changes" : "Create tool"}
				</button>
				<Link
					href={returnTo ?? DEFAULT_RETURN_PATH}
					className={styles.secondary}>
					Cancel
				</Link>
				<label className={styles.checkbox}>
					<input
						type="checkbox"
						name="isPublished"
						defaultChecked={tool?.isPublished ?? false}
					/>
					Published
				</label>
				{tool && (
					<button
						type="button"
						className={styles.danger}
						onClick={() => {
							if (!confirm(`Delete "${tool.name}"?`)) return;
							startTransition(() => deleteTool(tool.id, returnTo));
						}}>
						Delete
					</button>
				)}
			</div>

			{state?.error && <p className={styles.error}>{state.error}</p>}

			<label className={styles.field}>
				Change note
				<input
					name="changeNote"
					maxLength={200}
					placeholder={tool ? "What changed in the code?" : "Initial version"}
				/>
				<span className={styles.hint}>
					Saved with a new version in the history whenever the code changes.
				</span>
			</label>

			<div className={styles.row}>
				<label className={styles.field}>
					Name
					<input name="name" defaultValue={tool?.name} required />
				</label>
				<label className={styles.field}>
					Slug
					<input
						name="slug"
						defaultValue={tool?.slug}
						placeholder="Generated from the name"
					/>
				</label>
			</div>

			<div className={styles.row}>
				<label className={styles.field}>
					Language
					<select name="language" defaultValue={tool?.language ?? "VEX"}>
						{TOOL_LANGUAGES.map((lang) => (
							<option key={lang} value={lang}>
								{LANGUAGE_LABEL[lang]}
							</option>
						))}
					</select>
				</label>
				<label className={styles.field}>
					Context
					<input
						name="context"
						defaultValue={tool?.context}
						placeholder="Attribute Wrangle (points), Shelf tool…"
					/>
				</label>
				<label className={styles.field}>
					Min. Houdini version
					<input
						name="houdiniVersion"
						defaultValue={tool?.houdiniVersion}
						placeholder="20.5"
					/>
				</label>
			</div>

			<div className={styles.row}>
				<div className={styles.field}>
					Houdini icon
					<HoudiniIconPicker defaultValue={tool?.houdiniIcon ?? ""} />
				</div>
				<div className={styles.field}>
					Custom image
					<CustomIconField
						{...(tool?.customIconDate
							? {
									current: {
										slug: tool.slug,
										customIconDate: tool.customIconDate,
									},
								}
							: {})}
					/>
					<span className={styles.hint}>
						Overrides the Houdini icon. Resized to 128px.
					</span>
				</div>
			</div>

			<label className={styles.field}>
				Summary
				<input name="summary" defaultValue={tool?.summary} maxLength={300} />
			</label>

			<label className={styles.field}>
				Tags
				<input
					name="tags"
					defaultValue={tool?.tags.join(", ")}
					placeholder="sop, attributes, cleanup"
				/>
				<span className={styles.hint}>Comma-separated</span>
			</label>

			<DescriptionField defaultValue={tool?.description ?? ""} />

			<label className={styles.field}>
				Code
				<textarea
					name="code"
					className={styles.code}
					defaultValue={tool?.code}
					onKeyDown={insertTab}
					spellCheck={false}
					required
				/>
			</label>
		</form>
	);
}
