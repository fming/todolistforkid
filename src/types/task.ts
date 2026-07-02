export type TaskCategory =
  | "Math"
  | "English"
  | "Chinese"
  | "Reading"
  | "Sport"
  | "Programming"
  | "Music"
  | "Art"
  | "Other";

export interface Task {
  id: string;

  title: string;

  category: TaskCategory;

  durationMinutes: number;

  required: boolean;
}