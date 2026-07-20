import {
  TASK_CATEGORIES,
  TASK_TYPES,
  type Task,
  type TaskCategory,
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

  status: "todo",
};

/** Quick-tag chips shown in the parent verify UI. Click to append to comment. */
export const VERIFY_TAGS: readonly string[] = [
  "👍 完成很棒",
  "⏱ 速度不错",
  "🎯 全对",
  "✏️ 字更工整些",
  "📝 需要复习",
  "❌ 有错误",
] as const;

export const CATEGORY_EMOJI: Record<TaskCategory, string> = {
  Math: "🧮",
  English: "🔤",
  Chinese: "🀄",
  Reading: "📖",
  Sport: "⚽",
  Programming: "💻",
  Music: "🎵",
  Art: "🎨",
  Other: "✨",
};