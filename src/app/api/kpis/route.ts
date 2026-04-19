import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { activities, businessSubmissions, teamMembers } from "@/lib/db/schema";
import { eq, and, gte, lte, sum, count } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const userId = session.user.id as string;

  const [pointsRows, apptRows, teamRows] = await Promise.all([
    db
      .select({ total: sum(businessSubmissions.servicingPoints) })
      .from(businessSubmissions)
      .where(
        and(
          eq(businessSubmissions.servicingAgentId, userId),
          gte(businessSubmissions.submittedAt, monthStart),
          lte(businessSubmissions.submittedAt, monthEnd)
        )
      ),
    db
      .select({ total: count() })
      .from(activities)
      .where(
        and(
          eq(activities.agentId, userId),
          gte(activities.dateTime, monthStart),
          lte(activities.dateTime, monthEnd)
        )
      ),
    db
      .select({ total: count() })
      .from(teamMembers)
      .where(eq(teamMembers.userId, userId)),
  ]);

  return NextResponse.json({
    cashFlow: 0,
    points: Number(pointsRows[0]?.total ?? 0),
    newAppointments: Number(apptRows[0]?.total ?? 0),
    agents: Number(teamRows[0]?.total ?? 0),
    licenses: 0,
    studying: 0,
  });
}
