// A Cloudflare WAF block answers a server action with its own HTML page, which
// Next reports only as "An unexpected response was received from the server".

// Re-sends the same body as a plain POST (no Next-Action header, so no action
// runs) to see whether the firewall is what rejected it.

export type FirewallBlock = { rayId: string | undefined };

export async function detectFirewallBlock(
	formData: FormData,
): Promise<FirewallBlock | undefined> {
	try {
		const res = await fetch(window.location.pathname, {
			method: "POST",
			body: formData,
		});
		if (res.status !== 403) return undefined;
		const body = await res.text();
		if (!body.includes("cf-error-details")) return undefined;
		// The header is "<id>-<colo>"; the block page shows only the id.
		const rayId = res.headers.get("cf-ray")?.split("-")[0];
		return { rayId };
	} catch {
		return undefined;
	}
}
