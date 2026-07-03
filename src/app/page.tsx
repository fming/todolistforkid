"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import KidTaskGrid from "@/components/task/KidTaskGrid";
import { todayInBeijing } from "@/lib/date";
import {
  ALL_DONE,
  randomEncouragement,
  type Encouragement,
} from "@/lib/encouragements";
import type { DayPlan } from "@/types/day-plan";
import type { Task } from "@/types/task";

type PlanResponse =
  | DayPlan
  | { date: string; status: "empty"; tasks: Task[] };

type Toast =
  | { kind: "cheer"; payload: Encouragement }
  | { kind: "trophy"; payload: Encouragement }
  | { kind: "error"; message: string };

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
  const [toast, setToast] = useState<Toast | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((next: Toast, durationMs: number) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(next);
    toastTimer.current = setTimeout(() => setToast(null), durationMs);
  }, []);

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
    const wasJustCompleted =
      completed && !prev.find((t) => t.id === id)?.completed;

    // Optimistic update.
    const next = prev.map((t) => (t.id === id ? { ...t, completed } : t));
    setTasks(next);

    try {
      const res = await fetch("/api/plan", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, id, completed }),
      });
      if (!res.ok) throw new Error();

      if (wasJustCompleted) {
        const allDone = next.length > 0 && next.every((t) => t.completed);
        if (allDone) {
          showToast({ kind: "trophy", payload: ALL_DONE }, 8000);
        } else {
          showToast(
            { kind: "cheer", payload: randomEncouragement() },
            5000
          );
        }
      }
    } catch {
      setTasks(prev);
      showToast({ kind: "error", message: "Couldn't save that — try again." }, 2500);
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

        {toast?.kind === "cheer" && (
          <button
            key={`cheer-${toast.payload.en}`}
            type="button"
            onClick={() => setToast(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 px-6 focus:outline-none"
            aria-label="Dismiss"
          >
            <div className="animate-[popIn_.35s_ease-out] max-w-lg rounded-3xl bg-gradient-to-br from-emerald-50 via-white to-sky-50 px-10 py-8 text-center shadow-2xl ring-2 ring-emerald-200">
              <p className="text-6xl md:text-7xl">{toast.payload.emoji}</p>
              <p className="mt-4 text-3xl font-bold leading-snug text-slate-900 md:text-4xl">
                {toast.payload.zh ?? toast.payload.en}
              </p>
              {toast.payload.zh && (
                <p className="mt-2 text-lg italic text-slate-600 md:text-xl">
                  {toast.payload.en}
                </p>
              )}
              <p className="mt-4 text-xs text-slate-400">tap to close</p>
            </div>
          </button>
        )}

        {toast?.kind === "trophy" && (
          <button
            type="button"
            onClick={() => setToast(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6 focus:outline-none"
            aria-label="Dismiss"
          >
            <div className="animate-[popIn_.35s_ease-out] max-w-xl rounded-3xl bg-gradient-to-br from-amber-100 via-white to-emerald-100 px-12 py-10 text-center shadow-2xl ring-2 ring-amber-300">
              <p className="text-7xl md:text-8xl">{toast.payload.emoji}</p>
              <p className="mt-4 text-4xl font-bold text-slate-900 md:text-5xl">
                {toast.payload.zh}
              </p>
              <p className="mt-2 text-xl italic text-slate-600 md:text-2xl">
                {toast.payload.en}
              </p>
              <p className="mt-5 text-xs text-slate-500">tap to close</p>
            </div>
          </button>
        )}

        {toast?.kind === "error" && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-slate-900 px-4 py-2 text-sm text-white shadow-lg">
            {toast.message}
          </div>
        )}
      </div>
    </main>
  );
}
