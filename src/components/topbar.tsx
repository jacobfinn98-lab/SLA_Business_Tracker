"use client";

import { Menu } from "lucide-react";

interface TopbarProps {
  userName: string;
  onMobileMenuOpen: () => void;
}

export function Topbar({ userName, onMobileMenuOpen }: TopbarProps) {
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-CA", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <header className="h-14 flex items-center justify-between px-4 bg-white border-b border-gray-200 shrink-0">
      <div className="flex items-center gap-3">
        {/* Hamburger — mobile only */}
        <button
          onClick={onMobileMenuOpen}
          className="lg:hidden text-gray-500 hover:text-gray-900"
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>
        <span className="text-sm text-gray-500">{dateStr}</span>
      </div>
      <div className="text-sm font-medium text-gray-700">
        {userName}
      </div>
    </header>
  );
}
