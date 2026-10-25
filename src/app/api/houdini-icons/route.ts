import { getHoudiniIconNames } from "@/server/houdini-icons/pack-reader";

// The admin picker's list of icon names; 404 until a pack has been imported.
export async function GET() {
	const names = await getHoudiniIconNames();
	if (!names) return Response.json([], { status: 404 });
	return Response.json(names);
}
