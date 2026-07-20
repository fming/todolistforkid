import type { DayPlan } from "@/types/day-plan";
import type { Task, TaskCategory, TaskStatus } from "@/types/task";

export interface TaskRow {
  date: string;
  task: Task;
}

export type StatusFilter = "all" | "verified" | "pending" | "todo";

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

/** Resolve a task's status, falling back to the legacy `completed` boolean. */
export function taskStatus(task: Task): TaskStatus {
  return task.status ?? (task.completed ? "verified" : "todo");
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
    if (filter.status !== "all" && taskStatus(row.task) !== filter.status)
      return false;
    if (kw) {
      const hay = `${row.task.title} ${row.task.note ?? ""} ${row.task.adminComment ?? ""}`.toLowerCase();
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
    const isDone = taskStatus(row.task) === "verified";
    totalMinutes += mins;
    if (isDone) {
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
    if (isDone) {
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
