"use client";

import { useEffect, useRef } from "react";

// Counted from the browser, not the render: Next renders pages early for link
// prefetches. The ref stops dev Strict Mode's double effect counting twice.
export function ViewTracker({ eventsUrl }: { eventsUrl: string }) {
	const sent = useRef(false);

	useEffect(() => {
		if (sent.current) return;
		sent.current = true;
		void fetch(eventsUrl, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ event: "view" }),
			keepalive: true,
		}).catch(() => {});
	}, [eventsUrl]);

	return null;
}
