import type { Metadata } from "next";
import { LoginForm } from "./login-form";
import styles from "./login.module.sass";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
	return (
		<div className={styles.page}>
			<h1>Sign in</h1>
			<LoginForm />
		</div>
	);
}
