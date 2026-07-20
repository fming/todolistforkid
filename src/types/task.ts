export const TASK_CATEGORIES = [
  "Math",
  "English",
  "Chinese",
  "Reading",
  "Sport",
  "Programming",
  "Music",
  "Art",
  "Other",
] as const;

export type TaskCategory = typeof TASK_CATEGORIES[number];

export const TASK_TYPES = [
  "Reading",
  "Writing",
  "Worksheet",
  "Exercise",
  "Practice",
  "Project",
  "Video",
  "Quiz",
  "Review",
  "Other",
] as const;

export type TaskType = typeof TASK_TYPES[number];

export const TASK_DIFFICULTIES = [
  1,
  2,
  3,
] as const;

export type TaskDifficulty = typeof TASK_DIFFICULTIES[number];

export type TaskStatus = "todo" | "pending" | "verified";

export interface Task {
  id: string;

  title: string;

  category: TaskCategory;

  type: TaskType;

  durationMinutes: number;

  difficulty: TaskDifficulty;

  required: boolean;

  /** @deprecated Prefer `status`. Mirrored for legacy readers; = (status === "verified"). */
  completed: boolean;

  note: string;

  status: TaskStatus;

  /** ISO timestamp when kid submitted (status: pending). */
  submittedAt?: string;

  /** ISO timestamp when parent approved (status: verified). */
  verifiedAt?: string;

  /** Parent's comment attached to the latest approve/reject decision. */
  adminComment?: string;
}