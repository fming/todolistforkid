"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

import TaskItem from "@/components/task/TaskItem";
import type { Task } from "@/types/task";

interface TaskListProps {
  tasks: Task[];
  /** When true, show per-task status pill (todo/pending/verified). */
  showStatus?: boolean;
  /** When true, hide add/delete controls and render task fields as read-only. */
  readOnly?: boolean;
  onAddTask: () => void;
  onUpdateTask: <K extends keyof Task>(
    id: string,
    field: K,
    value: Task[K]
  ) => void;
  onDeleteTask: (id: string) => void;
}

export default function TaskList({
  tasks,
  showStatus = false,
  readOnly = false,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
}: TaskListProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Today's Tasks
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {readOnly
              ? "This is the live plan kids are working on."
              : "Build your daily learning plan."}
          </p>
        </div>

        {!readOnly && (
          <Button onClick={onAddTask}>
            <Plus className="mr-2 h-4 w-4" />
            Add Task
          </Button>
        )}
      </div>

      {/* Empty state */}
      {tasks.length === 0 && !readOnly && (
        <div className="rounded-2xl border-2 border-dashed bg-white py-16 text-center">
          <p className="text-slate-500">
            No tasks yet. Start by adding one.
          </p>

          <Button className="mt-4" onClick={onAddTask}>
            <Plus className="mr-2 h-4 w-4" />
            Create First Task
          </Button>
        </div>
      )}

      {tasks.length === 0 && readOnly && (
        <div className="rounded-2xl border-2 border-dashed bg-white py-16 text-center">
          <p className="text-slate-500">This plan has no tasks.</p>
        </div>
      )}

      {/* Task Cards */}
      <div className="space-y-5">
        {tasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            editable={!readOnly}
            showStatus={showStatus}
            onChange={onUpdateTask}
            onDelete={onDeleteTask}
          />
        ))}
      </div>

      {/* Footer hint */}
      {tasks.length > 0 && !readOnly && (
        <div className="text-center text-xs text-slate-400">
          Tip: Keep total difficulty balanced across the day
        </div>
      )}
    </div>
  );
}