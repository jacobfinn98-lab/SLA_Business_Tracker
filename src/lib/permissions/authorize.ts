import type { User } from "@/lib/auth";

type Role = "agent" | "mentor" | "admin";

const ROLE_RANK: Record<Role, number> = {
  agent: 0,
  mentor: 1,
  admin: 2,
};

export function authorize(user: User | null, required: Role): void {
  if (!user) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }
  const userRole = (user as { role?: string }).role as Role | undefined;
  const rank = userRole ? ROLE_RANK[userRole] ?? 0 : 0;
  if (rank < ROLE_RANK[required]) {
    throw Object.assign(new Error("Forbidden"), { status: 403 });
  }
}
