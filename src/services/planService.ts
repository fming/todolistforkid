import { redis, scanKeys } from "@/lib/redis";
import { shiftIsoDate } from "@/lib/date";
import type { DayPlan, PlanStatus } from "@/types/day-plan";
import type { Task, TaskStatus } from "@/types/task";

const PLAN_PREFIX = "plan:";

function planKey(date: string): string {
  return `${PLAN_PREFIX}${date}`;
}

/** Bring one task up to the current schema (adds `status`, mirrors `completed`). */
function normalizeTask(raw: Task): Task {
  const status: TaskStatus =
    (raw.status as TaskStatus | undefined) ?? (raw.completed ? "verified" : "todo");
  return {
    ...raw,
    status,
    completed: status === "verified",
  };
}

/** Normalize legacy shapes so old rows keep working. */
function normalize(raw: Partial<DayPlan> & { date: string; tasks: Task[] }): DayPlan {
  return {
    date: raw.date,
    tasks: (raw.tasks ?? []).map(normalizeTask),
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
 * Apply a per-task update on a published plan. Kids can't touch drafts.
 * Returns the updated plan or `null` if plan/task not found or transition illegal.
 */
async function mutateTask(
  date: string,
  taskId: string,
  apply: (t: Task) => Task | null
): Promise<DayPlan | null> {
  const plan = await getPlan(date, { includeDraft: false });
  if (!plan) return null;

  const idx = plan.tasks.findIndex((t) => t.id === taskId);
  if (idx < 0) return null;

  const next = apply(plan.tasks[idx]);
  if (!next) return null;

  const nextTasks = plan.tasks.slice();
  nextTasks[idx] = next;
  return savePlan({ ...plan, tasks: nextTasks });
}

/** Kid submits a task: todo → pending. */
export async function submitTask(
  date: string,
  taskId: string
): Promise<DayPlan | null> {
  return mutateTask(date, taskId, (t) => {
    if (t.status !== "todo") return null;
    return {
      ...t,
      status: "pending",
      completed: false,
      submittedAt: new Date().toISOString(),
    };
  });
}

/** Kid cancels their submission: pending → todo. */
export async function cancelSubmission(
  date: string,
  taskId: string
): Promise<DayPlan | null> {
  return mutateTask(date, taskId, (t) => {
    if (t.status !== "pending") return null;
    return {
      ...t,
      status: "todo",
      completed: false,
      submittedAt: undefined,
    };
  });
}

/** Parent verifies a submission. Approve → verified. Reject → todo. */
export async function verifyTask(
  date: string,
  taskId: string,
  decision: "approve" | "reject",
  comment?: string
): Promise<DayPlan | null> {
  return mutateTask(date, taskId, (t) => {
    if (t.status !== "pending") return null;
    const trimmed = comment?.trim().slice(0, 500) || undefined;
    if (decision === "approve") {
      return {
        ...t,
        status: "verified",
        completed: true,
        verifiedAt: new Date().toISOString(),
        adminComment: trimmed,
      };
    }
    // reject → back to todo, comment persists so kid can read feedback
    return {
      ...t,
      status: "todo",
      completed: false,
      submittedAt: undefined,
      adminComment: trimmed,
    };
  });
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
 * Yesterday relative to `date` (YYYY-MM-DD). Returns tasks reset to a fresh
 * "todo" state so the caller doesn't have to clean them up.
 */
export async function getYesterdayTasks(date: string): Promise<Task[] | null> {
  const yesterday = shiftIsoDate(date, -1);

  const plan = await getPlan(yesterday, { includeDraft: true });
  if (!plan) return null;

  return plan.tasks.map((t) => ({
    ...t,
    status: "todo",
    completed: false,
    submittedAt: undefined,
    verifiedAt: undefined,
    adminComment: undefined,
  }));
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
