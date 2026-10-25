"use client";

import { useActionState } from "react";
import formStyles from "@/components/admin/form.module.sass";
import { submitWithoutReset } from "@/lib/submit-without-reset";
import { login } from "@/server/actions/auth-actions";

export function LoginForm() {
	const [error, action, isPending] = useActionState(login, undefined);

	return (
		<form onSubmit={submitWithoutReset(action)} className={formStyles.form}>
			<label className={formStyles.field}>
				Username
				<input name="username" autoComplete="username" required />
			</label>
			<label className={formStyles.field}>
				Password
				<input
					name="password"
					type="password"
					autoComplete="current-password"
					required
				/>
			</label>
			{error && <p className={formStyles.error}>{error}</p>}
			<button type="submit" className={formStyles.primary} disabled={isPending}>
				{isPending ? "Signing in…" : "Sign in"}
			</button>
		</form>
	);
}
