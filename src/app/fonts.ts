import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

// Applied to <html> so every variable is available; actual usage is picked per-element via variables.sass.
export const fontVariables = `${geistSans.variable} ${geistMono.variable}`;
