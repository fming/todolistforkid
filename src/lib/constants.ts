import type { TaskCategory } from "@/types/task";

export const TASK_CATEGORIES: TaskCategory[] = [
  "Math",
  "English",
  "Chinese",
  "Reading",
  "Sport",
  "Programming",
  "Music",
  "Art",
  "Other",
];

export const DEFAULT_TASK = {
  title: "",
  category: "Math" as TaskCategory,
  durationMinutes: 30,
  required: true,
};