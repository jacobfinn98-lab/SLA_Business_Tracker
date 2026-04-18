"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  CalendarDays,
  Briefcase,
  BookUser,
  Users,
  Building2,
  FileText,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/activity", label: "Activity", icon: CalendarDays },
  { href: "/business", label: "Business", icon: Briefcase },
  { href: "/rolodex", label: "Rolodex", icon: BookUser },
  { href: "/bpm-guests", label: "BPM Guests", icon: Users },
  { href: "/teams", label: "Teams", icon: Building2 },
  { href: "/providers", label: "Providers", icon: FileText },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({
  collapsed,
  onToggle,
  mobileOpen,
  onMobileClose,
}: SidebarProps) {
  const pathname = usePathname();

  const navContent = (
    <nav className="flex flex-col flex-1 gap-1 px-2 py-4">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            onClick={onMobileClose}
            className={[
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-sla-gold text-sla-navy"
                : "text-sla-sidebar-fg hover:bg-sla-navy-light hover:text-white",
              collapsed ? "justify-center" : "",
            ].join(" ")}
            title={collapsed ? label : undefined}
          >
            <Icon size={20} className="shrink-0" />
            {!collapsed && <span>{label}</span>}
          </Link>
        );
      })}
    </nav>
  );

  // Desktop sidebar
  const desktop = (
    <aside
      className={[
        "hidden lg:flex flex-col bg-sla-navy border-r border-sla-navy-light transition-all duration-200 shrink-0",
        collapsed ? "w-16" : "w-60",
      ].join(" ")}
      style={{ minHeight: "100vh" }}
    >
      {/* Logo / wordmark */}
      <div
        className={[
          "flex items-center h-14 px-3 border-b border-sla-navy-light shrink-0",
          collapsed ? "justify-center" : "gap-2",
        ].join(" ")}
      >
        <span className="text-sla-gold font-bold text-xl leading-none">S</span>
        {!collapsed && (
          <span className="text-sla-sidebar-fg font-semibold text-sm tracking-wide">
            SLA Tracker
          </span>
        )}
      </div>

      {navContent}

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        className="flex items-center justify-center h-10 mx-2 mb-3 rounded-lg text-sla-sidebar-fg hover:bg-sla-navy-light transition-colors"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>
    </aside>
  );

  // Mobile slide-over
  const mobile = (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onMobileClose}
        />
      )}
      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 flex flex-col w-72 bg-sla-navy transition-transform duration-200 lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <div className="flex items-center justify-between h-14 px-4 border-b border-sla-navy-light">
          <span className="text-sla-sidebar-fg font-semibold text-sm tracking-wide">
            SLA Tracker
          </span>
          <button
            onClick={onMobileClose}
            className="text-sla-sidebar-fg hover:text-white"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>
        {navContent}
      </aside>
    </>
  );

  return (
    <>
      {desktop}
      {mobile}
    </>
  );
}
