import { redis, scanKeys } from "@/lib/redis";
import type { DayPlan, PlanStatus } from "@/types/day-plan";
import type { Task } from "@/types/task";

const PLAN_PREFIX = "plan:";

function planKey(date: string): string {
  return `${PLAN_PREFIX}${date}`;
}

/** Normalize legacy shapes so old rows keep working. */
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
  const raw = await redis.get<Partial<DayPlan> & { date: string; tasks: Task[] }>(
    planKey(date)
  );
  if (!raw) return null;

  const plan = normalize(raw);
  if (!opts.includeDraft && plan.status === "draft") return null;
  return plan;
}

export async function savePlan(plan: DayPlan): Promise<DayPlan> {
  const existing = await redis.get<Partial<DayPlan>>(planKey(plan.date));

  const next: DayPlan = {
    date: plan.date,
    tasks: plan.tasks,
    status: plan.status ?? (existing?.status as PlanStatus | undefined) ?? "draft",
    updatedAt: new Date().toISOString(),
    publishedAt: plan.publishedAt ?? existing?.publishedAt,
  };

  await redis.set(planKey(plan.date), next);
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

  return savePlan({ ...plan, status: "draft" });
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
  const keys = await scanKeys(`${PLAN_PREFIX}*`);
  if (keys.length === 0) return [];

  const rows = await Promise.all(
    keys.map((k) =>
      redis.get<Partial<DayPlan> & { date: string; tasks: Task[] }>(k)
    )
  );

  const plans = rows
    .filter((r): r is Partial<DayPlan> & { date: string; tasks: Task[] } => r !== null)
    .map(normalize)
    .filter((p) => opts.includeDrafts || p.status === "published");

  return plans.sort((a, b) => (a.date < b.date ? 1 : -1));
}

/**
 * Yesterday relative to `date` (YYYY-MM-DD). Returns tasks with fresh
 * completion state so the caller doesn't have to reset them.
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
 * Delete every plan key. Used by admin "Clear all history".
 */
export async function clearAllPlans(): Promise<number> {
  const keys = await scanKeys(`${PLAN_PREFIX}*`);
  if (keys.length === 0) return 0;
  await redis.del(...keys);
  return keys.length;
}
