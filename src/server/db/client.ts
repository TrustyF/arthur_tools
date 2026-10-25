import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import "dotenv/config";

const adapter = new PrismaPg({
	// biome-ignore lint/style/noNonNullAssertion: required env, fails loudly on first query
	connectionString: process.env.DATABASE_URL!,
});

function createClient() {
	return new PrismaClient({
		adapter,
		// Icon bytes stay out of every query unless explicitly selected.
		omit: { tool: { customIcon: true } },
	});
}

// Reused across dev hot reloads so each edit doesn't open a fresh pool.
const globalForDb = globalThis as unknown as {
	db?: ReturnType<typeof createClient>;
};

export const db = globalForDb.db ?? createClient();

if (process.env.NODE_ENV !== "production") globalForDb.db = db;
