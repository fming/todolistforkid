"use client";

import { useCallback, useEffect, useState } from "react";

import KidTaskGrid from "@/components/task/KidTaskGrid";
import { todayInBeijing } from "@/lib/date";
import type { DayPlan } from "@/types/day-plan";
import type { Task } from "@/types/task";

type PlanResponse =
  | DayPlan
  | { date: string; status: "empty"; tasks: Task[] };

function formatFriendlyDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00+08:00`);
  return d.toLocaleDateString("zh-CN", {
    timeZone: "Asia/Shanghai",
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export default function KidHome() {
  const [date] = useState(todayInBeijing);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [status, setStatus] = useState<"empty" | "published" | "loading">(
    "loading"
  );
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const res = await fetch(`/api/plan?date=${date}`);
      const data = (await res.json()) as PlanResponse;

      if ("status" in data && data.status === "empty") {
        setTasks([]);
        setStatus("empty");
        return;
      }

      setTasks(data.tasks);
      setStatus("published");
    } catch {
      setTasks([]);
      setStatus("empty");
    }
  }, [date]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleToggle(id: string, completed: boolean) {
    const prev = tasks;
    // Optimistic update.
    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, completed } : t)));

    try {
      const res = await fetch("/api/plan", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, id, completed }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setTasks(prev);
      setToast("Couldn't save that — try again.");
      setTimeout(() => setToast(null), 2500);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-sky-50 to-emerald-50">
      <div className="mx-auto max-w-6xl p-6 md:p-10">
        <header className="mb-6 flex items-start justify-between gap-6">
          <div>
            <p className="text-sm text-slate-500">
              Beijing Time: {formatFriendlyDate(date)}
            </p>
            <h1 className="mt-1 text-4xl font-bold text-slate-900">
              🌞 Today&apos;s Tasks
            </h1>
          </div>
          <a
            href="/admin"
            className="text-xs text-slate-400 underline hover:text-slate-700"
          >
            Admin
          </a>
        </header>

        {status === "loading" && (
          <div className="rounded-2xl border bg-white p-10 text-center text-slate-500">
            Loading...
          </div>
        )}

        {status === "empty" && (
          <div className="rounded-2xl border bg-white p-10 text-center">
            <p className="text-lg text-slate-700">
              Today&apos;s plan is being prepared…
            </p>
            <p className="mt-2 text-sm text-slate-400">
              Check back in a bit!
            </p>
          </div>
        )}

        {status === "published" && tasks.length === 0 && (
          <div className="rounded-2xl border bg-white p-10 text-center">
            <p className="text-lg text-slate-700">
              No tasks today — enjoy! 🎉
            </p>
          </div>
        )}

        {status === "published" && tasks.length > 0 && (
          <KidTaskGrid tasks={tasks} onToggle={handleToggle} />
        )}

        {toast && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-slate-900 px-4 py-2 text-sm text-white shadow-lg">
            {toast}
          </div>
        )}
      </div>
    </main>
  );
}
