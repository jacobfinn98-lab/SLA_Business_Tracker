import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { providers, dailyChallenges, users } from "../src/lib/db/schema";
import bcrypt from "bcrypt";

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const db = drizzle(pool);

async function seed() {
  console.log("Seeding providers…");
  await db
    .insert(providers)
    .values([
      { carrierName: "Equitable Life", details: "Canadian mutual life insurance company." },
      { carrierName: "iA Financial Group", details: "Industrial Alliance — one of Canada's largest insurers." },
      { carrierName: "Ivari", details: "Previously Transamerica Life Canada." },
      { carrierName: "Manulife", details: "Canada's largest insurance company." },
    ])
    .onConflictDoNothing();

  console.log("Seeding daily challenges…");
  await db
    .insert(dailyChallenges)
    .values([
      {
        title: "Phone Zone",
        description: "Make a minimum of 20 prospecting calls today. Log your activity and submit proof.",
        rpValue: 100,
      },
      {
        title: "Another One",
        description: "Book at least one new appointment today from your prospecting calls.",
        rpValue: 100,
      },
      {
        title: "Accountable",
        description: "Complete your daily accountability check-in with your mentor or accountability partner.",
        rpValue: 100,
      },
    ])
    .onConflictDoNothing();

  console.log("Seeding admin user…");
  const passwordHash = await bcrypt.hash("Admin1234!", 12);
  await db
    .insert(users)
    .values({
      name: "SLA Admin",
      email: "admin@sla.local",
      emailVerified: true,
      passwordHash,
      role: "admin",
    })
    .onConflictDoNothing();

  console.log("Seed complete.");
  await pool.end();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
