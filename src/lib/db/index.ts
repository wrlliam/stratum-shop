import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL!;

// Disable prefetch as it is not supported for "Transaction" pool mode
const client = postgres(connectionString, { prepare: false });

// const globalForDb = globalThis as typeof globalThis & {
//   db?: ReturnType<typeof drizzle>;
// };

// const db = globalForDb.db ?? drizzle(client, { schema });
// if (!globalForDb.db) {
//   globalForDb.db = db;
// }

// export { db };
export const db = drizzle(client, { schema });
export * from "./schema";
