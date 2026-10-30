import type { Metadata } from "next";
import "./styles/globals.sass";
import type React from "react";
import { auth } from "@/auth";
import SessionRecorder from "@/components/analytics/session-recorder";
import NavBar from "@/components/navbar/nav-bar";
import { fontVariables } from "./fonts";

const SITE_URL = process.env.SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
	title: {
		default: "Arthur's tools — Houdini Python & VEX snippets",
		template: "%s — Arthur's tools",
	},
	description:
		"Arthur Sirjacobs' collection of Houdini Python scripts and VEX snippets.",
	authors: [{ name: "Arthur Sirjacobs", url: SITE_URL }],
	metadataBase: new URL(SITE_URL),
};

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	// already dynamic - NavBar reads the session too
	const session = await auth();

	return (
		<html lang="en" className={fontVariables}>
			<body>
				<NavBar />
				<main>{children}</main>
				<SessionRecorder isAdmin={session?.user?.role === "ADMIN"} />
			</body>
		</html>
	);
}
