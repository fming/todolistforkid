import { Task } from "./task";

export type PlanStatus = "draft" | "published";

export interface DayPlan {
  date: string;

  status: PlanStatus;

  tasks: Task[];

  updatedAt: string;

  publishedAt?: string;
}
