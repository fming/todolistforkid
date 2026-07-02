import type { DayPlan } from "@/types/day-plan";
import type { Task, TaskCategory } from "@/types/task";

export interface TaskRow {
  date: string;
  task: Task;
}

export type StatusFilter = "all" | "done" | "notDone";

export interface HistoryFilter {
  from: string;
  to: string;
  category: TaskCategory | "all";
  status: StatusFilter;
  keyword: string;
}

export interface HistorySummary {
  totalTasks: number;
  doneTasks: number;
  totalMinutes: number;
  doneMinutes: number;
  daysCovered: number;
  byCategory: Array<{
    category: TaskCategory;
    total: number;
    done: number;
    totalMinutes: number;
    doneMinutes: number;
  }>;
}

/** Flatten plans into one row per task, newest first. */
export function flattenPlans(plans: DayPlan[]): TaskRow[] {
  const rows: TaskRow[] = [];
  for (const plan of plans) {
    for (const task of plan.tasks) {
      rows.push({ date: plan.date, task });
    }
  }
  return rows.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function applyFilter(rows: TaskRow[], filter: HistoryFilter): TaskRow[] {
  const kw = filter.keyword.trim().toLowerCase();
  return rows.filter((row) => {
    if (filter.from && row.date < filter.from) return false;
    if (filter.to && row.date > filter.to) return false;
    if (filter.category !== "all" && row.task.category !== filter.category)
      return false;
    if (filter.status === "done" && !row.task.completed) return false;
    if (filter.status === "notDone" && row.task.completed) return false;
    if (kw) {
      const hay = `${row.task.title} ${row.task.note ?? ""}`.toLowerCase();
      if (!hay.includes(kw)) return false;
    }
    return true;
  });
}

export function computeSummary(rows: TaskRow[]): HistorySummary {
  const byCat = new Map<
    TaskCategory,
    { total: number; done: number; totalMinutes: number; doneMinutes: number }
  >();
  const days = new Set<string>();
  let totalMinutes = 0;
  let doneMinutes = 0;
  let doneTasks = 0;

  for (const row of rows) {
    days.add(row.date);

    const mins = row.task.durationMinutes || 0;
    totalMinutes += mins;
    if (row.task.completed) {
      doneTasks += 1;
      doneMinutes += mins;
    }

    const entry = byCat.get(row.task.category) ?? {
      total: 0,
      done: 0,
      totalMinutes: 0,
      doneMinutes: 0,
    };
    entry.total += 1;
    entry.totalMinutes += mins;
    if (row.task.completed) {
      entry.done += 1;
      entry.doneMinutes += mins;
    }
    byCat.set(row.task.category, entry);
  }

  const byCategory = Array.from(byCat.entries())
    .map(([category, v]) => ({ category, ...v }))
    .sort((a, b) => b.totalMinutes - a.totalMinutes);

  return {
    totalTasks: rows.length,
    doneTasks,
    totalMinutes,
    doneMinutes,
    daysCovered: days.size,
    byCategory,
  };
}

/** ISO date offset by `days` from `iso` (negative = past). */
export function shiftIsoDate(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
