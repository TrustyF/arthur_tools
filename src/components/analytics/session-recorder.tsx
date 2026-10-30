"use client";
import Script from "next/script";
import { useEffect } from "react";

type Command = "start" | "stop";

declare global {
	interface Window {
		// the recorder's api once recorder.js has run, a queue of commands it replays until then
		arthurRecorder?: Record<Command, () => void> | Command[];
	}
}

// Runs the command now if recorder.js has loaded, otherwise queues it for when it does.
function recorder(command: Command) {
	const current = window.arthurRecorder;
	if (current && !Array.isArray(current)) current[command]();
	else (window.arthurRecorder = current ?? []).push(command);
}

// Session recording via the analytics server's shared recorder.js (rrweb), mounted
// once in layout.tsx. Skipped in dev and for admins, so editing sessions aren't recorded.
export default function SessionRecorder({ isAdmin }: { isAdmin: boolean }) {
	useEffect(() => {
		if (process.env.NODE_ENV !== "production") return;
		if (isAdmin) return;

		recorder("start");
		// also runs when isAdmin flips (sign-in / sign-out re-render the layout), mid-session
		return () => recorder("stop");
	}, [isAdmin]);

	if (process.env.NODE_ENV !== "production") return null;
	// data-manual: started and stopped by the effect above instead of on load
	return (
		<Script
			src="https://analytics.arthursirjacobs.com/recorder.js"
			data-source="arthur_tools"
			data-manual=""
		/>
	);
}
