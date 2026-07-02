import { Task } from "./task";

export interface DayPlan {
  date: string;

  tasks: Task[];
}