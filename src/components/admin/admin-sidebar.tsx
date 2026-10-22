// src/components/admin/admin-sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard, Users, Heart, Sparkles, Trophy, TrendingUp, LogOut, Menu, X,
} from "lucide-react";
import { logout } from "@/app/auth/actions";

const links = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/draws", label: "Draws", icon: Sparkles },
  { href: "/admin/charities", label: "Charities", icon: Heart },
  { href: "/admin/winners", label: "Winners", icon: Trophy },
  { href: "/admin/reports", label: "Reports", icon: TrendingUp },
];

export function AdminSidebar({ name, email }: { name: string; email: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const nav = (
    <nav className="mt-6 space-y-1">
      {links.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
              active
                ? "bg-white/15 text-white"
                : "text-emerald-100/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );

  const footer = (
    <div className="border-t border-white/10 pt-4">
      <p className="truncate text-sm font-medium text-white">{name}</p>
      <p className="truncate text-xs text-emerald-100/60">{email}</p>
      <form action={logout} className="mt-3">
        <button className="flex items-center gap-2 text-xs text-emerald-100/70 transition hover:text-white">
          <LogOut className="h-3.5 w-3.5" /> Log out
        </button>
      </form>
    </div>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between bg-[#0f4d32] px-4 py-3 text-white md:hidden">
        <span className="font-bold">GoodSwing Admin</span>
        <button onClick={() => setOpen(!open)} aria-label="Toggle menu">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="fixed inset-x-0 top-[48px] z-20 flex flex-col gap-4 bg-[#0f4d32] px-4 pb-6 md:hidden">
          {nav}
          {footer}
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col justify-between bg-[#0f4d32] p-5 md:flex">
        <div>
          <Link href="/admin" className="flex items-center gap-2 text-lg font-extrabold text-white">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-white text-[#0f4d32]">G</span>
            Admin
          </Link>
          {nav}
        </div>
        {footer}
      </aside>
    </>
  );
}