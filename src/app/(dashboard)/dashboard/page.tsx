import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { dailyChallenges, challengeSubmissions, businessSubmissions } from "@/lib/db/schema";
import { eq, and, gte, lte, sum, count } from "drizzle-orm";
import { KpiCard } from "@/components/kpi-card";
import { DailyChallengeCard } from "@/components/daily-challenge-card";
import { QuickAddBar } from "@/components/quick-add-bar";
import {
  DollarSign,
  TrendingUp,
  CalendarCheck,
  Users,
  Award,
  BookOpen,
} from "lucide-react";

const CRUSH_13_TARGET = 13;

async function getDashboardData(userId: string) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const [challenges, todaySubmissions, pointsRow] = await Promise.all([
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
  ]);

  const submissionMap = new Map(
    todaySubmissions.map((s) => [s.challengeId, s.status])
  );

  const completedCount = todaySubmissions.filter(
    (s) => s.status === "approved"
  ).length;

  const monthPoints = Number(pointsRow[0]?.total ?? 0);

  return {
    challenges: challenges.map((c) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      rpValue: c.rpValue,
      submissionStatus: (submissionMap.get(c.id) ?? "none") as
        | "none"
        | "pending"
        | "approved"
        | "rejected",
    })),
    completedCount,
    monthPoints,
  };
}

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;

  const userId = session.user.id as string;
  const firstName = session.user.name?.split(" ")[0] ?? "Agent";
  const today = new Date().toLocaleDateString("en-CA", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  let data: Awaited<ReturnType<typeof getDashboardData>> | null = null;
  try {
    data = await getDashboardData(userId);
  } catch {
    // DB not connected yet — render empty state
  }

  const challenges = data?.challenges ?? [];
  const completedCount = data?.completedCount ?? 0;
  const monthPoints = data?.monthPoints ?? 0;
  const crush13Pct = Math.min(100, Math.round((monthPoints / CRUSH_13_TARGET) * 100));

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Good {getTimeOfDay()}, {firstName}
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">{today}</p>
      </div>

      {/* KPI Cards */}
      <section>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <KpiCard label="Cash Flow" value="$0" icon={<DollarSign size={16} />} sub="manual entry" />
          <KpiCard label="Points" value={monthPoints} icon={<TrendingUp size={16} />} sub="this month" />
          <KpiCard label="New Appts" value={0} icon={<CalendarCheck size={16} />} sub="this month" />
          <KpiCard label="Agents" value={0} icon={<Users size={16} />} sub="licensed" />
          <KpiCard label="Licenses" value={0} icon={<Award size={16} />} />
          <KpiCard label="Studying" value={0} icon={<BookOpen size={16} />} />
        </div>
      </section>

      {/* Crush 13 Progress */}
      <section className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-semibold text-gray-900">Crush 13</h2>
            <p className="text-xs text-gray-500 mt-0.5">Monthly production target</p>
          </div>
          <span className="text-sm font-bold text-gray-700">
            {monthPoints} / {CRUSH_13_TARGET} pts
          </span>
        </div>
        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-sla-gold rounded-full transition-all duration-500"
            style={{ width: `${crush13Pct}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-2">{crush13Pct}% complete</p>
      </section>

      {/* Daily Challenges */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900">Daily Challenges</h2>
          <span className="text-sm text-gray-500">
            {completedCount} of {challenges.length} completed
          </span>
        </div>

        {challenges.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 p-8 text-center text-sm text-gray-400">
            No challenges found — run{" "}
            <code className="bg-gray-100 px-1 rounded text-xs">npm run db:seed</code>{" "}
            after connecting your database.
          </div>
        ) : (
          <div className="space-y-3">
            {challenges.map((c) => (
              <DailyChallengeCard key={c.id} {...c} />
            ))}
          </div>
        )}
      </section>

      {/* Quick Add */}
      <section>
        <h2 className="font-semibold text-gray-900 mb-3">Quick Add</h2>
        <QuickAddBar />
      </section>
    </div>
  );
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}
