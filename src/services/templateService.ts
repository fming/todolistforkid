import { readJSON } from "@/lib/storage";
import type { Task } from "@/types/task";

export const TEMPLATE_KEYS = ["weekday", "weekend"] as const;
export type TemplateKey = (typeof TEMPLATE_KEYS)[number];

export type TemplateTask = Omit<Task, "id">;

export interface Template {
  name: string;
  key: TemplateKey;
  tasks: TemplateTask[];
}

export function isTemplateKey(value: string): value is TemplateKey {
  return (TEMPLATE_KEYS as readonly string[]).includes(value);
}

export async function loadTemplate(key: TemplateKey): Promise<Template | null> {
  const raw = await readJSON<{ name: string; tasks: TemplateTask[] }>(
    `templates/${key}.json`
  );
  if (!raw) return null;

  return {
    name: raw.name,
    key,
    tasks: raw.tasks ?? [],
  };
}

/**
 * Turn a template into concrete tasks with fresh UUIDs. Runs on the server, so
 * a client-side `crypto.randomUUID()` fallback isn't needed.
 */
export function instantiateTemplate(template: Template): Task[] {
  return template.tasks.map((t) => ({
    ...t,
    id: crypto.randomUUID(),
    completed: false,
  }));
}
