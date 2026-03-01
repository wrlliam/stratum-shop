/**
 * Run this once to create the first admin user.
 * Usage: npx tsx scripts/setup-admin.ts
 */
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../lib/db/schema";
import { eq } from "drizzle-orm";
import * as bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import "dotenv/config";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@stratum.store";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "change-me-immediately";
const ADMIN_NAME = "Admin";

async function main() {
  const sql = postgres(process.env.DATABASE_URL!, { max: 1 });
  const db = drizzle(sql, { schema });

  const existing = await db.query.user.findFirst({
    where: eq(schema.user.email, ADMIN_EMAIL),
  });

  if (existing) {
    console.log(`Admin user already exists: ${ADMIN_EMAIL}`);
    if (existing.role !== "admin") {
      await db
        .update(schema.user)
        .set({ role: "admin" })
        .where(eq(schema.user.email, ADMIN_EMAIL));
      console.log("Updated role to admin");
    }
    await sql.end();
    return;
  }

  const userId = nanoid();
  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);
  const now = new Date();

  await db.insert(schema.user).values({
    id: userId,
    name: ADMIN_NAME,
    email: ADMIN_EMAIL,
    emailVerified: true,
    role: "admin",
    createdAt: now,
    updatedAt: now,
  });

  await db.insert(schema.account).values({
    id: nanoid(),
    accountId: userId,
    providerId: "credential",
    userId,
    password: hashedPassword,
    createdAt: now,
    updatedAt: now,
  });

  console.log(`✓ Admin user created: ${ADMIN_EMAIL}`);
  console.log(`  Password: ${ADMIN_PASSWORD}`);
  console.log("  Please change the password immediately after first login!");

  await sql.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
