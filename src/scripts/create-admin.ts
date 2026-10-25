// Usage: npm run create_admin -- <username> <password> [name]
// Creates the admin account, or resets the password and promotes an existing one.
import { hashPassword } from "@/lib/password";
import { db } from "@/server/db/client";

async function main() {
	const [username, password, name] = process.argv.slice(2);
	if (!username || !password) {
		console.error(
			"Usage: npm run create_admin -- <username> <password> [name]",
		);
		process.exit(1);
	}

	const passwordHash = await hashPassword(password);
	const user = await db.user.upsert({
		where: { username },
		create: { username, passwordHash, name: name ?? null, role: "ADMIN" },
		update: { passwordHash, role: "ADMIN", ...(name ? { name } : {}) },
	});
	console.log(`Admin ready: ${user.username}`);
}

main().finally(() => db.$disconnect());
