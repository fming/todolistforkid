import { readJSON, writeJSON } from "@/lib/storage";
import type { Task } from "@/types/task";

const TEMPLATE_PATH = "templates/default.json";

/**
 * A template task is a `Task` without the runtime bits (`id`, `completed`).
 * These are stripped on save and reapplied on load.
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
  const raw = await readJSON<{ name?: string; tasks?: TemplateTask[] }>(
    TEMPLATE_PATH
  );
  if (!raw) return EMPTY_TEMPLATE;

  return {
    name: raw.name ?? EMPTY_TEMPLATE.name,
    tasks: raw.tasks ?? [],
  };
}

/**
 * Persist a template. Runtime fields (`id`, `completed`) are stripped so the
 * template file stays a pristine blueprint.
 */
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

  await writeJSON(TEMPLATE_PATH, template);
  return template;
}

/**
 * Turn a template into concrete tasks with fresh UUIDs. Runs server-side, so
 * `crypto.randomUUID()` is safe to call directly.
 */
export function instantiateTemplate(template: Template): Task[] {
  return template.tasks.map((t) => ({
    ...t,
    id: crypto.randomUUID(),
    completed: false,
  }));
}
