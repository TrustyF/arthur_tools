"use client";

import Image from "next/image";
import { type ChangeEvent, useState } from "react";
import { toolIconSrc } from "@/lib/tool-icon";
import formStyles from "./form.module.sass";
import styles from "./houdini-icon-picker.module.sass";

type CustomIconFieldProps = {
	// Present when editing a tool that already has an uploaded icon.
	current?: { slug: string; customIconDate: Date };
};

export function CustomIconField({ current }: CustomIconFieldProps) {
	const [preview, setPreview] = useState<string>();

	function onChange(event: ChangeEvent<HTMLInputElement>) {
		const file = event.target.files?.[0];
		if (preview) URL.revokeObjectURL(preview);
		setPreview(file ? URL.createObjectURL(file) : undefined);
	}

	const shown =
		preview ?? (current && toolIconSrc({ ...current, houdiniIcon: "" }));

	return (
		<div className={styles.picker}>
			<div className={styles.current}>
				{shown ? (
					<Image src={shown} alt="" width={28} height={28} />
				) : (
					<span className={styles.none}>No custom image</span>
				)}
				<input
					type="file"
					name="customIcon"
					accept="image/png,image/jpeg,image/webp,image/svg+xml"
					onChange={onChange}
				/>
			</div>
			{current && !preview && (
				<label className={formStyles.checkbox}>
					<input type="checkbox" name="removeCustomIcon" />
					Remove custom image
				</label>
			)}
		</div>
	);
}
