import type { User } from "@/lib/auth";

type Role =
  | "training_associate"
  | "associate"
  | "marketing_director"
  | "senior_marketing_director"
  | "admin";

const ROLE_RANK: Record<Role, number> = {
  training_associate: 0,
  associate: 1,
  marketing_director: 2,
  senior_marketing_director: 3,
  admin: 4,
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
