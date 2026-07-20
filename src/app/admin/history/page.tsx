"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import StatusBanner, {
  type BannerKind,
  type BannerState,
} from "@/components/admin/StatusBanner";
import { TASK_CATEGORIES, CATEGORY_EMOJI } from "@/lib/constants";
import { shiftIsoDate, todayInBeijing } from "@/lib/date";
import {
  applyFilter,
  computeSummary,
  flattenPlans,
  taskStatus,
  type HistoryFilter,
} from "@/lib/history-filter";
import type { DayPlan } from "@/types/day-plan";
import type { TaskCategory } from "@/types/task";

const DEFAULT_FILTER = (): HistoryFilter => {
  const today = todayInBeijing();
  return {
    from: shiftIsoDate(today, -30),
    to: today,
    category: "all",
    status: "all",
    keyword: "",
  };
};

export default function HistoryPage() {
  const [plans, setPlans] = useState<DayPlan[] | null>(null);
  const [filter, setFilter] = useState<HistoryFilter>(DEFAULT_FILTER);
  const [banner, setBanner] = useState<BannerState | null>(null);

  const notify = useCallback((kind: BannerKind, message: string) => {
    setBanner({ kind, message });
  }, []);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/plan/history");
      if (!res.ok) throw new Error();
      const data = (await res.json()) as DayPlan[];
      setPlans(data);
    } catch {
      setPlans([]);
      notify("error", "Failed to load history.");
    }
  }, [notify]);

  useEffect(() => {
    void load();
  }, [load]);

  const { rows, summary } = useMemo(() => {
    const all = flattenPlans(plans ?? []);
    const filtered = applyFilter(all, filter);
    return { rows: filtered, summary: computeSummary(filtered) };
  }, [plans, filter]);

  async function handleClear() {
    if (
      !confirm(
        "Delete ALL plans (drafts and published)? Download a backup first if you want to keep them. This cannot be undone."
      )
    ) {
      return;
    }
    try {
      const res = await fetch("/api/plan/history", { method: "DELETE" });
      if (!res.ok) throw new Error();
      const { removed } = (await res.json()) as { removed: number };
      notify("success", `Cleared ${removed} plan file(s).`);
      await load();
    } catch {
      notify("error", "Failed to clear history.");
    }
  }

  function update<K extends keyof HistoryFilter>(key: K, value: HistoryFilter[K]) {
    setFilter((prev) => ({ ...prev, [key]: value }));
  }

  const pct =
    summary.totalTasks > 0
      ? Math.round((summary.doneTasks / summary.totalTasks) * 100)
      : 0;

  return (
    <>
      <StatusBanner banner={banner} onDismiss={() => setBanner(null)} />

      {/* Ops */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-white p-4 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900">📊 History</h2>
          <p className="text-sm text-slate-500">
            Browse, filter, and back up past plans.
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href="/api/plan/export"
            download
            className="inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-slate-50"
          >
            Download backup
          </a>
          <Button
            onClick={handleClear}
            className="bg-red-600 hover:bg-red-700"
          >
            Clear all history
          </Button>
        </div>
      </div>

      {/* Filter */}
      <div className="mb-6 rounded-2xl border bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
          <label className="text-sm">
            <span className="mb-1 block text-xs text-slate-500">From</span>
            <input
              type="date"
              value={filter.from}
              onChange={(e) => update("from", e.target.value)}
              className="w-full rounded-md border px-2 py-1.5"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-xs text-slate-500">To</span>
            <input
              type="date"
              value={filter.to}
              onChange={(e) => update("to", e.target.value)}
              className="w-full rounded-md border px-2 py-1.5"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-xs text-slate-500">Category</span>
            <select
              value={filter.category}
              onChange={(e) =>
                update("category", e.target.value as TaskCategory | "all")
              }
              className="w-full rounded-md border px-2 py-1.5"
            >
              <option value="all">All</option>
              {TASK_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-xs text-slate-500">Status</span>
            <select
              value={filter.status}
              onChange={(e) =>
                update("status", e.target.value as HistoryFilter["status"])
              }
              className="w-full rounded-md border px-2 py-1.5"
            >
              <option value="all">All</option>
              <option value="verified">✅ Verified</option>
              <option value="pending">⏳ Pending</option>
              <option value="todo">◻ To do</option>
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-xs text-slate-500">Keyword</span>
            <input
              type="text"
              placeholder="Search title / note / comment"
              value={filter.keyword}
              onChange={(e) => update("keyword", e.target.value)}
              className="w-full rounded-md border px-2 py-1.5"
            />
          </label>
        </div>
        <div className="mt-3 flex justify-end">
          <Button variant="outline" onClick={() => setFilter(DEFAULT_FILTER())}>
            Reset
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Completion</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {summary.doneTasks} / {summary.totalTasks}
          </p>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full bg-emerald-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-slate-500">{pct}% done</p>
        </div>
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Minutes</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {summary.doneMinutes} / {summary.totalMinutes}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Time completed vs planned
          </p>
        </div>
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Days covered</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {summary.daysCovered}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Unique dates in filter range
          </p>
        </div>
      </div>

      {/* By category */}
      {summary.byCategory.length > 0 && (
        <div className="mb-6 rounded-2xl border bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-medium text-slate-700">
            By category
          </h3>
          <div className="space-y-2">
            {summary.byCategory.map((c) => {
              const catPct =
                c.total > 0 ? Math.round((c.done / c.total) * 100) : 0;
              return (
                <div key={c.category} className="flex items-center gap-3">
                  <span className="w-32 text-sm text-slate-700">
                    {CATEGORY_EMOJI[c.category]} {c.category}
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full bg-emerald-500"
                      style={{ width: `${catPct}%` }}
                    />
                  </div>
                  <span className="w-32 text-right text-xs text-slate-500">
                    {c.done}/{c.total} · {c.doneMinutes}/{c.totalMinutes} min
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Task list */}
      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        {plans === null ? (
          <p className="p-6 text-sm text-slate-500">Loading history...</p>
        ) : rows.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">No tasks match this filter.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Title</th>
                <th className="px-4 py-2">Category</th>
                <th className="px-4 py-2">Type</th>
                <th className="px-4 py-2">Duration</th>
                <th className="px-4 py-2">Difficulty</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const s = taskStatus(row.task);
                return (
                  <tr
                    key={`${row.date}-${row.task.id}`}
                    className="border-t border-slate-100"
                  >
                    <td className="px-4 py-2 align-top text-slate-500">{row.date}</td>
                    <td className="px-4 py-2 align-top font-medium text-slate-800">
                      <div>{row.task.title || "Untitled"}</div>
                      {row.task.note && (
                        <p className="mt-1 whitespace-pre-wrap text-xs font-normal text-slate-600">
                          📝 {row.task.note}
                        </p>
                      )}
                      {row.task.adminComment && (
                        <p
                          className={`mt-1 whitespace-pre-wrap rounded-md px-2 py-1 text-xs font-normal ${
                            s === "verified"
                              ? "bg-emerald-50 text-emerald-800"
                              : "bg-rose-50 text-rose-800"
                          }`}
                        >
                          👨‍👩‍👧 {row.task.adminComment}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-2 align-top text-slate-600">
                      {CATEGORY_EMOJI[row.task.category]} {row.task.category}
                    </td>
                    <td className="px-4 py-2 align-top text-slate-600">{row.task.type}</td>
                    <td className="px-4 py-2 align-top text-slate-600">
                      {row.task.durationMinutes} min
                    </td>
                    <td className="px-4 py-2 align-top text-slate-600">
                      {"⭐".repeat(row.task.difficulty)}
                    </td>
                    <td className="px-4 py-2 align-top">
                      {s === "verified" && (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800">
                          ✅ Verified
                        </span>
                      )}
                      {s === "pending" && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                          ⏳ Pending
                        </span>
                      )}
                      {s === "todo" && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                          ◻ To do
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
