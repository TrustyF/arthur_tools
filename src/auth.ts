import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { comparePassword } from "@/lib/password";
import { db } from "@/server/db/client";

export const { handlers, auth, signIn, signOut } = NextAuth({
	// Credentials requires JWT session strategy (all-or-nothing).
	session: { strategy: "jwt" },
	pages: { signIn: "/login" },
	// Cookies aren't port-scoped, so on localhost the default name collides with
	// review_website_nextjs's session (other secret → JWTSessionError on every request).
	cookies: { sessionToken: { name: "arthur-tools.session-token" } },
	providers: [
		Credentials({
			credentials: {
				username: {},
				password: {},
			},
			authorize: async (credentials) => {
				const username =
					typeof credentials?.username === "string"
						? credentials.username.trim()
						: undefined;
				const password =
					typeof credentials?.password === "string"
						? credentials.password
						: undefined;
				if (!username || !password) return null;

				const user = await db.user.findUnique({ where: { username } });
				if (!user) return null;

				const valid = await comparePassword(password, user.passwordHash);
				if (!valid) return null;

				return {
					id: user.id,
					name: user.name ?? user.username,
					role: user.role,
				};
			},
		}),
	],
	callbacks: {
		// `user` is only set on the sign-in request; role changes apply on next sign-in.
		jwt({ token, user }) {
			if (user) {
				token.id = user.id as string;
				token.role = user.role;
			}
			return token;
		},
		session({ session, token }) {
			session.user.id = token.id;
			session.user.role = token.role;
			return session;
		},
	},
});
