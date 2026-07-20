import { redis } from "@/lib/redis";
import type { Task } from "@/types/task";

const TEMPLATE_KEY = "template:default";

/**
 * A template task is a `Task` without any per-instance runtime state
 * (id, status flags, timestamps, admin comment). Stripped on save and
 * reapplied on load.
 */
export type TemplateTask = Omit<
  Task,
  | "id"
  | "completed"
  | "status"
  | "submittedAt"
  | "verifiedAt"
  | "adminComment"
>;

export interface Template {
  name: string;
  tasks: TemplateTask[];
}

const EMPTY_TEMPLATE: Template = {
  name: "Default Learning Plan",
  tasks: [],
};

export async function loadDefaultTemplate(): Promise<Template> {
  const raw = await redis.get<{ name?: string; tasks?: TemplateTask[] }>(
    TEMPLATE_KEY
  );
  if (!raw) return EMPTY_TEMPLATE;

  return {
    name: raw.name ?? EMPTY_TEMPLATE.name,
    tasks: raw.tasks ?? [],
  };
}

export async function saveDefaultTemplate(
  tasks: Task[],
  name?: string
): Promise<Template> {
  const cleaned: TemplateTask[] = tasks.map((t) => {
    // Strip runtime + legacy fields, keep only template-relevant ones.
    const {
      id: _id,
      completed: _completed,
      status: _status,
      submittedAt: _submittedAt,
      verifiedAt: _verifiedAt,
      adminComment: _adminComment,
      ...rest
    } = t;
    void _id;
    void _completed;
    void _status;
    void _submittedAt;
    void _verifiedAt;
    void _adminComment;
    return rest;
  });

  const template: Template = {
    name: name ?? EMPTY_TEMPLATE.name,
    tasks: cleaned,
  };

  await redis.set(TEMPLATE_KEY, template);
  return template;
}

/**
 * Turn a template into concrete tasks with fresh UUIDs and a clean todo state.
 * Runs server-side, so `crypto.randomUUID()` is safe.
 */
export function instantiateTemplate(template: Template): Task[] {
  return template.tasks.map((t) => ({
    ...t,
    id: crypto.randomUUID(),
    status: "todo",
    completed: false,
  }));
}
