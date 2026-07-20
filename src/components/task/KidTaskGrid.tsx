"use client";

import KidTaskCard, { type KidAction } from "./KidTaskCard";
import type { Task } from "@/types/task";

interface KidTaskGridProps {
  tasks: Task[];
  onAction: (id: string, action: KidAction) => void | Promise<void>;
}

export default function KidTaskGrid({ tasks, onAction }: KidTaskGridProps) {
  const total = tasks.length;
  const done = tasks.filter((t) => (t.status ?? (t.completed ? "verified" : "todo")) === "verified").length;
  const pending = tasks.filter((t) => t.status === "pending").length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900">
            {done} / {total} done
          </h2>
          <span className="text-sm text-slate-500">
            {pending > 0 && (
              <span className="mr-3 text-amber-700">⏳ {pending} waiting</span>
            )}
            {pct}%
          </span>
        </div>
        <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full bg-emerald-500 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tasks.map((task) => (
          <KidTaskCard key={task.id} task={task} onAction={onAction} />
        ))}
      </div>
    </div>
  );
}
