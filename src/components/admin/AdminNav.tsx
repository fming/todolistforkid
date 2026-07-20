"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin/today", label: "Today" },
  { href: "/admin/template", label: "Template" },
  { href: "/admin/study-plan", label: "学习计划" },
  { href: "/admin/history", label: "History" },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="mb-6 flex gap-1 border-b border-slate-200">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={
              active
                ? "border-b-2 border-slate-900 px-4 py-2 text-sm font-medium text-slate-900"
                : "border-b-2 border-transparent px-4 py-2 text-sm text-slate-500 hover:text-slate-800"
            }
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
