"use client";

import type { Tool } from "@prisma/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
	type FormEvent,
	type KeyboardEvent,
	startTransition,
	useActionState,
	useRef,
	useState,
} from "react";
import { detectFirewallBlock } from "@/lib/firewall-block";
import { DEFAULT_RETURN_PATH } from "@/lib/return-to";
import { submitWithoutReset } from "@/lib/submit-without-reset";
import {
	type Draft,
	draftKey,
	initialValues,
	readDraft,
	removeDraft,
	sameValues,
	valuesFromForm,
	writeDraft,
} from "@/lib/tool-draft";
import {
	deleteTool,
	saveTool,
	type ToolFormState,
} from "@/server/actions/tool-actions";
import { CustomIconField } from "./custom-icon-field";
import { DescriptionField } from "./description-field";
import styles from "./form.module.sass";
import { HoudiniIconPicker } from "./houdini-icon-picker";
import { LanguageContextFields } from "./language-context-fields";
import { PreviewField } from "./preview-field";

// Long enough not to write on every keystroke, short enough to lose little.
const DRAFT_DELAY_MS = 500;

// Textareas move focus on Tab by default; insert a tab character instead.
function insertTab(event: KeyboardEvent<HTMLTextAreaElement>) {
	if (event.key !== "Tab" || event.shiftKey) return;
	event.preventDefault();
	const el = event.currentTarget;
	el.setRangeText("\t", el.selectionStart, el.selectionEnd, "end");
	// setRangeText fires no input event; the draft autosave needs one.
	el.dispatchEvent(new Event("input", { bubbles: true }));
}

// customIcon's bytes are omitted by the db client; the form only needs customIconDate.
type ToolFormProps = {
	tool?: Omit<Tool, "customIcon">;
	// Where save, cancel and delete lead; see lib/return-to.ts.
	returnTo?: string | undefined;
	// The page title, shown in the sticky bar beside the save button.
	heading: string;
};

