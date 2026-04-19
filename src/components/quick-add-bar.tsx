"use client";

import { useRouter } from "next/navigation";
import { UserPlus, Users, CalendarPlus, Briefcase, Star } from "lucide-react";

const ACTIONS = [
  { label: "Contact", icon: UserPlus, href: "/rolodex/new" },
  { label: "Guest", icon: Users, href: "/bpm-guests/new" },
  { label: "Appt", icon: CalendarPlus, href: "/activity/new" },
  { label: "Recruit", icon: Star, href: "/rolodex/recruit" },
  { label: "Biz", icon: Briefcase, href: "/business/new" },
] as const;

export function QuickAddBar() {
  const router = useRouter();

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {ACTIONS.map(({ label, icon: Icon, href }) => (
        <button
          key={label}
          onClick={() => router.push(href)}
          className="flex items-center gap-1.5 bg-sla-navy text-white text-sm font-medium px-3 py-2 rounded-lg hover:bg-sla-navy-light active:scale-95 transition-all"
        >
          <Icon size={15} className="shrink-0" />
          {label}
        </button>
      ))}
    </div>
  );
}
