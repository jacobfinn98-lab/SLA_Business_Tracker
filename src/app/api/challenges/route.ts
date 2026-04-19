import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { dailyChallenges, challengeSubmissions } from "@/lib/db/schema";
import { eq, and, gte } from "drizzle-orm";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id as string;
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [challenges, todaySubmissions] = await Promise.all([
    db.select().from(dailyChallenges).orderBy(dailyChallenges.createdAt),
    db
      .select()
      .from(challengeSubmissions)
      .where(
        and(
          eq(challengeSubmissions.agentId, userId),
          gte(challengeSubmissions.submittedAt, todayStart)
        )
      ),
  ]);

  const submissionMap = new Map(
    todaySubmissions.map((s) => [s.challengeId, s.status])
  );

  return NextResponse.json(
    challenges.map((c) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      rpValue: c.rpValue,
      submissionStatus: submissionMap.get(c.id) ?? "none",
    }))
  );
}
