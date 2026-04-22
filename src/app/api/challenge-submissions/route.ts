import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { challengeSubmissions } from "@/lib/db/schema";
import { eq, and, gte } from "drizzle-orm";

const submitSchema = z.object({
  challengeId: z.string().uuid(),
  proofImageUrl: z.string().url().optional(),
  goodFaithAcknowledged: z.literal(true),
});

function getStartOfTodayUTC(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = submitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const userId = session.user.id as string;

  try {
    const [submission] = await db
      .insert(challengeSubmissions)
      .values({
        challengeId: parsed.data.challengeId,
        agentId: userId,
        proofImageUrl: parsed.data.proofImageUrl,
        goodFaithAcknowledged: true,
        status: "pending",
      })
      .returning();

    return NextResponse.json(submission, { status: 201 });
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      (error as { code: string }).code === "23505"
    ) {
      return NextResponse.json({ error: "Already submitted today" }, { status: 409 });
    }
    console.error("Failed to create submission:", error);
    return NextResponse.json({ error: "Failed to create submission" }, { status: 500 });
  }
}

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id as string;
  const todayStart = getStartOfTodayUTC();

  try {
    const submissions = await db
      .select()
      .from(challengeSubmissions)
      .where(
        and(
          eq(challengeSubmissions.agentId, userId),
          gte(challengeSubmissions.submittedAt, todayStart)
        )
      );

    return NextResponse.json(submissions);
  } catch (error) {
    console.error("Failed to fetch submissions:", error);
    return NextResponse.json({ error: "Failed to fetch submissions" }, { status: 500 });
  }
}
