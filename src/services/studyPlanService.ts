import { redis, scanKeys } from "@/lib/redis";
import type { StudyPlan } from "@/types/study-plan";

const PREFIX = "studyPlan:";

function key(subject: string): string {
  return `${PREFIX}${subject}`;
}

export async function listStudyPlans(): Promise<StudyPlan[]> {
  const keys = await scanKeys(`${PREFIX}*`);
  if (keys.length === 0) return [];

  const rows = await Promise.all(keys.map((k) => redis.get<StudyPlan>(k)));
  return rows
    .filter((r): r is StudyPlan => r !== null)
    .sort((a, b) => a.subject.localeCompare(b.subject, "zh"));
}

export async function getStudyPlan(subject: string): Promise<StudyPlan | null> {
  return (await redis.get<StudyPlan>(key(subject))) ?? null;
}

export async function saveStudyPlan(
  subject: string,
  content: string
): Promise<StudyPlan> {
  const trimmed = subject.trim();
  if (!trimmed) throw new Error("Subject is required");

  const plan: StudyPlan = {
    subject: trimmed,
    content,
    updatedAt: new Date().toISOString(),
  };
  await redis.set(key(trimmed), plan);
  return plan;
}

export async function deleteStudyPlan(subject: string): Promise<void> {
  await redis.del(key(subject));
}
