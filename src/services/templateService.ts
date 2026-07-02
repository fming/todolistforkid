import { redis } from "@/lib/redis";
import type { Task } from "@/types/task";

const TEMPLATE_KEY = "template:default";

/**
 * A template task is a `Task` without runtime bits (`id`, `completed`).
 * Stripped on save and reapplied on load.
 */
export type TemplateTask = Omit<Task, "id" | "completed">;

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
  const cleaned: TemplateTask[] = tasks.map(({ id, completed, ...rest }) => {
    void id;
    void completed;
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
 * Turn a template into concrete tasks with fresh UUIDs. Runs server-side, so
 * `crypto.randomUUID()` is safe.
 */
export function instantiateTemplate(template: Template): Task[] {
  return template.tasks.map((t) => ({
    ...t,
    id: crypto.randomUUID(),
    completed: false,
  }));
}
