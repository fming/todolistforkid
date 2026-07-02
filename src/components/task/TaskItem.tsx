"use client";

import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

import CategorySelect from "./CategorySelect";
import TaskTypeSelect from "./TaskTypeSelect";
import DurationSelect from "./DurationSelect";
import DifficultySelect from "./DifficultySelect";

import type { Task } from "@/types/task";

interface TaskItemProps {
  task: Task;
  editable?: boolean;
  onChange: <K extends keyof Task>(
    id: string,
    field: K,
    value: Task[K]
  ) => void;
  onDelete: (id: string) => void;
}

export default function TaskItem({
  task,
  editable = true,
  onChange,
  onDelete,
}: TaskItemProps) {
  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm transition hover:shadow-md">
      {/* Header */}
      <div className="mb-5 flex items-start justify-between gap-4">
        {editable ? (
          <Input
            value={task.title}
            placeholder="Task title..."
            className="text-lg font-semibold"
            onChange={(e) =>
              onChange(task.id, "title", e.target.value)
            }
          />
        ) : (
          <h3 className="text-lg font-semibold text-slate-900">
            {task.title}
          </h3>
        )}

        {editable && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(task.id)}
          >
            <Trash2 className="h-5 w-5 text-red-500" />
          </Button>
        )}
      </div>

      {/* Grid */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {/* Category */}
        <div>
          <label className="mb-2 block text-sm text-slate-600">
            Category
          </label>

          {editable ? (
            <CategorySelect
              value={task.category}
              onChange={(value) =>
                onChange(task.id, "category", value)
              }
            />
          ) : (
            <div className="rounded-md border bg-slate-50 px-3 py-2">
              {task.category}
            </div>
          )}
        </div>

        {/* Type */}
        <div>
          <label className="mb-2 block text-sm text-slate-600">
            Type
          </label>

          {editable ? (
            <TaskTypeSelect
              value={task.type}
              onChange={(value) =>
                onChange(task.id, "type", value)
              }
            />
          ) : (
            <div className="rounded-md border bg-slate-50 px-3 py-2">
              {task.type}
            </div>
          )}
        </div>

        {/* Duration */}
        <div>
          <label className="mb-2 block text-sm text-slate-600">
            Duration
          </label>

          {editable ? (
            <DurationSelect
              value={task.durationMinutes}
              onChange={(value) =>
                onChange(task.id, "durationMinutes", value)
              }
            />
          ) : (
            <div className="rounded-md border bg-slate-50 px-3 py-2">
              {task.durationMinutes} min
            </div>
          )}
        </div>

        {/* Difficulty */}
        <div>
          <label className="mb-2 block text-sm text-slate-600">
            Difficulty
          </label>

          {editable ? (
            <DifficultySelect
              value={task.difficulty}
              onChange={(value) =>
                onChange(task.id, "difficulty", value)
              }
            />
          ) : (
            <div className="rounded-md border bg-slate-50 px-3 py-2">
              {"⭐".repeat(task.difficulty)}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Checkbox
            checked={task.required}
            disabled={!editable}
            onCheckedChange={(checked) =>
              onChange(task.id, "required", checked === true)
            }
          />

          <span className="text-sm text-slate-700">
            Required
          </span>
        </div>

        {!editable && (
          <span className="text-sm text-slate-400">
            Completed view mode
          </span>
        )}
      </div>
    </div>
  );
}