export function ToolForm({ tool, returnTo, heading }: ToolFormProps) {
	const router = useRouter();
	const key = draftKey(tool?.id);
	const saved = initialValues(tool);
	// Read once, on first render (this form only renders in the browser; see
	// tool-form-loader.tsx). A draft older than the tool's last save is stale.
	const [restored, setRestored] = useState<Draft | undefined>(() => {
		const draft = readDraft(key);
		if (!draft) return undefined;
		const isStale = tool && draft.savedAt < new Date(tool.updateDate).getTime();
		if (!isStale && !sameValues(draft.values, saved)) return draft;
		removeDraft(key);
		return undefined;
	});
	const draftTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

	function scheduleDraft(event: FormEvent<HTMLFormElement>) {
		const form = event.currentTarget;
		clearTimeout(draftTimer.current);
		draftTimer.current = setTimeout(() => {
			const values = valuesFromForm(form);
			if (sameValues(values, saved)) removeDraft(key);
			else writeDraft(key, values);
		}, DRAFT_DELAY_MS);
	}

	const [state, action, isPending] = useActionState(
		async (prev: ToolFormState, formData: FormData): Promise<ToolFormState> => {
			let result: ToolFormState;
			try {
				result = await saveTool(prev, formData);
			} catch {
				const block = await detectFirewallBlock(formData);
				if (block) {
					return {
						error: `Cloudflare's firewall blocked this save, probably because the code looks like an injection attack to it. Your changes are kept in this browser. Look up Ray ID ${block.rayId ?? "(unknown)"} under Security → Events in the Cloudflare dashboard to see which rule matched.`,
					};
				}
				// Network loss, an expired session, or a deploy that replaced this
				// page's version of the action. The draft is still in this browser.
				return {
					error:
						"Couldn't reach the server, or the site was just updated. Your changes are kept in this browser: reload the page to get them back, then save again.",
				};
			}
			if (result && "savedTo" in result) {
				clearTimeout(draftTimer.current);
				removeDraft(key);
				router.push(result.savedTo);
			}
			return result;
		},
		undefined,
	);
	const isNavigating = state !== undefined && "savedTo" in state;

	const values = restored?.values ?? saved;

	return (
		<form
			// Re-keyed when the draft is discarded, so every field remounts with
			// the saved values as its defaultValue.
			key={restored ? `draft-${restored.savedAt}` : "saved"}
			onSubmit={submitWithoutReset(action)}
			onChange={scheduleDraft}
			onInput={scheduleDraft}
			className={styles.form}>
			{tool && <input type="hidden" name="id" value={tool.id} />}
			{returnTo && <input type="hidden" name="returnTo" value={returnTo} />}

			<div className={styles.bar}>
				<h1>{heading}</h1>
				<label className={styles.checkbox}>
					<input
						type="checkbox"
						name="isPublished"
						defaultChecked={values.isPublished}
					/>
					Published
				</label>
				<label className={styles.checkbox}>
					<input
						type="checkbox"
						name="isPinned"
						defaultChecked={values.isPinned}
					/>
					Pinned
				</label>
				{tool && (
					<button
						type="button"
						className={styles.danger}
						onClick={() => {
							if (!confirm(`Delete "${tool.name}"?`)) return;
							removeDraft(key);
							startTransition(() => deleteTool(tool.id, returnTo));
						}}>
						Delete
					</button>
				)}
				<Link
					href={returnTo ?? DEFAULT_RETURN_PATH}
					className={styles.secondary}>
					Cancel
				</Link>
				<button
					type="submit"
					className={styles.primary}
					disabled={isPending || isNavigating}>
					{isPending || isNavigating ? "Saving…" : tool ? "Save" : "Create"}
				</button>
			</div>

			{restored && (
				<p className={styles.draftNotice}>
					Restored unsaved changes from{" "}
					{new Date(restored.savedAt).toLocaleString()}.
					<button
						type="button"
						className={styles.inlineButton}
						onClick={() => {
							removeDraft(key);
							setRestored(undefined);
						}}>
						Discard
					</button>
				</p>
			)}

			{state && "error" in state && (
				<p className={styles.error}>{state.error}</p>
			)}

			<div className={styles.columns}>
				<div className={styles.side}>
					<div className={styles.nameRow}>
						<label className={styles.field}>
							Name
							<input name="name" defaultValue={values.name} required />
						</label>
						<LanguageContextFields
							defaultLanguage={values.language}
							defaultContext={values.context}
						/>
					</div>

					<div className={styles.row}>
						<div className={styles.field}>
							Houdini icon
							<HoudiniIconPicker defaultValue={values.houdiniIcon} />
						</div>
						<label className={styles.field}>
							Tags
							<input
								name="tags"
								defaultValue={values.tags}
								placeholder="sop, attributes, cleanup"
							/>
						</label>
					</div>

					<label className={styles.field}>
						Summary
						<input
							name="summary"
							defaultValue={values.summary}
							maxLength={300}
						/>
					</label>

					<DescriptionField defaultValue={values.description} />

					<PreviewField defaultValue={values.previewUrl} />

					{/* Closed fields still submit; they're just rarely changed. */}
					<details className={styles.more}>
						<summary>More</summary>
						<div className={styles.row}>
							<label className={styles.field}>
								Slug
								<input
									name="slug"
									defaultValue={values.slug}
									placeholder="From the name"
								/>
							</label>
							<label className={styles.field}>
								Min. Houdini version
								<input
									name="houdiniVersion"
									defaultValue={values.houdiniVersion}
									placeholder="20.5"
								/>
							</label>
						</div>
						<label className={styles.field}>
							Change note
							<input
								name="changeNote"
								maxLength={200}
								defaultValue={values.changeNote}
								placeholder={
									tool ? "What changed in the code?" : "Initial version"
								}
							/>
							<span className={styles.hint}>
								Recorded in the history when the code changes.
							</span>
						</label>
						<div className={styles.field}>
							Custom icon
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
							<span className={styles.hint}>Overrides the Houdini icon.</span>
						</div>
					</details>
				</div>

				<label className={`${styles.field} ${styles.codeField}`}>
					Code
					<textarea
						name="code"
						className={styles.code}
						defaultValue={values.code}
						onKeyDown={insertTab}
						spellCheck={false}
						required
					/>
				</label>
			</div>
		</form>
	);
}
