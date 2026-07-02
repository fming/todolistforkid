import { deleteFile, listFiles, readJSON, writeJSON } from "@/lib/storage";
import type { DayPlan, PlanStatus } from "@/types/day-plan";
import type { Task } from "@/types/task";

const PLANS_DIR = "plans";

function planPath(date: string): string {
  return `${PLANS_DIR}/${date}.json`;
}

/**
 * Normalize a stored plan. Legacy files that predate `status` are treated as
 * "published" so existing data stays visible to kids.
 */
function normalize(raw: Partial<DayPlan> & { date: string; tasks: Task[] }): DayPlan {
  return {
    date: raw.date,
    tasks: raw.tasks ?? [],
    status: (raw.status as PlanStatus | undefined) ?? "published",
    updatedAt: raw.updatedAt ?? new Date(0).toISOString(),
    publishedAt: raw.publishedAt,
  };
}

/**
 * Read a plan. When `includeDraft` is false (kid view), drafts return `null`.
 */
export async function getPlan(
  date: string,
  opts: { includeDraft?: boolean } = {}
): Promise<DayPlan | null> {
  const raw = await readJSON<Partial<DayPlan> & { date: string; tasks: Task[] }>(
    planPath(date)
  );
  if (!raw) return null;

  const plan = normalize(raw);
  if (!opts.includeDraft && plan.status === "draft") return null;
  return plan;
}

export async function savePlan(plan: DayPlan): Promise<DayPlan> {
  const existing = await readJSON<Partial<DayPlan>>(planPath(plan.date));

  const next: DayPlan = {
    date: plan.date,
    tasks: plan.tasks,
    status: plan.status ?? (existing?.status as PlanStatus | undefined) ?? "draft",
    updatedAt: new Date().toISOString(),
    publishedAt: plan.publishedAt ?? existing?.publishedAt,
  };

  await writeJSON(planPath(plan.date), next);
  return next;
}

export async function publishPlan(date: string): Promise<DayPlan | null> {
  const plan = await getPlan(date, { includeDraft: true });
  if (!plan) return null;

  return savePlan({
    ...plan,
    status: "published",
    publishedAt: new Date().toISOString(),
  });
}

export async function unpublishPlan(date: string): Promise<DayPlan | null> {
  const plan = await getPlan(date, { includeDraft: true });
  if (!plan) return null;

  return savePlan({
    ...plan,
    status: "draft",
  });
}

/**
 * Flip one task's completion. Only allowed on published plans — kids can't
 * mutate a draft.
 */
export async function updateTaskCompletion(
  date: string,
  taskId: string,
  completed: boolean
): Promise<DayPlan | null> {
  const plan = await getPlan(date, { includeDraft: false });
  if (!plan) return null;

  const idx = plan.tasks.findIndex((t) => t.id === taskId);
  if (idx < 0) return null;

  const nextTasks = plan.tasks.slice();
  nextTasks[idx] = { ...nextTasks[idx], completed };

  return savePlan({ ...plan, tasks: nextTasks });
}

/**
 * List plans, newest first. Kid-facing views should pass `includeDrafts: false`.
 */
export async function listPlans(
  opts: { includeDrafts?: boolean } = {}
): Promise<DayPlan[]> {
  const files = await listFiles(PLANS_DIR);
  const dates = files
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.slice(0, -".json".length));

  const plans = await Promise.all(
    dates.map((d) => getPlan(d, { includeDraft: opts.includeDrafts }))
  );

  return plans
    .filter((p): p is DayPlan => p !== null)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

/**
 * Yesterday relative to `date` (YYYY-MM-DD). Returns tasks with fresh completion
 * state so the caller doesn't have to reset them.
 */
export async function getYesterdayTasks(date: string): Promise<Task[] | null> {
  const d = new Date(`${date}T00:00:00`);
  d.setDate(d.getDate() - 1);
  const yesterday = d.toISOString().slice(0, 10);

  const plan = await getPlan(yesterday, { includeDraft: true });
  if (!plan) return null;

  return plan.tasks.map((t) => ({ ...t, completed: false }));
}

/**
 * Delete every plan file. Used by admin "Clear all history".
 */
export async function clearAllPlans(): Promise<number> {
  const files = await listFiles(PLANS_DIR);
  const targets = files.filter((f) => f.endsWith(".json"));
  await Promise.all(targets.map((f) => deleteFile(`${PLANS_DIR}/${f}`)));
  return targets.length;
}
