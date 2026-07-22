"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import KidTaskGrid from "@/components/task/KidTaskGrid";
import type { KidAction } from "@/components/task/KidTaskCard";
import { todayInBeijing } from "@/lib/date";
import {
  ALL_DONE,
  SUBMITTED_NUDGE,
  randomEncouragement,
  type Encouragement,
} from "@/lib/encouragements";
import type { DayPlan } from "@/types/day-plan";
import type { Task, TaskStatus } from "@/types/task";

type PlanResponse =
  | DayPlan
  | { date: string; status: "empty"; tasks: Task[] };

type Toast =
  | { kind: "cheer"; payload: Encouragement; comment?: string }
  | { kind: "trophy"; payload: Encouragement }
  | { kind: "nudge"; payload: Encouragement }
  | { kind: "error"; message: string };

const POLL_INTERVAL_MS = 15_000;

function statusOf(t: Task): TaskStatus {
  return t.status ?? (t.completed ? "verified" : "todo");
}

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
  const tasksRef = useRef<Task[]>([]);

  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  const showToast = useCallback((next: Toast, durationMs: number) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(next);
    toastTimer.current = setTimeout(() => setToast(null), durationMs);
  }, []);

  const fetchPlan = useCallback(async (): Promise<Task[] | null> => {
    try {
      const res = await fetch(`/api/plan?date=${date}`);
      const data = (await res.json()) as PlanResponse;
      if ("status" in data && data.status === "empty") return [];
      return data.tasks;
    } catch {
      return null;
    }
  }, [date]);

  const load = useCallback(async () => {
    setStatus("loading");
    const next = await fetchPlan();
    if (next === null) {
      setTasks([]);
      setStatus("empty");
      return;
    }
    setTasks(next);
    setStatus(next.length === 0 ? "empty" : "published");
  }, [fetchPlan]);

  useEffect(() => {
    void load();
  }, [load]);

  // Poll for parent-side verification changes.
  useEffect(() => {
    const interval = setInterval(async () => {
      const fresh = await fetchPlan();
      if (!fresh) return;
      const prev = tasksRef.current;

      // Detect newly-verified tasks (verifiedAt appeared or got newer).
      const newlyVerified = fresh.filter((f) => {
        if (statusOf(f) !== "verified") return false;
        const p = prev.find((t) => t.id === f.id);
        if (!p) return false;
        if (statusOf(p) === "verified" && p.verifiedAt === f.verifiedAt) return false;
        return true;
      });

      // Detect newly-rejected (was pending, now todo with a comment).
      const newlyRejected = fresh.filter((f) => {
        if (statusOf(f) !== "todo" || !f.adminComment) return false;
        const p = prev.find((t) => t.id === f.id);
        if (!p) return false;
        return statusOf(p) === "pending";
      });

      setTasks(fresh);

      // Trophy if all verified now (and wasn't before).
      const allVerifiedNow =
        fresh.length > 0 && fresh.every((t) => statusOf(t) === "verified");
      const allVerifiedBefore =
        prev.length > 0 && prev.every((t) => statusOf(t) === "verified");

      if (allVerifiedNow && !allVerifiedBefore) {
        showToast({ kind: "trophy", payload: ALL_DONE }, 8000);
        return;
      }

      if (newlyVerified.length > 0) {
        const first = newlyVerified[0];
        showToast(
          {
            kind: "cheer",
            payload: randomEncouragement(),
            comment: first.adminComment,
          },
          6000
        );
        return;
      }

      if (newlyRejected.length > 0) {
        showToast(
          {
            kind: "error",
            message: `↩ 需要重做: ${newlyRejected[0].adminComment ?? ""}`,
          },
          5000
        );
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [fetchPlan, showToast]);

  async function handleAction(id: string, action: KidAction) {
    const prev = tasks;
    // Optimistic update.
    const next = prev.map((t) => {
      if (t.id !== id) return t;
      if (action === "submit") {
        return { ...t, status: "pending" as TaskStatus, submittedAt: new Date().toISOString() };
      }
      return { ...t, status: "todo" as TaskStatus, submittedAt: undefined };
    });
    setTasks(next);

    try {
      const res = await fetch("/api/plan", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, id, action }),
      });
      if (!res.ok) throw new Error();
      const updated = (await res.json()) as DayPlan;
      setTasks(updated.tasks);

      if (action === "submit") {
        showToast({ kind: "nudge", payload: SUBMITTED_NUDGE }, 3200);
      }
    } catch {
      setTasks(prev);
      showToast(
        { kind: "error", message: "Couldn't save that — try again." },
        2500
      );
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
          <KidTaskGrid tasks={tasks} onAction={handleAction} />
        )}

        {toast?.kind === "cheer" && (
          <button
            key={`cheer-${toast.payload.en}-${toast.comment ?? ""}`}
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
              {toast.comment && (
                <div className="mt-4 rounded-xl bg-emerald-100 px-4 py-3 text-left text-base text-emerald-900">
                  <p className="mb-1 font-medium">👨‍👩‍👧 家长评语</p>
                  <article className="prose prose-base max-w-none prose-p:my-1">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {toast.comment}
                    </ReactMarkdown>
                  </article>
                </div>
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

        {toast?.kind === "nudge" && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 animate-[fadeInUp_.25s_ease-out] rounded-full bg-amber-50 px-5 py-3 text-center shadow-lg ring-1 ring-amber-200">
            <p className="text-base font-medium text-amber-900">
              <span className="mr-1">{toast.payload.emoji}</span>
              {toast.payload.zh} · {toast.payload.en}
            </p>
          </div>
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
