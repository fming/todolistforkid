"use client";

import { Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import CategorySelect from "./CategorySelect";
import TaskTypeSelect from "./TaskTypeSelect";
import DurationSelect from "./DurationSelect";
import DifficultySelect from "./DifficultySelect";

import type { Task, TaskStatus } from "@/types/task";

interface TaskItemProps {
  task: Task;
  editable?: boolean;
  /** When true, show the per-task status pill (only meaningful on published plans). */
  showStatus?: boolean;
  onChange: <K extends keyof Task>(
    id: string,
    field: K,
    value: Task[K]
  ) => void;
  onDelete: (id: string) => void;
}

function statusOf(task: Task): TaskStatus {
  return task.status ?? (task.completed ? "verified" : "todo");
}

const STATUS_BADGE: Record<
  TaskStatus,
  { label: string; className: string }
> = {
  todo: {
    label: "◻ To do",
    className: "bg-slate-100 text-slate-600 ring-slate-200",
  },
  pending: {
    label: "⏳ Waiting review",
    className: "bg-amber-100 text-amber-800 ring-amber-200",
  },
  verified: {
    label: "✅ Verified",
    className: "bg-emerald-100 text-emerald-800 ring-emerald-300",
  },
};

export default function TaskItem({
  task,
  editable = true,
  showStatus = false,
  onChange,
  onDelete,
}: TaskItemProps) {
  const status = statusOf(task);
  const badge = STATUS_BADGE[status];

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

        <div className="flex items-center gap-2">
          {showStatus && (
            <span
              className={cn(
                "whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ring-1",
                badge.className
              )}
            >
              {badge.label}
            </span>
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

      {/* Details / note */}
      <div className="mt-5">
        <label className="mb-2 block text-sm text-slate-600">
          Details{" "}
          <span className="text-xs text-slate-400">
            (Markdown supported)
          </span>
        </label>
        {editable ? (
          <div className="grid gap-3 md:grid-cols-2">
            <textarea
              value={task.note}
              placeholder="Describe the task. Markdown supported: **bold**, - list, [link](url)..."
              rows={6}
              onChange={(e) =>
                onChange(task.id, "note", e.target.value)
              }
              spellCheck={false}
              className="w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            />
            <article className="prose prose-sm max-w-none rounded-md border bg-slate-50 px-3 py-2">
              {task.note?.trim() ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {task.note}
                </ReactMarkdown>
              ) : (
                <p className="italic text-slate-400">
                  Preview will appear here.
                </p>
              )}
            </article>
          </div>
        ) : task.note ? (
          <article className="prose prose-sm max-w-none rounded-md border bg-slate-50 px-3 py-2 text-slate-700">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {task.note}
            </ReactMarkdown>
          </article>
        ) : (
          <p className="rounded-md border bg-slate-50 px-3 py-2 text-sm italic text-slate-400">
            No details
          </p>
        )}
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

        {showStatus && status === "verified" && task.adminComment && (
          <p className="ml-3 max-w-md truncate text-xs text-emerald-700">
            👨‍👩‍👧 {task.adminComment}
          </p>
        )}
      </div>
    </div>
  );
}
