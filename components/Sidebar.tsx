"use client";

import { useState } from "react";
import Link from "next/link";
import {
  User,
  Settings,
  LayoutDashboard,
  FolderKanban,
  BarChart,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "#", label: "Dashboard", icon: LayoutDashboard },
  { href: "#", label: "Projects", icon: FolderKanban },
  { href: "#", label: "Reports", icon: BarChart },
];

export default function Sidebar() {
  const [open, setOpen] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <aside
      className={cn(
        "flex flex-col border-r transition-all",
        open ? "w-[240px]" : "w-[72px]"
      )}
    >
      <div className="flex items-center justify-between p-4">
        <div className="relative">
          <button
            aria-label="User menu"
            onClick={() => setMenuOpen((p) => !p)}
            className="rounded-full p-2 hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <User aria-hidden="true" className="size-6" />
          </button>
          {menuOpen && (
            <ul className="absolute left-0 mt-2 w-32 rounded-md border bg-background text-sm shadow">
              <li>
                <button className="block w-full px-2 py-1 text-left hover:bg-accent">Profile</button>
              </li>
              <li>
                <button className="block w-full px-2 py-1 text-left hover:bg-accent">Logout</button>
              </li>
            </ul>
          )}
        </div>
        <button
          aria-label="Toggle sidebar"
          onClick={() => setOpen((p) => !p)}
          className="rounded p-1 hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {open ? (
            <ChevronLeft aria-hidden="true" className="size-5" />
          ) : (
            <ChevronRight aria-hidden="true" className="size-5" />
          )}
        </button>
      </div>
      <nav className={cn("flex-1 space-y-1 px-2", !open && "flex flex-col items-center")}>
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2 rounded px-2 py-1 text-sm hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              !open && "justify-center"
            )}
          >
            <Icon aria-hidden="true" className="size-5" />
            {open && label}
          </Link>
        ))}
      </nav>
      <div className="mt-auto p-4">
        <Settings aria-hidden="true" className="size-5" />
      </div>
    </aside>
  );
}
