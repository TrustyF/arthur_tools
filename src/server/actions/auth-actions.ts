"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";

export async function login(
	_prev: string | undefined,
	formData: FormData,
): Promise<string | undefined> {
	try {
		await signIn("credentials", {
			username: formData.get("username"),
			password: formData.get("password"),
			redirectTo: "/admin",
		});
	} catch (err) {
		// signIn signals success by throwing a redirect, so only AuthError is a failure.
		if (err instanceof AuthError) return "Invalid username or password.";
		throw err;
	}
	return undefined;
}
