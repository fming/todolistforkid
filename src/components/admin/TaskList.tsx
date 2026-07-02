"use client";

import { Button } from "@/components/ui/button";

import type { Task } from "@/types/task";
import TaskRow from "./TaskRow";

interface TaskListProps {
  tasks: Task[];
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
  onAddTask,
  onUpdateTask,
  onDeleteTask,
}: TaskListProps) {
  return (
    <div className="rounded-xl border bg-white shadow-sm">
      {/* Header */}
      <div className="border-b px-6 py-4">
        <h2 className="text-lg font-semibold text-slate-900">
          Today's Tasks
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Create and edit today's learning tasks.
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr className="text-sm text-slate-600">
              <th className="px-4 py-3 text-left">
                Task
              </th>

              <th className="px-4 py-3 text-left">
                Category
              </th>

              <th className="px-4 py-3 text-center">
                Minutes
              </th>

              <th className="px-4 py-3 text-center">
                Required
              </th>

              <th className="w-16"></th>
            </tr>
          </thead>

          <tbody>
            {tasks.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="py-10 text-center text-slate-400"
                >
                  No tasks yet.
                </td>
              </tr>
            ) : (
              tasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onChange={onUpdateTask}
                  onDelete={onDeleteTask}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="border-t p-4">
        <Button onClick={onAddTask}>
          + Add Task
        </Button>
      </div>
    </div>
  );
}