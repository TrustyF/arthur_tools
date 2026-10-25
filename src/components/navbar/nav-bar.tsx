import Link from "next/link";
import { auth, signOut } from "@/auth";
import styles from "./nav-bar.module.sass";

export default async function NavBar() {
	const session = await auth();
	const isAdmin = session?.user?.role === "ADMIN";

	return (
		<header className={styles.wrapper}>
			<nav className={styles.nav}>
				<Link href="/" className={styles.logo}>
					arthur<span>/tools</span>
				</Link>
				<div className={styles.links}>
					<Link href="/?lang=PYTHON">Python</Link>
					<Link href="/?lang=VEX">VEX</Link>
					{isAdmin && <Link href="/admin">Admin</Link>}
					{session && (
						<form
							action={async () => {
								"use server";
								await signOut({ redirectTo: "/" });
							}}>
							<button type="submit" className={styles.signOut}>
								Sign out
							</button>
						</form>
					)}
				</div>
			</nav>
		</header>
	);
}
