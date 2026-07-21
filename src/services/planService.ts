import { redis, scanKeys } from "@/lib/redis";
import { shiftIsoDate } from "@/lib/date";
import type { DayPlan, PlanStatus } from "@/types/day-plan";
import type { Task, TaskStatus } from "@/types/task";

/**
 * Storage model
 * -------------
 *   plan:<date>         → the PUBLISHED plan for that date (or nothing).
 *   plan:<date>:draft   → the admin's in-progress DRAFT (or nothing).
 *
 * The two never share a key, so saving a draft can never overwrite what the
 * kids are seeing.
 */
const PLAN_PREFIX = "plan:";
const DRAFT_SUFFIX = ":draft";

function publishedKey(date: string): string {
  return `${PLAN_PREFIX}${date}`;
}

function draftKey(date: string): string {
  return `${PLAN_PREFIX}${date}${DRAFT_SUFFIX}`;
}

function isDraftKey(key: string): boolean {
  return key.endsWith(DRAFT_SUFFIX);
}

/** Bring one task up to the current schema. */
function normalizeTask(raw: Task): Task {
  const status: TaskStatus =
    (raw.status as TaskStatus | undefined) ?? (raw.completed ? "verified" : "todo");
  return {
    ...raw,
    status,
    completed: status === "verified",
  };
}

type RawPlan = Partial<DayPlan> & { date: string; tasks: Task[] };

/** Normalize legacy shapes so old rows keep working. */
function normalize(raw: RawPlan, fallbackStatus: PlanStatus): DayPlan {
  return {
    date: raw.date,
    tasks: (raw.tasks ?? []).map(normalizeTask),
    status: (raw.status as PlanStatus | undefined) ?? fallbackStatus,
    updatedAt: raw.updatedAt ?? new Date(0).toISOString(),
    publishedAt: raw.publishedAt,
  };
}

/** Read the published plan for a date, or null if none exists. */
export async function getPublishedPlan(date: string): Promise<DayPlan | null> {
  const raw = await redis.get<RawPlan>(publishedKey(date));
  if (!raw) return null;
  const plan = normalize(raw, "published");
  // Defensive: legacy rows written before the split may still be flagged
  // "draft" while sitting at the published key. Ignore them.
  if (plan.status !== "published") return null;
  return plan;
}

/** Read the draft for a date, or null if none exists. */
export async function getDraft(date: string): Promise<DayPlan | null> {
  const raw = await redis.get<RawPlan>(draftKey(date));
  if (!raw) return null;
  return normalize(raw, "draft");
}

/**
 * Save the admin's draft for a date. Never touches the published key, so the
 * currently-live plan (and any pending/verified state on its tasks) is safe.
 */
export async function saveDraft(date: string, tasks: Task[]): Promise<DayPlan> {
  const next: DayPlan = {
    date,
    tasks: tasks.map(normalizeTask),
    status: "draft",
    updatedAt: new Date().toISOString(),
  };
  await redis.set(draftKey(date), next);
  return next;
}

/** Delete the draft for a date, if any. Does not touch the published plan. */
export async function discardDraft(date: string): Promise<boolean> {
  const removed = await redis.del(draftKey(date));
  return removed > 0;
}

/**
 * Promote the current draft to published. Overwrites any existing published
 * plan for that date (that is the intent — publish replaces live). The draft
 * key is cleared once promotion succeeds.
 *
 * Returns the newly published plan, or null if there is no draft to publish.
 */
export async function publishDraft(date: string): Promise<DayPlan | null> {
  const draft = await getDraft(date);
  if (!draft) return null;

  // Reset any per-task runtime state that might have been carried into the
  // draft (e.g. copied from a previous day). A freshly published plan should
  // always start in "todo".
  const cleanTasks: Task[] = draft.tasks.map((t) => ({
    ...t,
    status: "todo",
    completed: false,
    submittedAt: undefined,
    verifiedAt: undefined,
    adminComment: undefined,
  }));

  const now = new Date().toISOString();
  const next: DayPlan = {
    date,
    tasks: cleanTasks,
    status: "published",
    updatedAt: now,
    publishedAt: now,
  };

  await redis.set(publishedKey(date), next);
  await redis.del(draftKey(date));
  return next;
}

/**
 * Move the currently published plan back into draft. Refuses to overwrite an
 * existing draft — the caller must discard it first.
 */
export async function unpublishPlan(
  date: string
): Promise<
  | { ok: true; plan: DayPlan }
  | { ok: false; reason: "not-published" | "draft-exists" }
> {
  const published = await getPublishedPlan(date);
  if (!published) return { ok: false, reason: "not-published" };

  const existingDraft = await getDraft(date);
  if (existingDraft) return { ok: false, reason: "draft-exists" };

  const draft: DayPlan = {
    date,
    tasks: published.tasks,
    status: "draft",
    updatedAt: new Date().toISOString(),
  };
  await redis.set(draftKey(date), draft);
  await redis.del(publishedKey(date));
  return { ok: true, plan: draft };
}

/**
 * Apply a per-task update on the published plan.
 * Returns the updated plan or null if plan/task not found or transition illegal.
 */
async function mutatePublishedTask(
  date: string,
  taskId: string,
  apply: (t: Task) => Task | null
): Promise<DayPlan | null> {
  const plan = await getPublishedPlan(date);
  if (!plan) return null;

  const idx = plan.tasks.findIndex((t) => t.id === taskId);
  if (idx < 0) return null;

  const next = apply(plan.tasks[idx]);
  if (!next) return null;

  const nextTasks = plan.tasks.slice();
  nextTasks[idx] = next;

  const updated: DayPlan = {
    ...plan,
    tasks: nextTasks,
    updatedAt: new Date().toISOString(),
  };
  await redis.set(publishedKey(date), updated);
  return updated;
}

/** Kid submits a task: todo → pending. */
export async function submitTask(
  date: string,
  taskId: string
): Promise<DayPlan | null> {
  return mutatePublishedTask(date, taskId, (t) => {
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
  return mutatePublishedTask(date, taskId, (t) => {
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
  return mutatePublishedTask(date, taskId, (t) => {
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
 * List published plans, newest first. Drafts are per-admin scratch state and
 * intentionally excluded from history/export.
 */
export async function listPublishedPlans(): Promise<DayPlan[]> {
  const keys = (await scanKeys(`${PLAN_PREFIX}*`)).filter((k) => !isDraftKey(k));
  if (keys.length === 0) return [];

  const rows = await Promise.all(keys.map((k) => redis.get<RawPlan>(k)));

  const plans = rows
    .filter((r): r is RawPlan => r !== null)
    .map((r) => normalize(r, "published"))
    .filter((p) => p.status === "published");

  return plans.sort((a, b) => (a.date < b.date ? 1 : -1));
}

/**
 * Yesterday relative to `date` (YYYY-MM-DD). Returns tasks reset to a fresh
 * "todo" state. Prefers the published plan; falls back to the draft.
 */
export async function getYesterdayTasks(date: string): Promise<Task[] | null> {
  const yesterday = shiftIsoDate(date, -1);
  const plan =
    (await getPublishedPlan(yesterday)) ?? (await getDraft(yesterday));
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
 * Delete every plan key (published + drafts). Used by admin "Clear all history".
 */
export async function clearAllPlans(): Promise<number> {
  const keys = await scanKeys(`${PLAN_PREFIX}*`);
  if (keys.length === 0) return 0;
  await redis.del(...keys);
  return keys.length;
}
