import {
  TASK_CATEGORIES,
  TASK_TYPES,
  type Task,
} from "@/types/task";

export { TASK_CATEGORIES, TASK_TYPES };

export const DEFAULT_TASK: Omit<Task, "id"> = {
  title: "",

  category: "Math",

  type: "Worksheet",

  durationMinutes: 30,

  difficulty: 2,

  required: true,

  completed: false,

  note: "",
};